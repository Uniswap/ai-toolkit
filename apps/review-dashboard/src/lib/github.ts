/**
 * GitHub API helpers for authorization checks.
 *
 * Uses the authenticated user's OAuth token to verify
 * they have access to specific repositories before serving
 * dashboard data or accepting configuration changes.
 */

interface RepoPermissions {
  admin: boolean;
  maintain: boolean;
  push: boolean;
  triage: boolean;
  pull: boolean;
}

interface GitHubRepoResponse {
  full_name: string;
  permissions?: RepoPermissions;
}

/**
 * Checks whether the user has access to a specific repository
 * and returns their permission level.
 *
 * Returns null if the user has no access (404/403 from GitHub).
 */
export async function getRepoPermissions(
  accessToken: string,
  owner: string,
  repo: string
): Promise<RepoPermissions | null> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
      // Short cache to avoid hammering GitHub API on page loads
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GitHubRepoResponse;
  return data.permissions ?? null;
}

/**
 * Verifies the user has at least the required access level to a repository.
 *
 * @param requiredLevel - 'read' checks for pull access, 'write' checks for push/admin
 */
export async function verifyRepoAccess(
  accessToken: string,
  owner: string,
  repo: string,
  requiredLevel: 'read' | 'write' = 'read'
): Promise<boolean> {
  const permissions = await getRepoPermissions(accessToken, owner, repo);
  if (!permissions) return false;

  if (requiredLevel === 'write') {
    return permissions.push || permissions.admin;
  }
  return permissions.pull;
}

/**
 * Filters a list of repositories to only those the user can access.
 *
 * Checks each repository in parallel against the GitHub API.
 * Suitable for small-to-medium lists (~50 repos). For larger
 * lists, consider using GET /user/repos with pagination instead.
 */
export async function filterAccessibleRepos<T extends { owner: string; name: string }>(
  accessToken: string,
  repos: T[]
): Promise<T[]> {
  const accessChecks = await Promise.all(
    repos.map((repo) => verifyRepoAccess(accessToken, repo.owner, repo.name))
  );
  return repos.filter((_, index) => accessChecks[index]);
}
