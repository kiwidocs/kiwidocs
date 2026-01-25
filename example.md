# 🧪 Kiwi Building Blocks Showcase

v3
<!-- @typing(lines="Welcome+to+Comment+Blocks;Clean+Syntax;No+Raw+HTML"; color="00BCD4") -->

Kiwi now uses standard HTML comments for its building blocks. This ensures that if for any reason the JavaScript doesn't load, your users just see clean Markdown—no raw code!

---

## 📢 Alerts
Alerts are perfect for highlighting important information.

<!-- @alert(title="Pro Tip"; body="You can pass content directly in the arguments!") -->

<!-- @alert(title="Warning"; color="#ff7b72"; body="Make sure to escape quotes in your arguments.") -->

---

## 💻 Code Snippets
Developers can easily show multi-language code tabs.

<!-- @snippets-per-type(python="print('Hello World')"; javascript="console.log('Hello World')"; rust="println!('Hello World')") -->

---

## 🖼️ Embedded Content
Embed external sites seamlessly.

<!-- @iframe(src="https://example.com"; height="400px") -->

---

## 🛠️ How it works
The `blocklib.js` engine identifies `<!-- @blockName(...) -->` comments and replaces them with rich HTML components *before* the Markdown is parsed. This keeps your source file clean and standard-compliant.
