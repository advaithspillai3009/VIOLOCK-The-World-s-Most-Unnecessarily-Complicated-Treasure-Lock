let level = 1;
let currentLevelConfig = null;
let challenge = [];
let frequencies = [];
let currentIndex = 0;
let audioContext = null;
let analyser = null;
let microphone = null;
let stream = null;
let animationId = null;
let running = false;
let lastRegisteredAt = 0;
let detectedTimes = [];
let correctCents = [];
let rhythmDeltas = [];
let waveBuffer = null;
let pitchMatchStartTime = 0;
let holdAccumulatorMs = 0;
let lastFrameTime = performance.now();
let matchGraceTime = 0;
let wrongPitchStartTime = 0;
let lastWrongNoteTime = 0;
const REQUIRED_HOLD_MS = 220; // Sustained note required for registration

// Level mechanics state
let timerIntervalId = null;
let timerRemaining = 0;
let timerTotal = 0;
let memoryActive = false;
let memoryMasked = false;
let memoryTimerId = null;
let strikes = 0;

const SCALES = {
    "A": 220.00,
    "A#": 233.08,
    "B": 246.94,
    "C": 261.63,
    "C#": 277.18,
    "D": 293.66,
    "D#": 311.13,
    "E": 329.63,
    "F": 349.23,
    "F#": 369.99,
    "G": 392.00,
    "G#": 415.30
};

const INTERVALS = {
    "Sa": 0,
    "Re": 2,
    "Ga": 4,
    "Ma": 5,
    "Pa": 7,
    "Dha": 9,
    "Ni": 11,
    "Sa'": 12
};

let currentScale = localStorage.getItem("violock_scale") || "D";
let SWARAS = calculateSwarasForScale(currentScale);
const swaraNames = Object.keys(INTERVALS);

function calculateSwarasForScale(scaleName) {
    const tonicHz = SCALES[scaleName] || 293.66;
    const map = {};
    for (const [swara, semitones] of Object.entries(INTERVALS)) {
        map[swara] = Number((tonicHz * Math.pow(2, semitones / 12)).toFixed(2));
    }
    return map;
}

// =========================================================
// LEVEL VICTORY / SUCCESS SCREEN CELEBRATION AUDIOS & TEXT
// Randomly selects one of the 3 user audios upon completing each level,
// and sets the modal text to match the dialogue of the playing audio.
// =========================================================
const LEVEL_VICTORY_AUDIOS = [
    {
        id: "another_one",
        src: "/static/assets/another_one.mp3",
        tag: "DJ KHALED • WE THE BEST",
        art: "🔑🔊",
        headline: "ANOTHER ONE! AND ANOTHER ONE!",
        quote: "Another one. And another one. And another one. And another one. And another one.",
        subtext: "Major Key Alert! Another vault seal crushed. On to the next one!"
    },
    {
        id: "kbc_question",
        src: "/static/assets/kbc_question.mp3",
        tag: "KAUN BANEGA CROREPATI • KBC",
        art: "📺🔒",
        headline: "LOCK KIYA JAYE?!",
        quote: "Computer Mahoday, swara ko lock kiya jaye!",
        subtext: "7 കോടി! Your swara frequency has been officially locked into the royal safe!"
    },
    {
        id: "nee_scene_aada",
        src: "/static/assets/nee_scene_aada.m4a",
        tag: "MALAYALAM VIRAL MASS",
        art: "🔥🕶️",
        headline: "നീ വിഷയം ആടാ ഉവ്വേ... നീ സീൻ ആണ്!",
        quote: "Nee vishayam aada uvve... Nee scene aanu!",
        subtext: "Pure scene! The ancient Kaavungal guardians are left speechless by your violin mastery."
    }
];

let currentVictoryAudio = null;
let lastVictoryAudioIndex = -1;

function getRandomVictoryAudio() {
    let newIndex;
    if (LEVEL_VICTORY_AUDIOS.length === 1) return LEVEL_VICTORY_AUDIOS[0];
    do {
        newIndex = Math.floor(Math.random() * LEVEL_VICTORY_AUDIOS.length);
    } while (newIndex === lastVictoryAudioIndex);
    lastVictoryAudioIndex = newIndex;
    return LEVEL_VICTORY_AUDIOS[newIndex];
}

function playVictoryAudio(audioItem) {
    stopVictoryAudio();
    try {
        currentVictoryAudio = new Audio(audioItem.src);
        currentVictoryAudio.volume = 1.0;
        const p = currentVictoryAudio.play();
        if (p !== undefined) {
            p.catch(e => console.warn("[VioLock] Victory audio autoplay blocked or failed:", e));
        }
    } catch (e) {
        console.warn("[VioLock] Victory audio error:", e);
    }
}

function stopVictoryAudio() {
    if (currentVictoryAudio) {
        try {
            currentVictoryAudio.pause();
            currentVictoryAudio.currentTime = 0;
        } catch (e) {}
        currentVictoryAudio = null;
    }
}

let currentFailAudio = null;

function playFailAudio() {
    stopFailAudio();
    stopVictoryAudio();
    try {
        currentFailAudio = new Audio("/static/assets/task_fail.m4a");
        currentFailAudio.volume = 1.0;
        const p = currentFailAudio.play();
        if (p !== undefined) {
            p.catch(e => console.warn("[VioLock] Fail audio autoplay prevented:", e));
        }
    } catch (e) {
        console.warn("[VioLock] Fail audio error:", e);
    }
}

function stopFailAudio() {
    if (currentFailAudio) {
        try {
            currentFailAudio.pause();
            currentFailAudio.currentTime = 0;
        } catch (e) {}
        currentFailAudio = null;
    }
}

window.playVictoryAudio = playVictoryAudio;
window.stopVictoryAudio = stopVictoryAudio;
window.playFailAudio = playFailAudio;
window.stopFailAudio = stopFailAudio;
window.LEVEL_VICTORY_AUDIOS = LEVEL_VICTORY_AUDIOS;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const visualizerCanvas = document.getElementById("audioVisualizer");
const visualizerCtx = visualizerCanvas ? visualizerCanvas.getContext("2d") : null;

if (startBtn) startBtn.onclick = startChallenge;
if (stopBtn) stopBtn.onclick = stopChallenge;

