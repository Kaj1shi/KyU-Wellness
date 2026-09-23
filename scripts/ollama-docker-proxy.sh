#!/usr/bin/env bash
# Bridge host-local Ollama (127.0.0.1:11434) to 0.0.0.0:11435 so Docker can reach it.
# Needed when Ollama is not listening on all interfaces (default).
set -euo pipefail

LISTEN_PORT="${OLLAMA_PROXY_PORT:-11435}"
TARGET="${OLLAMA_PROXY_TARGET:-127.0.0.1:11434}"

if ! command -v socat >/dev/null 2>&1; then
  echo "socat is required. Install with: sudo apt install socat"
  exit 1
fi

if ss -ltn | grep -q ":${LISTEN_PORT} "; then
  echo "Proxy already listening on :${LISTEN_PORT}"
  exit 0
fi

echo "Proxying 0.0.0.0:${LISTEN_PORT} -> ${TARGET}"
exec socat "TCP-LISTEN:${LISTEN_PORT},fork,reuseaddr,bind=0.0.0.0" "TCP:${TARGET}"
