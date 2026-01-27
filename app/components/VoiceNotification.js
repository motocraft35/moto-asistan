'use client';

const TRANSLATIONS = {
    "Turn left": "Sola dönün",
    "Turn right": "Sağa dönün",
    "Keep left": "Soldan devam edin",
    "Keep right": "Sağdan devam edin",
    "Head north": "Kuzey yönünde ilerleyin",
    "Head south": "Güney yönünde ilerleyin",
    "Head east": "Doğu yönünde ilerleyin",
    "Head west": "Batı yönünde ilerleyin",
    "at the roundabout": "kavşaktan",
    "take the 1st exit": "birinci çıkıştan çıkın",
    "take the 2nd exit": "ikinci çıkıştan çıkın",
    "take the 3rd exit": "üçüncü çıkıştan çıkın",
    "You have arrived at your destination": "Hedefinize vardınız",
    "Go straight": "Düz devam edin",
    "Make a U-turn": "U dönüşü yapın",
    "onto": "yönüne",
    "Continue": "Devam edin"
};

const translate = (text) => {
    let translated = text;
    Object.entries(TRANSLATIONS).forEach(([en, tr]) => {
        const regex = new RegExp(en, 'gi');
        translated = translated.replace(regex, tr);
    });
    return translated;
};

/**
 * VoiceNotification - A utility to handle Text-to-Speech (TTS)
 */
export const speak = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const translatedText = translate(text);
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.lang = 'tr-TR';
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        utterance.volume = 1.0;

        // Try to find a Turkish voice explicitly
        const voices = window.speechSynthesis.getVoices();
        const trVoice = voices.find(v => v.lang.includes('tr-TR') || v.lang.includes('tr_TR'));

        if (trVoice) {
            utterance.voice = trVoice;
        }

        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Speech Synthesis API not supported in this browser.');
    }
};

export default function VoiceNotification() {
    // This is a UI-less component, but we keep it as a placeholder
    // if we want to add voice settings/toggle later.
    return null;
}