// =========================================================
// CINEMATIC GRAPHIC NOVEL CUTSCENE BRIDGE
// =========================================================
const GameCutscene = {
    init() {
        if (window.ComicEngine) {
            window.ComicEngine.init();
            
            const replayBtn = document.getElementById("replayCutsceneBtn");
            if (replayBtn) {
                replayBtn.onclick = () => {
                    window.ComicEngine.playIntro(() => {
                        setViola("Ancient chamber unlocked. Sound the royal violin to clear Seal I.");
                    });
                };
            }

            // Auto-trigger animated graphic novel intro cutscene
            window.ComicEngine.playIntro(() => {
                setViola("Ancient chamber unlocked. Sound the royal violin to clear Seal I.");
            });
        }
    },
    startCutscene() {
        if (window.ComicEngine) {
            window.ComicEngine.playIntro(() => {
                setViola("Ancient chamber unlocked. Sound the royal violin to clear Seal I.");
            });
        }
    },
    endCutscene() {
        if (window.ComicEngine) {
            window.ComicEngine.skipCutscene();
        }
    }
};

// =========================================================
// AUDIO CHALLENGE CONTROLS
// =========================================================
async function startChallenge() {
    stopVictoryAudio();
    stopFailAudio();
    try {
        await loadChallenge();
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true // Enable AGC so laptop microphone adapts to acoustic instruments
            }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.2;

        waveBuffer = new Uint8Array(analyser.fftSize);

        microphone = audioContext.createMediaStreamSource(stream);

        // Acoustic Violin Pre-Processing Chain:
        // 1. High-pass filter at 120Hz to eliminate fan noise, AC hum, and desk thumps
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = "highpass";
        highPassFilter.frequency.setValueAtTime(120, audioContext.currentTime);

        // 2. Pre-amp software gain node (3.2x) to boost acoustic violin sound from laptop distance
        const preGain = audioContext.createGain();
        preGain.gain.setValueAtTime(3.2, audioContext.currentTime);

        microphone.connect(highPassFilter);
        highPassFilter.connect(preGain);
        preGain.connect(analyser);

        running = true;
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;

        const scanner = document.getElementById("scannerStatus");
        if (scanner) {
            scanner.classList.add("active");
            document.getElementById("scannerStatusText").textContent = "ACOUSTIC RECEIVER: ACTIVE";
        }
        const sysStatus = document.getElementById("systemStatusText");
        if (sysStatus) sysStatus.textContent = "DECRYPTING ANCIENT SEAL";

        // V.I.O.L.A. deadpan lore prompts
        if (level === 1) {
            setViola("Acoustic sensor calibrated to King Kaavungal's royal tonic. Demonstrate pure intonation of Sa.");
        } else if (level === 2) {
            setViola("Royal memory sequence projected. Commit the swaras to memory before the seal masks (Unlimited tries).");
        } else if (level === 3) {
            setViola("Royal archive sequence engaged. 6 ancient swaras require intonation from memory (No time pressure, unlimited tries).");
        } else if (level === 4) {
            setViola("Your Ga appears to be slightly questionable. Strict ±20 cents precision required.");
        } else if (level === 5) {
            setViola("All authentication parameters are now engaged. 30 seconds before hydraulic lockdown (Unlimited tries).");
        }

        detectLoop();
    } catch (err) {
        alert("Microphone access is required for live acoustic swara detection.");
        console.error(err);
    }
}

async function loadChallenge() {
    resetHudState();

    const response = await fetch(`/api/challenge/${level}?scale=${encodeURIComponent(currentScale)}`);
    const data = await response.json();
    currentLevelConfig = data;

    challenge = data.swaras;
    frequencies = data.frequencies;
    if (data.scale_swaras) {
        SWARAS = data.scale_swaras;
    } else {
        SWARAS = calculateSwarasForScale(currentScale);
    }
    currentIndex = 0;
    detectedTimes = [];
    correctCents = [];
    rhythmDeltas = [];
    pitchMatchStartTime = 0;
    holdAccumulatorMs = 0;
    matchGraceTime = 0;
    lastFrameTime = performance.now();
    wrongPitchStartTime = 0;
    lastWrongNoteTime = 0;

    const sealLabel = data.seal || `Seal ${level}: ${data.name}`;
    document.getElementById("levelName").textContent = sealLabel;

    const titles = {
        1: "PLAY: SA — The first seal recognizes only the purest swara",
        2: "MEMORIZE THE ROYAL SWARA SEQUENCE — Unlimited attempts permitted",
        3: "THE ROYAL ARCHIVE — Memorize the extended 6-swara sequence (No Timer)",
        4: "THE PERFECT SWARA — Rejecting even the slightest musical error (±20¢)",
        5: "FINAL VAULT AUTHENTICATION — All Protections Combined (30s Timer, Unlimited Tries)"
    };
    document.getElementById("challengeTitle").textContent = titles[level] || "Royal Seal Keypad: Intonate swaras in order";

    renderChallenge();
    updateProgress();
    updateLevelDots();

    document.getElementById("target").textContent = challenge[0];

    // Configure Level 5 Final Vault Authentication Box
    const lvl5Box = document.getElementById("finalVaultAuthBox");
    if (lvl5Box) {
        if (level === 5) {
            lvl5Box.classList.remove("hidden");
            const timeVal = document.getElementById("lvl5TimeVal");
            if (timeVal && data.time_limit) {
                timeVal.textContent = `${data.time_limit.toFixed(1)}s`;
            }
            const timeBar = document.getElementById("lvl5TimeBar");
            if (timeBar) timeBar.style.width = "100%";
        } else {
            lvl5Box.classList.add("hidden");
        }
    }

    // Configure level-specific HUD mechanics
    if (data.tolerance <= 20) {
        const precMeter = document.getElementById("precisionTuningMeter");
        if (precMeter) precMeter.classList.remove("hidden");
        updatePrecisionMeter(0, true, challenge[0]);
    }

    if (data.memory) {
        setupMemoryPhase(data.preview_seconds || 2.0);
    } else if (data.time_limit) {
        // Level 3 Time Attack (non-memory)
        const mechBar = document.getElementById("levelMechanicBar");
        const timerBox = document.getElementById("timerContainer");
        if (mechBar) mechBar.classList.remove("hidden");
        if (timerBox) timerBox.classList.remove("hidden");
        startTimer(data.time_limit);
    }
}

