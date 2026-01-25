/*
        Copyright (C) 2026 - Kiwi Docs by Veer Bajaj <https://github.com/kiwidocs>

        This program is free software: you can redistribute it and/or modify
        it under the terms of the GNU General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version.

        This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        GNU General Public License for more details.

        You should have received a copy of the GNU General Public License
        along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
            console.warn("KiwiBlockLib: Blocks folder or API error", e);
        }
    }

    async loadBlock(path) {
        try {
            const url = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${path}`;
            const text = await (await fetch(url)).text();

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
                        // The script should return a function or be an arrow function
                        try {
                            block.renderFn = new Function(`return ${scriptContent}`)();
                        } catch (e) {
                            console.error(`Error parsing script in ${path}`, e);
                        }
                    } else {
                        // Simple template renderer
                        block.renderFn = (args, bodyContent) => this.renderTemplate(bodyText, args, bodyContent);
                    }
                }
            }

            if (block.trigger) {
                // Sanitize trigger name: remove leading @ or /$@ if present to normalize
                const cleanTrigger = block.trigger.replace(/^[\/@$]+/, '').replace(/@$/, '');
                this.registry[cleanTrigger] = block;
                console.log(`KiwiBlockLib: Registered ${cleanTrigger} (Syntax: /$@${cleanTrigger} ... /@$)`);
            }
        } catch (e) {
            console.error(`KiwiBlockLib: Failed to load block at ${path}`, e);
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

    renderTemplate(template, args, body) {
        const props = this.parseArgs(args);
        let result = template;

        // Static unique ID for this instance if {id} is used
        const instanceId = 'kiwi-' + Math.random().toString(36).substr(2, 9);

        // Replace {key} or {key|default}
        result = result.replace(/\{(\w+)(?:\|([^}]+))?\}/g, (match, key, def) => {
            if (key === 'body') return body || '';
            if (key === 'id') return instanceId;
            return props[key] || def || '';
        });

        return result.trim();
    }

    parseArgs(str) {
        const res = {};
        if (!str) return res;
        // Match key="value"
        const regex = /(\w+)=\"([^\"]*)\"/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
            res[match[1]] = match[2];
        }
        return res;
    }

    process(text) {
        if (!text) return '';
        let processed = text;

        // Syntax: <!-- @trigger(args) -->
        // We look for HTML comments that start with @Key
        const regex = /<!--\s*@([a-zA-Z0-9_-]+)(?:\((.*?)\))?\s*-->/gs;

        processed = processed.replace(regex, (match, name, args) => {
            const block = this.registry[name];

            if (!block) {
                // If it's just a normal comment or unknown block, leave it? 
                // Or maybe the user made a typo.
                // For now, let's log it but maybe not render an error in place to be less intrusive,
                // OR render a small warning if it clearly looks like a block attempt.
                console.warn(`KiwiBlockLib: Unknown block "${name}"`);
                return match; // Leave comment as is (invisible in rendered HTML usually)
            }

            try {
                // Render the block
                // We don't support multi-line body in this syntax, everything is in args.
                // We pass empty string as body.
                const result = block.renderFn(args || '', '');
                let finalHtml = typeof result === 'string' ? result.trim() : result;

                // Surround with newlines to ensure it breaks out of markdown paragraphs if needed
                return `\n\n${finalHtml}\n\n`;
            } catch (e) {
                console.error(`KiwiBlockLib: Error rendering ${name}`, e);
                return `<div style="border: 1px solid red; color: red; padding: 10px;">
                    <strong>Block Error (${name})</strong>: ${e.message}
                </div>`;
            }
        });

        return processed;
    }
}

window.KiwiBlockLib = KiwiBlockLib;
