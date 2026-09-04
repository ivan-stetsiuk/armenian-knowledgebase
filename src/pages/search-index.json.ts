import type { APIRoute } from "astro";
import { searchEntries } from "../lib/search";

/* Built once, served as a static file beside the pages. */
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await searchEntries()), {
    headers: { "content-type": "application/json" },
  });
