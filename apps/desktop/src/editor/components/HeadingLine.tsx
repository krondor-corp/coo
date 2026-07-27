import type { HeadingLine as HeadingLineType } from "@repo/core";

export function HeadingLine({ line }: { line: HeadingLineType }) {
  if (line.boundary === "end") return null;
  const label = line.section.charAt(0).toUpperCase() + line.section.slice(1);
  return (
    <div className="heading-row" data-line-id={line.id}>
      <span className="heading-label">{label}</span>
    </div>
  );
}
