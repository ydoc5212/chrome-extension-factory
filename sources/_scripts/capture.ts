#!/usr/bin/env tsx
/**
 * Capture a URL into sources/<type>/YYYY-MM-DD_<source-id>_<slug>.md.
 *
 * Usage:
 *   npm run capture:source -- <url> --type=official|forum|blog
 *     [--topics=a,b,c]
 *     [--no-snapshot]
 *     [--render]                  # launch headless chromium instead of fetch (for JS-rendered sites)
 *     [--from-file=path.html]     # use local HTML instead of fetching
 *     [--source-id=nearform]
 *     [--slug=custom-slug]        # override URL-derived slug (useful for replacing a stub)
 *     [--author="Name"]
 *     [--evidence-class=a|b|c|d]
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import yaml from "js-yaml";

type SourceType = "official" | "forum" | "blog";
type EvidenceClass = "a" | "b" | "c" | "d";

interface Args {
  url: string;
  type: SourceType | null;
  topics: string[];
  snapshot: boolean;
  render: boolean;
  fromFile: string | null;
  sourceId: string | null;
  slug: string | null;
  author: string | null;
  evidenceClass: EvidenceClass | null;
}

const DIR_MAP: Record<SourceType, string> = {
  official: "official",
  forum: "forums",
  blog: "blogs",
};

const SOURCE_ID_MAP: Record<string, string> = {
  "developer.chrome.com": "chrome-developers",
  "developer.mozilla.org": "mdn",
  "groups.google.com": "google-group",
  "stackoverflow.com": "stackoverflow",
  "reddit.com": "reddit",
  "www.reddit.com": "reddit",
  "old.reddit.com": "reddit",
  "nearform.com": "nearform",
  "macarthur.me": "macarthur",
  "getsnapfont.com": "snapfont",
  "stefanvd.net": "stefan-vd",
  "www.stefanvd.net": "stefan-vd",
  "chromestatus.com": "chromestatus",
  "chrome.google.com": "chrome-webstore",
  "blog.google": "google-blog",
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    url: "",
    type: null,
    topics: [],
    snapshot: true,
    render: false,
    fromFile: null,
    sourceId: null,
    slug: null,
    author: null,
    evidenceClass: null,
  };
  for (const raw of argv) {
    if (raw.startsWith("--type=")) {
      const v = raw.slice("--type=".length);
      if (!["official", "forum", "blog"].includes(v)) {
        throw new Error(`--type must be official|forum|blog, got: ${v}`);
      }
      args.type = v as SourceType;
    } else if (raw.startsWith("--topics=")) {
      args.topics = raw
        .slice("--topics=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (raw === "--no-snapshot") {
      args.snapshot = false;
    } else if (raw === "--render") {
      args.render = true;
    } else if (raw.startsWith("--from-file=")) {
      args.fromFile = raw.slice("--from-file=".length);
    } else if (raw.startsWith("--source-id=")) {
      args.sourceId = raw.slice("--source-id=".length);
    } else if (raw.startsWith("--slug=")) {
      args.slug = raw.slice("--slug=".length);
    } else if (raw.startsWith("--author=")) {
      args.author = raw.slice("--author=".length).replace(/^"|"$/g, "");
    } else if (raw.startsWith("--evidence-class=")) {
      const v = raw.slice("--evidence-class=".length);
      if (!["a", "b", "c", "d"].includes(v)) {
        throw new Error(`--evidence-class must be a|b|c|d, got: ${v}`);
      }
      args.evidenceClass = v as EvidenceClass;
    } else if (raw.startsWith("--url=")) {
      args.url = raw.slice("--url=".length);
    } else if (!raw.startsWith("-") && !args.url) {
      args.url = raw;
    }
  }
  if (!args.url) throw new Error("Missing URL (pass as first positional or --url=...)");
  if (!args.type) throw new Error("Missing --type=official|forum|blog");
  if (args.render && args.fromFile) {
    throw new Error("--render and --from-file are mutually exclusive");
  }
  return args;
}

function deriveSourceId(url: string): string {
  const host = new URL(url).hostname;
  if (SOURCE_ID_MAP[host]) return SOURCE_ID_MAP[host];
  return host.replace(/^www\./, "").split(".")[0];
}

function deriveSlug(url: string): string {
  const u = new URL(url);
  const parts = u.pathname.split("/").filter(Boolean);
  const tail = parts.slice(-3).join("-") || u.hostname;
  return (
    tail
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "capture"
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultEvidenceClass(type: SourceType): EvidenceClass {
  if (type === "official") return "a";
  if (type === "forum") return "b";
  return "c";
}

async function fetchHtml(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "chrome-extension-factory-source-capture/1.0 (+https://github.com/anthropics/chrome-extension-factory)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
  return await resp.text();
}

async function renderHtml(url: string): Promise<string> {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright not installed. Run: npm install --save-dev playwright && npx playwright install chromium",
    );
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "en-US",
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(1500);
    return await page.content();
  } finally {
    await browser.close();
  }
}

async function saveToWayback(url: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://web.archive.org/save/${url}`, {
      method: "GET",
      headers: {
        "User-Agent": "chrome-extension-factory-source-capture/1.0",
      },
      redirect: "manual",
    });
    const contentLoc = resp.headers.get("content-location");
    if (contentLoc) {
      return contentLoc.startsWith("http")
        ? contentLoc
        : `https://web.archive.org${contentLoc}`;
    }
    const loc = resp.headers.get("location");
    if (loc) {
      return loc.startsWith("http") ? loc : `https://web.archive.org${loc}`;
    }
    return null;
  } catch (e) {
    console.warn(`[wayback] snapshot failed: ${(e as Error).message}`);
    return null;
  }
}

function extractContent(
  html: string,
  type: SourceType,
  url: string,
): { title: string; markdown: string } {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const rawTitle = doc.title?.trim() || doc.querySelector("h1")?.textContent?.trim() || "Untitled";

  let contentHtml: string | null = null;
  if (type !== "forum") {
    try {
      const reader = new Readability(doc.cloneNode(true) as Document);
      const article = reader.parse();
      if (article?.content) contentHtml = article.content;
    } catch (e) {
      console.warn(`[extract] readability failed: ${(e as Error).message}`);
    }
  }
  if (!contentHtml) {
    contentHtml = doc.body?.innerHTML ?? html;
  }

  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
  });
  td.remove(["script", "style", "noscript"]);

  const markdown = td.turndown(contentHtml).trim();
  return { title: rawTitle, markdown };
}

function buildBody(
  type: SourceType,
  title: string,
  markdown: string,
): string {
  if (type === "forum") {
    return `# ${title}\n\n## Signal extracted\n\n<!--\nFill in during curation. One to three sentences describing the insight\nburied in this thread. Quote the load-bearing post verbatim if it's short.\n-->\n\n## Raw content\n\n<!--\nAuto-extracted dump. For JS-rendered forums (Google Groups, Reddit), this\nmay be empty or incomplete — split posts into \`## Post N\` sections manually\nfollowing sources/_templates/forum-thread.md.\n-->\n\n${markdown}\n`;
  }
  if (type === "blog") {
    return `# ${title}\n\n## Signal extracted\n\n<!-- Fill in during curation. The one insight this post has that's hard to get elsewhere. -->\n\n---\n\n${markdown}\n\n## Curator notes\n\n<!-- Empty at capture time. -->\n`;
  }
  return `# ${title}\n\n${markdown}\n\n## Curator notes\n\n<!-- Empty at capture time. -->\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceId = args.sourceId ?? deriveSourceId(args.url);
  const slug = args.slug ?? deriveSlug(args.url);
  const date = todayISO();
  const filename = `${date}_${sourceId}_${slug}.md`;

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const sourcesRoot = resolve(scriptDir, "..");
  const outDir = resolve(sourcesRoot, DIR_MAP[args.type!]);
  const outPath = resolve(outDir, filename);

  let html: string;
  if (args.fromFile) {
    html = await readFile(args.fromFile, "utf8");
    console.log(`[capture] reading local file: ${args.fromFile}`);
  } else if (args.render) {
    console.log(`[capture] rendering (playwright): ${args.url}`);
    html = await renderHtml(args.url);
  } else {
    console.log(`[capture] fetching: ${args.url}`);
    html = await fetchHtml(args.url);
  }

  const { title, markdown } = extractContent(html, args.type!, args.url);
  console.log(`[capture] extracted ${markdown.length} chars; title: ${title}`);

  let waybackUrl: string | null = null;
  if (args.snapshot) {
    console.log(`[wayback] requesting snapshot for ${args.url}...`);
    waybackUrl = await saveToWayback(args.url);
    console.log(waybackUrl ? `[wayback] ${waybackUrl}` : `[wayback] no URL returned (non-fatal)`);
  } else {
    console.log(`[wayback] skipped (--no-snapshot)`);
  }

  const frontmatter: Record<string, unknown> = {
    url: args.url,
    captured_at: date,
    capture_method: args.fromFile ? "manual" : args.render ? "script-rendered" : "script",
    source_type: args.type,
    source_id: sourceId,
    title_at_capture: title,
    author: args.author,
    evidence_class: args.evidenceClass ?? defaultEvidenceClass(args.type!),
    topics: args.topics,
    wayback_url: waybackUrl,
    related_docs: [] as string[],
    notes: "Fill in during curation.",
  };
  if (args.type === "forum") {
    frontmatter.thread_url = args.url;
    frontmatter.post_count = null;
    frontmatter.accepted_answer = null;
  }

  const yamlStr = yaml.dump(frontmatter, { lineWidth: 120, noRefs: true });
  const body = buildBody(args.type!, title, markdown);
  const output = `---\n${yamlStr}---\n\n${body}`;

  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, output, "utf8");
  console.log(`[capture] wrote ${outPath}`);
}

main().catch((e) => {
  console.error(`[capture] error: ${(e as Error).message}`);
  process.exit(1);
});