function renderChallenge() {
    const box = document.getElementById("challengeSequence");
    box.innerHTML = "";

    challenge.forEach((swara, i) => {
        const el = document.createElement("span");
        el.className = "swara-card";
        el.textContent = swara;
        el.dataset.index = i;
        if (i === currentIndex) el.classList.add("current");
        box.appendChild(el);
    });
}

function resetHudState() {
    stopTimer();
    if (memoryTimerId) {
        clearTimeout(memoryTimerId);
        memoryTimerId = null;
    }
    memoryActive = false;
    memoryMasked = false;
    strikes = 0;

    const mechanicBar = document.getElementById("levelMechanicBar");
    if (mechanicBar) mechanicBar.classList.add("hidden");

    const timerBox = document.getElementById("timerContainer");
    if (timerBox) timerBox.classList.add("hidden");

    const memBanner = document.getElementById("memoryPhaseBanner");
    if (memBanner) memBanner.classList.add("hidden");

    const strikesBox = document.getElementById("strikesBox");
    if (strikesBox) strikesBox.classList.add("hidden");

    const precisionMeter = document.getElementById("precisionTuningMeter");
    if (precisionMeter) precisionMeter.classList.add("hidden");

    const lvl5Box = document.getElementById("finalVaultAuthBox");
    if (lvl5Box) lvl5Box.classList.add("hidden");

    const timerDigits = document.getElementById("timerSeconds");
    if (timerDigits) timerDigits.classList.remove("warning");

    const tuningNeedle = document.getElementById("tuningNeedle");
    if (tuningNeedle) {
        tuningNeedle.style.left = "50%";
        tuningNeedle.classList.remove("flat", "sharp");
    }
    const centsText = document.getElementById("centsDeviationText");
    if (centsText) centsText.textContent = "0¢ (IN TUNE)";
}

function startTimer(seconds) {
    stopTimer();
    timerRemaining = seconds;
    timerTotal = seconds;

    const timerDigits = document.getElementById("timerSeconds");
    const timerBar = document.getElementById("timerProgressBar");
    if (timerDigits) {
        timerDigits.textContent = timerRemaining.toFixed(1);
        timerDigits.classList.remove("warning");
    }
    if (timerBar) timerBar.style.width = "100%";

    timerIntervalId = setInterval(() => {
        timerRemaining = Math.max(0, timerRemaining - 0.1);
        if (timerDigits) {
            timerDigits.textContent = timerRemaining.toFixed(1);
            if (timerRemaining <= 3.0) {
                timerDigits.classList.add("warning");
            } else {
                timerDigits.classList.remove("warning");
            }
        }
        if (timerBar) {
            const pct = Math.max(0, (timerRemaining / timerTotal) * 100);
            timerBar.style.width = `${pct}%`;
        }
        if (timerRemaining <= 0) {
            stopTimer();
            failChallenge("THE VAULT REJECTED YOUR PERFORMANCE", "Time expired before completing the royal swara sequence. Vault seal reset.");
        }
    }, 100);
}

function stopTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

function setupMemoryPhase(previewSec) {
    memoryActive = true;
    memoryMasked = false;
    strikes = 0;

    const mechBar = document.getElementById("levelMechanicBar");
    const memBanner = document.getElementById("memoryPhaseBanner");
    const memTitle = document.getElementById("memoryPhaseTitle");
    const memDesc = document.getElementById("memoryPhaseDesc");
    const memFill = document.getElementById("memoryCountdownFill");
    const strikesBox = document.getElementById("strikesBox");
    const strikesDisplay = document.getElementById("strikesDisplay");

    if (mechBar) mechBar.classList.remove("hidden");
    if (memBanner) memBanner.classList.remove("hidden");
    if (memTitle) memTitle.textContent = "MEMORIZE THE ROYAL SEQUENCE";
    if (memDesc) memDesc.textContent = `Sequence will hide in ${previewSec}s...`;

    if (strikesBox) {
        strikesBox.classList.remove("hidden");
        if (strikesDisplay) {
            const allowed = currentLevelConfig ? currentLevelConfig.max_strikes : null;
            if (allowed != null && allowed > 0) {
                strikesDisplay.textContent = `0 / ${allowed} MISTAKES (${allowed} TRIES ALLOWED)`;
                strikesDisplay.style.color = "#36f0a4";
            } else {
                strikesDisplay.textContent = "UNLIMITED TRIES";
                strikesDisplay.style.color = "#36f0a4";
            }
        }
    }

    if (memFill) {
        memFill.style.transition = "none";
        memFill.style.width = "100%";
        void memFill.offsetWidth; // force reflow
        memFill.style.transition = `width ${previewSec}s linear`;
        memFill.style.width = "0%";
    }

    if (memoryTimerId) clearTimeout(memoryTimerId);
    memoryTimerId = setTimeout(() => {
        maskMemorySequence();
    }, previewSec * 1000);
}

function maskMemorySequence() {
    memoryMasked = true;
    const memTitle = document.getElementById("memoryPhaseTitle");
    const memDesc = document.getElementById("memoryPhaseDesc");
    if (memTitle) memTitle.textContent = "SEQUENCE HIDDEN";
    if (memDesc) memDesc.textContent = "Target: ??? • Intonate from royal memory";

    const cards = document.querySelectorAll("#challengeSequence span.swara-card");
    cards.forEach((card, idx) => {
        if (idx >= currentIndex) {
            card.classList.add("hidden-memory");
            card.textContent = "?";
        }
    });

    document.getElementById("target").textContent = "???";
    setViola("Royal sequence hidden. Intonate the secret swaras from memory.");

    // If Level 5 (Timer + Memory), start countdown now
    if (currentLevelConfig && currentLevelConfig.time_limit) {
        const timerBox = document.getElementById("timerContainer");
        if (timerBox) timerBox.classList.remove("hidden");
        startTimer(currentLevelConfig.time_limit);
    }
}

