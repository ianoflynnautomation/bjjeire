import { useQuery } from '@tanstack/react-query'

interface GitHubRepo {
  stargazers_count: number
  forks_count: number
}

function parseRepoPath(githubUrl: string): string | undefined {
  const match = githubUrl.match(/github\.com\/([^/?#]+\/[^/?#]+)/)
  return match?.[1]
}

interface UseGitHubRepoResult {
  stars: number | undefined
}

export function useGitHubRepo(
  githubUrl: string | undefined
): UseGitHubRepoResult {
  const repoPath = githubUrl ? parseRepoPath(githubUrl) : undefined

  const { data } = useQuery<GitHubRepo>({
    queryKey: ['github-repo', repoPath],
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${repoPath}`)
      if (!res.ok) {
        throw new Error('GitHub API error')
      }
      return res.json() as Promise<GitHubRepo>
    },
    enabled: Boolean(repoPath),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return { stars: data?.stargazers_count }
}
