#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
swiftc "$SCRIPT_DIR/main.swift" -o "$SCRIPT_DIR/../resources/swift-helper"
echo "Built: resources/swift-helper"
