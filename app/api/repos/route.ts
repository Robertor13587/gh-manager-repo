import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { GitHubClient } from '@/lib/github'
import { determineStatus } from '@/lib/status'
import * as dbUtils from '@/lib/db-utils'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await dbUtils.getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const repositories = await dbUtils.getRepositoriesByUserId(user.id)
    return NextResponse.json(repositories)
  } catch (error) {
    console.error('Error fetching repos:', error)
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await dbUtils.getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const account = await dbUtils.getAccountByProvider(user.id, 'github')
    if (!account?.access_token) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 400 })
    }

    const githubClient = new GitHubClient(account.access_token as string)
    const repos = await githubClient.getUserRepositories()

    const filesToCheck = ['README.md', 'CHANGELOG.md', 'MVP.md', 'RELEASE.md', 'COMPLETED.md']

    for (const repo of repos) {
      const dbRepo = await dbUtils.upsertRepository({
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        userId: user.id,
      })

      const files = await githubClient.getRepositoryFiles(repo.owner.login, repo.name, filesToCheck)

      const fileMap: Record<string, string | null> = {}
      for (const file of files) {
        fileMap[file.name] = file.content

        await dbUtils.upsertProjectFile({
          filename: file.name,
          content: file.content,
          repositoryId: dbRepo.id,
        })
      }

      const status = determineStatus(fileMap, dbRepo.mvpFiles, dbRepo.releaseFiles)
      await dbUtils.updateRepositoryStatus(dbRepo.id, status)
    }

    return NextResponse.json({ success: true, repositoriesCount: repos.length })
  } catch (error) {
    console.error('Error syncing repos:', error)
    return NextResponse.json({ error: 'Failed to sync repositories' }, { status: 500 })
  }
}
