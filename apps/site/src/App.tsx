import { useEffect, useState } from "react";
import { DocsPage } from "./DocsPage";
import { Header } from "./Header";
import { useHashRoute } from "./routing";

const REPO = "krondor-corp/coo";
const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/krondor-corp/coo/main/install.sh | bash";

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type Release = {
  tag_name: string;
  assets: ReleaseAsset[];
};

function platformAsset(assets: ReleaseAsset[], match: RegExp) {
  return assets.find((asset) => match.test(asset.name));
}

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
  const [release, setRelease] = useState<Release | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setRelease(data))
      .catch(() => setRelease(null));
  }, []);

  const macAsset = release && platformAsset(release.assets, /\.dmg$/);
  const windowsAsset =
    release &&
    (platformAsset(release.assets, /\.msi$/) ??
      platformAsset(release.assets, /setup\.exe$/));
  const linuxAsset =
    release &&
    (platformAsset(release.assets, /\.deb$/) ??
      platformAsset(release.assets, /\.AppImage$/));
  const hasDirectDownloads = macAsset || windowsAsset || linuxAsset;

  return (
    <main className="page">
      <header className="hero">
        <span className="hero-eyebrow">A command-based ChordPro editor</span>
        <h1 className="hero-title">Coo</h1>
        <p className="hero-tagline">
          Write lyrics naturally. Insert, rename, and move chords without typing
          a single bracket.
        </p>
        <div className="hero-links">
          <a href="#download" className="hero-cta">
            Get started
          </a>
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

      <section id="download" className="download">
        <h2>Install</h2>
        <InstallCommand />
        <p className="download-note">
          Detects your OS/arch and installs the latest release. macOS and Linux
          — see <a href="#/docs/install">the install docs</a> for Windows and
          manual downloads.
        </p>

        {hasDirectDownloads && (
          <details className="download-manual">
            <summary>Or download directly</summary>
            <div className="download-grid">
              {macAsset && (
                <a
                  className="download-card"
                  href={macAsset.browser_download_url}
                >
                  <span className="download-platform">macOS</span>
                  <span className="download-file">{macAsset.name}</span>
                </a>
              )}
              {windowsAsset && (
                <a
                  className="download-card"
                  href={windowsAsset.browser_download_url}
                >
                  <span className="download-platform">Windows</span>
                  <span className="download-file">{windowsAsset.name}</span>
                </a>
              )}
              {linuxAsset && (
                <a
                  className="download-card"
                  href={linuxAsset.browser_download_url}
                >
                  <span className="download-platform">Linux</span>
                  <span className="download-file">{linuxAsset.name}</span>
                </a>
              )}
            </div>
            {macAsset && (
              <p className="download-note">
                macOS will warn that Coo is from an unidentified developer — it
                isn't signed or notarized yet. See{" "}
                <a href="#/docs/install">the install docs</a> to open it anyway.
              </p>
            )}
          </details>
        )}
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
