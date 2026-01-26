
(function () {
    const DECAY_RATES = {
        hunger: 0.0013,     // ~5 per hour
        happiness: 0.0008,  // ~3 per hour
        energy: 0.0027,     // ~10 per hour (awake)
        health: 0.0005      // ~2 per hour (passive decay)
    };

    const GAIN_RATES = {
        feed: 20,
        play: 15,
        clean: 10,
        sleep: 0.0055       // ~20 per hour
    };

    const PERSO_LINES = {
        Cheery: ["Documentation is FUN!", "I love reading READMEs!", "Have you written your docs today?"],
        Chaotic: ["I deleted a semicolon once. Just for fun.", "What happens if I click that delete button?", "System.out.println('Chaos!!')"],
        Nostalgic: ["Remember floppy disks?", "I miss the sound of dial-up...", "Web 1.0 was simpler, wasn't it?"],
        Grumpy: ["Too much documentation, not enough coffee.", "Fix your indentation.", "This sidebar is too narrow."]
    };

    const EMOJIS = {
        happy: "🥝",
        sad: "😿",
        sleeping: "😴",
        eating: "😋",
        playing: "🎮",
        dead: "🪦",
        sick: "🤮"
    };

    class KiwiPet {
        constructor() {
            this.load();
            this.setupUI();
            this.startLoop();
        }

        load() {
            const saved = localStorage.getItem('kiwi_pet');
            if (saved) {
                this.state = JSON.parse(saved);
                this.updateStatsSinceLastSeen();
            } else {
                this.state = this.getInitialState();
            }
        }

        getInitialState() {
            const personalities = Object.keys(PERSO_LINES);
            return {
                name: "Kiwi",
                birthday: Date.now(),
                lastUpdate: Date.now(),
                stats: {
                    hunger: 100,
                    happiness: 100,
                    energy: 100,
                    health: 100
                },
                isSleeping: false,
                personality: personalities[Math.floor(Math.random() * personalities.length)],
                age: 0,
                isDead: false
            };
        }

        save() {
            this.state.lastUpdate = Date.now();
            localStorage.setItem('kiwi_pet', JSON.stringify(this.state));
        }

        updateStatsSinceLastSeen() {
            const now = Date.now();
            const diffMs = now - this.state.lastUpdate;
            if (diffMs <= 0) return;

            const diffSec = diffMs / 1000;

            // Apply decay
            this.state.stats.hunger = Math.max(0, this.state.stats.hunger - (DECAY_RATES.hunger * diffSec));
            this.state.stats.happiness = Math.max(0, this.state.stats.happiness - (DECAY_RATES.happiness * diffSec));

            if (this.state.isSleeping) {
                this.state.stats.energy = Math.min(100, this.state.stats.energy + (GAIN_RATES.sleep * diffSec));
            } else {
                this.state.stats.energy = Math.max(0, this.state.stats.energy - (DECAY_RATES.energy * diffSec));
            }

            // Health consequences
            if (this.state.stats.hunger <= 0 || this.state.stats.energy <= 0) {
                this.state.stats.health = Math.max(0, this.state.stats.health - (DECAY_RATES.health * 5 * diffSec));
            } else if (this.state.stats.hunger > 50 && this.state.stats.energy > 50) {
                this.state.stats.health = Math.min(100, this.state.stats.health + (DECAY_RATES.health * diffSec));
            }

            if (this.state.stats.health <= 0) {
                this.state.isDead = true;
            }

            this.state.age += (diffSec / 86400); // Age in days
            this.state.lastUpdate = now;
        }

        setupUI() {
            const container = document.createElement('div');
            container.id = 'kiwi-pet-ui';
            container.className = 'pet-container';
            container.innerHTML = `
                <div class="pet-header">
                    <div class="pet-name-tag">PET: <span id="pet-name"></span></div>
                    <div class="pet-close" onclick="document.getElementById('kiwi-pet-ui').classList.remove('active')">✕</div>
                </div>
                <div class="pet-visual-area">
                    <div id="pet-emoji" class="pet-emoji bounce"></div>
                    <div id="pet-message" class="pet-message"></div>
                </div>
                <div class="pet-stats">
                    ${this.renderStat('hunger', 'Hunger')}
                    ${this.renderStat('happiness', 'Happiness')}
                    ${this.renderStat('energy', 'Energy')}
                    ${this.renderStat('health', 'Health')}
                </div>
                <div class="pet-actions">
                    <button class="pet-btn" id="btn-feed">🍪<span>Feed</span></button>
                    <button class="pet-btn" id="btn-play">🎮<span>Play</span></button>
                    <button class="pet-btn" id="btn-clean">🧼<span>Clean</span></button>
                    <button class="pet-btn" id="btn-sleep">💤<span>Sleep</span></button>
                </div>
                <div class="pet-footer-actions">
                    <button class="pet-min-btn" id="btn-export">Export .pet</button>
                    <button class="pet-min-btn" id="btn-import">Import</button>
                    <button class="pet-min-btn" id="btn-reset" style="color: #ff7b72;">Reset</button>
                </div>
            `;
            document.body.appendChild(container);

            document.getElementById('btn-feed').onclick = () => this.interact('feed');
            document.getElementById('btn-play').onclick = () => this.interact('play');
            document.getElementById('btn-clean').onclick = () => this.interact('clean');
            document.getElementById('btn-sleep').onclick = () => this.interact('sleep');
            document.getElementById('btn-export').onclick = () => this.export();
            document.getElementById('btn-import').onclick = () => this.import();
            document.getElementById('btn-reset').onclick = () => {
                if (confirm("Are you sure you want to reset your pet?")) {
                    this.state = this.getInitialState();
                    this.save();
                    this.updateUI();
                }
            };
        }

        renderStat(id, label) {
            return `
                <div class="stat-item">
                    <div class="stat-label">${label}</div>
                    <div class="stat-bar-bg">
                        <div id="stat-${id}" class="stat-bar-fill ${id}-fill" style="width: 100%"></div>
                    </div>
                </div>
            `;
        }

        interact(action) {
            if (this.state.isDead) {
                this.setMessage("Your Kiwi has passed away. RIP.");
                return;
            }

            if (this.state.isSleeping && action !== 'sleep') {
                this.setMessage("Kiwi is sleeping! Don't wake them up.");
                return;
            }

            switch (action) {
                case 'feed':
                    if (this.state.stats.hunger >= 100) {
                        this.setMessage("Too full! kiwi is groaning.");
                        this.state.stats.happiness = Math.max(0, this.state.stats.happiness - 10);
                    } else {
                        this.state.stats.hunger = Math.min(100, this.state.stats.hunger + GAIN_RATES.feed);
                        this.setMessage("Yum! Kiwi found a snack in the docs.");
                        this.tempEmoji(EMOJIS.eating);
                    }
                    break;
                case 'play':
                    if (this.state.stats.energy < 15) {
                        this.setMessage("Too tired to play...");
                    } else {
                        this.state.stats.happiness = Math.min(100, this.state.stats.happiness + GAIN_RATES.play);
                        this.state.stats.energy = Math.max(0, this.state.stats.energy - 10);
                        this.state.stats.hunger = Math.max(0, this.state.stats.hunger - 5);
                        this.setMessage("Zoomies! Kiwi is running through the sidebar.");
                        this.tempEmoji(EMOJIS.playing);
                    }
                    break;
                case 'clean':
                    this.state.stats.health = Math.min(100, this.state.stats.health + GAIN_RATES.clean);
                    this.setMessage("Squeaky clean docs!");
                    break;
                case 'sleep':
                    this.state.isSleeping = !this.state.isSleeping;
                    this.setMessage(this.state.isSleeping ? "Zzz... Documentation dreams." : "Good morning!");
                    break;
            }
            this.save();
            this.updateUI();
        }

        tempEmoji(emoji) {
            const el = document.getElementById('pet-emoji');
            const original = el.textContent;
            el.textContent = emoji;
            setTimeout(() => {
                if (!this.state.isDead) this.updateUI();
            }, 2000);
        }

        setMessage(msg) {
            document.getElementById('pet-message').textContent = msg;
        }

        updateUI() {
            if (this.state.isDead) {
                document.getElementById('pet-emoji').textContent = EMOJIS.dead;
                document.getElementById('pet-emoji').classList.remove('bounce');
                this.setMessage("Game Over. Your Kiwi is no more.");
            } else if (this.state.isSleeping) {
                document.getElementById('pet-emoji').textContent = EMOJIS.sleeping;
            } else if (this.state.stats.health < 30) {
                document.getElementById('pet-emoji').textContent = EMOJIS.sick;
            } else if (this.state.stats.happiness < 40) {
                document.getElementById('pet-emoji').textContent = EMOJIS.sad;
            } else {
                document.getElementById('pet-emoji').textContent = EMOJIS.happy;
            }

            document.getElementById('pet-name').textContent = `${this.state.name} (Age: ${Math.floor(this.state.age)})`;

            // Update bars
            for (const stat in this.state.stats) {
                const el = document.getElementById(`stat-${stat}`);
                if (el) el.style.width = `${this.state.stats[stat]}%`;
            }

            // Update button icons
            document.getElementById('btn-sleep').innerHTML = this.state.isSleeping ? '☀️<span>Wake</span>' : '💤<span>Sleep</span>';
        }

        startLoop() {
            setInterval(() => {
                if (!this.state.isDead) {
                    this.updateStatsSinceLastSeen();
                    this.updateUI();

                    // Periodic messages
                    if (Math.random() < 0.05) {
                        const lines = PERSO_LINES[this.state.personality];
                        this.setMessage(lines[Math.floor(Math.random() * lines.length)]);
                    }

                    this.save();
                }
            }, 5000);
            this.updateUI();
        }

        export() {
            const data = JSON.stringify(this.state);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.state.name.toLowerCase()}.pet.kiwi`;
            a.click();
            URL.revokeObjectURL(url);
        }

        import() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pet.kiwi';
            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const newState = JSON.parse(event.target.result);
                        if (newState.stats && newState.name) {
                            this.state = newState;
                            this.save();
                            this.updateUI();
                            alert("Pet imported successfully!");
                        }
                    } catch (err) {
                        alert("Invalid pet file.");
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }

        toggleVisibility() {
            const ui = document.getElementById('kiwi-pet-ui');
            ui.classList.toggle('active');
        }
    }

    // Trigger logic
    let clickCount = 0;
    let lastClickTime = 0;

    window.addEventListener('load', () => {
        window.kiwiPet = new KiwiPet();

        // Find the version element in the footer
        const checkTrigger = setInterval(() => {
            const trigger = document.getElementById('version-trigger');
            if (trigger) {
                clearInterval(checkTrigger);
                trigger.onclick = (e) => {
                    const now = Date.now();
                    if (now - lastClickTime > 2000) clickCount = 0;
                    clickCount++;
                    lastClickTime = now;

                    // Subtle feedback
                    trigger.style.opacity = '0.5';
                    setTimeout(() => trigger.style.opacity = '1', 100);

                    if (clickCount === 7) {
                        window.kiwiPet.toggleVisibility();
                        clickCount = 0;
                    }
                };
            }
        }, 500);
    });
})();
