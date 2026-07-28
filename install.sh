#!/usr/bin/env bash
set -euo pipefail

REPO="krondor-corp/coo"
APP_NAME="Coo"
INSTALL_DIR="${INSTALL_DIR:-/Applications}"

TMP=""
cleanup() { [ -n "${TMP}" ] && rm -rf "${TMP}"; }
trap cleanup EXIT

main() {
    local os arch version

    os="$(detect_os)"
    arch="$(detect_arch "${os}")"
    version="$(latest_version)"
    TMP="$(mktemp -d)"

    echo "Installing ${APP_NAME} ${version#coo-v} (${arch}-${os})..."

    case "${os}" in
        darwin) install_macos "${version}" "${arch}" ;;
        linux)  install_linux "${version}" ;;
    esac
}

detect_os() {
    case "$(uname -s)" in
        Linux*)  echo "linux" ;;
        Darwin*) echo "darwin" ;;
        *)
            echo "Unsupported OS: $(uname -s)." >&2
            echo "Download an installer for your platform from https://github.com/${REPO}/releases" >&2
            exit 1
            ;;
    esac
}

# Only used on macOS — coo currently ships one Linux build (amd64/.deb, .AppImage).
detect_arch() {
    local os="$1"
    case "$(uname -m)" in
        x86_64|amd64)  echo "x64" ;;
        arm64|aarch64) echo "aarch64" ;;
        *)
            echo "Unsupported architecture: $(uname -m)." >&2
            echo "Download an installer for your platform from https://github.com/${REPO}/releases" >&2
            exit 1
            ;;
    esac
    if [ "${os}" = "linux" ] && [ "$(uname -m)" != "x86_64" ] && [ "$(uname -m)" != "amd64" ]; then
        echo "coo only ships a Linux amd64 build today." >&2
        echo "Download an installer for your platform from https://github.com/${REPO}/releases" >&2
        exit 1
    fi
}

# The repo also tags site/design-tokens releases via release-please, so we can't
# just take releases/latest — filter for the coo-v* component explicitly.
latest_version() {
    curl -fsSL "https://api.github.com/repos/${REPO}/releases" \
        | grep '"tag_name": *"coo-v' \
        | head -1 \
        | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/'
}

asset_url() {
    local version="$1" pattern="$2"
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/tags/${version}" \
        | grep '"browser_download_url"' \
        | grep "${pattern}" \
        | head -1 \
        | sed 's/.*"browser_download_url": *"\([^"]*\)".*/\1/'
}

install_macos() {
    local version="$1" arch="$2" version_num dmg url mount_point
    version_num="${version#coo-v}"
    dmg="Coo_${version_num}_${arch}.dmg"
    url="$(asset_url "${version}" "${dmg}")"
    [ -n "${url}" ] || { echo "Could not find ${dmg} in release ${version}" >&2; exit 1; }

    curl -fsSL -o "${TMP}/coo.dmg" "${url}"
    mount_point="$(hdiutil attach "${TMP}/coo.dmg" -nobrowse | grep -o '/Volumes/.*' | tail -1)"
    [ -n "${mount_point}" ] || { echo "Could not mount ${dmg}" >&2; exit 1; }

    rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
    cp -R "${mount_point}/${APP_NAME}.app" "${INSTALL_DIR}/"
    hdiutil detach "${mount_point}" -quiet

    # Coo isn't signed with an Apple Developer ID yet. Files copied by a Terminal-driven
    # script normally never pick up the com.apple.quarantine flag that triggers Gatekeeper's
    # "unidentified developer" block in the first place, but strip it defensively in case it's
    # present (e.g. curl configured to tag downloads, or a re-run over an existing quarantined copy).
    xattr -cr "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true

    echo "Installed ${APP_NAME} to ${INSTALL_DIR}/${APP_NAME}.app"
}

install_linux() {
    local version="$1" version_num deb url
    version_num="${version#coo-v}"
    deb="Coo_${version_num}_amd64.deb"
    url="$(asset_url "${version}" "${deb}")"
    [ -n "${url}" ] || { echo "Could not find ${deb} in release ${version}" >&2; exit 1; }

    curl -fsSL -o "${TMP}/coo.deb" "${url}"
    echo "Installing via dpkg (requires sudo)..."
    sudo dpkg -i "${TMP}/coo.deb"

    echo "Installed ${APP_NAME}."
}

main
