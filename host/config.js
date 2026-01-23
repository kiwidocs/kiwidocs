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
    owner: "team5171",

    // The Repository Name (Source for Docs)
    repo: "2026docs",

    // The Repository for the Activity Feed (can be the same or different)
    activityRepo: "2026docs",

    // Default Branch (main/master)
    branch: "main",

    // Branding
    branding: {
        title: "Team 5171 | Start Guide", // Window title
        shortTitle: "Start Guide",         // Sidebar title
        logo: "https://github.com/team5171.png",
        welcomeTitle: "Welcome to Team 5171",
        welcomeText: "We are initializing the workspace and fetching the latest guides. Please select a file from the sidebar to begin."
    },

    // Footer Info
    footer: {
        creator: "Veer Bajaj",
        organization: "Team 5171",
        version: "Kiwi Docs v2.1.0"
    }
};

// Auto-detect base URL if not manually set
if (!CONFIG.baseUrl) {
    CONFIG.baseUrl = window.location.href.split('?')[0].replace(/\/$/, "");
}
