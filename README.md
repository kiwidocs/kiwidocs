# Kiwi Docs Template

A lightweight, GitHub-powered documentation site that runs directly on **GitHub Pages**.
Fork this repository to create your own documentation portal in minutes.

---

## Features

* **Zero Build Step** – Runs directly from GitHub Pages
* **GitHub API Integration** – Automatically fetches Markdown files
* **Easy Customization** – Configure via `config.js` and `css/theme.css`
* **Responsive Design** – Mobile-friendly layout
* **Activity Feed** – Displays recent commits from selected repositories

---

## How to Use

### 1. Create Your Copy

You have three options:

<!-- @snippets-per-type(CLI="gh repo fork kiwidocs/kiwidocs --clone" GUI="Use GitHub's web UI or CLI:" Installer="curl -fsSL -o install.sh https://raw.githubusercontent.com/kiwidocs/kiwidocs/main/install.sh\nbash install.sh") -->

#### Option A — Fork (recommended)

Use GitHub’s web UI or CLI:

```bash
gh repo fork kiwidocs/kiwidocs --clone
```

Then enable **GitHub Pages**:

* Settings → Pages
* Source: `main` branch / root

---

#### Option B — Clone Manually

```bash
git clone https://github.com/kiwidocs/kiwidocs.git
cd kiwidocs
```

---

#### Option C — One-Line Installer (guided setup)

This clones the repo **and walks you through configuration**:

```bash
curl -fsSL https://raw.githubusercontent.com/kiwidocs/kiwidocs/main/install.sh | bash
```

> **Requirements:** `git`, `node`, and `bash`
> On macOS: `brew install node git`

---

### 2. Configuration (`config.js`)

If you used the installer, this file is already generated for you.

Otherwise, open `config.js` and edit:

```js
const CONFIG = {
    owner: "your-github-username-or-org",
    repo: "your-docs-repo",
    activityRepo: "your-docs-repo",
    branch: "main",

    branding: {
        title: "My Docs",
        shortTitle: "Docs",
        logo: "https://github.com/your-username.png",
        welcomeTitle: "Welcome",
        welcomeText: "Select a document from the sidebar to begin."
    },

    footer: {
        creator: "Your Name",
        organization: "Your Organization",
        version: "v1.0.0"
    }
};
```

---

### 3. Theming (`css/theme.css`)

Customize colors and layout variables:

```css
:root {
    --accent-primary: #ff5722;
    --bg-dark: #121212;
}
```

---

### 4. Adding Content

* Create `.md` files anywhere in the repo
* Files automatically appear in the sidebar
* `README.md` acts as the homepage
* Use relative paths for assets:

  ```md
  ![Screenshot](images/screenshot.png)
  ```

---

## Local Development

Kiwi Docs is fully static.

You can preview locally with:

```bash
npx serve .
```

Or:

```bash
python -m http.server 8000
```

Or open `index.html` directly
*(Note: some GitHub API features require a local server due to CORS)*

---

## Credits & License

Originally created by **Veer Bajaj** as part of **Kiwi Docs**.
Released under the **GNU GPL v3 License**.
