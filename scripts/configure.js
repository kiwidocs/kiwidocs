#!/usr/bin/env node
import fs from "fs";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (q, def) =>
    new Promise(res =>
        rl.question(`${q} (${def}): `, a => res(a || def))
    );

(async () => {
    console.log("\n🔧 Kiwi Docs Configuration\n");

    const owner = await ask("GitHub owner/org", "kiwidocs");
    const repo = await ask("Docs repository name", "kiwidocs");
    const activityRepo = await ask("Activity repo", repo);
    const branch = await ask("Default branch", "main");

    const title = await ask("Site title", "Kiwi Docs");
    const shortTitle = await ask("Sidebar title", title);
    const logo = await ask(
        "Logo URL",
        `https://github.com/${owner}.png`
    );

    const creator = await ask("Creator name", "Veer Bajaj");
    const organization = await ask("Organization name", "Kiwi Docs");
    const version = await ask("Version label", "Kiwi Docs v2.1.0");

    const config = `/*
  Copyright (C) 2026 - Kiwi Docs
  GPLv3
*/
const CONFIG = {
  owner: "${owner}",
  repo: "${repo}",
  activityRepo: "${activityRepo}",
  branch: "${branch}",

  branding: {
    title: "${title}",
    shortTitle: "${shortTitle}",
    logo: "${logo}",
    welcomeTitle: "Welcome to ${title}",
    welcomeText: "We are initializing the workspace and fetching the latest guides. Please select a file from the sidebar to begin."
  },

  footer: {
    creator: "${creator}",
    organization: "${organization}",
    version: "${version}"
  }
};

if (!CONFIG.baseUrl) {
  CONFIG.baseUrl = window.location.href.split('?')[0].replace(/\/$/, "");
}

export default CONFIG;
`;

    fs.writeFileSync("config.js", config);
    rl.close();

    console.log("\n✅ config.js written successfully\n");
})();
