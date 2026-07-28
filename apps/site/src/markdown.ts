import DOMPurify from "dompurify";
import { Marked } from "marked";

/** Rewrites relative "./foo.md#bar" links (written for GitHub) to this site's "#/docs/foo#bar" hash routes. */
function rewriteHref(href: string): string {
  const match = href.match(/^\.{0,2}\/?([\w-]+)\.md(#.*)?$/);
  if (!match) return href;
  const [, slug, hash] = match;
  return `#/docs/${slug}${hash ?? ""}`;
}

/** GitHub-compatible-enough heading slug for our own controlled content (no dedup-suffixing, but we don't repeat headings). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const marked = new Marked({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const resolvedHref = rewriteHref(href);
      const titleAttr = title ? ` title="${title}"` : "";
      const external = /^https?:\/\//.test(resolvedHref);
      const externalAttrs = external ? ' target="_blank" rel="noreferrer"' : "";
      return `<a href="${resolvedHref}"${titleAttr}${externalAttrs}>${text}</a>`;
    },
    heading(token) {
      const html = this.parser.parseInline(token.tokens);
      const id = slugify(token.text);
      return `<h${token.depth} id="${id}">${html}</h${token.depth}>\n`;
    },
  },
});

export function renderMarkdown(raw: string): string {
  return DOMPurify.sanitize(marked.parse(raw, { async: false }));
}
