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
                this.registry[block.trigger] = block;
                console.log(`KiwiBlockLib: Registered ${block.trigger}`);
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

        // Sort blocks: Multi-line first to avoid partial replacements
        const sortedBlocks = Object.values(this.registry).sort((a, b) => (b.isMultiLine ? 1 : 0) - (a.isMultiLine ? 1 : 0));

        sortedBlocks.forEach(block => {
            try {
                if (block.isMultiLine) {
                    // Multi-line: Match trigger line and subsequent body
                    // Stops at next block (@...) or markdown header (#...)
                    const regex = new RegExp(`^${block.trigger}(?:\\((.*)\\))?\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n@[^@]|$|\\r?\\n#)`, 'gm');
                    processed = processed.replace(regex, (match, args, body) => {
                        try {
                            const result = block.renderFn(args || '', body.trim());
                            return (typeof result === 'string' ? result.trim() : result) + '\n\n';
                        } catch (e) {
                            console.error(`KiwiBlockLib: Error rendering multi-line ${block.trigger}`, e);
                            return `<div style="color:rgba(255,0,0,0.8); border:1px solid red; padding:1rem; border-radius:8px; margin: 1rem 0;">
                                <strong>Error rendering ${block.trigger}</strong><br>
                                <small style="opacity:0.7">${e.message}</small>
                            </div>`;
                        }
                    });
                } else {
                    // Single-line: @trigger(args)
                    const regex = new RegExp(`${block.trigger}\\((.*?)\\)`, 'g');
                    processed = processed.replace(regex, (match, args) => {
                        try {
                            const result = block.renderFn(args || '');
                            return typeof result === 'string' ? result.trim() : result;
                        } catch (e) {
                            console.error(`KiwiBlockLib: Error rendering single-line ${block.trigger}`, e);
                            return `<span style="color:red">[Error: ${block.trigger}]</span>`;
                        }
                    });
                }
            } catch (fatal) {
                console.error(`KiwiBlockLib: Critical error processing ${block.trigger}`, fatal);
            }
        });

        return processed;
    }
}

window.KiwiBlockLib = KiwiBlockLib;
