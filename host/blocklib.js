/**
 * KiwiBlockLib - Handles custom building blocks for Markdown.
 * Supports simple Template blocks and complex Script blocks.
 */
class KiwiBlockLib {
    constructor(config) {
        this.config = config;
        this.registry = {};
    }

    async init() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isLocal) {
            console.log("KiwiBlockLib [v4]: Local mode detected. Loading blocks from /blocks");
            try {
                // In local mode, we don't have a directory listing easily without a backend,
                // but we can try to fetch a known list or just try common ones.
                // However, the best way for a "live" feel is to check if we can get a list.
                // Since it's a simple python server, it DOES provide directory listing if indexed.
                const res = await fetch('../blocks/');
                if (res.ok) {
                    const html = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const links = Array.from(doc.querySelectorAll('a'))
                        .map(a => a.getAttribute('href'))
                        .filter(href => href.endsWith('.kiwi'));

                    await Promise.all(links.map(async (href) => {
                        await this.loadBlockLocal(`../blocks/${href}`);
                    }));
                    return;
                }
            } catch (e) {
                console.warn("KiwiBlockLib [v4]: Local directory listing failed, falling back to GitHub", e);
            }
        }

        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/blocks?ref=${this.config.branch}`;
        try {
            const res = await fetch(url);
            if (!res.ok) return;
            const files = await res.json();

            await Promise.all(files.map(async (file) => {
                if (file.name.endsWith('.kiwi')) {
                    await this.loadBlock(file.path);
                }
            }));
        } catch (e) {
            console.warn("KiwiBlockLib [v4]: Blocks folder or API error", e);
        }
    }

    async loadBlockLocal(url) {
        try {
            const text = await (await fetch(url)).text();
            this.parseAndRegister(text, url);
        } catch (e) {
            console.error(`KiwiBlockLib [v4]: Failed to load local block at ${url}`, e);
        }
    }

    async loadBlock(path) {
        try {
            const url = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${path}`;
            const text = await (await fetch(url)).text();
            this.parseAndRegister(text, path);
        } catch (e) {
            console.error(`KiwiBlockLib [v4]: Failed to load block at ${path}`, e);
        }
    }

    parseAndRegister(text, sourceIdentifier) {
        let block = {};

        if (text.trim().startsWith('{')) {
            // Support legacy JSON format
            const json = JSON.parse(text);
            const renderFn = new Function(json.renderer)();
            block = { ...json, renderFn };
        } else {
            // New Template/Markdown format
            const parts = text.split(/---\r?\n/);
            if (parts.length >= 3) {
                const headerText = parts[1];
                const bodyText = parts.slice(2).join('---').trim();

                const header = this.parseHeader(headerText);
                block = { ...header };

                // Check if there is a <script> for logic
                const scriptMatch = bodyText.match(/<script>([\s\S]*?)<\/script>/);
                if (scriptMatch) {
                    const scriptContent = scriptMatch[1].trim();
                    try {
                        block.renderFn = new Function(`return ${scriptContent}`)();
                    } catch (e) {
                        console.error(`KiwiBlockLib [v4]: Error parsing script in ${sourceIdentifier}`, e);
                    }
                } else {
                    // Simple template renderer
                    block.renderFn = (args, bodyContent) => this.renderTemplate(bodyText, args, bodyContent);
                }
            }
        }

        if (block.trigger) {
            const cleanTrigger = block.trigger.replace(/[^\w-]/g, '');
            this.registry[cleanTrigger] = block;
            console.log(`KiwiBlockLib [v4]: Registered ${cleanTrigger} (Syntax: <!-- @${cleanTrigger}(...) -->)`);
        }
    }

    parseHeader(str) {
        const lines = str.split(/\r?\n/);
        const header = {};
        lines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const val = line.substring(colonIndex + 1).trim();
                header[key] = val === 'true' ? true : (val === 'false' ? false : val);
            }
        });
        return header;
    }

    renderTemplate(template, args, bodyContent) {
        const props = this.parseArgs(args);
        let result = template;

        const instanceId = 'kiwi-' + Math.random().toString(36).substr(2, 9);
        const finalBody = props.body || bodyContent || '';

        result = result.replace(/\{(\w+)(?:\|([^}]+))?\}/g, (match, key, def) => {
            if (key === 'body') return finalBody;
            if (key === 'id') return instanceId;
            return props[key] || def || '';
        });

        return result.trim();
    }

    parseArgs(str) {
        const res = {};
        if (!str) return res;

        // Regex matches key="val" or key='val'
        const regex = /([a-zA-Z0-9_-]+)=(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
            const key = match[1];
            const val = match[2] !== undefined ? match[2] : match[3];
            res[key] = val.replace(/\\(["'])/g, '$1');
        }
        return res;
    }

    process(text) {
        if (!text) return '';
        console.log(`KiwiBlockLib [v4]: Processing ${text.length} chars`);

        let processed = text;
        let matchCount = 0;

        const regex = /<!--\s*@([a-zA-Z0-9_-]+)(?:\(([\s\S]*?)\))?\s*-->/g;

        processed = processed.replace(regex, (match, name, args) => {
            matchCount++;
            const block = this.registry[name];

            if (!block) {
                console.warn(`KiwiBlockLib [v4]: Unknown block "${name}"`);
                return `<div style="border: 1px dashed orange; color: orange; padding: 4px; font-size:0.8em;">⚠️ Unknown Block: ${name}</div>`;
            }

            try {
                const cleanArgs = args ? args.trim() : '';
                const result = block.renderFn(cleanArgs, '');
                let finalHtml = typeof result === 'string' ? result.trim() : result;

                // Flatten HTML to prevent Markdown code block detection
                finalHtml = finalHtml.replace(/\n\s*/g, ' ').replace(/\s+/g, ' ');

                return `\n\n${finalHtml}\n\n`;
            } catch (e) {
                console.error(`KiwiBlockLib [v4]: Error rendering ${name}`, e);
                return `<div style="border: 1px solid red; color: red; padding: 10px;">Error: ${e.message}</div>`;
            }
        });

        console.log(`KiwiBlockLib [v4]: Processed ${matchCount} blocks`);
        return processed;
    }
}

window.KiwiBlockLib = KiwiBlockLib;
