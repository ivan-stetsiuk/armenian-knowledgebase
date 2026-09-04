/* Site-wide constants.
 *
 * BASE_URL carries a trailing slash ("/armenian-knowledgebase/"), but every
 * link in the codebase is written as `${base}/lessons/`. Stripping the slash
 * once here is the difference between one definition and the thirteen copies of
 * the same regex this replaced — and a `//` in a href is the kind of thing that
 * works in dev and 404s on GitHub Pages.
 */
export const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/* Shown in <title>, and as the fallback description. */
export const SITE_NAME = "Armenian Knowledge Base";
export const SITE_DESCRIPTION =
  "A personal Eastern Armenian reference built from lessons with a tutor.";
