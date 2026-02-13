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

// Polyfill crypto.randomUUID for non-secure contexts (e.g., HTTP on [::] or IP)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
    crypto.randomUUID = function () {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    };
}

const CONFIG = {
    // Your GitHub Organization or Username
    owner: "kiwidocs",

    // The Repository Name (Source for Docs)
    repo: "kiwidocs",

    // The Repository for the Activity Feed (can be the same or different)
    activityRepo: "kiwidocs",

    // Default Branch (main/master)
    branch: "main",

    // Personal Access Token for GitHub API (optional)
    repoToken: "",

    // File extensions to index for the AI assistant
    extensions: [".md", ".TBD", ".kiwi", ".txt", ".sh"],

    // Paths/filenames to ignore (regex strings)
    // Example: ["^_.*\\.md$"] ignores files starting with _ and ending in .md
    ignorePaths: ["^_.*\\.md$"],

    // ── Ask the Kiwi (AI Chat) ──────────────────────────────────────
    // Set this to your deployed Cloudflare Worker URL to enable the chat widget.
    // Leave empty or remove to disable the widget.
    askKiwiEndpoint: "https://kiwiback.veerbajaj11.workers.dev",

    // Branding
    branding: {
        title: "Kiwi Docs", // Window title
        shortTitle: "Kiwi Docs",         // Sidebar title
        logo: "https://github.com/kiwidocs.png",
        welcomeTitle: "Welcome to Kiwi Docs",
        welcomeText: "We are initializing the workspace and fetching the latest guides. Please select a file from the sidebar to begin."
    },

    // Footer Info
    footer: {
        creator: "Veer Bajaj",
        organization: "Kiwi Docs", // If none use Kiwi Docs
        version: "Kiwi Docs v2.2.0"
    },

    // Firebase Configuration
    firebaseConfig: {
        apiKey: "AIzaSyA389bfG_hGa5l2ckz9Ak3al_amtxvU53c",
        authDomain: "vibroim-b5dc3.firebaseapp.com",
        projectId: "vibroim-b5dc3",
        storageBucket: "vibroim-b5dc3.firebasestorage.app",
        messagingSenderId: "733742930053",
        appId: "1:733742930053:web:90437a2f6ac8b9cf1231ec",
        measurementId: "G-EEW2LL3PJR"
    }
};

// Auto-detect base URL if not manually set
if (!CONFIG.baseUrl) {
    CONFIG.baseUrl = window.location.href.split('?')[0].replace(/\/$/, "");
}
