/**
 * VioLock — Bureaucratic Security Levels Configuration
 * 5 Over-Engineered, Hilariously Redundant Authentication Protocols.
 */

const BUREAUCRATIC_LEVELS = [
    {
        id: 1,
        levelNumber: 1,
        title: "LEVEL 1: INITIAL SWARA VERIFICATION",
        sealName: "SEAL 01: IDENTITY COMMENCEMENT",
        classification: "STANDARD CLEARANCE PROTOCOL",
        purpose: "Basic identity signal establishment",
        description: "Intonate tonic swara [Sa] to register biometric acoustic vibration.",
        steps: [
            {
                stepIndex: 1,
                targetSwara: "Sa",
                directive: "INTONATE TONIC SWARA [Sa] TO ESTABLISH ACOUSTIC IDENTITY",
                subDirective: "Hold pitch steady for 0.4s to align royal biometric frequency sensor.",
                verificationBadge: "PRIMARY SWARA DETECTED",
                feedbackLog: [
                    "✓ SWARA DETECTED",
                    "✓ IDENTITY SIGNAL ACCEPTED",
                    "✓ ACCESS LEVEL: 01 GRANTED"
                ]
            }
        ],
        completionMessage: "PRIMARY ACOUSTIC IDENTITY REGISTERED. PROCEEDING TO MANDATORY CONFIRMATION."
    },
    {
        id: 2,
        levelNumber: 2,
        title: "LEVEL 2: SWARA RE-VERIFICATION",
        sealName: "SEAL 02: REDUNDANT CONFIRMATION",
        classification: "BUREAUCRATIC SAFETY PROTOCOL §4.2",
        purpose: "Redundant confirmation of prior acoustic affirmation",
        description: "The royal safe requires you to confirm what you just played to prevent unconfirmed input.",
        steps: [
            {
                stepIndex: 1,
                targetSwara: "Ga",
                directive: "INTONATE SECONDARY HARMONIC [Ga] TO INITIATE SEQUENCE",
                subDirective: "First affirmation of harmonic interval.",
                verificationBadge: "INITIAL GA RECORDED",
                feedbackLog: [
                    "✓ GA RECORDED",
                    "⚠️ CONFIRMATION PENDING"
                ]
            },
            {
                stepIndex: 2,
                targetSwara: "Ga",
                directive: "PLEASE CONFIRM THAT YOU PLAYED GA. (RE-INTONATE [Ga])",
                subDirective: "The crown requires verified certainty before proceeding.",
                verificationBadge: "GA CONFIRMED",
                feedbackLog: [
                    "✓ GA CONFIRMED",
                    "✓ PREVIOUS AUTHENTICATION HAS BEEN CONFIRMED",
                    "✓ ACCESS LEVEL: 02 GRANTED"
                ]
            }
        ],
        completionMessage: "CONFIRMATION ACCEPTED. PROTOCOL COMPLIANCE RATING: EXEMPLARY."
    },
    {
        id: 3,
        levelNumber: 3,
        title: "LEVEL 3: MUSICAL TWO-FACTOR AUTHENTICATION (2FA)",
        sealName: "SEAL 03: DOUBLE-FACTOR REPRODUCTION SHIELD",
        classification: "SECURITY DIRECTIVE 88-B",
        purpose: "Secondary reproduction prevention & recursive verification",
        description: "PREVIOUS AUTHENTICATION MAY HAVE BEEN REPRODUCED. SECONDARY MUSICAL VERIFICATION REQUIRED.",
        steps: [
            {
                stepIndex: 1,
                targetSwara: "Sa",
                directive: "FACTOR 1/3: INTONATE PRIMARY 2FA SWARA [Sa]",
                subDirective: "Submitting primary factor of royal two-factor handshake.",
                verificationBadge: "PRIMARY 2FA: VERIFIED",
                feedbackLog: [
                    "✓ PRIMARY AUTHENTICATION: VERIFIED",
                    "⏳ AWAITING SECONDARY FACTOR"
                ]
            },
            {
                stepIndex: 2,
                targetSwara: "Sa",
                directive: "FACTOR 2/3: PLEASE REPEAT THE SAME AUTHENTICATION. PLAY [Sa] AGAIN.",
                subDirective: "Confirming secondary reproduction parity.",
                verificationBadge: "SECONDARY 2FA: VERIFIED",
                feedbackLog: [
                    "✓ SECONDARY AUTHENTICATION: VERIFIED",
                    "⏳ AWAITING CONFIRMATION OF SECONDARY"
                ]
            },
            {
                stepIndex: 3,
                targetSwara: "Sa",
                directive: "FACTOR 3/3: PLEASE CONFIRM YOUR CONFIRMATION. PLAY [Sa] ONE MORE TIME.",
                subDirective: "Recursive tertiary verification of secondary confirmation.",
                verificationBadge: "CONFIRMATION OF SECONDARY: VERIFIED",
                feedbackLog: [
                    "✓ CONFIRMATION OF SECONDARY: VERIFIED",
                    "✓ 2FA SUCCESSFUL",
                    "✓ ACCESS LEVEL: 03 GRANTED"
                ]
            }
        ],
        completionMessage: "TWO-FACTOR RECURSIVE HANDSHAKE VALIDATED. VAULT DEFENSES CONFUSED BUT SATISFIED."
    },
    {
        id: 4,
        levelNumber: 4,
        title: "LEVEL 4: MUSICAL COUNTER-AUTHENTICATION",
        sealName: "SEAL 04: ANTI-ACCIDENTAL INTENT VERIFIER",
        classification: "PARANOID ROYAL DECREE #991",
        purpose: "Verify that previous authentications were not accidental",
        description: "THE SYSTEM MUST NOW VERIFY THAT PREVIOUS AUTHENTICATIONS WERE NOT ACCIDENTAL.",
        steps: [
            {
                stepIndex: 1,
                targetSwara: "Ma",
                directive: "STEP 1/4: PLAY TARGET COUNTER-SEAL SWARA [Ma]",
                subDirective: "Initial expression of intent to unlock.",
                verificationBadge: "AUTHENTICATION: RECORDED",
                feedbackLog: [
                    "✓ AUTHENTICATION: RECORDED",
                    "❓ SYSTEM INQUIRY GENERATING..."
                ]
            },
            {
                stepIndex: 2,
                targetSwara: "Ma",
                directive: "STEP 2/4: ARE YOU SURE? INTONATE [Ma] TO AFFIRM INTENT.",
                subDirective: "System is checking whether you sneezed or meant to play Ma.",
                verificationBadge: "RE-AUTHENTICATION: RECORDED",
                feedbackLog: [
                    "✓ RE-AUTHENTICATION: RECORDED",
                    "❓ REQUESTING SECONDARY CERTAINTY"
                ]
            },
            {
                stepIndex: 3,
                targetSwara: "Ma",
                directive: "STEP 3/4: CONFIRM THAT YOU ARE SURE. PLAY [Ma] AGAIN.",
                subDirective: "Double verification of intentional certainty.",
                verificationBadge: "CONFIRMATION: RECORDED",
                feedbackLog: [
                    "✓ CONFIRMATION: RECORDED",
                    "⚠️ FINAL NOTARIZATION REQUIRED"
                ]
            },
            {
                stepIndex: 4,
                targetSwara: "Ma",
                directive: "STEP 4/4: FINAL CONFIRMATION. PLAY [Ma] ONE LAST TIME.",
                subDirective: "Ultimate notarization of affirmative intent.",
                verificationBadge: "CONFIRMATION OF CONFIRMATION: RECORDED",
                feedbackLog: [
                    "✓ CONFIRMATION OF CONFIRMATION: RECORDED",
                    "✓ NO FURTHER ACTION REQUIRED... PROBABLY",
                    "✓ ACCESS LEVEL: 04 GRANTED"
                ]
            }
        ],
        completionMessage: "INTENTIONAL CERTAINTY NOTARIZED IN QUADRUPLICATE. SEAL 4 SURRENDERED."
    },
    {
        id: 5,
        levelNumber: 5,
        title: "LEVEL 5: FINAL ROYAL MUSICAL PROTOCOL",
        sealName: "SEAL 05: META-AUTHENTICATION OF ALL PRIOR AUTHENTICATIONS",
        classification: "SUPREME MONARCHIC VAULT OVERRIDE",
        purpose: "Meta-authentication of all prior authentications",
        description: "ALL PREVIOUS AUTHENTICATIONS MUST NOW BE AUTHENTICATED.",
        steps: [
            {
                stepIndex: 1,
                targetSwara: "Sa",
                directive: "PROTOCOL 1/5: RE-AUTHENTICATE LEVEL 1 IDENTITY [Sa]",
                subDirective: "Re-verifying Seal 1 biometric baseline.",
                verificationBadge: "SEAL 1 RE-AUTHENTICATED",
                feedbackLog: ["✓ SEAL 1 BIOMETRIC ANCHOR: VERIFIED"]
            },
            {
                stepIndex: 2,
                targetSwara: "Ga",
                directive: "PROTOCOL 2/5: RE-AUTHENTICATE LEVEL 2 CONFIRMATION [Ga]",
                subDirective: "Re-verifying Seal 2 redundant confirmation.",
                verificationBadge: "SEAL 2 RE-AUTHENTICATED",
                feedbackLog: ["✓ SEAL 2 REDUNDANT CONFIRMATION: VERIFIED"]
            },
            {
                stepIndex: 3,
                targetSwara: "Sa",
                directive: "PROTOCOL 3/5: RE-AUTHENTICATE LEVEL 3 2FA FACTOR [Sa]",
                subDirective: "Re-verifying Seal 3 recursive 2FA token.",
                verificationBadge: "SEAL 3 RE-AUTHENTICATED",
                feedbackLog: ["✓ SEAL 3 RECURSIVE 2FA: VERIFIED"]
            },
            {
                stepIndex: 4,
                targetSwara: "Ma",
                directive: "PROTOCOL 4/5: RE-AUTHENTICATE LEVEL 4 COUNTER-SEAL [Ma]",
                subDirective: "Re-verifying Seal 4 intentional anti-accident proof.",
                verificationBadge: "SEAL 4 RE-AUTHENTICATED",
                feedbackLog: ["✓ SEAL 4 ANTI-ACCIDENTAL CERTIFICATE: VERIFIED"]
            },
            {
                stepIndex: 5,
                targetSwara: "Pa",
                directive: "PROTOCOL 5/5: INTONATE FINAL MONARCHIC KEY [Pa]",
                subDirective: "Initiating ultimate monolithic tumblers disengagement sequence.",
                verificationBadge: "SUPREME MONARCHIC SEAL: ENGAGED",
                feedbackLog: ["✓ SUPREME MONARCHIC SEAL: ENGAGED"]
            }
        ],
        completionSequence: [
            "ALL FIVE MUSICAL SEALS VERIFIED.",
            "VAULT ACCESS GRANTED.",
            "UNLOCKING ROYAL VAULT...",
            "3...",
            "2...",
            "1...",
            "ACCESS GRANTED."
        ]
    }
];

// Base frequencies for Indian Classical tonic (Sa) across all 12 chromatic scales
const SCALE_FREQUENCIES = {
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

// Shankarabharanam / Major intervals in semitones from Sa:
const SWARA_INTERVALS = {
    "Sa": 0,
    "Re": 2,
    "Ga": 4,
    "Ma": 5,
    "Pa": 7,
    "Dha": 9,
    "Ni": 11,
    "Sa'": 12
};

function getSwarasForTonic(tonicHz) {
    const swaraMap = {};
    for (const [swara, semitones] of Object.entries(SWARA_INTERVALS)) {
        swaraMap[swara] = +(tonicHz * Math.pow(2, semitones / 12)).toFixed(2);
    }
    return swaraMap;
}

window.BUREAUCRATIC_LEVELS = BUREAUCRATIC_LEVELS;
window.SCALE_FREQUENCIES = SCALE_FREQUENCIES;
window.SWARA_INTERVALS = SWARA_INTERVALS;
window.getSwarasForTonic = getSwarasForTonic;
