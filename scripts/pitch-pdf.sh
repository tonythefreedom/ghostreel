#!/bin/sh
# Prints pitch/deck.html to pitch/GhostReel-pitch.pdf (two 1920×1080 pages) with the local Chrome.
cd "$(dirname "$0")/.." || exit 1
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --no-pdf-header-footer --virtual-time-budget=8000 \
  --user-data-dir="${TMPDIR:-/tmp}/gr-pitch-chrome" \
  --print-to-pdf="$PWD/pitch/GhostReel-pitch.pdf" "file://$PWD/pitch/deck.html"
