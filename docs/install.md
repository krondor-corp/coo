# Install

## Mac and Linux

Open Terminal, paste this in, and press Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/krondor-corp/coo/main/install.sh | bash
```

That works out which version your computer needs, downloads the latest one, and puts it in place — on a Mac, straight into your Applications folder. Then open Coo the way you'd open anything else.

### Your Mac says "Apple could not verify this app is free of malware"

Expected, and not a sign of a bad download. Coo hasn't been through Apple's paid signing process yet, so the first time you open it your Mac wants you to confirm you meant to. Do any one of these, once:

- **Right-click (or Control-click) Coo in your Applications folder and choose Open**, then click **Open** in the box that appears.
- If that option isn't there: open **System Settings → Privacy & Security**, scroll to the bottom, and click **Open Anyway** next to the message about Coo. Then open Coo again.
- Or, in Terminal:
  ```bash
  xattr -cr /Applications/Coo.app
  ```

Once you've done it, it won't ask again. It mostly comes up when you've downloaded the `.dmg` in a browser rather than using the command above.

## Windows

Download the `.msi` or the `-setup.exe` from [the latest release](https://github.com/krondor-corp/coo/releases/latest) and run it.

## Downloading it yourself, any computer

Grab the file for your machine from [the releases page](https://github.com/krondor-corp/coo/releases/latest):

| Your computer | The file |
| --- | --- |
| Mac, Apple silicon (M1 and later) | `Coo_<version>_aarch64.dmg` |
| Mac, Intel | `Coo_<version>_x64.dmg` |
| Windows | `Coo_<version>_x64-setup.exe` or `Coo_<version>_x64_en-US.msi` |
| Linux | `Coo_<version>_amd64.deb` or `Coo_<version>_amd64.AppImage` |

Not sure which Mac you have? Apple menu → About This Mac.

Every release also includes a `SHA256SUMS` file, if you like to check your downloads.

## updating

Coo doesn't update itself yet. Run the command above again, or download the newer version — either one replaces what you already have.

## uninstalling

On a Mac, drag Coo from your Applications folder to the Trash. On Windows, uninstall it the usual way through Settings → Apps. On Linux, if you installed the `.deb`:

```bash
sudo dpkg -r coo
```

## building it yourself

Coo is open source. If you want to build from the source code, see [development.md](https://github.com/krondor-corp/coo/blob/main/docs/development.md).
