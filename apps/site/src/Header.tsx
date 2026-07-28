const REPO = "krondor-corp/coo";

function Logomark() {
  return (
    <svg viewBox="0 0 32 32" className="logomark" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <line x1="6" y1="5" x2="6" y2="27" />
        <line x1="13" y1="5" x2="13" y2="27" />
        <line x1="20" y1="5" x2="20" y2="27" />
        <line x1="27" y1="5" x2="27" y2="27" />
        <line x1="6" y1="9" x2="27" y2="9" strokeWidth={2.5} />
        <line x1="6" y1="16" x2="27" y2="16" strokeWidth={1} />
        <line x1="6" y1="23" x2="27" y2="23" strokeWidth={1} />
      </g>
      <circle cx="13" cy="16" r="2.25" fill="currentColor" />
      <circle cx="27" cy="23" r="2.25" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <a href="#/" className="site-title">
        <Logomark />
        <span className="site-title-text">Coo</span>
      </a>
      <nav className="site-nav">
        <a href="#/docs">Docs &rarr;</a>
        <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </header>
  );
}
