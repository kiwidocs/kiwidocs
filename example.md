# Kiwi Building Blocks Showcase



<!-- @typing(lines="Welcome+to+Comment+Blocks;Clean+Syntax;No+Raw+HTML" color="00BCD4") -->

Kiwi now uses standard HTML comments for its building blocks. This ensures that if for any reason the JavaScript doesn't load, your users just see clean Markdown—no raw code!

---

## Alerts
Alerts are perfect for highlighting important information.

<!-- @alert(title="Pro Tip" body="You can pass content directly in the arguments!") -->

<!-- @alert(title="Warning" color="#ff7b72" body="Make sure to escape quotes in your arguments.") -->

<!-- @alert(title="Note" color="#f6ff72ff" body="Any buliding blocks cannot be seen in the raw editor of your choice.") -->

---

## Code Snippets
Developers can easily show multi-language code tabs.

<!-- @snippets-per-type(python="print('Hello World')" javascript="console.log('Hello World')" rust="println!('Hello World')") -->

---

## Embedded Content
Embed external sites seamlessly.

<!-- @iframe(src="https://example.com" height="400px") -->

---

## Cards
Display content in premium-looking cards.

<!-- @card(title="Web Design" body="Learn how to build stunning web applications with Kiwi." color="#58a6ff" link="https://github.com") -->

---

## Badges & Tokens
Use badges to label items or show status.
<!-- @badge(text="New" color="#238636") --> <!-- @badge(text="Beta" color="#d29922") --> <!-- @badge(text="Fixed" color="#58a6ff") -->

---

## Accordions
Keep your docs tidy by collapsing detailed info.
<!-- @accordion(title="What is Kiwi?" body="Kiwi is a super-fast, AI-ready documentation engine that turns Markdown into rich interactive experiences.") -->

---

## Dynamic Buttons
Add call-to-action buttons with custom gradients.
<!-- @button(text="Get Started Now" url="https://github.com" color1="#58a6ff" color2="#bc8cff") -->

---

## Avatars
Showcase team members or contributors.
<!-- @avatar(name="John Kiwi" subtext="Lead Developer" src="https://i.pravatar.cc/150?u=kiwij") -->

---

## Testimonials
Highlight quotes or feedback from your users.
<!-- @quote(text="Kiwi has completely transformed our internal documentation workflow. It's fast, beautiful, and AI-friendly." author="Sarah Chen" role="Engineering Manager") -->

---

## 🛠️ How it works
The `blocklib.js` engine identifies `<!-- (at)blockName(...) -->` comments and replaces them with rich HTML components *before* the Markdown is parsed. This keeps your source file clean and standard-compliant.
