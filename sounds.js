const SOUND_ASSETS = {
    death: "sounds/death.wav",
    restart: "sounds/restart.wav",
    changeDirection: "sounds/change_direction.wav",
    cycleHistory: "sounds/cycle_history.wav",
    eat: "sounds/eat.wav",
    dialogueBox: "sounds/dialogue_box.wav",
    dialogueLetter: "sounds/dialogue_letter.wav",
    timeTravel: "sounds/time_travel.wav",
    tick: "sounds/tick.wav"
};

/** @type {AudioContext} */
let audioContext = null;
function getAudioContext() {
    if(!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
}

const audioBufferCache = {};
async function loadAudioBuffer(url) {
    if(audioBufferCache[url]) return audioBufferCache[url];
    const ctx = getAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioBufferCache[url] = audioBuffer;
    return audioBuffer;
}

export async function playSound(name, options = { pitch: 1, volume: 1 }) {
    const url = SOUND_ASSETS[name];
    if(!url) return;

    try {
        const ctx = getAudioContext();
        const buffer = await loadAudioBuffer(url);
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = options.volume;
        source.buffer = buffer;
        source.playbackRate.value = options.pitch || 1;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
    } catch(e) {
        // Fail silently if sound can't be played
        // "silently". get it? haha... ha. i'm really tired.
    }
}