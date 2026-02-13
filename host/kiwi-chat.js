/**
 * kiwi-chat.js — "Ask the Kiwi" client-side chat widget
 *
 * Injects a floating chat button + panel into any Kiwi Docs page.
 * Talks to the Cloudflare Worker backend at CONFIG.askKiwiEndpoint.
 *
 * Depends on: marked.js (already loaded by Kiwi Docs) and CONFIG from config.js.
 * Integrates with Firebase Auth via firebase-init.js.
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

        // Init Auth
        initAuth();
    }

    // ── Auth ─────────────────────────────────────────────────────────

    function initAuth() {
        const interval = setInterval(() => {
            if (window.kiwiAuth) {
                clearInterval(interval);
                window.kiwiAuth.onAuthStateChanged((user) => {
                    currentUser = user;
                    updateUIForAuth();
                });
            }
        }, 100);
    }

    function updateUIForAuth() {
        const messages = document.getElementById('kiwi-chat-messages');
        const existingPrompt = document.querySelector('.kiwi-chat-auth-prompt');
        if (existingPrompt) existingPrompt.remove();

        if (!currentUser) {
            const prompt = document.createElement('div');
            prompt.className = 'kiwi-chat-auth-prompt';
            prompt.innerHTML = `
                <p class="kiwi-chat-auth-title">Sign in to save chat history</p>
                <div class="kiwi-chat-auth-buttons">
                    <button class="kiwi-chat-auth-btn github" id="kiwi-login-github">
                        <svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        Login with GitHub
                    </button>
                    <button class="kiwi-chat-auth-btn anon" id="kiwi-login-anon">Chat as Guest</button>
                </div>
            `;
            messages.prepend(prompt);

            document.getElementById('kiwi-login-github').onclick = () => window.kiwiAuth.loginWithGitHub();
            document.getElementById('kiwi-login-anon').onclick = () => window.kiwiAuth.loginAnonymously();
        } else {
            console.log("Logged in as", currentUser.isAnonymous ? "Guest" : currentUser.displayName);
            if (!currentUser.isAnonymous) {
                const historyLink = document.createElement('div');
                historyLink.className = 'kiwi-chat-msg system';
                historyLink.innerHTML = `<a href="/chat" target="_blank">View all your chats</a>`;
                messages.prepend(historyLink);
            }
        }
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

        // Ensure user is logged in
        if (!currentUser) {
            // Force anonymous login if they try to send without logging in
            try {
                await window.kiwiAuth.loginAnonymously();
            } catch (err) {
                appendMessage('system', '⚠️ Please sign in to chat.');
                return;
            }
        }

        isLoading = true;
        sendBtn.disabled = true;
        input.value = '';
        input.style.height = '40px';

        appendMessage('user', question);
        history.push({ role: 'user', text: question });

        showTyping();

        try {
            const token = await window.kiwiAuth.getIdToken();
            const res = await fetch(`${endpoint}/api/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question,
                    sessionId,
                    history: history.slice(-10), // send last 10 messages for context
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
