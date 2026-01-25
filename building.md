# ✨ Building with Kiwi

Kiwi Docs isn't just for static text. It supports **Building Blocks** — powerful, dynamic components that you can drop directly into your Markdown files to create rich, interactive documentation.

## 🚀 How to Write Your Markdown!

Adding dynamic content to your pages is as simple as writing a trigger. There are two types of blocks:

### 1. Single-Line Blocks
Use these for components that only need basic settings.
- **Syntax:** `@block-name(argument="value")`
- **Example:** `@iframe(src="...", height="300px")`

### 2. Multi-Line Blocks
Use these for components that wrap around content or code.
- **Syntax:**
  ```markdown
  @block-name
  ... content here ...
  ```
- **Example:** The `@snippets-per-type` block uses this to hold your code.

---

## 📦 Core Blocks Portfolio

### 🧩 Snippets Per Type (`@snippets-per-type`)
The ultimate way to show multi-language code. It automatically creates a beautiful tabbed interface for your snippets.

**How to use it:**
Use the `@snippets-per-type` trigger, followed by `@@` sections for each language.

```markdown
@snippets-per-type
@@python:
print("Hello from Kiwi!")

@@javascript:
console.log("Hello from Kiwi!");

@@bash:
echo "Hello from Kiwi!"
```

### 🖼️ Iframe (`@iframe`)
Embed websites, demos, or videos directly into your docs.

**How to use it:**
```markdown
@iframe(src="https://example.com", height="400px")
```

---

## � Advanced Markdown Features

Kiwi leverages **Marked.js** for high-performance rendering. Besides standard Markdown, we've optimized several features:

### 📸 Rich Media
You can embed images, videos, and audio using standard syntax. Kiwi automatically resolves relative paths to your GitHub repository!

| Type | Syntax |
| :--- | :--- |
| **Image** | `![alt text](path/to/img.png)` |
| **Video** | `![Video](path/to/video.mp4)` |
| **Audio** | `![Audio](path/to/audio.mp3)` |

### 📑 Automatic Table of Contents
Every `h1`, `h2`, and `h3` is automatically scanned and added to the sidebar's **Table of Contents**. This keeps your navigation smooth and effortless.

### 🔗 Smart Linking
Links to other `.md` files (e.g., `[Setup Guide](setup.md)`) are automatically intercepted. They load instantly without a full page refresh, keeping your users in the flow.

---

## �🛠️ Creating Custom Blocks

You can extend Kiwi with your own blocks by adding `.kiwi` files to the `blocks/` directory.

### 1. The Block Definition (.kiwi)
Each block is a JSON-like configuration file:

```json
{
  "name": "my-component",
  "description": "Short description",
  "trigger": "@my-trigger",
  "isMultiLine": true,
  "renderer": "/* Javascript logic */"
}
```

### 2. The Renderer API
The `renderer` property is a string containing a JavaScript function body. It receives two variables:

- `args`: A string containing everything inside the parentheses `(...)`.
- `body`: (Multi-line only) The content provided below the trigger.

**Example Minimal Renderer:**
```javascript
return (args, body) => {
  return `<div class="custom-box">${body}</div>`;
}
```

### 💡 Best Practices
- **Namespace your triggers**: Start with `@` (e.g., `@my-org-alert`).
- **Style safely**: Use `<style>` tags within your renderer, but scope them to a unique class to avoid bleeding into other documentation.
- **Keep it fast**: Avoid heavy external scripts inside renderers to maintain a snappy documentation experience.
