import type { PassthroughLine as PassthroughLineType } from "@repo/core";

export function PassthroughLine({ line }: { line: PassthroughLineType }) {
  return (
    <div
      className="passthrough-row"
      data-line-id={line.id}
      title="Edit via raw source"
    >
      <code>{line.raw}</code>
    </div>
  );
}
