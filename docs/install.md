# Install

## macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/krondor-corp/coo/main/install.sh | bash
```

This detects your OS/arch, downloads the latest `coo-v*` release, and installs it:

- **macOS** — mounts the `.dmg` and copies `Coo.app` into `/Applications` (override with `INSTALL_DIR`)
- **Linux** — downloads the `.deb` and installs it with `sudo dpkg -i` (amd64 only today; other distros can grab the `.AppImage` manually)

### macOS: "Apple could not verify this app is free of malware"

Coo isn't signed with an Apple Developer ID or notarized yet, so Gatekeeper blocks it the first time you open it — whether you installed via the script or downloaded the `.dmg` from a browser (browser downloads get tagged with a quarantine flag that Terminal-driven installs don't). This is expected, not a broken build. Pick one:

- **Right-click (Control-click) `Coo.app` → Open**, then confirm "Open" in the dialog that appears.
- If macOS doesn't offer that option: **System Settings → Privacy & Security**, scroll to the bottom, and click **"Open Anyway"** next to the Coo warning. Then open the app again.
- From Terminal:
  ```bash
  xattr -cr /Applications/Coo.app
  ```

You only need to do this once per install. `install.sh` clears the quarantine flag for you, so this mostly matters if you downloaded the `.dmg` directly.

## Windows

There's no installer script for Windows — download the `.msi` or the NSIS `-setup.exe` directly from [the latest release](https://github.com/krondor-corp/coo/releases/latest) and run it.

## manually, any platform

Grab the file for your platform from [the releases page](https://github.com/krondor-corp/coo/releases/latest):

| Platform | File |
| --- | --- |
| macOS Apple Silicon | `Coo_<version>_aarch64.dmg` |
| macOS Intel | `Coo_<version>_x64.dmg` |
| Windows | `Coo_<version>_x64-setup.exe` or `Coo_<version>_x64_en-US.msi` |
| Linux | `Coo_<version>_amd64.deb` or `Coo_<version>_amd64.AppImage` |

Every release also publishes a `SHA256SUMS` file if you want to verify a download.

## updating

Coo doesn't self-update yet. Re-run the install script, or download the newer release manually — either overwrites the previous install.

## uninstall

```bash
rm -rf /Applications/Coo.app          # macOS
sudo dpkg -r coo                      # Linux, if installed via .deb
```

On Windows, uninstall it the normal way (Settings → Apps).

## building from source

See [development.md](./development.md).
