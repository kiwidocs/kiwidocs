# ✨ Building with Kiwi

Kiwi Docs isn't just for static text. It supports **Building Blocks** — powerful, dynamic components that you can drop directly into your Markdown files to create rich, interactive documentation.

## 🚀 How to Write Your Markdown!

Adding dynamic content to your pages is simple. We use the `+++` syntax, which is clear and robust.

### 1. Single-Line Blocks
Use these for components like iframes or animations.
- **Syntax:** `+++ blockName(arguments)`
- **Example:** `+++ typing(lines="Hello World")`

### 2. Multi-Line Blocks
Use these for components that wrap around content or code. Start with `+++ name` and end with `+++`.
- **Syntax:**
  ```markdown
  +++ blockName
  ... content here ...
  +++
  ```
- **Example:** The `snippets-per-type` block uses this to hold your code.

---

## 📦 Core Blocks Portfolio

### 🧩 Snippets Per Type (`snippets-per-type`)
The ultimate way to show multi-language code.

**How to use it:**

```markdown
+++ snippets-per-type
@@python:
print("Hello from Kiwi!")

@@javascript:
console.log("Hello from Kiwi!");
+++
```

### 🖼️ Iframe (`iframe`)
Embed websites, demos, or videos directly into your docs.

**How to use it:**
```markdown
+++ iframe(src="https://example.com", height="400px")
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

## 🛠️ Creating Custom Blocks (New Format)

Kiwi now uses a simplified, file-per-block system in the `blocks/` directory. Each block is a `.kiwi` file using a Markdown-like frontmatter. This format is designed to be **AI-friendly** and **human-readable**.

### 1. The Block Structure
A `.kiwi` file consists of two parts: a YAML-like header and the HTML template.

```markdown
---
name: Alert
trigger: @alert
isMultiLine: true
---
<div class="custom-alert">
  <h3>{title|Important}</h3>
  <p>{body}</p>
</div>
```

- **`trigger`**: The @command used in Markdown.
- **`isMultiLine`**: Set to `true` if the block should capture code/text below it.
- **`{key}`**: Placeholders that are replaced by arguments (e.g., `@alert(title="Warning")`).
- **`{body}`**: Used in multi-line blocks to inject the content.

### 2. Logic-Powered Blocks
If you need complex logic (like our tabbed snippets), you can use a `<script>` tag inside the `.kiwi` file. The script should return a renderer function:

```html
---
trigger: @my-logic
isMultiLine: true
---
<script>
(args, body) => {
  // Your custom JS logic here
  return `<div>Processed ${body}</div>`;
}
</script>
```

### ⚙️ The Engine: `blocklib.js`
The heavy lifting is now handled by `host/blocklib.js`. It automatically:
1. Fetches all `.kiwi` files from your repository.
2. Compiles templates or executes scripts.
3. Injects them into your Markdown *before* parsing, ensuring a seamless experience.

---

### 💡 Best Practices for AI & Humans
- **Keep it Simple**: Use the template format `{arg}` whenever possible.
- **Self-Contained Styles**: Include `<style>` tags directly in your `.kiwi` file to keep blocks portable.
- **Namespace**: Use consistent triggers like `@ui-button` or `@dev-note`.
