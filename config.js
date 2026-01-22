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
