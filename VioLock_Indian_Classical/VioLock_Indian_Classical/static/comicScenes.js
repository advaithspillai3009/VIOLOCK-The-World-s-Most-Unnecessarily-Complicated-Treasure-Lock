/**
 * VioLock — Comic Scenes Configuration
 * Master image: static/assets/kaavungal_story_comic.jpg (1024 x 682 px)
 * Precise panel bounding boxes, Ken Burns pan/zoom coordinates, captions, dialogues, and sound cues.
 */

const COMIC_CONFIG = {
    imageSrc: "/static/assets/kaavungal_story_comic_enhanced.jpg",
    naturalWidth: 2048,
    naturalHeight: 1364,
    coordinateScale: 2.0,

    // Voice Profiles for SpeechSynthesis
    voices: {
        narrator: { pitch: 0.95, rate: 0.95, lang: "en-US", volume: 1.0 },
        kaavungalKing: { pitch: 0.75, rate: 0.90, lang: "en-US", volume: 1.0 },
        ezhukoyickalKing: { pitch: 0.82, rate: 0.95, lang: "en-US", volume: 1.0 },
        grandmother: { pitch: 1.15, rate: 0.88, lang: "en-US", volume: 1.0 },
        heir: { pitch: 1.05, rate: 1.00, lang: "en-US", volume: 1.0 },
        viola: { pitch: 1.30, rate: 1.15, lang: "en-US", volume: 0.95 }
    },

    // INTRO CUTSCENE SCENES (Panels 1 to 13)
    introScenes: [
        {
            id: "panel-1",
            index: 1,
            title: "THE TWO KINGDOMS",
            caption: "Long ago, two kingdoms stood divided by war.",
            bounds: { x: 0, y: 0, w: 269, h: 191 },
            camera: {
                start: { x: 60, y: 95, zoom: 1.08 },
                end: { x: 210, y: 95, zoom: 1.08 }
            },
            duration: 6500,
            sound: "war_ambient",
            dialogues: [
                {
                    speaker: "Narrator",
                    text: "Long ago, the mighty Kingdom of Kaavungal stood divided by war against the ruthless Ezhukoyickal.",
                    voice: "narrator",
                    delay: 400
                }
            ]
        },
        {
            id: "panel-2",
            index: 2,
            title: "THE FINAL BATTLE",
            caption: "The kingdoms of Kaavungal and Ezhukoyickal prepared for their final battle.",
            bounds: { x: 270, y: 0, w: 200, h: 191 },
            camera: {
                start: { x: 370, y: 95, zoom: 1.02 },
                end: { x: 370, y: 95, zoom: 1.08 }
            },
            duration: 6000,
            sound: "war_drums",
            dialogues: [
                {
                    speaker: "Narrator",
                    text: "Armies gathered at the citadel gates as the crimson sky signaled the final clash of empires.",
                    voice: "narrator",
                    delay: 400
                }
            ]
        },
        {
            id: "panel-3",
            index: 3,
            title: "THE KING'S REALIZATION",
            caption: "As the King of Kaavungal realized they were losing...",
            bounds: { x: 471, y: 0, w: 170, h: 191 },
            camera: {
                start: { x: 556, y: 95, zoom: 1.02 },
                end: { x: 556, y: 95, zoom: 1.08 }
            },
            duration: 7500,
            sound: "somber_strings",
            dialogues: [
                {
                    speaker: "King Kaavungal",
                    characterTitle: "KING KAAVUNGAL",
                    text: "We are losing. The kingdom will not survive this day.",
                    voice: "kaavungalKing",
                    delay: 500
                },
                {
                    speaker: "King Kaavungal",
                    characterTitle: "KING KAAVUNGAL",
                    text: "But the royal treasure must.",
                    voice: "kaavungalKing",
                    delay: 4000
                }
            ]
        },
        {
            id: "panel-4",
            index: 4,
            title: "HIDING THE TREASURE",
            caption: "He hid the greatest treasures of his kingdom inside a secret vault.",
            bounds: { x: 642, y: 0, w: 196, h: 191 },
            camera: {
                start: { x: 740, y: 95, zoom: 1.02 },
                end: { x: 740, y: 95, zoom: 1.08 }
            },
            duration: 6500,
            sound: "vault_echo",
            dialogues: [
                {
                    speaker: "King Kaavungal",
                    characterTitle: "KING KAAVUNGAL",
                    text: "Take everything to the subterranean vault!",
                    voice: "kaavungalKing",
                    delay: 500
                }
            ]
        },
        {
            id: "panel-5",
            index: 5,
            title: "THE ENCRYPTED MUSICAL LOCK",
            caption: "He created an encrypted musical lock.",
            bounds: { x: 839, y: 0, w: 185, h: 191 },
            camera: {
                start: { x: 932, y: 95, zoom: 1.02 },
                end: { x: 932, y: 95, zoom: 1.08 }
            },
            duration: 8500,
            sound: "violin_tanpura_drone",
            dialogues: [
                {
                    speaker: "King Kaavungal",
                    characterTitle: "KING KAAVUNGAL",
                    text: "No sword can open this door. No key can break it. The vault will answer only to the swaras.",
                    voice: "kaavungalKing",
                    delay: 500
                },
                {
                    speaker: "King Kaavungal",
                    characterTitle: "KING KAAVUNGAL",
                    text: "Only the correct sequence can unlock the treasure.",
                    voice: "kaavungalKing",
                    delay: 4600
                }
            ]
        },
        {
            id: "panel-6",
            index: 6,
            title: "THE FALL OF KAAVUNGAL",
            caption: "But the Kaavungal kingdom fell.",
            bounds: { x: 0, y: 192, w: 187, h: 147 },
            camera: {
                start: { x: 93, y: 265, zoom: 1.02 },
                end: { x: 93, y: 265, zoom: 1.08 }
            },
            duration: 6500,
            sound: "burning_citadel",
            dialogues: [
                {
                    speaker: "King Kaavungal",
                    characterTitle: "KING KAAVUNGAL",
                    text: "The treasure must not fall into their hands...",
                    voice: "kaavungalKing",
                    delay: 600
                }
            ]
        },
        {
            id: "panel-7",
            index: 7,
            title: "THE BAFFLED CONQUEROR",
            caption: "The Ezhukoyickal king found the vault... but could never open it.",
            bounds: { x: 188, y: 192, w: 246, h: 147 },
            camera: {
                start: { x: 250, y: 265, zoom: 1.05 },
                end: { x: 360, y: 265, zoom: 1.05 }
            },
            duration: 7500,
            sound: "stone_hum",
            dialogues: [
                {
                    speaker: "Ezhukoyickal King",
                    characterTitle: "EZHUKOYICKAL KING",
                    text: "So this is where he hid it. What kind of king protects treasure with music?!",
                    voice: "ezhukoyickalKing",
                    delay: 500
                }
            ]
        },
        {
            id: "panel-8",
            index: 8,
            title: "CENTURIES PASSED",
            caption: "Centuries passed...",
            bounds: { x: 435, y: 192, w: 173, h: 147 },
            camera: {
                start: { x: 520, y: 265, zoom: 1.02 },
                end: { x: 520, y: 265, zoom: 1.08 }
            },
            duration: 6000,
            sound: "wind_and_ruins",
            dialogues: [
                {
                    speaker: "Narrator",
                    text: "Dynasties crumbled into dust. The impenetrable vault became forgotten beneath the overgrown mountains.",
                    voice: "narrator",
                    delay: 400
                }
            ]
        },
        {
            id: "panel-9",
            index: 9,
            title: "THE GRANDMOTHER'S STORY",
            caption: "Generations later, an heir of the Kaavungal kingdom heard the story from his grandmother.",
            bounds: { x: 609, y: 192, w: 218, h: 147 },
            camera: {
                start: { x: 718, y: 265, zoom: 1.02 },
                end: { x: 718, y: 265, zoom: 1.08 }
            },
            duration: 7500,
            sound: "fireside_diya",
            dialogues: [
                {
                    speaker: "Grandmother",
                    characterTitle: "GRANDMOTHER",
                    text: "There was a vault beneath the old kingdom. Your ancestor hid the royal treasure.",
                    voice: "grandmother",
                    delay: 600
                }
            ]
        },
        {
            id: "panel-10",
            index: 10,
            title: "THE ANCIENT MAP",
            caption: "The heir found the map...",
            bounds: { x: 828, y: 192, w: 196, h: 147 },
            camera: {
                start: { x: 926, y: 265, zoom: 1.02 },
                end: { x: 926, y: 265, zoom: 1.08 }
            },
            duration: 6500,
            sound: "revelation_chime",
            dialogues: [
                {
                    speaker: "Heir",
                    characterTitle: "THE HEIR",
                    text: "The vault... It was real.",
                    voice: "heir",
                    delay: 600
                }
            ]
        },
        {
            id: "panel-11",
            index: 11,
            title: "THE EXPEDITION",
            caption: "He set on a journey...",
            bounds: { x: 0, y: 340, w: 188, h: 138 },
            camera: {
                start: { x: 94, y: 409, zoom: 1.02 },
                end: { x: 94, y: 409, zoom: 1.08 }
            },
            duration: 6000,
            sound: "forest_trek",
            dialogues: [
                {
                    speaker: "Narrator",
                    text: "Violin in hand, the heir journeyed through perilous ancient forests toward the forgotten mountains.",
                    voice: "narrator",
                    delay: 400
                }
            ]
        },
        {
            id: "panel-12",
            index: 12,
            title: "THE SUBTERRANEAN PORTAL",
            caption: "...and finally found the vault.",
            bounds: { x: 189, y: 340, w: 128, h: 138 },
            camera: {
                start: { x: 253, y: 409, zoom: 1.02 },
                end: { x: 253, y: 409, zoom: 1.08 }
            },
            duration: 6000,
            sound: "monolithic_gate",
            dialogues: [
                {
                    speaker: "Narrator",
                    text: "Parting moss-covered stone stairs, the subterranean portal emerged from the bedrock.",
                    voice: "narrator",
                    delay: 400
                }
            ]
        },
        {
            id: "panel-13",
            index: 13,
            title: "THE ACOUSTIC TRIAL",
            caption: "MUSICAL AUTHENTICATION REQUIRED — THE TRIAL BEGINS",
            bounds: { x: 318, y: 340, w: 219, h: 138 },
            camera: {
                start: { x: 427, y: 409, zoom: 1.02 },
                end: { x: 427, y: 409, zoom: 1.18 }
            },
            duration: 7500,
            sound: "gate_energize",
            dialogues: [
                {
                    speaker: "V.I.O.L.A.",
                    characterTitle: "V.I.O.L.A. GUARDIAN",
                    text: "Acoustic resonance detected. Play the royal swaras to disengage the 5 ancient seals.",
                    voice: "viola",
                    delay: 500
                }
            ],
            isFinalIntro: true
        }
    ],

    // CLIMAX CUTSCENE SCENES (Panels 1 to 7)
    climaxScenes: [
        {
            id: "climax-1",
            index: 1,
            title: "THE GATES PART",
            caption: "After the final swara, the vault opened.",
            banner: "AUTHENTICATION SUCCESSFUL • VAULT UNLOCKED",
            bounds: { x: 0, y: 479, w: 191, h: 187 },
            camera: {
                start: { x: 95, y: 572, zoom: 1.02 },
                end: { x: 95, y: 572, zoom: 1.10 }
            },
            duration: 6500,
            sound: "gate_rumble_open",
            dialogues: [
                {
                    speaker: "Narrator",
                    text: "With a deafening subterranean shudder, the colossal granite portal slowly parted.",
                    voice: "narrator",
                    delay: 400
                }
            ]
        },
        {
            id: "climax-2",
            index: 2,
            title: "THE EMPTY TREASURY",
            caption: "The heir entered the treasure chamber... ...but the treasure was gone.",
            bounds: { x: 191, y: 479, w: 179, h: 187 },
            camera: {
                start: { x: 280, y: 572, zoom: 1.02 },
                end: { x: 280, y: 572, zoom: 1.08 }
            },
            duration: 6500,
            sound: "empty_chamber_echo",
            dialogues: [
                {
                    speaker: "Heir",
                    characterTitle: "THE HEIR",
                    text: "Where is it?!",
                    voice: "heir",
                    delay: 800
                }
            ]
        },
        {
            id: "climax-3",
            index: 3,
            title: "THE NOTE ON THE PEDESTAL",
            caption: "On the pedestal, he found a note.",
            bounds: { x: 370, y: 479, w: 120, h: 187 },
            camera: {
                start: { x: 430, y: 572, zoom: 1.02 },
                end: { x: 430, y: 572, zoom: 1.08 }
            },
            duration: 5500,
            sound: "parchment_rustle",
            dialogues: [
                {
                    speaker: "Narrator",
                    text: "Resting alone on the central pedestal was a single ancient slip of paper.",
                    voice: "narrator",
                    delay: 400
                }
            ]
        },
        {
            id: "climax-4",
            index: 4,
            title: "THE UNMISTAKABLE PORTRAIT",
            caption: "",
            imageOnly: true,
            wheelSpin: true,
            wheelSpinDuration: 600,
            audioDelayMs: 150,
            customImage: "/static/assets/climax_messi_selfie.jpg",
            coverScreen: true,
            bounds: { x: 0, y: 0, w: 1024, h: 987 },
            camera: {
                start: { x: 512, y: 493, zoom: 1.02 },
                end: { x: 512, y: 450, zoom: 1.14 }
            },
            duration: 9000,
            sound: "pk_karikku_lolan",
            audioSrc: "/static/assets/pk_karikku_lolan.mp3",
            dialogues: []
        },
        {
            id: "climax-5",
            index: 5,
            title: "OFFICIAL VAULT AUDIT",
            caption: "YOU SUCCESSFULLY UNLOCKED ABSOLUTELY NOTHING.",
            banner: "AUTHENTICATION: SUCCESSFUL ✓ • TREASURE: 0",
            isReceiptScreen: true,
            isFinalClimax: true,
            duration: 999999,
            sound: "a10_audio",
            audioSrc: "/static/assets/a10_audio.m4a",
            kingImage: "/static/assets/ezhukoyikkal_king_mohanlal.jpg",
            dialogues: [
                {
                    speaker: "Ezhukoyikkal King",
                    characterTitle: "EZHUKOYICKAL KING (MOHANLAL)",
                    text: "Entha mone ingane... You unlocked an empty vault! I took the treasure centuries ago!",
                    voice: "ezhukoyickalking",
                    delay: 500
                }
            ]
        }
    ]
};
