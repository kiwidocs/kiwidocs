#!/usr/bin/env bash
set -e

# Force interactive input even when piped via curl | bash
exec < /dev/tty

REPO_URL="https://github.com/kiwidocs/kiwidocs.git"
DIR="kiwidocs"

progress_bar () {
  local duration=$1
  local width=40
  local step=$((duration * 10))
  local filled=0

  printf "  ["
  for ((i=0; i<width; i++)); do printf " "; done
  printf "]"

  for ((i=0; i<=step; i++)); do
    filled=$((i * width / step))
    printf "\r  ["
    for ((j=0; j<filled; j++)); do printf "#"; done
    for ((j=filled; j<width; j++)); do printf " "; done
    printf "]"
    sleep 0.1
  done
  echo ""
}

echo ""
echo "🥝 Kiwi Docs Installer (v1.5.0)"
echo "================================================="
echo "This installer will:"
echo "  • Clone the Kiwi Docs template"
echo "  • Ask you a few setup questions"
echo "  • Generate a ready-to-use config.js"
echo ""
echo "No Node.js. No npm. Pure Bash."
echo "================================================="
echo ""

# ---- dependency checks ----
echo "🔍 Checking system requirements..."
progress_bar 1

if command -v git >/dev/null 2>&1; then
  echo "  ✔ git found"
else
  echo "  ❌ git is required but not installed"
  exit 1
fi

echo ""

# ---- clone repo ----
echo "📥 Preparing repository..."
sleep 0.5

if [ -d "$DIR" ]; then
  echo "  ⚠️ '$DIR' already exists, reusing it"
  progress_bar 1
else
  echo "  Cloning from $REPO_URL"
  git clone "$REPO_URL" >/dev/null 2>&1 &
  progress_bar 3
  wait
  echo "  ✔ Clone completed"
fi

cd "$DIR"
echo "📂 Working directory: $(pwd)"
echo ""

# ---- configuration ----
echo "🛠 Preparing configuration wizard..."
progress_bar 2
echo ""

echo "You can press Enter to accept the default value."
echo ""

read -rp "GitHub owner or organization [kiwidocs]: " OWNER
OWNER=${OWNER:-kiwidocs}

read -rp "Documentation repository name [kiwidocs]: " REPO
REPO=${REPO:-kiwidocs}

read -rp "Default branch name [main]: " BRANCH
BRANCH=${BRANCH:-main}

read -rp "Site title (browser title) [Kiwi Docs]: " TITLE
TITLE=${TITLE:-"Kiwi Docs"}

read -rp "Sidebar title [$TITLE]: " SHORT_TITLE
SHORT_TITLE=${SHORT_TITLE:-"$TITLE"}

read -rp "Creator name (footer) [Veer Bajaj]: " CREATOR
CREATOR=${CREATOR:-"Veer Bajaj"}

read -rp "Organization name (footer) [Kiwi Docs]: " ORG
ORG=${ORG:-"Kiwi Docs"}

read -rp "Version label [Kiwi Docs v2.1.0]: " VERSION
VERSION=${VERSION:-"Kiwi Docs v2.1.0"}

LOGO="https://github.com/$OWNER.png"

echo ""
echo "🧾 Configuration summary"
echo "-------------------------------------------------"
echo "  GitHub owner       : $OWNER"
echo "  Docs repository    : $REPO"
echo "  Default branch     : $BRANCH"
echo "  Site title         : $TITLE"
echo "  Sidebar title      : $SHORT_TITLE"
echo "  Creator            : $CREATOR"
echo "  Organization       : $ORG"
echo "  Version            : $VERSION"
echo "  Logo URL           : $LOGO"
echo "-------------------------------------------------"
echo ""

# ---- write config.js ----
echo "✍️  Writing config.js..."
progress_bar 2

cat > host/config.js <<EOF
/*
  Copyright (C) 2026 - Kiwi Docs
  GNU General Public License v3
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

echo "  ✔ config.js created successfully"
echo ""

# ---- final instructions ----
echo "🎉 Installation complete!"
echo "================================================="
echo "Next steps:"
echo "  1️⃣  Push this repository to your GitHub account"
echo "  2️⃣  Enable GitHub Pages:"
echo "      Settings → Pages → Source: main / root"
echo "  3️⃣  Open your GitHub Pages URL"
echo ""
echo "Your documentation site is now ready."
echo "================================================="
