import { Octokit } from 'octokit'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  owner: {
    login: string
  }
}

export interface FileContent {
  name: string
  content: string
}

export class GitHubClient {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token })
  }

  async getUserRepositories() {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.repos.listForAuthenticatedUser,
        { per_page: 100, type: 'all', sort: 'updated' }
      )
      return data as GitHubRepo[]
    } catch (error) {
      console.error('Error fetching repositories:', error)
      throw error
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      })

      if (Array.isArray(data)) {
        return null
      }

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }

      return null
    } catch (error) {
      // File not found is not an error
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      console.error(`Error fetching file ${path}:`, error)
      return null
    }
  }

  async getRepositoryFiles(owner: string, repo: string, filenames: string[]): Promise<FileContent[]> {
    const files: FileContent[] = []

    for (const filename of filenames) {
      const content = await this.getFileContent(owner, repo, filename)
      if (content) {
        files.push({ name: filename, content })
      }
    }

    return files
  }
}
