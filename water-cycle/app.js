/* رحلة قطرة الماء — محرّك الشاشة
 * يقرأ المحتوى من content/missions.js (window.WATER_JOURNEY) ولا يحتوي نصوصًا تعليمية.
 * الوحدات: Store (حفظ التقدّم)، Sound (مؤثرات)، Voice (قراءة صوتية)، Kanaan (الوكيل)،
 * Scene (المشهد والاستكشاف)، Quiz (السؤال والسقالات)، Build (البناء).
 */
(function () {
  "use strict";

  const C = window.WATER_JOURNEY;
  const params = new URLSearchParams(location.search);
  const mission = C.missions.find(m => m.id === params.get("mission")) || C.missions[0];
  const $ = id => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toArabicDigits = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

  /* ---------------- Store: تقدّم الطالب وسجل التقييم ---------------- */
  const Store = {
    key: "waterJourney.v1",
    read() {
      try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; }
    },
    write(patch) {
      try {
        const data = Object.assign(this.read(), patch);
        localStorage.setItem(this.key, JSON.stringify(data));
      } catch (e) { /* التخزين غير متاح: نكمل دون حفظ */ }
    }
  };
  const saved = Store.read();
  const prefs = Object.assign({ sfx: true, autoRead: false }, saved.prefs);

  /* ---------------- Sound: مؤثرات قصيرة بـ WebAudio ---------------- */
  const Sound = {
    ctx: null,
    tone(freq, start, dur, type = "sine", vol = 0.16) {
      if (!prefs.sfx) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const t = this.ctx.currentTime + start;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.ctx.destination);
        o.start(t); o.stop(t + dur + 0.05);
      } catch (e) { /* لا صوت */ }
    },
    tap() { this.tone(660, 0, 0.12, "sine", 0.08); },
    right() { this.tone(523, 0, 0.2); this.tone(659, 0.12, 0.2); this.tone(784, 0.24, 0.35); },
    tryAgain() { this.tone(330, 0, 0.25, "triangle", 0.12); this.tone(294, 0.16, 0.3, "triangle", 0.1); },
    hint() { this.tone(880, 0, 0.15, "sine", 0.07); this.tone(990, 0.1, 0.2, "sine", 0.06); },
    stone(i) { this.tone(140 + i * 6, 0, 0.18, "triangle", 0.18); }
  };

  /* ---------------- Voice: قراءة صوتية اختيارية ---------------- */
  const Voice = {
    audio: null,
    voice() {
      if (!("speechSynthesis" in window)) return null;
      const list = speechSynthesis.getVoices();
      return list.find(v => (v.lang || "").toLowerCase().startsWith("ar")) || null;
    },
    available() { return !!this.voice(); },
    stop() {
      if (this.audio) { this.audio.pause(); this.audio = null; }
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    },
    say(text, audioSrc) {
      this.stop();
      if (audioSrc) { this.audio = new Audio(audioSrc); this.audio.play().catch(() => {}); return true; }
      const v = this.voice();
      if (!v) return false;
      const u = new SpeechSynthesisUtterance(text);
      u.voice = v; u.lang = v.lang; u.rate = 0.9; u.pitch = 1.05;
      speechSynthesis.speak(u);
      return true;
    }
  };
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  /* ---------------- أيقونات ---------------- */
  const ICONS = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    cross: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    sun: '<svg viewBox="0 0 48 48" stroke="#E8961A"><circle cx="24" cy="24" r="9" fill="#FFD66B"/><path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.5 10.5l3.5 3.5M34 34l3.5 3.5M37.5 10.5L34 14M14 34l-3.5 3.5"/></svg>',
    wind: '<svg viewBox="0 0 48 48" stroke="#5C8FB3"><path d="M6 18h24a6 6 0 1 0-6-6"/><path d="M6 26h32a6 6 0 1 1-6 6"/><path d="M6 34h14"/></svg>',
    rain: '<svg viewBox="0 0 48 48" stroke="#3F86C4"><path d="M14 26a8 8 0 0 1 1-16 11 11 0 0 1 20 3 7 7 0 0 1-1 13z" fill="#E3F1FA"/><path d="M16 32l-3 6M25 32l-3 6M34 32l-3 6"/></svg>'
  };

  /* ---------------- Kanaan: الوكيل التعليمي ---------------- */
  const face = $("kanaanFace"), bubbleText = $("kanaanText");
  const Kanaan = {
    last: { text: "", audio: null },
    say(mood, text, opts = {}) {
      const src = C.kanaan.moods[mood] || C.kanaan.moods.smile;
      if (!face.src.endsWith(src)) face.src = src;
      bubbleText.textContent = text;
      this.last = { text, audio: opts.audio || null };
      const av = face.parentElement;
      av.classList.remove("is-talking"); void av.offsetWidth; av.classList.add("is-talking");
      if (prefs.autoRead) Voice.say(text, opts.audio);
    }
  };

  /* ---------------- الحالة ---------------- */
  const state = {
    seen: new Set(),
    level: 0,            // مستوى الدعم الحالي (0 = بلا دعم)
    wrong: new Set(),
    attempts: 0,
    solved: false,
    started: Date.now()
  };

  /* ---------------- الرأس والتقدّم ---------------- */
  function renderHeader() {
    const total = C.meta.stages.length;
    $("progressText").textContent = `المهمة ${toArabicDigits(mission.order)} من ${toArabicDigits(total)}`;
    const done = new Set((saved.completed || []));
    $("progressTrack").innerHTML = C.meta.stages.map((name, i) => {
      const m = C.missions[i];
      const cls = (m && done.has(m.id)) ? "is-done" : (i === mission.order - 1 ? "is-current" : "");
      const status = cls === "is-done" ? "مكتملة" : cls === "is-current" ? "الحالية" : "لم تبدأ";
      return `<li class="${cls}" title="${name}"><span class="sr-only">${name}: ${status}</span></li>`;
    }).join("");
    $("eyebrow").textContent = mission.eyebrow;
    $("missionTitle").textContent = mission.title;
    $("objective").textContent = mission.objective;
    document.title = `${mission.title} · ${C.meta.title}`;
  }
  function markProgressDone() {
    const li = $("progressTrack").children[mission.order - 1];
    if (li) { li.className = "is-done"; li.querySelector(".sr-only").textContent = `${mission.title}: مكتملة`; }
  }

  /* ---------------- Scene: المشهد والاستكشاف ---------------- */
  const scene = $("scene");
  const HOTSPOT_POS = { sun: [18.75, 41], vapor: [52, 30], water: [32, 88] }; // نسب مئوية من المشهد
  const timers = {};
  function play(cls, ms) {
    clearTimeout(timers[cls]);
    scene.classList.remove(cls); void scene.offsetWidth; scene.classList.add(cls);
    timers[cls] = setTimeout(() => scene.classList.remove(cls), reduceMotion ? Math.min(ms, 2500) : ms);
  }
  const DEMOS = {
    sun: () => play("is-heat", 5200),
    water: () => play("is-ripple", 2400),
    vapor: () => play("is-rise", 5000),
    heat: () => play("is-heat", 6000)
  };

  function renderHotspots() {
    const box = $("hotspots");
    box.innerHTML = "";
    Object.entries(mission.explore.hotspots).forEach(([id, h]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "hotspot"; b.dataset.id = id;
      const [x, y] = HOTSPOT_POS[id] || [50, 50];
      b.style.left = x + "%"; b.style.top = y + "%";
      b.innerHTML = `<span class="hotspot__mark" aria-hidden="true">${ICONS.check}</span><span>${h.label}</span>`;
      b.setAttribute("aria-label", `استكشف: ${h.label}`);
      b.addEventListener("click", () => explore(id));
      box.appendChild(b);
    });
    // النقر على الرسم نفسه يعمل أيضًا
    $("artSun").addEventListener("click", () => explore("sun"));
    $("artWater").addEventListener("click", () => explore("water"));
    $("artVapor").addEventListener("click", () => explore("vapor"));
    $("artDrop").addEventListener("click", () => explore("water"));
    updateNextHotspot();
  }
  function updateNextHotspot() {
    const all = [...document.querySelectorAll(".hotspot")];
    all.forEach(b => b.classList.remove("is-next"));
    if (state.solved || state.level >= 2) return;
    const next = all.find(b => !state.seen.has(b.dataset.id));
    if (next) next.classList.add("is-next");   // نبضة واحدة فقط على العنصر التالي
  }

  function explore(id) {
    const h = mission.explore.hotspots[id];
    if (!h) return;
    Sound.tap();
    DEMOS[id] && DEMOS[id]();
    showCard(h.card);
    const firstTime = !state.seen.has(id);
    state.seen.add(id);
    const btn = document.querySelector(`.hotspot[data-id="${id}"]`);
    if (btn) { btn.classList.add("is-seen"); btn.setAttribute("aria-label", `${h.label} (تمت ملاحظته)`); }
    updateNextHotspot();
    if (firstTime && !state.solved && state.level === 0 &&
        state.seen.size === Object.keys(mission.explore.hotspots).length) {
      const d = mission.explore.done;
      Kanaan.say(d.mood, d.text, d);
    }
  }

  function showCard(card) {
    $("infoTitle").textContent = card.title;
    $("infoText").textContent = card.text;
    const el = $("infocard");
    el.hidden = false;
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  }
  $("infoClose").addEventListener("click", () => { $("infocard").hidden = true; });

  function spotlight(target) {
    scene.classList.remove("spot-sun");
    document.querySelectorAll(".hotspot").forEach(b => b.classList.remove("is-spot"));
    if (!target) return;
    scene.classList.add("spot-" + target);
    const b = document.querySelector(`.hotspot[data-id="${target}"]`);
    if (b) b.classList.add("is-spot");
  }

  /* ---------------- Quiz: السؤال والسقالات ---------------- */
  function renderQuestion() {
    const q = mission.question;
    $("questionText").textContent = q.prompt;
    const box = $("choices");
    box.innerHTML = "";
    q.choices.forEach(ch => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "choice"; b.dataset.id = ch.id;
      b.innerHTML = `
        <span class="choice__state" aria-hidden="true"></span>
        <span class="choice__icon" aria-hidden="true">${ICONS[ch.icon] || ""}</span>
        <span class="choice__label">${ch.label}</span>
        <span class="choice__note"></span>`;
      b.addEventListener("click", () => answer(ch, b));
      box.appendChild(b);
    });
  }

  function renderLevel() {
    const el = $("supportLevel");
    if (!state.level) { el.hidden = true; return; }
    const max = mission.scaffolds.length;
    el.hidden = false;
    el.innerHTML = `<span>مستوى المساعدة</span><span class="dots" aria-hidden="true">${
      Array.from({ length: max }, (_, i) => `<i class="${i < state.level ? "on" : ""}"></i>`).join("")
    }</span><span class="sr-only">${toArabicDigits(state.level)} من ${toArabicDigits(max)}</span>`;
    $("btnHelp").disabled = state.level >= max;
  }

  // يرفع الدعم مستوى واحدًا ويعرضه (لا يكشف الإجابة)
  function scaffold(prefix) {
    const list = mission.scaffolds;
    state.level = Math.min(state.level + 1, list.length);
    const s = list[state.level - 1];
    spotlight(s.highlight || null);
    if (s.demo && DEMOS[s.demo]) DEMOS[s.demo]();
    Kanaan.say(s.mood, prefix ? `${prefix} ${s.text}` : s.text, s);
    renderLevel();
    updateNextHotspot();
  }

  function answer(ch, btn) {
    if (state.solved || btn.getAttribute("aria-disabled") === "true") return;
    state.attempts++;
    if (!ch.correct) {
      state.wrong.add(ch.id);
      Sound.tryAgain();
      btn.classList.add("is-wrong", "shake");
      setTimeout(() => btn.classList.remove("shake"), 400);
      btn.setAttribute("aria-disabled", "true");
      btn.querySelector(".choice__state").innerHTML = ICONS.cross;
      btn.querySelector(".choice__note").textContent = "جرّب غيرها";
      btn.setAttribute("aria-label", `${ch.label}: ليست الإجابة، جرّب غيرها`);
      scaffold(ch.nudge);
      return;
    }
    solve(ch, btn);
  }

  function solve(ch, btn) {
    state.solved = true;
    Sound.right();
    spotlight(null);
    btn.classList.add("is-right");
    btn.querySelector(".choice__state").innerHTML = ICONS.check;
    btn.querySelector(".choice__note").textContent = "إجابة صحيحة";
    btn.setAttribute("aria-label", `${ch.label}: إجابة صحيحة`);
    document.querySelectorAll(".choice").forEach(b => {
      b.setAttribute("aria-disabled", "true");
      if (b !== btn && !b.classList.contains("is-wrong")) b.classList.add("is-muted");
    });

    const f = mission.feedback;
    const independent = state.level === 0;
    Kanaan.say(f.correct.mood, `${f.correct.text} ${independent ? f.independent : f.withHelp}`, f.correct);
    $("btnHelp").disabled = true;
    $("supportLevel").hidden = true;

    // القطرة تتبخّر وتصعد مع البخار: الحركة جزء من المفهوم
    play("is-heat", 4000);
    scene.classList.add("is-solved");
    updateNextHotspot();

    // سجل التقييم (مرحلة Evaluation) + تقليل الدعم في المهام القادمة
    const completed = new Set(saved.completed || []); completed.add(mission.id);
    const log = Object.assign({}, saved.log);
    log[mission.id] = {
      attempts: state.attempts, supportLevel: state.level, explored: [...state.seen],
      seconds: Math.round((Date.now() - state.started) / 1000), at: new Date().toISOString()
    };
    saved.completed = [...completed];
    Store.write({ completed: saved.completed, log, independent: independent });
    markProgressDone();

    setTimeout(showEarned, reduceMotion ? 200 : 1400);
  }

  /* ---------------- Build: المورد ثم البناء ---------------- */
  const R = mission.reward;
  function showEarned() {
    $("earnedBadge").textContent = "🏠 " + R.badge;
    $("earnedResource").textContent = R.resource;
    $("btnBuild").textContent = R.action;
    $("earned").hidden = false;
    $("btnBuild").focus({ preventScroll: true });
    $("earned").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

  const STONES = [ // صفّان من الحجارة بأحجام مختلفة كالحجر الفلسطيني
    [180, 146, 34, 14], [216, 146, 40, 14], [258, 146, 30, 14], [290, 146, 40, 14],
    [176, 131, 28, 13], [206, 131, 38, 13], [246, 131, 34, 13], [282, 131, 30, 13], [314, 131, 20, 13]
  ];
  function renderParts(includeCurrent) {
    const done = C.missions
      .filter(m => (saved.completed || []).includes(m.id) && (includeCurrent || m.id !== mission.id))
      .map(m => m.reward.part);
    $("parts").innerHTML = C.house.parts.map(p => {
      const ok = done.includes(p.id);
      return `<li class="${ok ? "is-done" : ""}">${ok ? ICONS.check : ICONS.lock}${p.label}<span class="sr-only">${ok ? " (بُني)" : " (لم يُبنَ بعد)"}</span></li>`;
    }).join("");
  }
  function openBuild() {
    const dlg = $("buildDialog");
    $("buildTitle").textContent = R.resource;
    $("buildStory").textContent = R.story;
    $("btnNext").textContent = mission.next.label;
    $("btnNext").disabled = !mission.next.available;
    $("nextNote").textContent = mission.next.available ? "" : mission.next.note;
    $("stones").innerHTML = "";
    renderParts(false);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    Voice.stop();

    const g = $("stones");
    STONES.forEach(([x, y, w, h], i) => {
      setTimeout(() => {
        const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        Object.entries({ x, y: y - 1, width: w, height: h, rx: 3 }).forEach(([k, v]) => r.setAttribute(k, v));
        r.classList.add("fall");
        g.appendChild(r);
        Sound.stone(i);
      }, reduceMotion ? 0 : 250 + i * 170);
    });
    setTimeout(() => {
      $("buildTitle").textContent = R.built;
      renderParts(true);
      if (prefs.autoRead) Voice.say(R.built);
    }, reduceMotion ? 50 : 250 + STONES.length * 170 + 400);
  }
  $("btnBuild").addEventListener("click", openBuild);
  $("btnReplay").addEventListener("click", () => { location.reload(); });

  /* ---------------- أدوات الصوت ---------------- */
  function syncTools() {
    $("btnSfx").setAttribute("aria-pressed", String(prefs.sfx));
    $("btnAutoRead").setAttribute("aria-pressed", String(prefs.autoRead));
  }
  $("btnSfx").addEventListener("click", () => {
    prefs.sfx = !prefs.sfx; Store.write({ prefs }); syncTools(); Sound.tap();
  });
  $("btnAutoRead").addEventListener("click", () => {
    prefs.autoRead = !prefs.autoRead; Store.write({ prefs }); syncTools();
    if (prefs.autoRead) readNow(); else Voice.stop();
  });
  function readNow() {
    const ok = Voice.say(Kanaan.last.text, Kanaan.last.audio);
    if (!ok) $("btnListen").title = "لا يتوفّر صوت عربي على هذا الجهاز";
  }
  $("btnListen").addEventListener("click", readNow);
  $("btnHelp").addEventListener("click", () => { if (!state.solved) { Sound.hint(); scaffold(); } });

  /* ---------------- البدء ---------------- */
  renderHeader();
  renderHotspots();
  renderQuestion();
  syncTools();
  // تلاشي الدعم: من أنهى مهمة سابقة وحده يحصل على تعليمات أقصر
  const intro = mission.intro;
  Kanaan.say(intro.mood, saved.independent && !(saved.completed || []).includes(mission.id) ? intro.brief : intro.full, intro);
})();
