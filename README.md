# Kiwi Docs Template

A lightweight, GitHub-powered documentation site. Fork this repository to create your own documentation portal.

## Features
- **Zero Build Step**: Runs directly from GitHub Pages.
- **GitHub API Integration**: Automatically fetches Markdown files from your repository.
- **Customizable**: Easy configuration via `config.js` and `theme.css`.
- **Responsive**: Mobile-friendly design.
- **Activity Feed**: Shows recent commits from specified repositories.

## How to Use

### 1. Fork & Setup
1. Fork this repository.
2. Enable **GitHub Pages** in your repo settings (Settings > Pages > Source: `main` branch / root).

### 2. Configuration (`config.js`)
Open `config.js` and update the values to match your project:

```javascript
const CONFIG = {
    owner: "your-username",
    repo: "your-repo-name",
    branch: "main",
    branding: {
        title: "My Docs",
        logo: "https://your-logo-url.png"
    }
    // ...
};
```

### 3. Theming (`css/theme.css`)
Customize the colors and variables in `css/theme.css` to match your brand:

```css
:root {
    --accent-primary: #ff5722; /* Your primary color */
    --bg-dark: #121212;
}
```

### 4. Adding Content
Create `.md` files in the root (or subdirectories). They will automatically appear in the sidebar.
- `README.md` acts as the home page.
- Images/Assets: Use relative paths (e.g., `images/screenshot.png`).

## Live Development
To test locally, you can use any static file server, for example:
```bash
npx serve .
```
or just open `index.html` in your browser (though some API features might need a local server/CORS).

## Credits
Originally created by **Veer Bajaj** for **Team 5171**.
Released under MIT License.
