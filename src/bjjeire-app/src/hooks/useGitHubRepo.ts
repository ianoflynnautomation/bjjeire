import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/fetch-client'

interface GitHubRepo {
  stargazers_count: number
  forks_count: number
}

interface UseGitHubRepoResult {
  stars: number | undefined
}

export function parseRepoPath(githubUrl: string): string | undefined {
  const match = new RegExp(/github\.com\/([^/?#]+\/[^/?#]+)/).exec(githubUrl)
  return match?.[1]
}

export function useGitHubRepo(
  githubUrl: string | undefined
): UseGitHubRepoResult {
  const repoPath = githubUrl ? parseRepoPath(githubUrl) : undefined

  const { data } = useQuery<GitHubRepo>({
    queryKey: ['github-repo', repoPath],
    queryFn: () =>
      fetchJson<GitHubRepo>(`https://api.github.com/repos/${repoPath}`),
    enabled: Boolean(repoPath),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return { stars: data?.stargazers_count }
}
