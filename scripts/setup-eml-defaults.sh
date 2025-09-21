#!/usr/bin/env bash
set -euo pipefail

# setup-eml-defaults.sh
# Ensures .eml files open with Microsoft Outlook on macOS using `duti`.

# Options:
#   --auto-install-brew    If Homebrew is missing, attempt to install it (interactive).
#   --quiet                Less output.
#   --dry-run              Show what would be done without changing anything.

QUIET=0
DRY_RUN=0
AUTO_INSTALL_BREW=0

log()  { [ "$QUIET" -eq 0 ] && echo "[eml-setup] $*"; }
run()  { [ "$DRY_RUN" -eq 1 ] && echo "+ $*"; [ "$DRY_RUN" -eq 0 ] && eval "$@"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --quiet) QUIET=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --auto-install-brew) AUTO_INSTALL_BREW=1 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

# 1) Platform check
if [ "$(uname -s)" != "Darwin" ]; then
  echo "This script is for macOS only." >&2
  exit 1
fi

# 2) Find Outlook bundle id
OUTLOOK_BUNDLE_ID="$(osascript -e 'id of app "Microsoft Outlook"' 2>/dev/null || true)"
if [ -z "$OUTLOOK_BUNDLE_ID" ]; then
  # Fallback to well-known id
  OUTLOOK_BUNDLE_ID="com.microsoft.Outlook"
  log "Could not query Outlook via AppleScript; using fallback bundle id: $OUTLOOK_BUNDLE_ID"
else
  log "Detected Outlook bundle id: $OUTLOOK_BUNDLE_ID"
fi
# After resolving OUTLOOK_BUNDLE_ID and ensuring duti is present, add:
duti -s "$OUTLOOK_BUNDLE_ID" .eml all

for UTI in \
  "com.apple.mail.email" \
  "com.apple.internet-email-message" \
  "public.email-message" \
  "public.message"
do
  duti -s "$OUTLOOK_BUNDLE_ID" "$UTI" all || true
done

sudo /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -kill -r -domain local -domain system -domain user
killall Finder || true


# 3) Ensure `duti` is available
DUTI_PATH="$(command -v duti || true)"
if [ -z "$DUTI_PATH" ]; then
  log "duti not found."

  # Prefer Homebrew if present
  if command -v brew >/dev/null 2>&1; then
    log "Installing duti via Homebrew..."
    run "brew install duti"
  else
    if [ "$AUTO_INSTALL_BREW" -eq 1 ]; then
      log "Homebrew not found. Attempting to install Homebrew (interactive)..."
      run '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
      log "Installing duti via Homebrew..."
      run "brew install duti"
    else
      cat >&2 <<'EOF'
duti is required but not installed.

Install paths:
  1) With Homebrew (recommended):
       /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
       brew install duti

  2) Or download source: https://github.com/moretension/duti

Re-run this script after installing duti, or call it with --auto-install-brew.
EOF
      exit 1
    fi
  fi
else
  log "Found duti at: $DUTI_PATH"
fi

# 4) Set association: .eml -> Outlook for all roles
#    (roles: viewer, editor, shell; 'all' applies to all)
log "Associating .eml with $OUTLOOK_BUNDLE_ID (all roles) ..."
if [ "$DRY_RUN" -eq 1 ]; then
  echo "+ duti -s $OUTLOOK_BUNDLE_ID .eml all"
else
  duti -s "$OUTLOOK_BUNDLE_ID" .eml all
fi

# 5) Verify via LaunchServices database
#    duti -x prints current association for an extension.
log "Verifying association..."
if [ "$DRY_RUN" -eq 1 ]; then
  echo "+ duti -x eml"
else
  if ! duti -x eml; then
    echo "Warning: verification via 'duti -x eml' failed." >&2
  fi
fi

log "Done. New .eml files should open in Microsoft Outlook by default."
log "If Finder still opens them elsewhere, run:  killall Finder  (optional refresh)"