function updatePrecisionMeter(cents, inTune, swaraName = "") {
    const meter = document.getElementById("precisionTuningMeter");
    if (!meter || meter.classList.contains("hidden")) return;

    const needle = document.getElementById("tuningNeedle");
    const readout = document.getElementById("centsDeviationText");

    const clampedCents = Math.max(-50, Math.min(50, cents));
    const needlePct = 50 + (clampedCents / 50) * 50;

    if (needle) {
        needle.style.left = `${needlePct}%`;
        needle.classList.remove("flat", "sharp");
        if (!inTune) {
            if (cents < 0) needle.classList.add("flat");
            else needle.classList.add("sharp");
        }
    }

    if (readout) {
        const prefix = swaraName ? `${swaraName}: ` : "";
        if (Math.abs(cents) <= 4) {
            readout.textContent = `${prefix}PERFECT (0¢)`;
            readout.style.color = "var(--emerald-neon)";
        } else if (cents < 0) {
            readout.textContent = `${prefix}${Math.abs(Math.round(cents))} CENTS FLAT`;
            readout.style.color = inTune ? "var(--emerald-neon)" : "#60a5fa";
        } else {
            readout.textContent = `${prefix}${Math.round(cents)} CENTS SHARP`;
            readout.style.color = inTune ? "var(--emerald-neon)" : "#f87171";
        }
    }
}

function detectLoop() {
    if (!running) return;

    drawVisualizer();

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const result = detectPitchYIN(buffer, audioContext.sampleRate);
    const now = performance.now();
    const deltaMs = Math.min(50, Math.max(1, now - (lastFrameTime || now)));
    lastFrameTime = now;
    let isMatchingTarget = false;

    if (result && result.frequency > 110 && result.frequency < 1250) {
        const swaraResult = frequencyToSwara(result.frequency);
        const targetSwara = challenge[currentIndex];
        const targetFreq = frequencies[currentIndex];
        const cents = centsFromTarget(result.frequency, targetFreq);
        const tolerance = (currentLevelConfig && currentLevelConfig.tolerance) ? currentLevelConfig.tolerance : 45;
        const inTune = Math.abs(cents) <= tolerance;

        document.getElementById("detectedSwara").textContent = swaraResult.name;
        document.getElementById("frequency").textContent = `${result.frequency.toFixed(1)} Hz`;
        const visualizerFreq = document.getElementById("visualizerFreq");
        if (visualizerFreq) visualizerFreq.textContent = `${result.frequency.toFixed(1)} Hz`;

        document.getElementById("confidence").textContent = `${Math.round(result.confidence * 100)}%`;
        document.getElementById("confidenceBar").style.width = `${Math.round(result.confidence * 100)}%`;

        updatePrecisionMeter(cents, inTune, swaraResult.name);

        // Update Level 5 Final Vault telemetry matrix if on Level 5
        if (level === 5) {
            const memVal = document.getElementById("lvl5MemVal");
            const pitchVal = document.getElementById("lvl5PitchVal");
            const pitchBar = document.getElementById("lvl5PitchBar");
            const rhythmVal = document.getElementById("lvl5RhythmVal");
            const rhythmBar = document.getElementById("lvl5RhythmBar");
            const consVal = document.getElementById("lvl5ConsistencyVal");
            const consBar = document.getElementById("lvl5ConsistencyBar");
            const timeVal = document.getElementById("lvl5TimeVal");
            const timeBar = document.getElementById("lvl5TimeBar");

            if (memVal) memVal.textContent = memoryMasked ? "MASKED (RECALL)" : "ARMED (PREVIEW)";
            if (pitchVal) pitchVal.textContent = `${Math.abs(Math.round(cents))}¢ (${inTune ? "IN TUNE" : "OUT"})`;
            if (pitchBar) pitchBar.style.width = `${Math.max(10, Math.min(100, Math.round(100 - Math.abs(cents) * 2)))}%`;
            if (timeVal) timeVal.textContent = `${timerRemaining.toFixed(1)}s`;
            if (timeBar && timerTotal) timeBar.style.width = `${Math.max(0, (timerRemaining / timerTotal) * 100)}%`;
            if (rhythmVal && rhythmDeltas.length) {
                const rScore = Math.max(50, Math.min(100, Math.round(100 - average(rhythmDeltas) * 30)));
                rhythmVal.textContent = `${rScore}%`;
                if (rhythmBar) rhythmBar.style.width = `${rScore}%`;
            }
            if (consVal && correctCents.length) {
                const cScore = Math.max(50, Math.min(100, Math.round(100 - average(correctCents) * 1.5)));
                consVal.textContent = `${cScore}%`;
                if (consBar) consBar.style.width = `${cScore}%`;
            }
        }

        // If in memory preview mode, do not register or penalize notes until sequence is masked
        if (memoryActive && !memoryMasked) {
            animationId = requestAnimationFrame(detectLoop);
            return;
        }

        if (currentIndex < challenge.length) {
            if (!memoryActive || !memoryMasked) {
                document.getElementById("target").textContent = targetSwara;
            }

            const isSameSwara = (swaraResult.name === targetSwara) || 
                                (targetSwara === "Sa'" && swaraResult.name === "Sa") ||
                                (targetSwara === "Sa" && swaraResult.name === "Sa'");

            if (isSameSwara && inTune && result.confidence >= 0.60) {
                isMatchingTarget = true;
                matchGraceTime = now;
                wrongPitchStartTime = 0;

                holdAccumulatorMs += deltaMs;
                const percent = Math.min(100, Math.round((holdAccumulatorMs / REQUIRED_HOLD_MS) * 100));

                const currentCard = document.querySelector("#challengeSequence span.swara-card.current");
                if (currentCard) {
                    currentCard.style.setProperty("--hold-progress", `${percent}%`);
                }

                if (holdAccumulatorMs >= REQUIRED_HOLD_MS) {
                    registerSwara(cents);
                    holdAccumulatorMs = 0;
                    pitchMatchStartTime = 0;
                }
            } else if (memoryActive && memoryMasked) {
                // Wrong note evaluation during memory phase
                if (result.confidence >= 0.68) {
                    if (!wrongPitchStartTime) {
                        wrongPitchStartTime = now;
                    }

                    const wrongElapsed = now - wrongPitchStartTime;
                    if (wrongElapsed >= REQUIRED_HOLD_MS && (now - lastWrongNoteTime > 900)) {
                        strikes++;
                        lastWrongNoteTime = now;
                        wrongPitchStartTime = 0;

                        const maxStrikes = currentLevelConfig ? currentLevelConfig.max_strikes : null;
                        const strikesDisplay = document.getElementById("strikesDisplay");
                        if (strikesDisplay) {
                            if (maxStrikes != null && maxStrikes > 0) {
                                strikesDisplay.textContent = `${strikes} / ${maxStrikes} MISTAKES`;
                                strikesDisplay.style.color = strikes >= maxStrikes ? "#ef4444" : "#f59e0b";
                            } else {
                                strikesDisplay.textContent = `MISTAKES: ${strikes} (UNLIMITED TRIES)`;
                                strikesDisplay.style.color = "#f59e0b";
                            }
                        }

                        const curCard = document.querySelector("#challengeSequence span.swara-card.current");
                        if (curCard) {
                            curCard.classList.add("shake-error");
                            setTimeout(() => curCard.classList.remove("shake-error"), 450);
                        }

                        if (maxStrikes != null && maxStrikes > 0) {
                            const remaining = Math.max(0, maxStrikes - strikes);
                            setViola(`INCORRECT SWARA: Sensed ${swaraResult.name}. Mistake ${strikes}/${maxStrikes} (${remaining} tries remaining).`);

                            if (strikes >= maxStrikes) {
                                failChallenge("INCORRECT SWARA", `The royal lock rejected your performance. All ${maxStrikes} attempts exhausted. Sequence reset.`);
                            }
                        } else {
                            setViola(`INCORRECT SWARA: Sensed ${swaraResult.name}. Try again (Unlimited tries).`);
                        }
                    }
                }
            }
        }
    } else {
        document.getElementById("detectedSwara").textContent = "—";
        const visualizerFreq = document.getElementById("visualizerFreq");
        if (visualizerFreq) visualizerFreq.textContent = "— Hz";
        document.getElementById("confidence").textContent = "0%";
        document.getElementById("confidenceBar").style.width = "0%";
    }

    if (!isMatchingTarget) {
        // Leaky integrator with 140ms grace buffer for bow reversals / vibrato
        if (now - matchGraceTime > 140) {
            holdAccumulatorMs = Math.max(0, holdAccumulatorMs - deltaMs * 1.5);
        }
        pitchMatchStartTime = 0;
        const currentCard = document.querySelector("#challengeSequence span.swara-card.current");
        if (currentCard) {
            const percent = Math.min(100, Math.round((holdAccumulatorMs / REQUIRED_HOLD_MS) * 100));
            currentCard.style.setProperty("--hold-progress", `${percent}%`);
        }
    }

    animationId = requestAnimationFrame(detectLoop);
}

