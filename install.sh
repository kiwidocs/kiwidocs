#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/kiwidocs/kiwidocs.git"
DIR="kiwidocs"

echo "🥝 Kiwi Docs Installer (v1.0.0)"
echo "---------------------"

# --- check git ---
if ! command -v git >/dev/null 2>&1; then
  echo "❌ git is required"
  exit 1
fi

# --- clone repo ---
if [ -d "$DIR" ]; then
  echo "⚠️ '$DIR' already exists, using it"
else
  echo "📥 Cloning repository..."
  git clone "$REPO_URL"
fi

cd "$DIR"

echo ""
echo "🛠 Kiwi Docs Configuration"
echo "Press Enter to accept defaults"
echo ""

# --- prompts ---
read -rp "GitHub owner/org [kiwidocs]: " OWNER
OWNER=${OWNER:-kiwidocs}

read -rp "Docs repository name [kiwidocs]: " REPO
REPO=${REPO:-kiwidocs}

read -rp "Default branch [main]: " BRANCH
BRANCH=${BRANCH:-main}

read -rp "Site title [Kiwi Docs]: " TITLE
TITLE=${TITLE:-"Kiwi Docs"}

read -rp "Sidebar title [$TITLE]: " SHORT_TITLE
SHORT_TITLE=${SHORT_TITLE:-"$TITLE"}

read -rp "Creator name [Veer Bajaj]: " CREATOR
CREATOR=${CREATOR:-"Veer Bajaj"}

read -rp "Organization name [Kiwi Docs]: " ORG
ORG=${ORG:-"Kiwi Docs"}

read -rp "Version label [Kiwi Docs v2.1.0]: " VERSION
VERSION=${VERSION:-"Kiwi Docs v2.1.0"}

LOGO="https://github.com/$OWNER.png"

# --- write config.js ---
cat > config.js <<EOF
/*
  Copyright (C) 2026 - Kiwi Docs
  GNU GPL v3
*/
const CONFIG = {
  owner: "$OWNER",
  repo: "$REPO",
  activityRepo: "$REPO",
  branch: "$BRANCH",

  branding: {
    title: "$TITLE",
    shortTitle: "$SHORT_TITLE",
    logo: "$LOGO",
    welcomeTitle: "Welcome to $TITLE",
    welcomeText: "We are initializing the workspace and fetching the latest guides. Please select a file from the sidebar to begin."
  },

  footer: {
    creator: "$CREATOR",
    organization: "$ORG",
    version: "$VERSION"
  }
};

if (!CONFIG.baseUrl) {
  CONFIG.baseUrl = window.location.href.split('?')[0].replace(/\/$/, "");
}
EOF

echo ""
echo "✅ config.js generated successfully"
echo ""
echo "👉 Next steps:"
echo "1. Push this repo to your GitHub account"
echo "2. Enable GitHub Pages (main / root)"
echo "3. Open your Pages URL"
