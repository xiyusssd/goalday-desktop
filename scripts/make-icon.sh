#!/bin/sh
# Compose a macOS-style app icon: white rounded-square with padded artwork.
# Usage: make-icon.sh <source-square-png>
set -e
SRC="$1"
OUT=/tmp/appicon.png
B64=/tmp/appicon_src.b64

# Base64-encode the (already square) source so it can be inlined into an SVG.
base64 -i "$SRC" > "$B64"

# Build the SVG: 1024 canvas, 824 rounded rect (macOS margin), art at ~78% inset.
{
  printf '%s\n' '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="1024" viewBox="0 0 1024 1024">'
  printf '%s\n' '<defs><clipPath id="r"><rect x="100" y="100" width="824" height="824" rx="185"/></clipPath></defs>'
  printf '%s\n' '<rect x="100" y="100" width="824" height="824" rx="185" fill="#ffffff"/>'
  printf '%s\n' '<g clip-path="url(#r)">'
  printf '%s' '<image x="192" y="192" width="640" height="640" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,'
  cat "$B64"
  printf '%s\n' '"/>'
  printf '%s\n' '</g></svg>'
} > /tmp/appicon.svg

rm -f "$OUT" /tmp/appicon.svg.png
qlmanage -t -s 1024 -o /tmp /tmp/appicon.svg >/dev/null 2>&1
mv /tmp/appicon.svg.png "$OUT" 2>/dev/null || true
sips -g pixelWidth -g pixelHeight "$OUT" 2>/dev/null | grep pixel
