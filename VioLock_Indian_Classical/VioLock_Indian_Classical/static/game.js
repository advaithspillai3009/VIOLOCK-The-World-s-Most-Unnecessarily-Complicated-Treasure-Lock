/**
 * VioLock — Game Engine & Bureaucratic Security State Machine
 * Coordinates 5 Over-Engineered Levels, Audio Pitch Telemetry,
 * Fullscreen Cinematic Cutscenes, and the Anti-Climactic Vault Reveal.
 */

(function() {
    "use strict";

    // Application State
    const state = {
        currentLevelIdx: 0,
        currentStepIdx: 0,
        isPlaying: false,
        introSeen: false,
        selectedScale: "D",
        tonicHz: 293.66,
        stepHistory: [],
        levelScores: [],
        totalAttempts: 0,
        startTime: null
    };

    let audioDetector = null;
    let canvasCtx = null;
    let audioFeedbackCtx = null;

    // DOM Element References
    const DOM = {};

    function cacheDom() {
        DOM.scaleSelect = document.getElementById("scaleSelect");
        DOM.displayTonicNote = document.getElementById("displayTonicNote");
        DOM.displayTonicFreq = document.getElementById("displayTonicFreq");
        DOM.heroTonicText = document.getElementById("heroTonicText");

        DOM.startBtn = document.getElementById("startBtn");
        DOM.stopBtn = document.getElementById("stopBtn");
        DOM.replayCutsceneBtn = document.getElementById("replayCutsceneBtn");
        DOM.systemStatusText = document.getElementById("systemStatusText");

        DOM.levelRackDots = document.querySelectorAll(".tumbler-dot");
        DOM.levelName = document.getElementById("levelName");
        DOM.challengeTitle = document.getElementById("challengeTitle");
        DOM.scannerStatusText = document.getElementById("scannerStatusText");

        DOM.targetSealSwara = document.getElementById("targetSealSwara");
        DOM.directiveText = document.getElementById("directiveText");
        DOM.subDirectiveText = document.getElementById("subDirectiveText");
        DOM.stepChecklist = document.getElementById("stepChecklist");

        DOM.audioVisualizer = document.getElementById("audioVisualizer");
        DOM.visualizerFreq = document.getElementById("visualizerFreq");

        DOM.detectedSwara = document.getElementById("detectedSwara");
        DOM.target = document.getElementById("target");
        DOM.frequency = document.getElementById("frequency");
        DOM.confidence = document.getElementById("confidence");
        DOM.tuningNeedle = document.getElementById("tuningNeedle");
        DOM.centsDeviationText = document.getElementById("centsDeviationText");
        DOM.holdProgressBar = document.getElementById("holdProgressBar");

        DOM.violaText = document.getElementById("violaText");
        DOM.micErrorBanner = document.getElementById("micErrorBanner");

        // Dramatic Level 5 Countdown Overlay
        DOM.vaultCountdownOverlay = document.getElementById("vaultCountdownOverlay");
        DOM.countdownStepText = document.getElementById("countdownStepText");
        DOM.countdownDigits = document.getElementById("countdownDigits");

        // Post-Climax Final Screen & Modals
        DOM.climaxChamberModal = document.getElementById("climaxChamberModal");
        DOM.finalNoteModal = document.getElementById("finalNoteModal");
        DOM.btnOpenNoteModal = document.getElementById("btnOpenNoteModal");
        DOM.btnCloseNoteModal = document.getElementById("btnCloseNoteModal");
        DOM.btnReturnToVault = document.getElementById("btnReturnToVault");
    }

    function init() {
        cacheDom();
        if (DOM.audioVisualizer) {
            canvasCtx = DOM.audioVisualizer.getContext("2d");
        }

        // Initialize Cutscene Manager
        if (window.CutsceneManager) {
            window.CutsceneManager.init();
        }

        // Initialize Audio Detector
        audioDetector = new window.AudioDetector();
        audioDetector.setTonic(state.selectedScale, state.tonicHz);

        setupEventListeners();
        updateTonicDisplays();
        renderLevelState();

        // Support test URL parameters for headless verification
        const urlParams = new URLSearchParams(window.location.search);
        const testParam = urlParams.get("test");
        if (testParam === "cutscene") {
            setTimeout(() => {
                if (window.CutsceneManager) window.CutsceneManager.playIntro();
            }, 300);
        } else if (testParam === "climax") {
            setTimeout(() => {
                showFinalParodyScreen();
            }, 300);
        } else if (testParam === "note") {
            setTimeout(() => {
                showFinalParodyScreen();
                if (DOM.finalNoteModal) DOM.finalNoteModal.classList.remove("hidden");
            }, 300);
        } else if (testParam === "countdown") {
            setTimeout(() => {
                triggerLevel5ClimaxCountdown();
            }, 300);
        }
    }

    function setupEventListeners() {
        // Scale / Shruti change
        if (DOM.scaleSelect) {
            DOM.scaleSelect.addEventListener("change", (e) => {
                const scale = e.target.value;
                state.selectedScale = scale;
                state.tonicHz = window.SCALE_FREQUENCIES[scale] || 293.66;
                audioDetector.setTonic(state.selectedScale, state.tonicHz);
                updateTonicDisplays();
                if (state.isPlaying) {
                    loadCurrentStepTarget();
                }
            });
        }

        // Start / Safety Disengage Button
        if (DOM.startBtn) {
            DOM.startBtn.addEventListener("click", () => {
                if (!state.introSeen && window.CutsceneManager) {
                    // Play Intro Cutscene first
                    window.CutsceneManager.playIntro(() => {
                        state.introSeen = true;
                        beginGameplay();
                    });
                } else {
                    beginGameplay();
                }
            });
        }

        // Stop / Abort Button
        if (DOM.stopBtn) {
            DOM.stopBtn.addEventListener("click", () => {
                abortGameplay();
            });
        }

        // Replay Cutscene Button in Header
        if (DOM.replayCutsceneBtn) {
            DOM.replayCutsceneBtn.addEventListener("click", () => {
                if (audioDetector) audioDetector.stop();
                state.isPlaying = false;
                if (window.CutsceneManager) {
                    window.CutsceneManager.playIntro(() => {
                        state.introSeen = true;
                        beginGameplay();
                    });
                }
            });
        }

        // Audio Detector Callbacks
        audioDetector.onTelemetry = (telemetry) => {
            renderTelemetry(telemetry);
        };

        audioDetector.onWaveformData = (buffer) => {
            renderWaveform(buffer);
        };

        audioDetector.onNoteMatch = (match) => {
            handleNoteConfirmed(match);
        };

        audioDetector.onError = (errMsg) => {
            showMicError(errMsg);
        };

        // Note Modal inspection handlers
        if (DOM.btnOpenNoteModal) {
            DOM.btnOpenNoteModal.addEventListener("click", () => {
                if (DOM.finalNoteModal) DOM.finalNoteModal.classList.remove("hidden");
            });
        }
        if (DOM.btnCloseNoteModal) {
            DOM.btnCloseNoteModal.addEventListener("click", () => {
                if (DOM.finalNoteModal) DOM.finalNoteModal.classList.add("hidden");
            });
        }

        // Return to Vault / Reset
        if (DOM.btnReturnToVault) {
            DOM.btnReturnToVault.addEventListener("click", () => {
                resetGameToBeginning();
            });
        }
    }

    function updateTonicDisplays() {
        if (DOM.displayTonicNote) DOM.displayTonicNote.textContent = state.selectedScale;
        if (DOM.displayTonicFreq) DOM.displayTonicFreq.textContent = `${state.tonicHz.toFixed(2)} Hz`;
        if (DOM.heroTonicText) DOM.heroTonicText.textContent = `Sa (${state.selectedScale} • ${state.tonicHz.toFixed(2)} Hz)`;
    }

    async function beginGameplay() {
        state.isPlaying = true;
        if (!state.startTime) state.startTime = Date.now();

        if (DOM.startBtn) DOM.startBtn.disabled = true;
        if (DOM.stopBtn) DOM.stopBtn.disabled = false;
        if (DOM.micErrorBanner) DOM.micErrorBanner.classList.add("hidden");

        if (DOM.systemStatusText) {
            DOM.systemStatusText.textContent = `AUTHENTICATING: LEVEL ${state.currentLevelIdx + 1} OF 5`;
            DOM.systemStatusText.classList.add("status-active");
        }
        if (DOM.scannerStatusText) {
            DOM.scannerStatusText.textContent = "ACOUSTIC RECEIVER: ACTIVE";
        }

        await audioDetector.start();
        renderLevelState();
        loadCurrentStepTarget();
    }

    function abortGameplay() {
        state.isPlaying = false;
        if (audioDetector) audioDetector.stop();

        if (DOM.startBtn) DOM.startBtn.disabled = false;
        if (DOM.stopBtn) DOM.stopBtn.disabled = true;

        if (DOM.systemStatusText) {
            DOM.systemStatusText.textContent = "KAAVUNGAL VAULT: SUSPENDED";
            DOM.systemStatusText.classList.remove("status-active");
        }
        if (DOM.scannerStatusText) {
            DOM.scannerStatusText.textContent = "ACOUSTIC RECEIVER: IDLE";
        }

        setViolaText("Acoustic stream suspended. Disengage safety when ready to resume authentication.");
    }

    function renderLevelState() {
        const levelConfig = window.BUREAUCRATIC_LEVELS[state.currentLevelIdx];
        if (!levelConfig) return;

        // Update Tumbler dots
        if (DOM.levelRackDots) {
            DOM.levelRackDots.forEach((dot, idx) => {
                dot.classList.remove("active", "completed");
                if (idx < state.currentLevelIdx) {
                    dot.classList.add("completed");
                } else if (idx === state.currentLevelIdx) {
                    dot.classList.add("active");
                }
            });
        }

        if (DOM.levelName) {
            DOM.levelName.textContent = levelConfig.sealName;
        }

        if (DOM.challengeTitle) {
            DOM.challengeTitle.textContent = `${levelConfig.title} — ${levelConfig.classification}`;
        }

        renderStepChecklist(levelConfig);
    }

    function renderStepChecklist(levelConfig) {
        if (!DOM.stepChecklist) return;
        DOM.stepChecklist.innerHTML = "";

        levelConfig.steps.forEach((step, idx) => {
            const item = document.createElement("div");
            item.className = "checklist-item";
            if (idx < state.currentStepIdx) {
                item.classList.add("done");
                item.innerHTML = `<span class="check-icon">✓</span> <span class="check-text">${step.verificationBadge}</span>`;
            } else if (idx === state.currentStepIdx) {
                item.classList.add("current");
                item.innerHTML = `<span class="check-icon">▶</span> <span class="check-text">${step.directive}</span>`;
            } else {
                item.classList.add("pending");
                item.innerHTML = `<span class="check-icon">○</span> <span class="check-text">${step.verificationBadge} (Pending)</span>`;
            }
            DOM.stepChecklist.appendChild(item);
        });
    }

    function loadCurrentStepTarget() {
        const levelConfig = window.BUREAUCRATIC_LEVELS[state.currentLevelIdx];
        if (!levelConfig) return;

        const step = levelConfig.steps[state.currentStepIdx];
        if (!step) return;

        if (DOM.targetSealSwara) {
            DOM.targetSealSwara.textContent = step.targetSwara;
        }
        if (DOM.target) {
            DOM.target.textContent = step.targetSwara;
        }
        if (DOM.directiveText) {
            DOM.directiveText.textContent = step.directive;
        }
        if (DOM.subDirectiveText) {
            DOM.subDirectiveText.textContent = step.subDirective;
        }

        audioDetector.setTargetSwara(step.targetSwara, 40);

        setViolaText(`[${levelConfig.sealName}] ${step.directive}`);
        renderStepChecklist(levelConfig);
    }

    function handleNoteConfirmed(match) {
        const levelConfig = window.BUREAUCRATIC_LEVELS[state.currentLevelIdx];
        if (!levelConfig) return;

        const currentStep = levelConfig.steps[state.currentStepIdx];
        if (!currentStep) return;

        playAcousticBeep(587.33, 0.15); // Reassuring acoustic chime

        // Flash target seal
        if (DOM.targetSealSwara) {
            DOM.targetSealSwara.classList.add("flash-confirm");
            setTimeout(() => DOM.targetSealSwara.classList.remove("flash-confirm"), 400);
        }

        // Bureaucratic log output
        const logMsg = currentStep.feedbackLog.join(" • ");
        setViolaText(logMsg);

        state.currentStepIdx++;

        // Check if level completed
        if (state.currentStepIdx >= levelConfig.steps.length) {
            completeLevel();
        } else {
            loadCurrentStepTarget();
        }
    }

    function completeLevel() {
        const levelConfig = window.BUREAUCRATIC_LEVELS[state.currentLevelIdx];
        playLevelClearedChord();

        setViolaText(levelConfig.completionMessage || "AUTHENTICATION VERIFIED.");

        state.currentLevelIdx++;
        state.currentStepIdx = 0;

        if (state.currentLevelIdx < window.BUREAUCRATIC_LEVELS.length) {
            // Next bureaucratic level
            setTimeout(() => {
                renderLevelState();
                loadCurrentStepTarget();
            }, 800);
        } else {
            // ALL 5 LEVELS COMPLETED! Trigger Level 5 Dramatic Tension & Climax!
            triggerLevel5ClimaxCountdown();
        }
    }

    function triggerLevel5ClimaxCountdown() {
        if (audioDetector) audioDetector.stop();
        state.isPlaying = false;

        if (DOM.vaultCountdownOverlay) {
            DOM.vaultCountdownOverlay.classList.remove("hidden");
            DOM.vaultCountdownOverlay.classList.add("active");
        }

        const countdownLines = [
            { text: "ALL FIVE MUSICAL SEALS VERIFIED.", count: "READY" },
            { text: "VAULT ACCESS GRANTED.", count: "ENGAGED" },
            { text: "UNLOCKING ROYAL VAULT...", count: "3" },
            { text: "DISENGAGING MONOLITHIC PINS...", count: "2" },
            { text: "PARTING GRANITE HYDRAULICS...", count: "1" },
            { text: "ACCESS GRANTED.", count: "OPEN" }
        ];

        let idx = 0;
        const interval = setInterval(() => {
            if (idx < countdownLines.length) {
                const item = countdownLines[idx];
                if (DOM.countdownStepText) DOM.countdownStepText.textContent = item.text;
                if (DOM.countdownDigits) DOM.countdownDigits.textContent = item.count;
                playAcousticBeep(300 + idx * 80, 0.1);
                idx++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    if (DOM.vaultCountdownOverlay) {
                        DOM.vaultCountdownOverlay.classList.remove("active");
                        DOM.vaultCountdownOverlay.classList.add("hidden");
                    }
                    // LAUNCH THE CLIMAX CUTSCENE VIDEO!
                    launchClimaxVideo();
                }, 700);
            }
        }, 750);
    }

    function launchClimaxVideo() {
        if (window.CutsceneManager) {
            window.CutsceneManager.playClimax(() => {
                showFinalParodyScreen();
            });
        } else {
            showFinalParodyScreen();
        }
    }

    function showFinalParodyScreen() {
        if (DOM.climaxChamberModal) {
            DOM.climaxChamberModal.classList.remove("hidden");
            DOM.climaxChamberModal.classList.add("active");
        }

        setViolaText("Human verified. Treasure unavailable. Congratulations. YOU SUCCESSFULLY UNLOCKED ABSOLUTELY NOTHING.");
    }

    function resetGameToBeginning() {
        if (DOM.climaxChamberModal) {
            DOM.climaxChamberModal.classList.remove("active");
            DOM.climaxChamberModal.classList.add("hidden");
        }
        if (DOM.finalNoteModal) {
            DOM.finalNoteModal.classList.add("hidden");
        }

        state.currentLevelIdx = 0;
        state.currentStepIdx = 0;
        state.isPlaying = false;
        state.startTime = null;

        if (audioDetector) audioDetector.stop();

        if (DOM.startBtn) DOM.startBtn.disabled = false;
        if (DOM.stopBtn) DOM.stopBtn.disabled = true;

        if (DOM.systemStatusText) {
            DOM.systemStatusText.textContent = "KAAVUNGAL VAULT: SEALED";
            DOM.systemStatusText.classList.remove("status-active");
        }
        if (DOM.scannerStatusText) {
            DOM.scannerStatusText.textContent = "ACOUSTIC RECEIVER: IDLE";
        }

        renderLevelState();
        if (DOM.targetSealSwara) DOM.targetSealSwara.textContent = "—";
        if (DOM.target) DOM.target.textContent = "—";
        if (DOM.directiveText) DOM.directiveText.textContent = "Press START to disengage safety and begin Level 1.";
        if (DOM.subDirectiveText) DOM.subDirectiveText.textContent = "Musical authentication required.";

        setViolaText("Vault re-sealed. Ready to authenticate when prompted.");
    }

    function renderTelemetry(t) {
        if (!t) return;

        if (DOM.detectedSwara) {
            DOM.detectedSwara.textContent = t.swara || "—";
            if (t.inTune) {
                DOM.detectedSwara.classList.add("text-success");
            } else {
                DOM.detectedSwara.classList.remove("text-success");
            }
        }

        if (DOM.frequency) {
            DOM.frequency.textContent = t.freq ? `${t.freq} Hz` : "— Hz";
        }
        if (DOM.visualizerFreq) {
            DOM.visualizerFreq.textContent = t.freq ? `${t.freq} Hz` : "— Hz";
        }

        if (DOM.confidence) {
            DOM.confidence.textContent = `${t.confidence}%`;
        }

        // Tuning Needle & Cents
        if (DOM.tuningNeedle) {
            const clampedCents = Math.max(-50, Math.min(50, t.cents || 0));
            // Needle position from 0% (left / -50c) to 100% (right / +50c)
            const needlePct = ((clampedCents + 50) / 100) * 100;
            DOM.tuningNeedle.style.left = `${needlePct}%`;
        }

        if (DOM.centsDeviationText) {
            if (t.swara) {
                const sign = t.cents > 0 ? "+" : "";
                DOM.centsDeviationText.textContent = `${sign}${t.cents}¢ (${t.inTune ? "IN TUNE" : (t.cents < 0 ? "FLAT" : "SHARP")})`;
                DOM.centsDeviationText.className = `cents-readout ${t.inTune ? "in-tune" : (Math.abs(t.cents) < 20 ? "near" : "off")}`;
            } else {
                DOM.centsDeviationText.textContent = "0¢ (AWAITING INPUT)";
                DOM.centsDeviationText.className = "cents-readout";
            }
        }

        // Hold Stability Progress Bar
        if (DOM.holdProgressBar) {
            const pct = Math.round((t.holdRatio || 0) * 100);
            DOM.holdProgressBar.style.width = `${pct}%`;
            if (pct >= 100) {
                DOM.holdProgressBar.classList.add("full");
            } else {
                DOM.holdProgressBar.classList.remove("full");
            }
        }
    }

    function renderWaveform(buffer) {
        if (!canvasCtx || !DOM.audioVisualizer) return;
        const width = DOM.audioVisualizer.width;
        const height = DOM.audioVisualizer.height;

        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.fillStyle = "rgba(10, 15, 20, 0.4)";
        canvasCtx.fillRect(0, 0, width, height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "#d4af37";
        canvasCtx.beginPath();

        const sliceWidth = width / buffer.length;
        let x = 0;

        for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i];
            const y = (v * height * 0.45) + (height / 2);
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        canvasCtx.stroke();
    }

    function setViolaText(msg) {
        if (DOM.violaText) {
            DOM.violaText.textContent = msg;
        }
    }

    function showMicError(msg) {
        if (DOM.micErrorBanner) {
            DOM.micErrorBanner.textContent = `⚠️ ${msg}`;
            DOM.micErrorBanner.classList.remove("hidden");
        }
        setViolaText(`SECURITY EXCEPTION: ${msg}`);
    }

    function playAcousticBeep(freq, duration) {
        try {
            if (!audioFeedbackCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                audioFeedbackCtx = new AudioCtx();
            }
            if (audioFeedbackCtx.state === "suspended") {
                audioFeedbackCtx.resume();
            }
            const osc = audioFeedbackCtx.createOscillator();
            const gain = audioFeedbackCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, audioFeedbackCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioFeedbackCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioFeedbackCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioFeedbackCtx.destination);
            osc.start();
            osc.stop(audioFeedbackCtx.currentTime + duration);
        } catch (e) {}
    }

    function playLevelClearedChord() {
        playAcousticBeep(440, 0.2);
        setTimeout(() => playAcousticBeep(554.37, 0.2), 100);
        setTimeout(() => playAcousticBeep(659.25, 0.35), 200);
    }

    // Auto-initialize on DOMContentLoaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.VioLockGame = {
        state,
        beginGameplay,
        abortGameplay,
        resetGameToBeginning,
        showFinalParodyScreen,
        triggerLevel5ClimaxCountdown
    };
})();
