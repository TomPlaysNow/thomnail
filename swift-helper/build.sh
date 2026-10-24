#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../src-tauri/binaries"
mkdir -p "$OUTPUT_DIR"
xcrun swiftc -O "$SCRIPT_DIR/main.swift" -o "$OUTPUT_DIR/swift-helper"
echo "Built: src-tauri/binaries/swift-helper"
