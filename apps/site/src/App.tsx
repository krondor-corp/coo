import { useEffect, useState } from "react";

const REPO = "krondor-corp/coo";

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

export function App() {
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

  return (
    <main className="page">
      <header className="hero">
        <Logomark />
        <span className="hero-eyebrow">A command-based ChordPro editor</span>
        <h1 className="hero-title">Coo</h1>
        <p className="hero-tagline">
          Write lyrics naturally. Insert, rename, and move chords without typing
          a single bracket.
        </p>
        <div className="hero-links">
          <a href="#download" className="hero-cta">
            Download
          </a>
          <a
            href={`https://github.com/${REPO}`}
            className="hero-link"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
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
        <h2>Download</h2>
        {release ? (
          <div className="download-grid">
            {macAsset && (
              <a className="download-card" href={macAsset.browser_download_url}>
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
        ) : (
          <p className="download-empty">
            No release published yet — check back soon, or{" "}
            <a href={`https://github.com/${REPO}/releases`}>
              browse all releases
            </a>
            .
          </p>
        )}
        {macAsset && (
          <p className="download-note">
            macOS will warn that Coo is from an unidentified developer — it
            isn't signed or notarized yet. Right-click the app and choose Open,
            or see{" "}
            <a
              href={`https://github.com/${REPO}/blob/main/docs/install.md`}
              target="_blank"
              rel="noreferrer"
            >
              the install guide
            </a>
            .
          </p>
        )}
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Krondor Corp</span>
        <a href={`https://github.com/${REPO}`}>GitHub</a>
      </footer>
    </main>
  );
}
