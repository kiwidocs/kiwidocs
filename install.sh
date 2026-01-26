#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/kiwidocs/kiwidocs.git"
DIR_NAME="kiwidocs"

echo "🥝 Kiwi Docs Installer"
echo "----------------------"

# Check for git
if ! command -v git >/dev/null 2>&1; then
  echo "❌ Git is not installed."
  exit 1
fi

# Check for node
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is required."
  echo "👉 Install it via: brew install node"
  exit 1
fi

# Clone repo
if [ -d "$DIR_NAME" ]; then
  echo "⚠️  Directory '$DIR_NAME' already exists."
else
  echo "📥 Cloning Kiwi Docs..."
  git clone "$REPO_URL"
fi

cd "$DIR_NAME"

# Run config wizard
echo ""
echo "🛠️  Launching configuration wizard..."
node scripts/configure.js

echo ""
echo "✅ Kiwi Docs is configured!"
echo "👉 Next steps:"
echo "   cd kiwidocs"
echo "   npm install"
echo "   npm run dev (or however you start it)"
