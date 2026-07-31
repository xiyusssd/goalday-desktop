#!/bin/sh
# Build GoalDay desktop for release.
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

# Default to the .app only. The .dmg step drives Finder over Apple Events, which
# fails with a -1743 permission error unless the terminal has Automation access
# granted. Pass explicit bundle args to override, e.g. `./build.sh --bundles dmg`.
if [ $# -eq 0 ]; then
  set -- --bundles app
fi

exec node_modules/.bin/tauri build "$@"