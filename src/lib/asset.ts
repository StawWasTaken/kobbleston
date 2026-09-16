/**
 * Resolves a file in /public against the deployed base path, so the same
 * code works at the domain root and under a project subpath like
 * /kobbleston/ on GitHub Pages.
 */
export function asset(path: string) {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}
