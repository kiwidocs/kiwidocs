# Custom Building Blocks

Kiwi Docs supports custom "building blocks" that allow you to extend Markdown with dynamic components like tabbed snippets, iframes, and more.

## Usage

Blocks are stored in the `blocks/` directory of your repository. When you use a block trigger in your Markdown files, Kiwi will automatically render it.

### Included Blocks

#### Snippets Per Type (`@snippets-per-type`)

Displays code snippets in a tabbed interface. Useful for showing the same code in multiple languages.

**Syntax:**
```markdown
@snippets-per-type
@@python:
print("Hello World")
@@c++:
std::cout << "Hello World";
```

#### Iframe (`@iframe`)

Embeds an external URL in an iframe.

**Syntax:**
```markdown
@iframe(src="https://example.com", height="500px")
```

## Creating Custom Blocks

To create a new block, add a `.kiwi.json` file to the `blocks/` directory.

### File Format (.kiwi)

The file must be a JSON object with the following properties:

```json
{
  "name": "my-block",
  "description": "Description of what it does",
  "trigger": "@my-block",
  "isMultiLine": true, // true if it consumes a body, false for single line
  "renderer": "/* javascript code */"
}
```

### Renderer Function

The `renderer` property contains the body of a JavaScript function. It receives `args` (string) and `body` (string, only if `isMultiLine` is true). It must return an HTML string.

**Example Renderer:**

```javascript
return (args, body) => {
  return `<div class="my-block">${body}</div>`;
}
```

### API Reference

- **`args`**: The string inside the parentheses of the trigger. E.g., for `@block(foo="bar")`, args is `foo="bar"`.
- **`body`**: The content following the trigger line until the next block or end of section.

## Best Practices

1.  **Unique Triggers**: Ensure your `trigger` does not conflict with existing markdown syntax or other blocks. Start with `@`.
2.  **Safety**: The renderer code runs in the user's browser. Avoid unsafe operations.
3.  **Styling**: You can include `<style>` tags in your returned HTML to style your components. These styles will apply globally, so scope them to your component's class.


---
# Custom Building Blocks Implementation - Walkthrough

I have implemented the custom "building blocks" feature, enabling dynamic content in Markdown files.

## Changes

### 1. New Directory: `blocks/`

I created a `blocks/` directory to store custom block definitions.

- `blocks/snippets.kiwi`: Defines the `@snippets-per-type` block for tabbed code snippets.
- `blocks/iframe.kiwi`: Defines the `@iframe` block for embedding external content.

### 2. Updated `host/index.html`

The main viewer was updated to:
- Fetch `.kiwi` files from the `blocks/` directory (via GitHub API).
- Parse the block definitions and their JavaScript renderers.
- Process Markdown content to identify block triggers (e.g., `@iframe(...)`) and replace them with rendered HTML *before* passing the text to the Markdown parser.

### 3. Documentation: `host/building.md`

A new guide was created to explain:
- How to use the included blocks (`@snippets-per-type`, `@iframe`).
- How to create new blocks using the `.kiwi` JSON format.
- The API for the renderer function.

## Verification Results

### Static Analysis
- **`index.html`**: Verified that the `loadBlocks` function is called during initialization and `processBlocks` is used in `loadFile`.
- **`blocks/*.kiwi`**: Verified the JSON structure and the renderer functions.
- **`building.md`**: Verified the documentation covers usage and creation.

### How to Test
1.  Push these changes to your GitHub repository.
2.  Create a markdown file with the following content:
    ```markdown
    # Test Block
    
    @iframe(src="https://example.com", height="300px")
    
    @snippets-per-type
    @@python:
    print("Test")
    @@js:
    console.log("Test");
    ```
3.  Open the Kiwi Docs viewer and navigate to that file.
4.  You should see an iframe and a tabbed code block.
