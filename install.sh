#!/usr/bin/env bash
set -euo pipefail

REPO="krondor-corp/coo"
APP_NAME="Coo"
INSTALL_DIR="${INSTALL_DIR:-/Applications}"

TMP=""
MOUNT_POINT=""
cleanup() {
    [ -n "${MOUNT_POINT}" ] && hdiutil detach "${MOUNT_POINT}" -quiet 2>/dev/null || true
    [ -n "${TMP}" ] && rm -rf "${TMP}" || true
}
trap cleanup EXIT

# Without this, any unexpected non-zero status under `set -e` exits mutely and
# looks to the user like the installer did nothing at all.
trap 'echo "" >&2; echo "Install failed at line ${LINENO}. Nothing was changed in ${INSTALL_DIR}." >&2; echo "Please report this with the output above: https://github.com/${REPO}/issues" >&2' ERR

RESOLVED_VERSION=""
RESOLVED_URL=""

main() {
    local os arch pattern

    os="$(detect_os)"
    arch="$(detect_arch "${os}")"
    TMP="$(mktemp -d)"

    pattern="$(asset_pattern "${os}" "${arch}")"
    resolve_release "${pattern}"

    echo "Installing ${APP_NAME} ${RESOLVED_VERSION#coo-v} (${arch}-${os})..."

    case "${os}" in
        darwin) install_macos ;;
        linux)  install_linux ;;
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
    if [ "${os}" = "linux" ] && [ "$(uname -m)" != "x86_64" ] && [ "$(uname -m)" != "amd64" ]; then
        echo "coo only ships a Linux amd64 build today." >&2
        echo "Download an installer for your platform from https://github.com/${REPO}/releases" >&2
        exit 1
    fi
    case "$(uname -m)" in
        x86_64|amd64)  echo "x64" ;;
        arm64|aarch64) echo "aarch64" ;;
        *)
            echo "Unsupported architecture: $(uname -m)." >&2
            echo "Download an installer for your platform from https://github.com/${REPO}/releases" >&2
            exit 1
            ;;
    esac
}

# Matched against asset names. Deliberately excludes the version so one pattern
# works across releases while we search for one that's finished uploading.
asset_pattern() {
    local os="$1" arch="$2"
    case "${os}" in
        darwin) echo "_${arch}.dmg" ;;
        linux)  echo "_amd64.deb" ;;
    esac
}

# The repo also tags site/design-tokens releases via release-please, so we can't
# just take releases/latest — filter for the coo-v* component explicitly.
# Newest first.
list_versions() {
    curl -fsSL "https://api.github.com/repos/${REPO}/releases" \
        | grep '"tag_name": *"coo-v' \
        | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/'
}

# Empty (not a failure) when this release has no asset matching the pattern —
# `|| true` keeps a no-match grep from tripping `set -e` and killing the script
# silently, which is exactly what used to happen mid-build.
asset_url() {
    local version="$1" pattern="$2"
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/tags/${version}" 2>/dev/null \
        | grep '"browser_download_url"' \
        | grep -- "${pattern}" \
        | head -1 \
        | sed 's/.*"browser_download_url": *"\([^"]*\)".*/\1/' \
        || true
}

# A release is published as soon as it's tagged, but its installers are uploaded
# by a build that takes several minutes — and can fail outright. So walk back
# from the newest release to the first one that actually has our installer,
# rather than reporting a version we then can't download.
resolve_release() {
    local pattern="$1" version url newest=""

    for version in $(list_versions); do
        [ -n "${newest}" ] || newest="${version}"
        url="$(asset_url "${version}" "${pattern}")"
        if [ -n "${url}" ]; then
            if [ "${version}" != "${newest}" ]; then
                echo "${newest#coo-v} has no ${pattern} installer yet — its build is probably still running." >&2
                echo "Installing ${version#coo-v} instead; re-run this later to pick up ${newest#coo-v}." >&2
                echo "" >&2
            fi
            RESOLVED_VERSION="${version}"
            RESOLVED_URL="${url}"
            return 0
        fi
    done

    echo "No ${APP_NAME} release has a ${pattern} installer." >&2
    echo "The newest build may still be running, or may have failed." >&2
    echo "Check https://github.com/${REPO}/releases and try again shortly." >&2
    exit 1
}

install_macos() {
    curl -fsSL -o "${TMP}/coo.dmg" "${RESOLVED_URL}"
    MOUNT_POINT="$(hdiutil attach "${TMP}/coo.dmg" -nobrowse | grep -o '/Volumes/.*' | tail -1)"
    [ -n "${MOUNT_POINT}" ] || { echo "Could not mount the downloaded disk image." >&2; exit 1; }
    [ -d "${MOUNT_POINT}/${APP_NAME}.app" ] || {
        echo "The disk image doesn't contain ${APP_NAME}.app." >&2
        exit 1
    }

    # Stage the new app fully before touching the installed one. Deleting first
    # meant any later failure left you with no app at all.
    cp -R "${MOUNT_POINT}/${APP_NAME}.app" "${TMP}/"
    hdiutil detach "${MOUNT_POINT}" -quiet
    MOUNT_POINT=""

    [ -d "${TMP}/${APP_NAME}.app" ] || { echo "Copying ${APP_NAME}.app out of the image failed." >&2; exit 1; }

    rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
    mv "${TMP}/${APP_NAME}.app" "${INSTALL_DIR}/"

    # Coo isn't signed with an Apple Developer ID yet. Files copied by a Terminal-driven
    # script normally never pick up the com.apple.quarantine flag that triggers Gatekeeper's
    # "unidentified developer" block in the first place, but strip it defensively in case it's
    # present (e.g. curl configured to tag downloads, or a re-run over an existing quarantined copy).
    xattr -cr "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true

    echo "Installed ${APP_NAME} to ${INSTALL_DIR}/${APP_NAME}.app"
    echo "If Coo was already running, quit it (Cmd+Q) and reopen to get this version."
}

install_linux() {
    curl -fsSL -o "${TMP}/coo.deb" "${RESOLVED_URL}"
    echo "Installing via dpkg (requires sudo)..."
    sudo dpkg -i "${TMP}/coo.deb"

    echo "Installed ${APP_NAME}."
}

main
