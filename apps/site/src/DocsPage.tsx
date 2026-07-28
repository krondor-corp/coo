import { useEffect, useMemo, useRef } from "react";
import { DOC_GROUPS, findDocPage } from "./docs";
import { renderMarkdown } from "./markdown";
import { useCopyButtons } from "./useCopyButtons";

type Props = {
  slug: string;
  anchor?: string;
};

export function DocsPage({ slug, anchor }: Props) {
  const page = findDocPage(slug);
  const contentRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => (page ? renderMarkdown(page.raw) : ""), [page]);

  useCopyButtons(contentRef, [html]);

  useEffect(() => {
    if (!anchor) return;
    const target = document.getElementById(anchor);
    target?.scrollIntoView({ block: "start" });
  }, [anchor]);

  return (
    <div className="docs-layout">
      <nav className="sidebar" aria-label="Documentation navigation">
        {DOC_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.title}>
            <h3 className="sidebar-heading">{group.title}</h3>
            <ul className="sidebar-list">
              {group.pages.map((item) => (
                <li
                  key={item.slug}
                  className={`sidebar-item${item.slug === slug ? " active" : ""}`}
                >
                  <a href={`#/docs/${item.slug}`}>{item.title}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {page ? (
        <article
          className="doc-content"
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <article className="doc-content">
          <p>Couldn't find that doc page.</p>
        </article>
      )}
    </div>
  );
}
