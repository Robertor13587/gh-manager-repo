export type ProjectStatus = 'MVP' | 'COMPLETED' | 'IN_PROGRESS'

export function determineStatus(
  files: Record<string, string | null>,
  mvpFiles: string[],
  releaseFiles: string[]
): ProjectStatus {
  // Check for release/completed files
  for (const releaseFile of releaseFiles) {
    if (files[releaseFile]) {
      return 'COMPLETED'
    }
  }

  // Check for MVP files
  for (const mvpFile of mvpFiles) {
    if (files[mvpFile]) {
      return 'MVP'
    }
  }

  // Check README for status indicators
  const readme = files['README.md'] || files['readme.md'] || files['Readme.md']
  if (readme) {
    const lowerReadme = readme.toLowerCase()

    // Check for status section
    if (lowerReadme.includes('## completed') || lowerReadme.includes('## release')) {
      return 'COMPLETED'
    }
    if (lowerReadme.includes('## mvp') || lowerReadme.includes('## minimum viable product')) {
      return 'MVP'
    }

    // Check for version patterns
    if (lowerReadme.match(/version[:\s]+1\.[0-9]/i)) {
      return 'COMPLETED'
    }
    if (lowerReadme.match(/version[:\s]+0\.[0-9]/i)) {
      return 'MVP'
    }
  }

  return 'IN_PROGRESS'
}

export function parseStatus(content: string): 'MVP' | 'COMPLETED' | null {
  const lines = content.split('\n')

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('completed') || lower.includes('released')) {
      return 'COMPLETED'
    }
    if (lower.includes('mvp') || lower.includes('minimum viable')) {
      return 'MVP'
    }
  }

  return null
}
