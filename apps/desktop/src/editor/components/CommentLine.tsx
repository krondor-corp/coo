import type { CommentLine as CommentLineType } from "@repo/core";
import { useEffect, useRef, useState } from "react";

type Props = {
  line: CommentLineType;
  focused: boolean;
  onChange: (text: string) => void;
  onExit: () => void;
};

export function CommentLine({ line, focused, onChange, onExit }: Props) {
  const [draft, setDraft] = useState(line.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(line.text);
  }, [line.text]);

  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  return (
    <div className="comment-row" data-line-id={line.id}>
      <span className="comment-prefix" aria-hidden="true">
        &gt;
      </span>
      <input
        ref={inputRef}
        className="comment-input"
        aria-label="Comment"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onChange(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onChange(draft);
            onExit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            setDraft(line.text);
            onExit();
          }
        }}
      />
    </div>
  );
}
