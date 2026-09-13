/**
 * VioLock — Cinematic Graphic Novel Cutscene Engine
 * High-definition panel framing, smooth Ken Burns camera motion,
 * Indian Classical Violin & Tanpura ambient musical soundtrack,
 * clean artwork presentation (no inserted dialogues), and instant skip.
 */

const ComicEngine = {
    overlayEl: null,
    stageWrapperEl: null,
    viewportEl: null,
    imagePlaneEl: null,
    flashOverlayEl: null,
    panelCounterEl: null,
    skipBtn: null,
    musicToggleBtn: null,
    voiceToggleBtn: null,
    titleCardEl: null,
    lowerBarEl: null,

    // State
    scenesList: [],
    currentSceneIndex: 0,
    active: false,
    isClimaxMode: false,
    sceneTimer: null,
    audioTimer: null,
    dialogueTimers: [],
    onSequenceComplete: null,
    musicEnabled: false,
    voicesEnabled: true,

    // Audio / Musical Score Engine
    audioCtx: null,
    masterMusicGain: null,
    tanpuraIntervalId: null,
    violinIntervalId: null,
    activeAudioNodes: [],
    currentClipAudio: null,

    init() {
        this.overlayEl = document.getElementById("comicCutsceneOverlay");
        if (!this.overlayEl) return;

        this.stageWrapperEl = this.overlayEl.querySelector(".comic-stage-wrapper");
        this.viewportEl = document.getElementById("comicViewportContainer");
        this.imagePlaneEl = document.getElementById("comicImagePlane");
        this.flashOverlayEl = document.getElementById("comicFlashOverlay");
        this.panelCounterEl = document.getElementById("comicPanelCounter");
        this.skipBtn = document.getElementById("btnComicSkip");
        this.musicToggleBtn = document.getElementById("comicMusicToggle");
        this.titleCardEl = document.getElementById("comicTitleCard");
        this.lowerBarEl = document.getElementById("comicLowerBar");

        // Set master image source (exact pristine user artwork)
        if (this.imagePlaneEl && COMIC_CONFIG.imageSrc) {
            this.imagePlaneEl.src = COMIC_CONFIG.imageSrc;
        }

        // Bind Skip Button
        if (this.skipBtn) {
            this.skipBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.skipCutscene();
            });
        }

        // Bind Music Toggle Button
        if (this.musicToggleBtn) {
            this.musicToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleMusic();
            });
        }

        // Bind Voice Toggle Button
        this.voiceToggleBtn = document.getElementById("comicVoiceToggle");
        if (this.voiceToggleBtn) {
            this.voiceToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleVoices();
            });
        }

        // Bind Title Card Start Button
        const startBtn = document.getElementById("btnTitleStart");
        if (startBtn) {
            startBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.beginStoryFromTitleCard();
            });
        }

        // Bind Vault Audit Receipt Elements
        this.receiptOverlayEl = document.getElementById("comicReceiptOverlay");
        const receiptReplayBtn = document.getElementById("btnPlayAgainReceipt");
        if (receiptReplayBtn) {
            receiptReplayBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.finishCutscene();
            });
        }

        // Viewport click / Space key to advance next panel
        if (this.stageWrapperEl) {
            this.stageWrapperEl.addEventListener("click", () => {
                if (this.active) this.advanceNextStep();
            });
        }

        window.addEventListener("keydown", (e) => {
            if (this.active) {
                if (e.code === "Space" || e.code === "Enter") {
                    e.preventDefault();
                    this.advanceNextStep();
                } else if (e.code === "Escape") {
                    e.preventDefault();
                    this.skipCutscene();
                }
            }
        });

        window.addEventListener("resize", () => {
            if (this.active) {
                this.recalculateCurrentFrame();
            }
        });

        // Developer / Testing URL params (?scene=1..13, ?climax=1..7, ?skip=1)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("skip")) {
            this.hideTitleCard();
            setTimeout(() => this.skipCutscene(), 30);
        } else if (urlParams.has("climax")) {
            this.hideTitleCard();
            const climaxIdx = parseInt(urlParams.get("climax"), 10) - 1 || 0;
            setTimeout(() => {
                this.playClimax({}, () => {});
                if (climaxIdx > 0 && climaxIdx < this.scenesList.length) {
                    this.renderScene(climaxIdx);
                }
            }, 30);
        } else if (urlParams.has("scene") || urlParams.has("panel")) {
            this.hideTitleCard();
            const panelIdx = parseInt(urlParams.get("scene") || urlParams.get("panel"), 10) - 1 || 0;
            setTimeout(() => {
                this.playIntro(() => {});
                this.hideTitleCard();
                this.renderScene(panelIdx);
            }, 30);
        }
    },

    hideTitleCard() {
        if (this.titleCardEl) {
            this.titleCardEl.classList.add("hidden");
            this.titleCardEl.style.display = "none";
        }
    },

    showTitleCard() {
        if (this.titleCardEl) {
            this.titleCardEl.style.display = "flex";
            this.titleCardEl.classList.remove("hidden");
        }
    },

    // =========================================================
    // INDIAN CLASSICAL MUSICAL SOUNDTRACK ENGINE (Web Audio API)
    // Tanpura Drone + Lyrical Violin Motifs + Atmospheric Ambient Pad
    // =========================================================
    initAudio() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }
            if (!this.masterMusicGain) {
                this.masterMusicGain = this.audioCtx.createGain();
                this.masterMusicGain.gain.setValueAtTime(this.musicEnabled ? 0.22 : 0.0, this.audioCtx.currentTime);
                this.masterMusicGain.connect(this.audioCtx.destination);
            }
        } catch (e) {
            console.warn("[ComicEngine] AudioContext init error:", e);
        }
    },

    startCutsceneMusic(mode = "intro") {
        // Cutscene background music removed per user request
        this.stopCutsceneMusic();
        return;
    },

    startTanpuraDrone() {
        if (!this.audioCtx || !this.masterMusicGain) return;
        const ctx = this.audioCtx;

        // Tanpura string frequencies for tonic D
        const strings = [
            { freq: 220.00, desc: "Panchamam (Pa)" },
            { freq: 293.66, desc: "Tara Shadjam (Sa)" },
            { freq: 294.20, desc: "Tara Shadjam shimmer (Sa+)" },
            { freq: 146.83, desc: "Kharaja Shadjam (Low Sa)" }
        ];

        let currentString = 0;

        const pluckString = () => {
            if (!this.active || !this.audioCtx) return;
            const now = ctx.currentTime;
            const note = strings[currentString];
            currentString = (currentString + 1) % strings.length;

            // Plucked string oscillator with rich harmonic richness
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(note.freq, now);

            // Resonant body filter for acoustic tambura resonance
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(1200, now);
            filter.Q.setValueAtTime(4.0, now);

            // Pluck envelope: sharp attack, rich shimmering decay
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterMusicGain);

            osc.start(now);
            osc.stop(now + 3.3);

            this.activeAudioNodes.push(osc, gain);
        };

        pluckString();
        this.tanpuraIntervalId = setInterval(pluckString, 950);
    },

    startAtmosphericPad() {
        if (!this.audioCtx || !this.masterMusicGain) return;
        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        const padOsc1 = ctx.createOscillator();
        const padOsc2 = ctx.createOscillator();
        const padFilter = ctx.createBiquadFilter();
        const padGain = ctx.createGain();

        padOsc1.type = "sine";
        padOsc1.frequency.setValueAtTime(73.42, now); // Low D2 sub-bass
        padOsc2.type = "triangle";
        padOsc2.frequency.setValueAtTime(146.83, now); // D3

        padFilter.type = "lowpass";
        padFilter.frequency.setValueAtTime(280, now);

        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(0.10, now + 2.0);

        padOsc1.connect(padFilter);
        padOsc2.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.masterMusicGain);

        padOsc1.start(now);
        padOsc2.start(now);

        this.activeAudioNodes.push(padOsc1, padOsc2, padGain);
    },

    startViolinMelody(mode) {
        if (!this.audioCtx || !this.masterMusicGain) return;
        const ctx = this.audioCtx;

        // Classical swara motifs in Tonic D (D, E, F#, G, A, B, C#, D')
        const introScale = [
            293.66, // Sa
            329.63, // Re
            369.99, // Ga
            392.00, // Ma
            440.00, // Pa
            493.88, // Dha
            554.37, // Ni
            587.33  // Sa'
        ];

        // Lyrical musical phrases
        const phrases = mode === "climax"
            ? [
                [440.00, 369.99, 293.66, 220.00], // Descending mysterious
                [293.66, 329.63, 369.99, 440.00], // Inquisitive rise
                [554.37, 493.88, 440.00, 392.00, 369.99, 293.66], // Dramatic resolution
                [293.66, 293.66, 369.99, 293.66]  // Anti-climactic cadence
            ]
            : [
                [293.66, 329.63, 369.99, 440.00], // Sa-Re-Ga-Pa
                [440.00, 493.88, 554.37, 587.33], // Pa-Dha-Ni-Sa'
                [587.33, 554.37, 493.88, 440.00, 369.99], // Tara Sthayi descent
                [293.66, 369.99, 440.00, 369.99, 293.66]  // Pure Kaavungal motif
            ];

        let phraseIndex = 0;

        const playNextPhrase = () => {
            if (!this.active || !this.audioCtx) return;
            const currentPhrase = phrases[phraseIndex % phrases.length];
            phraseIndex++;

            let noteTime = ctx.currentTime + 0.3;
            currentPhrase.forEach((freq, idx) => {
                const dur = idx === currentPhrase.length - 1 ? 2.2 : 0.85;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                // Warm violin acoustic formant
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq, noteTime);

                // Portamento / Meend pitch slide
                if (idx > 0) {
                    const prevFreq = currentPhrase[idx - 1];
                    osc.frequency.setValueAtTime(prevFreq, noteTime);
                    osc.frequency.exponentialRampToValueAtTime(freq, noteTime + 0.18);
                }

                filter.type = "bandpass";
                filter.frequency.setValueAtTime(950, noteTime);
                filter.Q.setValueAtTime(2.2, noteTime);

                // Violin bow envelope
                gain.gain.setValueAtTime(0.001, noteTime);
                gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.12);
                gain.gain.setValueAtTime(0.08, noteTime + dur - 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterMusicGain);

                osc.start(noteTime);
                osc.stop(noteTime + dur + 0.05);

                this.activeAudioNodes.push(osc, gain);
                noteTime += dur * 0.9;
            });
        };

        playNextPhrase();
        this.violinIntervalId = setInterval(playNextPhrase, 5200);
    },

    stopCutsceneMusic() {
        if (this.tanpuraIntervalId) {
            clearInterval(this.tanpuraIntervalId);
            this.tanpuraIntervalId = null;
        }
        if (this.violinIntervalId) {
            clearInterval(this.violinIntervalId);
            this.violinIntervalId = null;
        }

        if (this.audioCtx && this.masterMusicGain) {
            const now = this.audioCtx.currentTime;
            this.masterMusicGain.gain.cancelScheduledValues(now);
            this.masterMusicGain.gain.setValueAtTime(this.masterMusicGain.gain.value, now);
            this.masterMusicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        }

        setTimeout(() => {
            this.activeAudioNodes.forEach(node => {
                try {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                } catch (e) {}
            });
            this.activeAudioNodes = [];
        }, 550);
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.masterMusicGain && this.audioCtx) {
            const now = this.audioCtx.currentTime;
            this.masterMusicGain.gain.cancelScheduledValues(now);
            this.masterMusicGain.gain.linearRampToValueAtTime(this.musicEnabled ? 0.22 : 0.0, now + 0.2);
        }
        if (this.musicToggleBtn) {
            this.musicToggleBtn.textContent = this.musicEnabled ? "🎵 MUSIC: ON" : "🔇 MUSIC: OFF";
        }
    },

    toggleVoices() {
        this.voicesEnabled = !this.voicesEnabled;
        if (!this.voicesEnabled && window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
        }
        if (this.voiceToggleBtn) {
            this.voiceToggleBtn.textContent = this.voicesEnabled ? "🗣️ VOICES: ON" : "🔇 VOICES: OFF";
        }
    },

    speakDialogue(dialogue) {
        if (!this.voicesEnabled || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            const textToSpeak = (dialogue.text || "").replace(/^[".]+|[".]+$/g, '').trim();
            if (!textToSpeak) return;

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const profile = (COMIC_CONFIG.voices && COMIC_CONFIG.voices[dialogue.voice])
                ? COMIC_CONFIG.voices[dialogue.voice]
                : { pitch: 1.0, rate: 0.95, volume: 1.0 };

            utterance.pitch = profile.pitch || 1.0;
            utterance.rate = profile.rate || 0.95;
            utterance.volume = (profile.volume || 1.0) * 0.95;
            utterance.lang = profile.lang || "en-US";

            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length) {
                const enVoices = voices.filter(v => v.lang.startsWith("en"));
                if (enVoices.length) {
                    if (dialogue.voice === "grandmother" || dialogue.voice === "viola") {
                        const female = enVoices.find(v => v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google US English"));
                        if (female) utterance.voice = female;
                    } else {
                        const male = enVoices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Mark"));
                        if (male) utterance.voice = male;
                    }
                }
            }

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("[ComicEngine] SpeechSynthesis error:", e);
        }
    },

    // Subtle transition chime when switching panels (disabled)
    playPanelTransitionChime() {
        return;
    },

    playAudioClip(url, volume = 1.0) {
        try {
            this.stopAudioClip();
            if (this.audioCtx && this.masterMusicGain) {
                const now = this.audioCtx.currentTime;
                this.masterMusicGain.gain.cancelScheduledValues(now);
                this.masterMusicGain.gain.setValueAtTime(0.04, now);
            }
            const audio = new Audio(url);
            audio.volume = volume;
            this.currentClipAudio = audio;
            audio.onended = () => {
                if (this.audioCtx && this.masterMusicGain && this.musicEnabled) {
                    const now = this.audioCtx.currentTime;
                    this.masterMusicGain.gain.cancelScheduledValues(now);
                    this.masterMusicGain.gain.setValueAtTime(0.22, now);
                }
            };
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn("[ComicEngine] Audio clip playback prevented by browser:", err);
                });
            }
            return audio;
        } catch (e) {
            console.warn("[ComicEngine] Error playing audio clip:", url, e);
            return null;
        }
    },

    stopAudioClip() {
        if (this.currentClipAudio) {
            try {
                this.currentClipAudio.pause();
                this.currentClipAudio.currentTime = 0;
            } catch (e) {}
            this.currentClipAudio = null;
        }
        if (this.audioCtx && this.masterMusicGain && this.musicEnabled) {
            const now = this.audioCtx.currentTime;
            this.masterMusicGain.gain.cancelScheduledValues(now);
            this.masterMusicGain.gain.setValueAtTime(0.22, now);
        }
    },

    // =========================================================
    // DYNAMIC PANEL FRAMING & KEN BURNS CAMERA MATH
    // High-definition presentation with unconstrained camera zoom
    // =========================================================
    calculateViewportDimensions(bounds, scene) {
        const stage = this.stageWrapperEl || document.body;
        const isCover = scene && (scene.coverScreen || scene.id === "climax-4" || scene.imageOnly);
        const maxStageW = window.innerWidth * (isCover ? 0.96 : 0.88);
        const maxStageH = window.innerHeight * (isCover ? 0.95 : 0.70);
        const panelAR = bounds.w / bounds.h;
        const stageAR = maxStageW / maxStageH;

        let vW, vH;
        if (panelAR > stageAR) {
            vW = Math.min(maxStageW, Math.max(isCover ? 700 : 540, bounds.w * (isCover ? 2.2 : 1.5)));
            vH = vW / panelAR;
        } else {
            vH = Math.min(maxStageH, Math.max(isCover ? 600 : 450, bounds.h * (isCover ? 2.2 : 1.5)));
            vW = vH * panelAR;
        }

        if (vW > maxStageW) {
            vW = maxStageW;
            vH = vW / panelAR;
        }
        if (vH > maxStageH) {
            vH = maxStageH;
            vW = vH * panelAR;
        }

        return {
            w: Math.round(vW),
            h: Math.round(vH),
            scale: vW / bounds.w
        };
    },

    computeCameraTransform(focalX, focalY, zoom, bounds, dims) {
        const S = dims.scale * zoom;
        let tx = (dims.w / 2) - (focalX * S);
        let ty = (dims.h / 2) - (focalY * S);

        // Clamp camera strictly inside panel bounds so neighboring panels NEVER bleed in!
        const minTx = dims.w - (bounds.x + bounds.w) * S;
        const maxTx = -bounds.x * S;
        if (minTx <= maxTx) {
            tx = Math.min(maxTx, Math.max(minTx, tx));
        }

        const minTy = dims.h - (bounds.y + bounds.h) * S;
        const maxTy = -bounds.y * S;
        if (minTy <= maxTy) {
            ty = Math.min(maxTy, Math.max(minTy, ty));
        }

        return `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0px) scale(${S.toFixed(4)})`;
    },

    applySceneCamera(scene) {
        if (!this.imagePlaneEl || !this.viewportEl) return;

        const isCustom = !!scene.customImage;
        const coordScale = isCustom ? 1.0 : (COMIC_CONFIG.coordinateScale || 1.0);

        const rawBounds = scene.bounds;
        const bounds = {
            x: rawBounds.x * coordScale,
            y: rawBounds.y * coordScale,
            w: rawBounds.w * coordScale,
            h: rawBounds.h * coordScale
        };

        const targetSrc = isCustom ? scene.customImage : COMIC_CONFIG.imageSrc;
        if (this.imagePlaneEl.getAttribute("src") !== targetSrc) {
            this.imagePlaneEl.src = targetSrc;
        }

        if (isCustom) {
            this.imagePlaneEl.style.width = `${bounds.w}px`;
            this.imagePlaneEl.style.height = `${bounds.h}px`;
            this.imagePlaneEl.style.minWidth = `${bounds.w}px`;
            this.imagePlaneEl.style.minHeight = `${bounds.h}px`;
        } else {
            this.imagePlaneEl.style.width = `${COMIC_CONFIG.naturalWidth}px`;
            this.imagePlaneEl.style.height = `${COMIC_CONFIG.naturalHeight}px`;
            this.imagePlaneEl.style.minWidth = `${COMIC_CONFIG.naturalWidth}px`;
            this.imagePlaneEl.style.minHeight = `${COMIC_CONFIG.naturalHeight}px`;
        }

        const dims = this.calculateViewportDimensions(bounds, scene);

        // Dynamically resize viewport container to match panel aspect ratio
        this.viewportEl.style.width = `${dims.w}px`;
        this.viewportEl.style.height = `${dims.h}px`;

        if (scene && (scene.coverScreen || scene.id === "climax-4")) {
            this.viewportEl.classList.add("cover-active");
        } else {
            this.viewportEl.classList.remove("cover-active");
        }

        const startCam = {
            x: scene.camera.start.x * coordScale,
            y: scene.camera.start.y * coordScale,
            zoom: scene.camera.start.zoom
        };
        const endCam = {
            x: scene.camera.end.x * coordScale,
            y: scene.camera.end.y * coordScale,
            zoom: scene.camera.end.zoom
        };

        // Smooth Ken Burns camera animation with full zoom range
        const startTransform = this.computeCameraTransform(startCam.x, startCam.y, startCam.zoom, bounds, dims);
        const endTransform = this.computeCameraTransform(endCam.x, endCam.y, endCam.zoom, bounds, dims);

        // Snap to start frame
        this.imagePlaneEl.style.transition = "none";
        this.imagePlaneEl.style.transform = startTransform;

        // Force browser layout reflow
        void this.imagePlaneEl.offsetWidth;

        // Smoothly animate Ken Burns camera to end frame
        const dur = scene.duration || 6500;
        this.imagePlaneEl.style.transition = `transform ${dur}ms cubic-bezier(0.25, 1, 0.45, 1)`;
        this.imagePlaneEl.style.transform = endTransform;
    },

    recalculateCurrentFrame() {
        const scene = this.scenesList[this.currentSceneIndex];
        if (scene) {
            this.applySceneCamera(scene);
        }
    },

    // =========================================================
    // SCENE PLAYBACK & DIALOGUE / SUBTITLE PRESENTATION
    // =========================================================
    playIntro(onComplete) {
        this.isClimaxMode = false;
        this.scenesList = COMIC_CONFIG.introScenes;
        this.onSequenceComplete = onComplete;
        this.currentSceneIndex = 0;
        this.active = true;

        if (this.receiptOverlayEl) this.receiptOverlayEl.classList.add("hidden");
        if (this.viewportEl) this.viewportEl.classList.remove("hidden");
        if (this.lowerBarEl) this.lowerBarEl.classList.remove("hidden");

        if (this.overlayEl) {
            this.overlayEl.style.display = "flex";
            void this.overlayEl.offsetWidth;
            this.overlayEl.classList.remove("hidden");
        }

        this.showTitleCard();
    },

    beginStoryFromTitleCard() {
        this.hideTitleCard();
        this.startCutsceneMusic("intro");
        this.renderScene(0);
    },

    playClimax(scores, onComplete) {
        this.isClimaxMode = true;
        this.scenesList = COMIC_CONFIG.climaxScenes;
        this.onSequenceComplete = onComplete;
        this.currentSceneIndex = 0;
        this.active = true;

        this.hideTitleCard();
        if (this.receiptOverlayEl) this.receiptOverlayEl.classList.add("hidden");
        if (this.viewportEl) this.viewportEl.classList.remove("hidden");
        if (this.lowerBarEl) this.lowerBarEl.classList.remove("hidden");

        if (this.overlayEl) {
            this.overlayEl.style.display = "flex";
            void this.overlayEl.offsetWidth;
            this.overlayEl.classList.remove("hidden");
        }

        this.startCutsceneMusic("climax");
        this.renderScene(0);
    },

    renderSceneDialogues(scene) {
        if (!this.lowerBarEl) return;

        // Strip all dialogues, subtitle cards, and screen overlays on image-only slides (Messi reveal)
        if (scene.imageOnly || scene.id === "climax-4") {
            this.lowerBarEl.innerHTML = "";
            this.lowerBarEl.classList.add("hidden");
            this.lowerBarEl.style.display = "none";
            return;
        }

        const dialogues = scene.dialogues || [];
        const hasDialogues = dialogues.length > 0;

        const showDialogueStep = (dIdx) => {
            if (!this.active || this.currentSceneIndex !== (scene.index - 1)) return;
            const d = dialogues[dIdx];
            if (!d) return;

            const speakerTitle = d.characterTitle || d.speaker || "NARRATOR";
            const speakerClass = `speaker-${(d.voice || "narrator").toLowerCase()}`;

            let actionHtml = "";
            if (scene.isFinalClimax) {
                actionHtml = `
                    <div style="margin-top: 10px;">
                        <button id="btnPlayAgainComic" class="btn-climax-replay">
                            ⚡ RE-SEAL VAULT & PLAY AGAIN ➔
                        </button>
                    </div>
                `;
            }

            this.lowerBarEl.innerHTML = `
                <div class="comic-dialogue-card">
                    <div class="dialogue-card-header">
                        <span class="dialogue-scene-badge">${scene.title || ""}</span>
                        <span class="dialogue-speaker-badge ${speakerClass}">
                            ${speakerTitle}
                        </span>
                    </div>
                    <div class="dialogue-card-body">
                        <p class="dialogue-text">"${d.text}"</p>
                    </div>
                    ${actionHtml ? actionHtml : `
                        <div class="dialogue-card-footer">
                            <span class="comic-advance-hint">Click anywhere or press Space to advance ➔</span>
                        </div>
                    `}
                </div>
            `;

            if (scene.isFinalClimax) {
                const btn = this.lowerBarEl.querySelector("#btnPlayAgainComic");
                if (btn) {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.finishCutscene();
                    });
                }
            }

            // Speak out loud with speech synthesis
            this.speakDialogue(d);
        };

        if (hasDialogues) {
            const firstDelay = dialogues[0].delay || 300;
            const t0 = setTimeout(() => showDialogueStep(0), firstDelay);
            this.dialogueTimers.push(t0);

            if (dialogues.length > 1) {
                for (let i = 1; i < dialogues.length; i++) {
                    const nextD = dialogues[i];
                    const nextDelay = nextD.delay || (firstDelay + 3500);
                    const tN = setTimeout(() => showDialogueStep(i), nextDelay);
                    this.dialogueTimers.push(tN);
                }
            }
        } else if (scene.caption) {
            let actionHtml = "";
            if (scene.isFinalClimax) {
                actionHtml = `
                    <div style="margin-top: 10px;">
                        <button id="btnPlayAgainComic" class="btn-climax-replay">
                            ⚡ RE-SEAL VAULT & PLAY AGAIN ➔
                        </button>
                    </div>
                `;
            }

            this.lowerBarEl.innerHTML = `
                <div class="comic-dialogue-card">
                    <div class="dialogue-card-header">
                        <span class="dialogue-scene-badge">${scene.title || ""}</span>
                    </div>
                    <div class="dialogue-card-body">
                        <p class="dialogue-text">${scene.caption}</p>
                    </div>
                    ${actionHtml ? actionHtml : `
                        <div class="dialogue-card-footer">
                            <span class="comic-advance-hint">Click anywhere or press Space to advance ➔</span>
                        </div>
                    `}
                </div>
            `;

            if (scene.isFinalClimax) {
                const btn = this.lowerBarEl.querySelector("#btnPlayAgainComic");
                if (btn) {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.finishCutscene();
                    });
                }
            }
        } else {
            this.lowerBarEl.innerHTML = `
                <span class="comic-advance-hint">Click anywhere or press Space to advance ➔</span>
            `;
        }
    },

    renderScene(index) {
        if (!this.active) return;
        this.clearTimers();

        if (index >= this.scenesList.length) {
            this.finishCutscene();
            return;
        }

        this.currentSceneIndex = index;
        const scene = this.scenesList[index];

        // Update Panel HUD Counter
        if (this.panelCounterEl) {
            const prefix = this.isClimaxMode ? "CLIMAX" : "PANEL";
            this.panelCounterEl.innerHTML = `<span class="counter-dot"></span> ${prefix} ${scene.index} / ${this.scenesList.length}`;
        }

        this.stopAudioClip();

        // Reset wheel spin animation on viewport
        if (this.viewportEl) {
            this.viewportEl.classList.remove("wheel-spin-in");
        }

        // Dedicated Vault Audit Receipt Screen (after Messi image)
        if (scene.isReceiptScreen) {
            if (this.viewportEl) this.viewportEl.classList.add("hidden");
            if (this.lowerBarEl) this.lowerBarEl.classList.add("hidden");
            if (this.receiptOverlayEl) this.receiptOverlayEl.classList.remove("hidden");

            // Play A10 Mohanlal audio
            this.playAudioClip(scene.audioSrc || "/static/assets/a10_audio.m4a", 1.0);
            return;
        } else {
            if (this.receiptOverlayEl) this.receiptOverlayEl.classList.add("hidden");
            if (this.viewportEl) this.viewportEl.classList.remove("hidden");
            if (scene.imageOnly || scene.id === "climax-4") {
                if (this.lowerBarEl) {
                    this.lowerBarEl.classList.add("hidden");
                    this.lowerBarEl.style.display = "none";
                }
            } else {
                if (this.lowerBarEl) {
                    this.lowerBarEl.classList.remove("hidden");
                    this.lowerBarEl.style.display = "";
                }
            }
        }

        // Trigger Wheel Spin Entrance Animation (e.g. for Messi Climax Reveal)
        if (scene.wheelSpin && this.viewportEl) {
            void this.viewportEl.offsetWidth; // Force layout reflow to replay CSS keyframe
            this.viewportEl.classList.add("wheel-spin-in");

            // Reduced gap: Start audio with minimal delay (150ms) as the image spins into view
            if (scene.audioSrc) {
                const delay = scene.audioDelayMs !== undefined ? scene.audioDelayMs : 150;
                this.audioTimer = setTimeout(() => {
                    if (this.active && this.currentSceneIndex === index) {
                        this.playAudioClip(scene.audioSrc, 1.0);
                    }
                }, delay);
            }
        } else if (scene.audioSrc) {
            const delay = scene.audioDelayMs || 0;
            if (delay > 0) {
                this.audioTimer = setTimeout(() => {
                    if (this.active && this.currentSceneIndex === index) {
                        this.playAudioClip(scene.audioSrc, 1.0);
                    }
                }, delay);
            } else {
                this.playAudioClip(scene.audioSrc, 1.0);
            }
        }

        // Render Dialogue / Subtitle Presentation
        this.renderSceneDialogues(scene);

        // Apply Dynamic Frame & Ken Burns Camera Motion
        this.applySceneCamera(scene);
        this.playPanelTransitionChime();

        // Final climax panel stays interactive
        if (scene.isFinalClimax) {
            return;
        }

        // Auto-advance timer for next scene
        const dur = scene.duration || 6500;
        this.sceneTimer = setTimeout(() => {
            this.advanceNextStep();
        }, dur);
    },

    advanceNextStep() {
        this.clearTimers();
        const nextIndex = this.currentSceneIndex + 1;
        if (nextIndex < this.scenesList.length) {
            this.renderScene(nextIndex);
        } else {
            this.finishCutscene();
        }
    },

    skipCutscene() {
        this.active = false;
        this.clearTimers();
        this.stopAudioClip();
        this.stopCutsceneMusic();
        this.hideTitleCard();

        if (this.receiptOverlayEl) {
            this.receiptOverlayEl.classList.add("hidden");
        }
        if (this.viewportEl) {
            this.viewportEl.classList.remove("hidden");
            this.viewportEl.classList.remove("cover-active");
            this.viewportEl.classList.remove("wheel-spin-in");
        }
        if (this.lowerBarEl) {
            this.lowerBarEl.classList.remove("hidden");
            this.lowerBarEl.style.display = "";
        }

        if (this.overlayEl) {
            this.overlayEl.classList.add("hidden");
            this.overlayEl.style.display = "none";
        }
        if (this.flashOverlayEl) {
            this.flashOverlayEl.classList.remove("active");
        }
        if (typeof this.onSequenceComplete === "function") {
            this.onSequenceComplete();
        }
    },

    finishCutscene() {
        this.active = false;
        this.clearTimers();
        this.stopAudioClip();
        this.stopCutsceneMusic();

        if (this.receiptOverlayEl) {
            this.receiptOverlayEl.classList.add("hidden");
        }
        if (this.viewportEl) {
            this.viewportEl.classList.remove("hidden");
            this.viewportEl.classList.remove("cover-active");
            this.viewportEl.classList.remove("wheel-spin-in");
        }
        if (this.lowerBarEl) {
            this.lowerBarEl.classList.remove("hidden");
            this.lowerBarEl.style.display = "";
        }

        if (this.flashOverlayEl) {
            this.flashOverlayEl.classList.add("active");
        }

        setTimeout(() => {
            if (this.overlayEl) {
                this.overlayEl.classList.add("hidden");
                this.overlayEl.style.display = "none";
            }
            if (this.flashOverlayEl) {
                this.flashOverlayEl.classList.remove("active");
            }

            if (typeof this.onSequenceComplete === "function") {
                this.onSequenceComplete();
            }
        }, 350);
    },

    clearTimers() {
        if (this.sceneTimer) {
            clearTimeout(this.sceneTimer);
            this.sceneTimer = null;
        }
        if (this.audioTimer) {
            clearTimeout(this.audioTimer);
            this.audioTimer = null;
        }
        if (this.dialogueTimers && this.dialogueTimers.length) {
            this.dialogueTimers.forEach(t => clearTimeout(t));
            this.dialogueTimers = [];
        }
        if (this.viewportEl) {
            this.viewportEl.classList.remove("wheel-spin-in");
        }
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
        }
    }
};

window.ComicEngine = ComicEngine;
