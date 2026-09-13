from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Base frequencies for Indian Classical tonic (Sa) across all 12 chromatic scales:
SCALES = {
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
    "G#": 415.30,
}

# Standard Shankarabharanam / Bilawal / Major intervals in semitones from Sa:
INTERVALS = {
    "Sa": 0,
    "Re": 2,
    "Ga": 4,
    "Ma": 5,
    "Pa": 7,
    "Dha": 9,
    "Ni": 11,
    "Sa'": 12,
}

def get_swaras_for_tonic(tonic_hz):
    return {
        swara: round(tonic_hz * (2 ** (semitones / 12.0)), 2)
        for swara, semitones in INTERVALS.items()
    }

LEVELS = {
    1: {
        "name": "THE FIRST SWARA",
        "seal": "SEAL I: THE FIRST SWARA",
        "story": "The first seal recognizes only the purest swara.",
        "mechanic": "pitch",
        "length": 1,
        "tolerance": 45,
        "time_limit": None,
        "memory": False,
        "rhythm": False,
    },
    2: {
        "name": "THE MEMORY OF THE KING",
        "seal": "SEAL II: THE MEMORY OF THE KING",
        "story": "The second seal was designed so that only someone who remembers the royal sequence may proceed.",
        "mechanic": "memory",
        "length": 4,
        "tolerance": 45,
        "time_limit": None,
        "memory": True,
        "preview_seconds": 6.0,
        "max_strikes": None,  # Unlimited tries
        "rhythm": False,
    },
    3: {
        "name": "THE ROYAL ARCHIVE",
        "seal": "SEAL III: THE ROYAL ARCHIVE",
        "story": "The third seal challenges the heir with an extended sequence of 6 swaras to memorize, free from the pressure of time.",
        "mechanic": "memory_extended",
        "length": 6,  # Increased from 4 to 6 notes to memorise
        "tolerance": 45,
        "time_limit": None,  # Timer removed
        "memory": True,
        "preview_seconds": 8.0,
        "max_strikes": None,  # Unlimited tries
        "rhythm": False,
    },
    4: {
        "name": "THE PERFECT SWARA",
        "seal": "SEAL IV: THE PERFECT SWARA",
        "story": "The fourth seal was created to reject even the slightest musical error.",
        "mechanic": "precision_rhythm",
        "length": 4,
        "tolerance": 20,
        "time_limit": None,
        "memory": False,
        "rhythm": True,
        "target_gap": 1.2,
    },
    5: {
        "name": "THE FINAL VAULT",
        "seal": "SEAL V: THE FINAL VAULT",
        "story": "The final seal combines every protection created by the King of Kaavungal.",
        "mechanic": "viola_final",
        "length": 5,
        "tolerance": 20,
        "time_limit": 30.0,
        "memory": True,
        "preview_seconds": 6.0,
        "max_strikes": None,  # Unlimited tries
        "rhythm": True,
        "target_gap": 1.1,
    },
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/challenge/<int:level>")
def challenge(level):
    level = max(1, min(5, level))
    lvl_cfg = LEVELS[level]
    length = lvl_cfg["length"]

    scale_name = request.args.get("scale", "D").strip().upper()
    tonic_hz = SCALES.get(scale_name, 293.66)
    swaras_map = get_swaras_for_tonic(tonic_hz)
    keys = list(swaras_map.keys())

    if level == 1:
        sequence = ["Sa"]
    else:
        # Allow repeated swaras because repetition is musically valid.
        sequence = [random.choice(keys) for _ in range(length)]

    return jsonify({
        "level": level,
        "name": lvl_cfg["name"],
        "seal": lvl_cfg.get("seal", lvl_cfg["name"]),
        "story": lvl_cfg.get("story", ""),
        "mechanic": lvl_cfg["mechanic"],
        "tolerance": lvl_cfg["tolerance"],
        "time_limit": lvl_cfg["time_limit"],
        "memory": lvl_cfg["memory"],
        "preview_seconds": lvl_cfg.get("preview_seconds"),
        "max_strikes": lvl_cfg.get("max_strikes", 0),
        "rhythm": lvl_cfg["rhythm"],
        "target_gap": lvl_cfg.get("target_gap", 1.2),
        "scale": scale_name,
        "sa_reference": scale_name,
        "tonic_hz": tonic_hz,
        "swaras": sequence,
        "frequencies": [swaras_map[s] for s in sequence],
        "scale_swaras": swaras_map,
        "gaps": [1.2 for _ in sequence],
    })

if __name__ == "__main__":
    app.run(debug=True)
