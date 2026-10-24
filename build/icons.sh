#!/usr/bin/env bash
# Rebuild PNG and macOS ICNS from the SVG source (librsvg + macOS iconutil).
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
icon_work="$(mktemp -d "${TMPDIR:-/tmp}/thomnail-icons.XXXXXX")"
trap 'rm -rf "$icon_work"' EXIT
iconset="$icon_work/Thomnail.iconset"
mkdir -p "$iconset"

for size in 16 32 128 256 512; do
  rsvg-convert -w "$size" -h "$size" "$project_dir/resources/icon.svg" \
    -o "$iconset/icon_${size}x${size}.png"
  retina=$((size * 2))
  rsvg-convert -w "$retina" -h "$retina" "$project_dir/resources/icon.svg" \
    -o "$iconset/icon_${size}x${size}@2x.png"
done

iconutil -c icns "$iconset" -o "$icon_work/icon.icns"
cp "$iconset/icon_512x512@2x.png" "$project_dir/resources/icon.png"
cp "$icon_work/icon.icns" "$project_dir/resources/icon.icns"
