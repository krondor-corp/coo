# Releases & Pages Setup

## Release Pipeline

Two workflows chain together to automate releases:

1. **Push to `main`** (touching `apps/desktop/**`) → `release-please.yml` scans conventional commits, bumps the version, opens/updates a standing release PR
2. **Merge the release PR** → it tags `coo-vX.Y.Z`, which triggers `release-coo.yml`: builds macOS, Windows, and Linux installers and attaches them to a GitHub Release with checksums

### PAT Setup

The default `GITHUB_TOKEN` can't push commits/tags that trigger other workflows (GitHub's anti-cascade rule). release-please needs a PAT:

1. Go to **GitHub → Settings → Developer settings → Personal access tokens**
2. Create a classic token with `repo` scope
3. Go to **repo Settings → Secrets and variables → Actions**
4. Add a repository secret: **Name:** `RELEASE_PAT`, **Value:** the token

```bash
gh secret set RELEASE_PAT --repo krondor-corp/coo
```

There is no default-token fallback — release-please fails closed if `RELEASE_PAT` isn't set, rather than silently running as a token that can't actually cut a release.

### Cutting a Release

Commit to `main` using [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: ...` → minor bump
- `fix: ...` → patch bump
- `feat!: ...` or a `BREAKING CHANGE` footer → major bump

Only commits touching `apps/desktop/**` affect the app's version. release-please maintains a standing `chore(main): release coo X.Y.Z` PR that bumps `apps/desktop/package.json`, `apps/desktop/src-tauri/tauri.conf.json`, and `apps/desktop/src-tauri/Cargo.toml` together, plus a changelog. Merging it tags `coo-vX.Y.Z` and triggers the build.

### Manual Release

Trigger `release-coo.yml` directly from the Actions tab, or:

```bash
gh workflow run release-coo.yml -f version=X.Y.Z
```

Useful for a hotfix you don't want to wait on release-please for.

## GitHub Pages

`apps/site` deploys automatically on push to `main` when files under `apps/site/**`, `packages/design-tokens/**`, or the `pages.yml` workflow itself change. It's served at the custom domain `coo.krondor.org`, configured at the repo level (**Settings → Pages**) with a `CNAME` file committed at `apps/site/public/CNAME` so the mapping survives a Pages settings reset.

The site is a plain Vite/React build with `base: "/"` — it's served at the domain root, not the default `username.github.io/coo` project-page path, so don't reintroduce a `/coo` base path (`actions/configure-pages`' `base_path` output assumes the latter and will break asset URLs if wired back in).
