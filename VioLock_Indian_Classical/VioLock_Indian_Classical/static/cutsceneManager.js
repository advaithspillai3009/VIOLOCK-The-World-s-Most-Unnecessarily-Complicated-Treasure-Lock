/**
 * VioLock — Cutscene Video Manager
 * Fullscreen 16:9 cinematic presentation, hidden browser controls,
 * muted autoplay fallback with interactive unmuting, game-styled skip button,
 * replay protection, and resilient placeholder fallback.
 */

const CUTSCENES = {
    intro: "/static/assets/cutscenes/intro.mp4",
    climax: "/static/assets/cutscenes/climax.mp4"
};

const CutsceneManager = {
    overlayEl: null,
    videoEl: null,
    skipBtn: null,
    placeholderCardEl: null,
    unmutePromptEl: null,
    
    isPlaying: false,
    currentCallback: null,
    unmuteListenerAttached: false,

    init() {
        this.overlayEl = document.getElementById("videoCutsceneOverlay");
        this.videoEl = document.getElementById("cutsceneVideoPlayer");
        this.skipBtn = document.getElementById("btnCutsceneSkip");
        this.placeholderCardEl = document.getElementById("cutscenePlaceholderCard");
        this.unmutePromptEl = document.getElementById("cutsceneUnmutePrompt");

        if (this.skipBtn) {
            this.skipBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.skip();
            });
        }

        if (this.videoEl) {
            this.videoEl.addEventListener("ended", () => {
                this.finish();
            });

            this.videoEl.addEventListener("error", (e) => {
                console.warn("[CutsceneManager] Video error or file not found:", e);
                this.showPlaceholderFallback();
            });
        }

        // Global keyboard shortcut to skip cutscenes (Space or Escape)
        window.addEventListener("keydown", (e) => {
            if (this.isPlaying && (e.code === "Space" || e.code === "Escape")) {
                e.preventDefault();
                this.skip();
            }
        });
    },

    play(videoSrc, onComplete) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentCallback = onComplete;

        if (!this.overlayEl || !this.videoEl) {
            console.warn("[CutsceneManager] Overlay or video element missing");
            this.finish();
            return;
        }

        // Reset UI
        if (this.placeholderCardEl) {
            this.placeholderCardEl.classList.add("hidden");
        }
        if (this.unmutePromptEl) {
            this.unmutePromptEl.classList.add("hidden");
        }

        // Show overlay with fade-in
        this.overlayEl.style.display = "flex";
        void this.overlayEl.offsetWidth; // Reflow
        this.overlayEl.classList.remove("hidden");
        this.overlayEl.classList.add("active");

        // Load video source
        this.videoEl.pause();
        this.videoEl.currentTime = 0;
        this.videoEl.muted = false;
        this.videoEl.src = videoSrc;
        this.videoEl.load();

        // Attempt playback with audio
        const playPromise = this.videoEl.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Successfully playing with audio
            }).catch((err) => {
                console.warn("[CutsceneManager] Autoplay with sound restricted, trying muted fallback:", err);
                // Fallback: play muted to comply with browser autoplay policy
                this.videoEl.muted = true;
                this.videoEl.play().then(() => {
                    this.showUnmutePrompt();
                    this.attachUnmuteListener();
                }).catch((fallbackErr) => {
                    console.warn("[CutsceneManager] Video play failed:", fallbackErr);
                    this.showPlaceholderFallback();
                });
            });
        }
    },

    playIntro(onComplete) {
        this.play(CUTSCENES.intro, onComplete);
    },

    playClimax(onComplete) {
        this.play(CUTSCENES.climax, onComplete);
    },

    showUnmutePrompt() {
        if (this.unmutePromptEl) {
            this.unmutePromptEl.classList.remove("hidden");
        }
    },

    attachUnmuteListener() {
        if (this.unmuteListenerAttached) return;
        this.unmuteListenerAttached = true;

        const unmuteHandler = () => {
            if (this.videoEl) {
                this.videoEl.muted = false;
            }
            if (this.unmutePromptEl) {
                this.unmutePromptEl.classList.add("hidden");
            }
            window.removeEventListener("click", unmuteHandler);
            window.removeEventListener("keydown", unmuteHandler);
            this.unmuteListenerAttached = false;
        };

        window.addEventListener("click", unmuteHandler, { once: true });
        window.addEventListener("keydown", unmuteHandler, { once: true });
    },

    showPlaceholderFallback() {
        if (this.placeholderCardEl) {
            const fileName = (this.videoEl && this.videoEl.src) ? this.videoEl.src.split("/").pop() : "video.mp4";
            const fileLabel = document.getElementById("placeholderFilename");
            if (fileLabel) {
                fileLabel.textContent = fileName;
            }
            this.placeholderCardEl.classList.remove("hidden");
        }
    },

    skip() {
        if (!this.isPlaying) return;
        this.finish();
    },

    finish() {
        if (!this.isPlaying) return;
        this.isPlaying = false;

        if (this.videoEl) {
            this.videoEl.pause();
        }

        if (this.overlayEl) {
            this.overlayEl.classList.remove("active");
            this.overlayEl.classList.add("hidden");
            setTimeout(() => {
                this.overlayEl.style.display = "none";
                if (this.placeholderCardEl) {
                    this.placeholderCardEl.classList.add("hidden");
                }
                if (this.unmutePromptEl) {
                    this.unmutePromptEl.classList.add("hidden");
                }
            }, 500);
        }

        const cb = this.currentCallback;
        this.currentCallback = null;
        if (typeof cb === "function") {
            cb();
        }
    }
};

window.CutsceneManager = CutsceneManager;
window.CUTSCENES = CUTSCENES;
