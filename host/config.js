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
const CONFIG = {
    // Your GitHub Organization or Username
    owner: "kiwidocs",

    // The Repository Name (Source for Docs)
    repo: "kiwidocs",

    // The Repository for the Activity Feed (can be the same or different)
    activityRepo: "kiwidocs",

    // Default Branch (main/master)
    branch: "main",

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
        version: "Kiwi Docs v2.1.0"
    }
};

// Auto-detect base URL if not manually set
if (!CONFIG.baseUrl) {
    CONFIG.baseUrl = window.location.href.split('?')[0].replace(/\/$/, "");
}
