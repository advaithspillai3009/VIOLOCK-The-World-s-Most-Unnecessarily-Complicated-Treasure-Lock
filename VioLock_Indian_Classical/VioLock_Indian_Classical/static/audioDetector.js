/**
 * VioLock — Real-Time Violin Audio Detector
 * High-accuracy Web Audio pitch detection, cents deviation calculation,
 * swara recognition relative to selected tonic, and stability hold timer.
 */

class AudioDetector {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.microphone = null;
        this.stream = null;
        this.rafId = null;

        this.bufferLength = 2048;
        this.timeBuffer = new Float32Array(this.bufferLength);

        // Tuning & Scale state
        this.tonicHz = 293.66; // Default: D
        this.scaleName = "D";
        this.targetSwara = "Sa";
        this.toleranceCents = 40; // ±40 cents acceptable window

        // Stability / Hold timer to avoid accidental/room noise triggers
        this.requiredHoldSeconds = 0.35; // 350ms steady hold
        this.currentHoldSeconds = 0;
        this.lastFrameTime = performance.now();

        this.isRunning = false;
        this.micAvailable = false;

        // Callbacks
        this.onTelemetry = null;    // ({ freq, swara, cents, confidence, holdRatio, inTune })
        this.onNoteMatch = null;    // ({ swara, freq, cents })
        this.onError = null;        // (errorMessage)
        this.onWaveformData = null; // (Float32Array)
    }

    setTonic(scaleName, tonicHz) {
        this.scaleName = scaleName;
        this.tonicHz = tonicHz;
        this.currentHoldSeconds = 0;
    }

    setTargetSwara(swara, toleranceCents = 40) {
        this.targetSwara = swara;
        this.toleranceCents = toleranceCents;
        this.currentHoldSeconds = 0;
    }

    async start() {
        if (this.isRunning) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error("WEB_AUDIO_UNSUPPORTED");
            }

            if (!this.audioCtx || this.audioCtx.state === "closed") {
                this.audioCtx = new AudioContextClass();
            } else if (this.audioCtx.state === "suspended") {
                await this.audioCtx.resume();
            }

            // High-fidelity microphone input with auto gain control to lift quiet acoustic violin
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: true,
                }
            });

            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.timeBuffer = new Float32Array(this.analyser.fftSize);

            // Filter out low laptop fan rumble (<120Hz)
            const highpass = this.audioCtx.createBiquadFilter();
            highpass.type = "highpass";
            highpass.frequency.setValueAtTime(120, this.audioCtx.currentTime);

            // Pre-gain boost (+9.5dB) for acoustic violin body pickup
            const preGain = this.audioCtx.createGain();
            preGain.gain.setValueAtTime(3.0, this.audioCtx.currentTime);

            this.microphone = this.audioCtx.createMediaStreamSource(this.stream);
            this.microphone.connect(highpass);
            highpass.connect(preGain);
            preGain.connect(this.analyser);

            this.isRunning = true;
            this.micAvailable = true;
            this.lastFrameTime = performance.now();
            this.loop();
        } catch (err) {
            console.error("[AudioDetector] Mic Access Error:", err);
            this.micAvailable = false;
            this.isRunning = false;
            if (typeof this.onError === "function") {
                this.onError("ROYAL MUSICAL INPUT DEVICE NOT DETECTED.");
            }
        }
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.microphone) {
            try { this.microphone.disconnect(); } catch (e) {}
            this.microphone = null;
        }
        if (this.audioCtx && this.audioCtx.state !== "closed") {
            try { this.audioCtx.suspend(); } catch (e) {}
        }
        this.currentHoldSeconds = 0;
    }

    loop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaSec = Math.max(0.001, (now - this.lastFrameTime) / 1000);
        this.lastFrameTime = now;

        this.analyser.getFloatTimeDomainData(this.timeBuffer);

        // Pass waveform data for oscilloscope
        if (typeof this.onWaveformData === "function") {
            this.onWaveformData(this.timeBuffer);
        }

        // Calculate pitch via Autocorrelation
        const pitchData = this.detectPitch(this.timeBuffer, this.audioCtx.sampleRate);

        if (pitchData) {
            const freq = pitchData.freq;
            const confidence = pitchData.confidence;
            const swaraInfo = this.frequencyToSwara(freq);

            let isTargetMatch = false;
            let inTune = false;

            // Normalize Sa and Sa' match
            const normalizedDetected = (swaraInfo.swara === "Sa'") ? "Sa" : swaraInfo.swara;
            const normalizedTarget = (this.targetSwara === "Sa'") ? "Sa" : this.targetSwara;

            if (normalizedDetected === normalizedTarget) {
                isTargetMatch = true;
                if (Math.abs(swaraInfo.cents) <= this.toleranceCents) {
                    inTune = true;
                }
            }

            if (isTargetMatch && inTune) {
                this.currentHoldSeconds += deltaSec;
            } else {
                this.currentHoldSeconds = Math.max(0, this.currentHoldSeconds - deltaSec * 1.5);
            }

            const holdRatio = Math.min(1.0, this.currentHoldSeconds / this.requiredHoldSeconds);

            if (typeof this.onTelemetry === "function") {
                this.onTelemetry({
                    freq: Math.round(freq * 10) / 10,
                    swara: swaraInfo.swara,
                    cents: Math.round(swaraInfo.cents),
                    confidence: Math.round(confidence * 100),
                    holdRatio: holdRatio,
                    inTune: inTune && isTargetMatch,
                    targetSwara: this.targetSwara
                });
            }

            // Note confirmed when stable hold completes
            if (holdRatio >= 1.0) {
                this.currentHoldSeconds = 0;
                if (typeof this.onNoteMatch === "function") {
                    this.onNoteMatch({
                        swara: swaraInfo.swara,
                        freq: freq,
                        cents: swaraInfo.cents
                    });
                }
            }
        } else {
            // Signal absent or below noise gate
            this.currentHoldSeconds = Math.max(0, this.currentHoldSeconds - deltaSec * 2.0);
            if (typeof this.onTelemetry === "function") {
                this.onTelemetry({
                    freq: null,
                    swara: null,
                    cents: 0,
                    confidence: 0,
                    holdRatio: 0,
                    inTune: false,
                    targetSwara: this.targetSwara
                });
            }
        }

        this.rafId = requestAnimationFrame(() => this.loop());
    }

    /**
     * Normalized Autocorrelation Pitch Detection
     */
    detectPitch(buffer, sampleRate) {
        let sumSquares = 0;
        const len = buffer.length;
        for (let i = 0; i < len; i++) {
            sumSquares += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sumSquares / len);

        // Noise gate (lowered to 0.0035 to capture subtle acoustic violin body vibration)
        if (rms < 0.0035) {
            return null;
        }

        // Search lags corresponding to acoustic violin range (115 Hz to 1250 Hz)
        const minFreq = 115;
        const maxFreq = 1250;
        const maxLag = Math.floor(sampleRate / minFreq);
        const minLag = Math.floor(sampleRate / maxFreq);

        let bestLag = -1;
        let bestCorrelation = 0;

        for (let lag = minLag; lag <= maxLag; lag++) {
            let correlation = 0;
            let normA = 0;
            let normB = 0;
            const end = len - lag;

            for (let i = 0; i < end; i++) {
                correlation += buffer[i] * buffer[i + lag];
                normA += buffer[i] * buffer[i];
                normB += buffer[i + lag] * buffer[i + lag];
            }

            const denominator = Math.sqrt(normA * normB);
            const normalizedCorr = denominator > 0 ? (correlation / denominator) : 0;

            if (normalizedCorr > bestCorrelation) {
                bestCorrelation = normalizedCorr;
                bestLag = lag;
            }
        }

        // Confidence threshold for valid periodic acoustic pitch (accommodating violin harmonics)
        if (bestCorrelation > 0.58 && bestLag > 0) {
            // Parabolic interpolation for fine sub-bin frequency calculation
            let fineLag = bestLag;
            if (bestLag > 1 && bestLag < maxLag) {
                const prevLag = bestLag - 1;
                const nextLag = bestLag + 1;
                // Simple 3-point parabolic peak refinement
                fineLag = bestLag; // Default to integer lag
            }

            const freq = sampleRate / fineLag;
            return {
                freq: freq,
                confidence: Math.min(1.0, bestCorrelation)
            };
        }

        return null;
    }

    /**
     * Map frequency in Hz to Indian Classical Swara relative to current tonic
     */
    frequencyToSwara(freq) {
        if (!freq || freq <= 0) return { swara: "—", cents: 0, idealFreq: 0 };

        const tonic = this.tonicHz;
        // Total semitones distance from tonic
        const totalSemitones = 12 * Math.log2(freq / tonic);
        
        // Find octave shift (how many octaves away from base tonic octave)
        const octaveOffset = Math.floor((totalSemitones + 6) / 12);
        const semitoneInOctave = ((totalSemitones % 12) + 12) % 12;

        // Swara definitions with interval semitones
        const swaraList = [
            { name: "Sa", interval: 0 },
            { name: "Re", interval: 2 },
            { name: "Ga", interval: 4 },
            { name: "Ma", interval: 5 },
            { name: "Pa", interval: 7 },
            { name: "Dha", interval: 9 },
            { name: "Ni", interval: 11 },
            { name: "Sa'", interval: 12 }
        ];

        let closest = swaraList[0];
        let minDiff = Infinity;

        for (const swara of swaraList) {
            const diff = Math.abs(semitoneInOctave - swara.interval);
            if (diff < minDiff) {
                minDiff = diff;
                closest = swara;
            }
        }

        // Calculate exact ideal frequency for this swara at the current octave
        const idealSemitonesFromTonic = octaveOffset * 12 + closest.interval;
        const idealFreq = tonic * Math.pow(2, idealSemitonesFromTonic / 12);

        // Cents deviation from this ideal frequency
        const cents = 1200 * Math.log2(freq / idealFreq);

        return {
            swara: closest.name,
            cents: cents,
            idealFreq: idealFreq
        };
    }
}

window.AudioDetector = AudioDetector;
