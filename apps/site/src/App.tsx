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
        <span className="hero-eyebrow">A chord-chart editor for musicians</span>
        <h1 className="hero-title">Coo</h1>
        <p className="hero-tagline">
          Type your lyrics. Drop chords right where you sing them. Transpose the
          whole song to fit your voice.
        </p>
        <InstallCommand />
        <p className="download-note">
          Copy that, paste it into Terminal, press Enter. It picks the right
          version for your Mac or Linux machine. On Windows, or want to download
          it yourself? <a href="#/docs/install">Start here</a>.
        </p>
        <div className="hero-links">
          <a href="#/docs" className="hero-link">
            Read the guide
          </a>
        </div>
      </header>

      <section className="features">
        <div className="feature">
          <h3>Chords land where you sing them</h3>
          <p>
            Put the cursor on the syllable, hit "/", name the chord. It sits
            right above the word. No brackets, no counting spaces.
          </p>
        </div>
        <div className="feature">
          <h3>Transpose to fit a voice</h3>
          <p>
            Shift the whole song up or down a step on screen. Your file keeps
            the key you actually wrote it in.
          </p>
        </div>
        <div className="feature">
          <h3>Your songs stay yours</h3>
          <p>
            Every song is a plain file on your own computer. No account, no
            cloud, and it opens in any other chord-chart app you like.
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
