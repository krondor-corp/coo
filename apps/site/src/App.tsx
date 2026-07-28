import { useState } from "react";
import { DocsPage } from "./DocsPage";
import { Header } from "./Header";
import { useHashRoute } from "./routing";

const REPO = "krondor-corp/coo";
const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/krondor-corp/coo/main/install.sh | bash";

function InstallCommand() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(INSTALL_COMMAND).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="install-command">
      <code>{INSTALL_COMMAND}</code>
      <button type="button" className="copy-btn" onClick={copy}>
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}

function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="hero-eyebrow">A command-based ChordPro editor</span>
        <h1 className="hero-title">Coo</h1>
        <p className="hero-tagline">
          Write lyrics naturally. Insert, rename, and move chords without typing
          a single bracket.
        </p>
        <InstallCommand />
        <p className="download-note">
          Detects your OS/arch and installs the latest release. macOS and Linux
          — see <a href="#/docs/install">the install docs</a> for Windows and
          manual downloads.
        </p>
        <div className="hero-links">
          <a href="#/docs" className="hero-link">
            Read the docs
          </a>
        </div>
      </header>

      <section className="features">
        <div className="feature">
          <h3>Write, don't format</h3>
          <p>
            Type lyrics like a plain text editor. Chords sit above the words
            they belong to, positioned automatically.
          </p>
        </div>
        <div className="feature">
          <h3>Commands, not syntax</h3>
          <p>
            A "/" menu inserts chords, section headings, and comments — no
            ChordPro syntax to memorize.
          </p>
        </div>
        <div className="feature">
          <h3>Raw source, always</h3>
          <p>
            Every document is still a plain .chopro file underneath. Drop into
            raw source mode any time.
          </p>
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Krondor Corp</span>
        <a href={`https://github.com/${REPO}`}>GitHub</a>
      </footer>
    </main>
  );
}

export function App() {
  const route = useHashRoute();

  return (
    <>
      <Header />
      {route.page === "docs" ? (
        <main className="page page-docs">
          <DocsPage slug={route.slug} anchor={route.anchor} />
        </main>
      ) : (
        <HomePage />
      )}
    </>
  );
}
