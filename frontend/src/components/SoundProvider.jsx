import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

// We'll use synth-generated beeps/clicks or base64 placeholder files later if needed,
// but for now, we'll try to map to simple browser oscillator sounds to avoid missing public assets,
// or use simple base64 encoded tiny wav files if use-sound requires real urls.
// Since we don't have audio files, let's create a pure WebAudio synthesizer context.

const SoundContext = createContext();

export const useRetroSound = () => useContext(SoundContext);

export default function SoundProvider({ children }) {
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Using Web Audio API for true programmatic retro synthesis (no external assets needed)
    const playTone = useCallback((freq, type, duration) => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error("WebAudio Error:", e);
        }
    }, [soundEnabled]);

    const playClick = useCallback(() => playTone(800, 'square', 0.05), [playTone]);
    const playType = useCallback(() => playTone(1200, 'square', 0.03), [playTone]);
    const playError = useCallback(() => playTone(150, 'sawtooth', 0.4), [playTone]);
    const playAlert = useCallback(() => {
        playTone(880, 'square', 0.2);
        setTimeout(() => playTone(1100, 'square', 0.2), 200);
    }, [playTone]);

    // Attach global click listener to make EVERY button/link click in the app sound retro
    useEffect(() => {
        const handleClick = (e) => {
            const target = e.target.closest('button, a, input[type="submit"], .clickable');
            if (target) {
                playClick();
            }
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [playClick]);

    return (
        <SoundContext.Provider value={{
            playClick,
            playType,
            playError,
            playAlert,
            soundEnabled,
            setSoundEnabled
        }}>
            {children}
        </SoundContext.Provider>
    );
}
