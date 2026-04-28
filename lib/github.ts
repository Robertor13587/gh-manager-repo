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
  path: string
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
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path })
      if (Array.isArray(data)) return null
      if ('content' in data) return Buffer.from(data.content, 'base64').toString('utf-8')
      return null
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return null
      console.error(`Error fetching file ${path}:`, error)
      return null
    }
  }

  /**
   * Fetches all tracked files by searching the full git tree recursively.
   * This handles repos where files live in a subdirectory instead of root.
   * Returns the first match found for each filename (case-insensitive).
   */
  async getRepositoryFiles(owner: string, repo: string, filenames: string[]): Promise<FileContent[]> {
    const lowerTargets = filenames.map((f) => f.toLowerCase())

    try {
      // Get the full tree recursively
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: 'HEAD',
        recursive: '1',
      })

      if (tree.truncated) {
        console.warn(`[GitHub] Tree truncated for ${owner}/${repo}, falling back to root-only search`)
      }

      // Find matching blobs — for each target filename, pick the shallowest match
      const matched = new Map<string, string>() // filename → path in repo

      for (const item of tree.tree) {
        if (item.type !== 'blob' || !item.path) continue
        const base = item.path.split('/').pop()!.toLowerCase()
        const targetIdx = lowerTargets.indexOf(base)
        if (targetIdx === -1) continue

        const canonical = filenames[targetIdx]
        // Prefer shallower paths (fewer slashes)
        const existing = matched.get(canonical)
        if (!existing || item.path.split('/').length < existing.split('/').length) {
          matched.set(canonical, item.path)
        }
      }

      // Fetch content for each match
      const results: FileContent[] = []
      for (const [filename, path] of matched.entries()) {
        const content = await this.getFileContent(owner, repo, path)
        if (content) results.push({ name: filename, content, path })
      }

      return results
    } catch (error) {
      // If tree fetch fails (e.g. empty repo), silently return nothing
      console.error(`[GitHub] getRepositoryFiles failed for ${owner}/${repo}:`, error)
      return []
    }
  }
}
