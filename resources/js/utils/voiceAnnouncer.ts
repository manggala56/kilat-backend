/**
 * Utility Pesan Suara (Voice Notification & Audio Announcer) untuk Transaksi Online & Kasir.
 */

// Chime synthesizer menggunakan Web Audio API tanpa perlu file mp3 eksternal
export function playChime() {
    if (typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
        console.warn('[VoiceAnnouncer] Web Audio chime failed:', err);
    }
}

export function speakText(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('[VoiceAnnouncer] Web Speech API tidak didukung di browser ini.');
        return;
    }

    try {
        window.speechSynthesis.cancel(); // Hentikan suara yang sedang berjalan

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0; // Kecepatan normal
        utterance.pitch = 1.0;

        // Cari suara Bahasa Indonesia jika ada
        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia'));
        if (indonesianVoice) {
            utterance.voice = indonesianVoice;
        }

        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    } catch (err) {
        console.error('[VoiceAnnouncer] Gagal memutar suara:', err);
    }
}

export const announceVoice = speakText;

/**
 * Notifikasi suara untuk pembayaran QRIS / Gateway berhasil lunas.
 */
export function announcePaidOnlineOrder(tableNumber: string, totalAmount: number) {
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(totalAmount);
    const text = `Pembayaran QRIS sebesar ${formatted} rupiah untuk ${tableNumber || 'Pesanan'} berhasil diterima.`;
    speakText(text);
}

/**
 * Notifikasi suara untuk pesanan online baru (Bayar di Kasir).
 */
export function announcePendingOnlineOrder(tableNumber: string) {
    const text = `Pesanan baru masuk dari ${tableNumber || 'pelanggan'}. Silakan konfirmasi pembayaran di kasir.`;
    speakText(text);
}
