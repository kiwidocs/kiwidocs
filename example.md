# 🧪 Kiwi Building Blocks Showcase

@typing(lines="Welcome+to+the+Kiwi+Showcase;Exploring+Building+Blocks;Modern+Documentation+Simplified", color="00BCD4")

Kiwi allows you to mix standard Markdown with dynamic elements. Here is how you can use the core library.

---

## 📢 Alerts
Alerts are perfect for highlighting important information. They support custom titles and bodies.

@alert(title="Pro Tip")
You can use **Markdown** inside your alerts too! The system handles it seamlessly.

@alert(title="Warning", color="#ff7b72")
Always double check your triggers before publishing to production.

---

## 💻 Multi-Language Code Snippets
The `@snippets-per-type` block is ideal for developers. It creates an interactive, tabbed interface.

### Example:

@snippets-per-type
python:
def authenticate_user(token):
    # Initialize the secure connection
    print(f"Connecting with: {token}")
    return {"status": "success", "code": 200}

@@javascript:
async function authenticateUser(token) {
    console.log("Connecting with: " + token);
    const response = await fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ token })
    });
    return response.json();
}

@@rust:
fn authenticate_user(token: &str) -> Result<(), String> {
    println!("Connecting with: {}", token);
    Ok(())
}
---

## 🖼️ Embedded Content (Iframes)
Easily embed external sites, demos, or videos.

@iframe(src="https://example.com", height="300px")

---

## 🛠️ How it works
This page is written in pure Markdown. The blocks are processed by `blocklib.js` on the client side, then passed to the Markdown parser.

### Standard Markdown Test
- List item 1
- List item 2
  - Nested item

1. Numbered 1
2. Numbered 2

> This is a blockquote to test standard rendering alongside our custom blocks.

| Feature | Support |
| :--- | :--- |
| Markdown | ✅ Full |
| Blocks | ✅ Native |
| Dark Mode | ✅ Auto |
