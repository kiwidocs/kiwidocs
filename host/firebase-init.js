/**
 * firebase-init.js
 *
 * Initializes Firebase App and Authentication for Kiwi Docs.
 * Provides helper functions for GitHub and Anonymous login.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GithubAuthProvider,
    signInAnonymously,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Initialize Firebase using CONFIG from config.js
let app;
let auth;

if (typeof CONFIG !== 'undefined' && CONFIG.firebaseConfig) {
    app = initializeApp(CONFIG.firebaseConfig);
    auth = getAuth(app);
} else {
    console.error("kiwi-firebase: CONFIG.firebaseConfig not found. Authentication will not work.");
}

export const firebaseAuth = {
    auth,

    loginWithGitHub: async () => {
        const provider = new GithubAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error("GitHub Login Error:", error);
            throw error;
        }
    },

    loginAnonymously: async () => {
        try {
            const result = await signInAnonymously(auth);
            return result.user;
        } catch (error) {
            console.error("Anonymous Login Error:", error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
            throw error;
        }
    },

    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, callback);
    },

    getIdToken: async () => {
        if (auth.currentUser) {
            return await auth.currentUser.getIdToken();
        }
        return null;
    }
};

// Expose to window for non-module scripts if needed
window.kiwiAuth = firebaseAuth;
