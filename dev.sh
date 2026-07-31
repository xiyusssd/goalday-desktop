#!/bin/sh
# Launch GoalDay desktop in dev mode.
# Uses a standalone Node because the default `node` on this machine is a shim into
# ChatGPT.app's bundled Node (hardened runtime + library validation) that refuses
# to load prebuilt native modules (rollup/esbuild). See README.
set -e
cd "$(dirname "$0")"

NODE_BIN="$HOME/.goalday-runtime/node/bin"
if [ -x "$NODE_BIN/node" ]; then
  export PATH="$NODE_BIN:$PATH"
elif [ -x /opt/homebrew/bin/node ]; then
  export PATH="/opt/homebrew/bin:$PATH"
fi

# Tauri shells out to cargo, which lives outside the default PATH under launchd.
if [ -d "$HOME/.cargo/bin" ]; then
  export PATH="$PATH:$HOME/.cargo/bin"
fi

echo "Using node: $(command -v node) ($(node -v))"
exec node_modules/.bin/tauri dev
