/**
 * GitHub API utilities for uploading encrypted exams.
 */

export interface GitHubConfig {
  token: string;
  repo: string;
  branch: string;
}

export async function uploadToGitHub(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string
) {
  const { token, repo, branch } = config;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  // Check if file exists to get SHA
  let sha: string | undefined;
  try {
    const res = await fetch(`${url}?ref=${branch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch (e) {
    // File doesn't exist, which is fine
  }

  const body = {
    message,
    content: btoa(content),
    branch,
    sha,
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to upload to GitHub');
  }

  return res.json();
}
