/* audio.js — optional voice (UDL: more than one way to receive instructions).
   Uses the browser's built-in speech synthesis, so it works offline when an
   Arabic voice is installed. Off by default; the learner switches it on. */
window.WC = window.WC || {};

WC.Audio = (function () {
  var enabled = false, voice = null, ctx = null;
  var synth = window.speechSynthesis;

  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices() || [];
    voice = vs.find(function (v) { return /^ar/i.test(v.lang); }) || null;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  function clean(t) {
    return String(t).replace(/<[^>]+>/g, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
      .replace(/[«»]/g, '').replace(/\s+/g, ' ').trim();
  }

  return {
    get enabled() { return enabled; },
    supported: !!synth,
    toggle: function () { enabled = !enabled; if (!enabled) this.stop(); return enabled; },
    speak: function (text, force) {
      if ((!enabled && !force) || !synth) return;
      synth.cancel();
      var u = new SpeechSynthesisUtterance(clean(text));
      u.lang = 'ar-SA'; u.rate = 0.92; if (voice) u.voice = voice;
      synth.speak(u);
    },
    stop: function () { if (synth) synth.cancel(); },
    /** soft two-note chime on a discovery (only when sound is on) */
    chime: function () {
      if (!enabled) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        [659, 988].forEach(function (f, i) {
          var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.14;
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
          o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.65);
        });
      } catch (e) { /* audio is optional */ }
    }
  };
})();