function drawVisualizer() {
    if (!visualizerCtx || !analyser || !waveBuffer) return;

    analyser.getByteTimeDomainData(waveBuffer);

    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;

    visualizerCtx.fillStyle = "#070d14";
    visualizerCtx.fillRect(0, 0, width, height);

    visualizerCtx.strokeStyle = "rgba(42, 60, 80, 0.4)";
    visualizerCtx.lineWidth = 1;
    visualizerCtx.beginPath();
    visualizerCtx.moveTo(0, height / 2);
    visualizerCtx.lineTo(width, height / 2);
    visualizerCtx.stroke();

    for (let x = 50; x < width; x += 60) {
        visualizerCtx.beginPath();
        visualizerCtx.moveTo(x, 0);
        visualizerCtx.lineTo(x, height);
        visualizerCtx.stroke();
    }

    visualizerCtx.lineWidth = 2.2;
    visualizerCtx.strokeStyle = "#36f0a4";
    visualizerCtx.shadowBlur = 8;
    visualizerCtx.shadowColor = "#36f0a4";

    visualizerCtx.beginPath();
    const sliceWidth = (width * 1.0) / waveBuffer.length;
    let x = 0;

    for (let i = 0; i < waveBuffer.length; i++) {
        const v = waveBuffer[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
            visualizerCtx.moveTo(x, y);
        } else {
            visualizerCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }

    visualizerCtx.lineTo(width, height / 2);
    visualizerCtx.stroke();
    visualizerCtx.shadowBlur = 0;
}

function registerSwara(cents) {
    holdAccumulatorMs = 0;
    pitchMatchStartTime = 0;
    const now = performance.now();

    if (now - lastRegisteredAt < 450) return;

    if (currentLevelConfig && currentLevelConfig.rhythm && detectedTimes.length > 0) {
        const gap = (now - detectedTimes[detectedTimes.length - 1]) / 1000;
        const targetGap = currentLevelConfig.target_gap || 1.2;
        rhythmDeltas.push(Math.abs(gap - targetGap));
    }

    lastRegisteredAt = now;
    detectedTimes.push(now);
    correctCents.push(Math.abs(cents));

    const oldIndex = currentIndex;
    currentIndex++;

    const items = document.querySelectorAll("#challengeSequence span.swara-card");
    if (items[oldIndex]) {
        items[oldIndex].classList.remove("current", "hidden-memory");
        items[oldIndex].classList.add("done");
        items[oldIndex].textContent = challenge[oldIndex];
        items[oldIndex].style.setProperty("--hold-progress", "0%");
    }

    if (currentIndex < challenge.length) {
        if (items[currentIndex]) {
            items[currentIndex].classList.add("current");
        }
        if (memoryActive && memoryMasked) {
            document.getElementById("target").textContent = "???";
        } else {
            document.getElementById("target").textContent = challenge[currentIndex];
        }
        const nextTargetDesc = (memoryActive && memoryMasked) ? "???" : challenge[currentIndex];
        setViola(`Swara accepted: ${challenge[oldIndex]}. Aligning next pin: ${nextTargetDesc}.`);
        updateProgress();
    } else {
        updateProgress();
        finishLevel();
    }
}

function frequencyToSwara(freq) {
    let closest = swaraNames[0];
    let best = Infinity;

    for (const swara of swaraNames) {
        const cents = Math.abs(centsFromTarget(freq, SWARAS[swara]));
        if (cents < best) {
            best = cents;
            closest = swara;
        }
    }

    return { name: closest, cents: best };
}

function centsFromTarget(freq, target) {
    let cents = 1200 * Math.log2(freq / target);
    return ((cents + 600) % 1200 + 1200) % 1200 - 600;
}

function updateProgress() {
    const percent = challenge.length
        ? Math.round((currentIndex / challenge.length) * 100)
        : 0;

    document.getElementById("progressText").textContent =
        `${currentIndex} / ${challenge.length} pins matched`;
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressBar").style.width = `${percent}%`;
}

function updateLevelDots() {
    document.querySelectorAll(".tumbler-dot").forEach(dot => {
        const dotLevel = Number(dot.dataset.level);
        dot.classList.toggle("active", dotLevel === level);
        dot.classList.toggle("cleared", dotLevel < level);
    });
}

function finishLevel() {
    stopAudioOnly();
    stopTimer();
    if (memoryTimerId) clearTimeout(memoryTimerId);

    const avgCents = correctCents.length ? average(correctCents) : 15;
    const pitchScore = Math.max(70, Math.min(99, Math.round(100 - avgCents * 1.5)));

    let rhythmScore = 100;
    if (currentLevelConfig && currentLevelConfig.rhythm && rhythmDeltas.length) {
        const avgGapDev = average(rhythmDeltas);
        rhythmScore = Math.max(70, Math.min(99, Math.round(100 - avgGapDev * 30)));
    } else if (level >= 3) {
        rhythmScore = Math.min(99, 86 + Math.floor(Math.random() * 9));
    }

    const timingScore = (currentLevelConfig && currentLevelConfig.time_limit)
        ? Math.min(99, Math.max(80, Math.round(74 + (timerRemaining / (currentLevelConfig.time_limit || 30.0)) * 24)))
        : Math.min(99, 90 + Math.floor(Math.random() * 8));
    const consistencyScore = Math.min(
        99,
        Math.round(82 + (correctCents.length / challenge.length) * 16)
    );

    const finalSecurityScore = Math.min(9999, Math.max(9100, Math.round(
        8800 + pitchScore * 5.2 + rhythmScore * 3.4 + timingScore * 2.1 + consistencyScore * 1.4 + (Math.random() * 40)
    )));

    document.getElementById("pitchStat").textContent = `${pitchScore}%`;
    document.getElementById("rhythmStat").textContent = `${rhythmScore}%`;
    document.getElementById("consistencyStat").textContent = `${consistencyScore}%`;

    const scanner = document.getElementById("scannerStatus");
    if (scanner) {
        scanner.classList.remove("active");
        document.getElementById("scannerStatusText").textContent = "SEAL BREACHED";
    }

    if (level < 5) {
        showLevelCompleteModal(pitchScore, rhythmScore, consistencyScore);
    } else {
        const sysStatus = document.getElementById("systemStatusText");
        if (sysStatus) sysStatus.textContent = "AUTHENTICATION SUCCESSFUL";
        setViola("AUTHENTICATION SUCCESSFUL. Monolithic lock disengaged. VAULT UNLOCKED.");

        const targetElem = document.getElementById("target");
        if (targetElem) targetElem.textContent = "VAULT UNLOCKED";

        setTimeout(() => {
            if (sysStatus) sysStatus.textContent = "VAULT UNLOCKED";
            startClimaxSequence(pitchScore, rhythmScore, timingScore, consistencyScore, finalSecurityScore);
        }, 1200);
    }
}

function showLevelCompleteModal(pitch, rhythm, consistency) {
    const modal = document.getElementById("levelCompleteModal");
    const memeContainer = document.getElementById("memeContainer");

    const lvlName = currentLevelConfig ? currentLevelConfig.seal : `SEAL ${level}`;
    const successTitles = {
        1: "SWARA ACCEPTED",
        2: "MEMORY SEAL ACCEPTED",
        3: "ROYAL ARCHIVE UNLOCKED",
        4: "PRECISION SEAL ACCEPTED"
    };
    document.getElementById("modalLevelTitle").textContent = successTitles[level] || `${lvlName} UNLOCKED`;
    document.getElementById("modalPitchScore").textContent = `${pitch}%`;
    document.getElementById("modalIntonationScore").textContent = pitch >= 88 ? "Virtuoso" : "Passable";
    document.getElementById("modalNextLevel").textContent = `Seal ${level + 1}`;

    // Stop any playing fail audio and play victory audio
    stopFailAudio();
    const victory = getRandomVictoryAudio();
    playVictoryAudio(victory);

    // Update text on success screen to match the playing audio
    if (memeContainer) {
        memeContainer.innerHTML = `
            <div class="audio-now-playing-pill">
                <span class="audio-pulse-dot"></span>
                <span>NOW PLAYING: ${victory.tag}</span>
                <span class="victory-audio-waveform">
                    <span></span><span></span><span></span><span></span>
                </span>
            </div>
            <div class="meme-art">${victory.art}</div>
            <h4 class="meme-headline" style="color: #ffd700; font-size: 19px; font-weight: 800; letter-spacing: 0.5px;">
                "${victory.headline}"
            </h4>
            <p class="meme-punchline" style="font-size: 14px; color: #f1f5f9; font-weight: 600; margin-top: 6px;">
                <span style="color: #fbbf24; font-style: italic;">"${victory.quote}"</span>
                <br>
                <span style="color: #94a3b8; font-size: 12px; font-weight: 400; display: inline-block; margin-top: 4px;">
                    ${victory.subtext}
                </span>
            </p>
        `;
    }

    setViola(`Seal ${level} disengaged. Review your intonation clearance and proceed to the next seal.`);
    if (modal) modal.classList.remove("hidden");

    const proceedBtn = document.getElementById("proceedBtn");
    if (proceedBtn) {
        proceedBtn.onclick = () => {
            stopVictoryAudio();
            stopFailAudio();
            modal.classList.add("hidden");
            level++;
            updateLevelDots();
            startChallenge();
        };
    }
}

function failChallenge(title, desc) {
    stopVictoryAudio();
    stopAudioOnly();
    stopTimer();
    if (memoryTimerId) clearTimeout(memoryTimerId);

    // Play viral failure roast audio
    playFailAudio();

    const modal = document.getElementById("challengeFailModal");
    const failTitle = document.getElementById("failTitle");
    const failDesc = document.getElementById("failDesc");
    const retryBtn = document.getElementById("retryBtn");

    if (failTitle) failTitle.textContent = title;
    if (failDesc) failDesc.textContent = desc;

    const scanner = document.getElementById("scannerStatus");
    if (scanner) {
        scanner.classList.remove("active");
        document.getElementById("scannerStatusText").textContent = "AUTHENTICATION FAILED";
    }

    setViola(`Verification failed: ${title}. Re-engage to retry seal.`);
    if (modal) modal.classList.remove("hidden");

    if (retryBtn) {
        retryBtn.onclick = () => {
            stopFailAudio();
            modal.classList.add("hidden");
            startChallenge();
        };
    }
}

// =========================================================
// THE GRAND CLIMAX & ANCIENT NOTE REVEAL CONTROLLER
function resetToLevel1() {
    stopVictoryAudio();
    stopFailAudio();
    level = 1;
    updateLevelDots();
    resetHudState();

    document.getElementById("challengeSequence").innerHTML = `
        <div class="empty-state">
            <div class="safe-dial-placeholder">⚙</div>
            <p>Press <b>DISENGAGE SAFETY / START</b> to activate acoustic microphone sensor</p>
        </div>
    `;
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    document.getElementById("challengeTitle").textContent = "Initialize safe sensors to unlock";
    document.getElementById("levelName").textContent = "Seal I: The First Swara";
    const sysStatus = document.getElementById("systemStatusText");
    if (sysStatus) sysStatus.textContent = "KAAVUNGAL VAULT: SEALED";
    setViola("Vault reset and re-sealed. Ready for your next verification challenge.");
}

function startClimaxSequence(pitch, rhythm, timing, consistency, finalScore) {
    stopAudioOnly();
    stopTimer();

    // Trigger screen rumble effect
    document.body.classList.add("rumbling");
    setTimeout(() => {
        document.body.classList.remove("rumbling");
    }, 1800);

    // Trigger Comic Graphic Novel Climax Sequence (Panels 1 to 7)
    if (window.ComicEngine) {
        window.ComicEngine.playClimax({ pitch, rhythm, timing, consistency, finalScore }, () => {
            resetToLevel1();
        });
        return;
    }

    const climaxModal = document.getElementById("climaxChamberModal");
    if (!climaxModal) return;

    climaxModal.classList.remove("hidden");

    function setClimaxStep(stepId) {
        document.querySelectorAll(".climax-step").forEach(step => {
            step.classList.remove("active");
        });
        const targetStep = document.getElementById(stepId);
        if (targetStep) targetStep.classList.add("active");
    }

    // Step 1: Door Opens
    setClimaxStep("climaxStepDoor");
    setViola("All 5 acoustic seals shattered. The ancient monolithic granite gates are parting.");

    // Step 1 -> Step 2
    const enterTreasuryBtn = document.getElementById("enterTreasuryBtn");
    if (enterTreasuryBtn) {
        enterTreasuryBtn.onclick = () => {
            setClimaxStep("climaxStepEmpty");
            setViola("Scanning subterranean hall... Visual anomaly detected in central treasury.");
        };
    }

    // Step 2 -> Step 3
    const inspectNoteBtn = document.getElementById("inspectNoteBtn");
    if (inspectNoteBtn) {
        inspectNoteBtn.onclick = () => {
            setClimaxStep("climaxStepNote");
            setViola("Parchment document retrieved from pedestal. Awaiting spectral scan.");
        };
    }

    // Step 3 -> Step 4
    const scanNoteBtn = document.getElementById("scanNoteBtn");
    if (scanNoteBtn) {
        scanNoteBtn.onclick = () => {
            setClimaxStep("climaxStepAnalysis");
            runViolaForensicsScan(pitch, rhythm, timing, consistency, finalScore);
        };
    }
}

function runViolaForensicsScan(pitch, rhythm, timing, consistency, finalScore) {
    const scanBar = document.getElementById("violaScanBar");
    const scanPct = document.getElementById("violaScanPercent");
    const scanLog = document.getElementById("violaScanLog");
    const viewFinalAuditBtn = document.getElementById("viewFinalAuditBtn");

    if (scanBar) scanBar.style.width = "0%";
    if (scanPct) scanPct.textContent = "0%";
    if (viewFinalAuditBtn) viewFinalAuditBtn.classList.add("hidden");

    scanLog.innerHTML = `<div class="log-line">> INITIALIZING SPECTROMETRY ON PARCHMENT FIBERS...</div>`;

    const stages = [
        { pct: 12, log: "> ANALYSING HISTORICAL DOCUMENT... 12%" },
        { pct: 37, log: "> DOCUMENT AUTHENTICATED. 37% [ANCIENT ROYAL EZHUKOYICKAL SEAL VERIFIED]" },
        { pct: 68, log: "<span class='log-line highlight'>> TREASURE STATUS: REMOVED (ESTIMATED THEFT DATE: CENTURIES AGO)</span>" },
        { pct: 100, log: "<span class='log-line danger'>> THE EZHUKOYICKAL KING TOOK THE TREASURE.</span>" },
        { pct: 100, log: "> You spent all five levels unlocking a vault... that was already empty." }
    ];

    let stepIndex = 0;

    function nextScanStep() {
        if (stepIndex < stages.length) {
            const current = stages[stepIndex];
            if (scanBar) scanBar.style.width = `${current.pct}%`;
            if (scanPct) scanPct.textContent = `${current.pct}%`;
            
            const line = document.createElement("div");
            line.className = "log-line";
            line.innerHTML = current.log;
            scanLog.appendChild(line);
            scanLog.scrollTop = scanLog.scrollHeight;

            stepIndex++;
            setTimeout(nextScanStep, 800);
        } else {
            if (viewFinalAuditBtn) viewFinalAuditBtn.classList.remove("hidden");
            setViola("Human verified. Treasure unavailable. System considers this outcome entirely disappointing.");
        }
    }

    setTimeout(nextScanStep, 600);

    if (viewFinalAuditBtn) {
        viewFinalAuditBtn.onclick = () => {
            showFinalParodyResults(pitch, rhythm, timing, consistency, finalScore);
        };
    }
}

function showFinalParodyResults(pitch, rhythm, timing, consistency, finalScore) {
    document.querySelectorAll(".climax-step").forEach(step => step.classList.remove("active"));
    const resultsStep = document.getElementById("climaxStepResults");
    if (resultsStep) resultsStep.classList.add("active");

    const sysStatus = document.getElementById("systemStatusText");
    if (sysStatus) sysStatus.textContent = "VAULT CRACKED • TREASURE: 0";

    const pScore = document.getElementById("finalPitchScore");
    if (pScore) pScore.textContent = `${pitch}%`;
    const rScore = document.getElementById("finalRhythmScore");
    if (rScore) rScore.textContent = `${rhythm}%`;
    const tScore = document.getElementById("finalTimingScore");
    if (tScore) tScore.textContent = `${timing}%`;
    const cScore = document.getElementById("finalConsistencyScore");
    if (cScore) cScore.textContent = `${consistency}%`;

    const replayBtn = document.getElementById("replayQuestBtn");
    if (replayBtn) {
        replayBtn.onclick = () => {
            const climaxModal = document.getElementById("climaxChamberModal");
            if (climaxModal) climaxModal.classList.add("hidden");
            level = 1;
            updateLevelDots();
            resetHudState();

            document.getElementById("challengeSequence").innerHTML = `
                <div class="empty-state">
                    <div class="safe-dial-placeholder">⚙</div>
                    <p>Press <b>DISENGAGE SAFETY / START</b> to activate acoustic microphone sensor</p>
                </div>
            `;
            if (startBtn) startBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;
            document.getElementById("challengeTitle").textContent = "Initialize safe sensors to unlock";
            document.getElementById("levelName").textContent = "Seal I: The First Swara";
            if (sysStatus) sysStatus.textContent = "KAAVUNGAL VAULT: SEALED";
            setViola("Vault reset and re-sealed. Ready for your next verification challenge.");
        };
    }
}

function stopChallenge() {
    running = false;
    cancelAnimationFrame(animationId);
    stopAudioOnly();
    resetHudState();

    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;

    const scanner = document.getElementById("scannerStatus");
    if (scanner) {
        scanner.classList.remove("active");
        document.getElementById("scannerStatusText").textContent = "ACOUSTIC RECEIVER: IDLE";
    }

    setViola("Clearance aborted. V.I.O.L.A. has paused tumbler evaluation.");
}

function stopAudioOnly() {
    running = false;
    cancelAnimationFrame(animationId);

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    analyser = null;
    microphone = null;
}

function setViola(text) {
    const el = document.getElementById("violaText");
    if (el) el.textContent = text;
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// YIN Pitch Detection Algorithm optimized for acoustic violin timbre
function detectPitchYIN(buffer, sampleRate) {
    const threshold = 0.22;
    const minFreq = 115;
    const maxFreq = 1250;
    const minTau = Math.floor(sampleRate / maxFreq);
    const maxTau = Math.min(Math.floor(sampleRate / minFreq), buffer.length - 2);

    let rms = 0;
    for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / buffer.length);
    // Lower noise floor gate to 0.0035 to capture delicate acoustic violin body resonance
    if (rms < 0.0035) return null;

    const diff = new Float32Array(maxTau + 1);
    for (let tau = minTau; tau <= maxTau; tau++) {
        let sum = 0;
        for (let i = 0; i < buffer.length - tau; i++) {
            const d = buffer[i] - buffer[i + tau];
            sum += d * d;
        }
        diff[tau] = sum;
    }

    const cmnd = new Float32Array(maxTau + 1);
    cmnd[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau <= maxTau; tau++) {
        runningSum += diff[tau];
        cmnd[tau] = diff[tau] * tau / (runningSum || 1);
    }

    let tauEstimate = -1;
    let minCmndVal = 999;
    let minCmndTau = -1;

    for (let tau = minTau; tau <= maxTau; tau++) {
        if (cmnd[tau] < minCmndVal) {
            minCmndVal = cmnd[tau];
            minCmndTau = tau;
        }
        if (cmnd[tau] < threshold) {
            while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) tau++;
            tauEstimate = tau;
            break;
        }
    }

    // Fallback if violin bow friction/harmonics prevent dip below strict 0.22:
    if (tauEstimate === -1) {
        if (minCmndVal < 0.38 && minCmndTau !== -1) {
            tauEstimate = minCmndTau;
        } else {
            return null;
        }
    }

    const confidence = Math.max(0, Math.min(1, 1 - cmnd[tauEstimate]));
    const betterTau = parabolicInterpolation(cmnd, tauEstimate);
    const frequency = sampleRate / betterTau;

    return { frequency, confidence };
}

