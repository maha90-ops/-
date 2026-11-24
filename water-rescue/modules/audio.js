/* audio.js — أصوات مولّدة برمجيًا عبر Web Audio API
   لا تحتاج ملفات صوتية ولا إنترنت. لا يبدأ أي صوت إلا بعد تفاعل الطالب.
   لاستبدالها بملفات حقيقية: ضع الملفات في assets/audio واستخدم WR.audio.file(). */
(function () {
  let ctx = null, master = null, noiseBuf = null;
  const loops = {};

  function on() { return WR.store.state.settings.sound; }
  let gestured = false;
  function ensure() {
    if (!gestured) return null; // لا صوت قبل أول تفاعل من الطالب
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, t0, dur, { type = 'sine', vol = 0.25, to = null } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noiseLoop(filterType, freq, vol) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    src.connect(f); f.connect(g); g.connect(master); src.start();
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 1.2);
    return { src, f, g };
  }

  const sounds = {
    click(t) { tone(660, t, 0.08, { type: 'triangle', vol: 0.12 }); },
    drop(t) { tone(1200, t, 0.18, { vol: 0.22, to: 380 }); },
    bubble(t) { tone(400, t, 0.12, { vol: 0.15, to: 900 }); },
    success(t) { [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.09, 0.3, { type: 'triangle', vol: 0.18 })); },
    soft(t) { tone(392, t, 0.25, { type: 'sine', vol: 0.12 }); tone(349, t + 0.12, 0.3, { vol: 0.1 }); },
    alert(t) { tone(587, t, 0.25, { type: 'square', vol: 0.07 }); tone(440, t + 0.3, 0.35, { type: 'square', vol: 0.07 }); },
    badge(t) { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.45, { type: 'triangle', vol: 0.18 })); },
    whoosh(t) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.6);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + 0.8);
    }
  };

  const audio = {
    unlock() { gestured = true; if (on()) ensure(); },
    play(name) {
      if (!on() || !ensure() || !sounds[name]) return;
      try { sounds[name](ctx.currentTime + 0.01); } catch (e) { /* ignore */ }
    },
    /** حلقة مستمرة: rain | wind */
    loop(name, active) {
      if (!active) {
        const l = loops[name];
        if (l && ctx) { l.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6); setTimeout(() => { try { l.src.stop(); } catch (e) {} }, 700); if (l.timer) clearInterval(l.timer); }
        delete loops[name];
        return;
      }
      if (loops[name] || !on() || !ensure()) return;
      if (name === 'rain') {
        const l = noiseLoop('highpass', 1400, 0.12);
        l.timer = setInterval(() => { if (Math.random() < 0.6) tone(u_r(1500, 2600), ctx.currentTime, 0.06, { vol: 0.05, to: 600 }); }, 120);
        loops.rain = l;
      } else if (name === 'wind') {
        const l = noiseLoop('lowpass', 500, 0.1);
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 0.18; lg.gain.value = 250; lfo.connect(lg); lg.connect(l.f.frequency); lfo.start();
        loops.wind = l;
      }
    },
    stopAll() { Object.keys(loops).forEach(k => audio.loop(k, false)); if (window.speechSynthesis) speechSynthesis.cancel(); },
    /** قراءة نص بصوت عربي (إن توفر في الجهاز) */
    speak(text) {
      if (!window.speechSynthesis) return false;
      speechSynthesis.cancel();
      const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/[«»]/g, '');
      const m = new SpeechSynthesisUtterance(clean);
      m.lang = 'ar-SA'; m.rate = 0.92; m.pitch = 1.15;
      const v = speechSynthesis.getVoices().find(v => /^ar/i.test(v.lang));
      if (v) m.voice = v;
      speechSynthesis.speak(m);
      return true;
    }
  };
  function u_r(a, b) { return a + Math.random() * (b - a); }

  WR.audio = audio;
})();
