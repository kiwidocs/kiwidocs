/**
 * kiwi-chat.js — "Ask the Kiwi" client-side chat widget
 *
 * Injects a floating chat button + panel into any Kiwi Docs page.
 * Talks to the Cloudflare Worker backend at CONFIG.askKiwiEndpoint.
 *
 * Depends on: marked.js (already loaded by Kiwi Docs) and CONFIG from config.js.
 */
(function () {
    'use strict';

    // ── Resolve backend URL ──────────────────────────────────────────

    const endpoint = (typeof CONFIG !== 'undefined' && CONFIG.askKiwiEndpoint)
        ? CONFIG.askKiwiEndpoint.replace(/\/$/, '')
        : null;

    if (!endpoint) {
        console.warn('kiwi-chat: CONFIG.askKiwiEndpoint not set — chat widget disabled.');
        return;
    }

    // ── State ────────────────────────────────────────────────────────

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for non-secure contexts (HTTP)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    let isOpen = false;
    let isLoading = false;
    let currentUser = null;
    let sessionId = localStorage.getItem('kiwi_chat_session_id') || generateUUID();
    localStorage.setItem('kiwi_chat_session_id', sessionId);

    let history = []; // { role: 'user' | 'assistant' | 'system', text: string }
    let repoConfig = {
        owner: CONFIG.ai_owner,
        repo: CONFIG.ai_repo,
        branch: CONFIG.ai_branch,
        token: CONFIG.repoToken,
        extensions: CONFIG.extensions,
        ignorePaths: CONFIG.ignorePaths
    };

    // ── Build DOM ────────────────────────────────────────────────────

    function createWidget() {
        // FAB
        const fab = document.createElement('button');
        fab.className = 'kiwi-chat-fab';
        fab.id = 'kiwi-chat-fab';
        fab.innerHTML = '🥝';
        fab.title = 'Ask the Kiwi';
        fab.setAttribute('aria-label', 'Open Kiwi chat');

        // Panel
        const panel = document.createElement('div');
        panel.className = 'kiwi-chat-panel';
        panel.id = 'kiwi-chat-panel';
        panel.innerHTML = `
            <div class="kiwi-chat-header">
                <span class="kiwi-chat-header-icon">🥝</span>
                <div class="kiwi-chat-header-text">
                    <p class="kiwi-chat-header-title">Ask the Kiwi</p>
                    <p class="kiwi-chat-header-sub">AI-powered docs assistant · Gemini 2.5 Flash</p>
                </div>
                <button class="kiwi-chat-header-close" id="kiwi-chat-close" aria-label="Close chat">✕</button>
            </div>
            <div class="kiwi-chat-messages" id="kiwi-chat-messages">
                <div class="kiwi-chat-msg system">Ask me anything about the docs!</div>
            </div>
            <div class="kiwi-chat-suggestions" id="kiwi-chat-suggestions">
                <button class="kiwi-chat-suggestion" data-q="How do I get started?">Getting started</button>
                <button class="kiwi-chat-suggestion" data-q="What building blocks are available?">Building blocks</button>
                <button class="kiwi-chat-suggestion" data-q="How do I customize the theme?">Theming</button>
                <button class="kiwi-chat-suggestion" data-q="How do I create a custom block?">Custom blocks</button>
            </div>
            <div class="kiwi-chat-input-area">
                <textarea class="kiwi-chat-input" id="kiwi-chat-input"
                    placeholder="Ask about the docs…" rows="1"
                    aria-label="Type your question"></textarea>
                <button class="kiwi-chat-send" id="kiwi-chat-send" aria-label="Send message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(panel);

        // ── Events ───────────────────────────────────────────────────

        fab.addEventListener('click', toggleChat);
        document.getElementById('kiwi-chat-close').addEventListener('click', toggleChat);

        const input = document.getElementById('kiwi-chat-input');
        const sendBtn = document.getElementById('kiwi-chat-send');

        sendBtn.addEventListener('click', () => sendMessage());

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = '40px';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });

        // Suggestion chips
        document.querySelectorAll('.kiwi-chat-suggestion').forEach((btn) => {
            btn.addEventListener('click', () => {
                const q = btn.getAttribute('data-q');
                if (q) {
                    input.value = q;
                    sendMessage();
                }
            });
        });

        // No auth needed for local
    }

    // ── Toggle ───────────────────────────────────────────────────────

    function toggleChat() {
        isOpen = !isOpen;
        const panel = document.getElementById('kiwi-chat-panel');
        const fab = document.getElementById('kiwi-chat-fab');

        if (isOpen) {
            panel.classList.add('visible');
            fab.classList.add('open');
            document.getElementById('kiwi-chat-input').focus();
        } else {
            panel.classList.remove('visible');
            fab.classList.remove('open');
        }
    }

    // ── Render a message ─────────────────────────────────────────────

    function appendMessage(role, text) {
        const container = document.getElementById('kiwi-chat-messages');
        const div = document.createElement('div');
        div.className = `kiwi-chat-msg ${role}`;

        if (role === 'assistant') {
            // Render markdown (marked.js is already on the page)
            if (typeof marked !== 'undefined') {
                div.innerHTML = marked.parse(text);
            } else {
                div.textContent = text;
            }
        } else {
            div.textContent = text;
        }

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        // Hide suggestions after first user message
        if (role === 'user') {
            const suggestions = document.getElementById('kiwi-chat-suggestions');
            if (suggestions) suggestions.style.display = 'none';
        }

        return div;
    }

    function showTyping() {
        const container = document.getElementById('kiwi-chat-messages');
        const div = document.createElement('div');
        div.className = 'kiwi-typing-msg assistant'; // Use specific class to avoid accidental removal
        div.id = 'kiwi-typing-indicator';
        div.innerHTML = `
            <div class="kiwi-chat-msg assistant">
                <div class="kiwi-typing">
                    <span class="kiwi-typing-dot"></span>
                    <span class="kiwi-typing-dot"></span>
                    <span class="kiwi-typing-dot"></span>
                </div>
            </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('kiwi-typing-indicator');
        if (el) el.remove();
    }

    // ── Send message ─────────────────────────────────────────────────

    async function sendMessage() {
        const input = document.getElementById('kiwi-chat-input');
        const sendBtn = document.getElementById('kiwi-chat-send');
        const question = input.value.trim();
        if (!question || isLoading) return;

        isLoading = true;
        sendBtn.disabled = true;
        input.value = '';
        input.style.height = '40px';

        appendMessage('user', question);
        history.push({ role: 'user', text: question });

        showTyping();

        try {
            const res = await fetch(`${endpoint}/api/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question,
                    sessionId,
                    history: history.slice(-10), // send last 10 messages for context
                    config: repoConfig
                }),
            });

            removeTyping();

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server error ${res.status}`);
            }

            const data = await res.json();
            const answer = data.answer || 'Sorry, I could not find an answer.';

            appendMessage('assistant', answer);
            history.push({ role: 'assistant', text: answer });
        } catch (err) {
            removeTyping();
            appendMessage('system', `⚠️ ${err.message || 'Something went wrong. Try again.'}`);
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    // ── Init ─────────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
    } else {
        createWidget();
    }
})();
