type Props = {
  source: string;
  error: string | null;
  onChange: (text: string) => void;
};

export function RawSourceView({ source, error, onChange }: Props) {
  return (
    <div className="raw-source-view">
      {error && <div className="parse-error-banner">{error}</div>}
      <textarea
        aria-label="ChordPro source"
        className="raw-source-textarea"
        value={source}
        spellCheck={false}
        autoFocus
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