function parabolicInterpolation(values, index) {
    if (index <= 1 || index >= values.length - 1) return index;

    const x0 = values[index - 1];
    const x1 = values[index];
    const x2 = values[index + 1];

    const denom = 2 * (2 * x1 - x2 - x0);
    if (!denom) return index;

    return index + (x2 - x0) / denom;
}

// Scale / Tonic Management
function initScaleSelector() {
    const scaleSelect = document.getElementById("scaleSelect");
    if (scaleSelect) {
        scaleSelect.value = currentScale;
        scaleSelect.onchange = () => {
            applyScale(scaleSelect.value, true);
        };
    }
    applyScale(currentScale, false);
}

function applyScale(newScale, notify = true) {
    if (!SCALES[newScale]) return;
    currentScale = newScale;
    localStorage.setItem("violock_scale", currentScale);
    SWARAS = calculateSwarasForScale(currentScale);

    const tonicHz = SCALES[currentScale];
    const noteEl = document.getElementById("displayTonicNote");
    const freqEl = document.getElementById("displayTonicFreq");
    const heroText = document.getElementById("heroTonicText");
    const selectEl = document.getElementById("scaleSelect");

    if (noteEl) noteEl.textContent = currentScale;
    if (freqEl) freqEl.textContent = `${tonicHz.toFixed(2)} Hz`;
    if (heroText) heroText.textContent = `Sa (${currentScale})`;
    if (selectEl && selectEl.value !== currentScale) selectEl.value = currentScale;

    if (challenge && challenge.length) {
        frequencies = challenge.map(s => SWARAS[s]);
    }

    if (notify) {
        setViola(`Royal tonic re-tuned to ${currentScale} (${tonicHz.toFixed(2)} Hz). Acoustic sensor adjusted.`);
    }
}

// Generate subtle ancient ember particles
function initAmbientParticles() {
    const container = document.getElementById("ambientParticles");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement("div");
        particle.className = "ember-particle";
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${4 + Math.random() * 6}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(particle);
    }
}

// Initialize on page load
GameCutscene.init();
initScaleSelector();
initAmbientParticles();

const devParams = new URLSearchParams(window.location.search);
if (devParams.has("level")) {
    level = parseInt(devParams.get("level"), 10) || 1;
    setTimeout(() => {
        loadChallenge();
    }, 200);
}
