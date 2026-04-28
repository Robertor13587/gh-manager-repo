import { NextRequest, NextResponse } from 'next/server'
import { GitHubClient } from '@/lib/github'
import { determineStatus } from '@/lib/status'
import * as dbUtils from '@/lib/db-utils'
import { getDb } from '@/lib/db'

// Protected by Vercel Cron secret
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()
    const users = await sql`SELECT id, email FROM users`
    const filesToCheck = ['README.md', 'CHANGELOG.md', 'MVP.md', 'RELEASE.md', 'COMPLETED.md']
    let synced = 0

    for (const user of users) {
      const account = await dbUtils.getAccountByProvider(user.id as string, 'github')
      if (!account?.access_token) continue

      const githubClient = new GitHubClient(account.access_token as string)
      const repos = await githubClient.getUserRepositories()

      for (const repo of repos) {
        const dbRepo = await dbUtils.upsertRepository({
          owner: repo.owner.login,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          userId: user.id as string,
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
        synced++
      }
    }

    console.log(`[Cron] Synced ${synced} repositories for ${users.length} users`)
    return NextResponse.json({ success: true, synced, users: users.length })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
