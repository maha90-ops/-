/* stage-planet.js — المرحلة ٥: مختبر كوكب الأرض
   كوكب مصغّر (نصف كرة بمقطع داخلي) تجري عليه دورة المياه بلا توقف.
   قطرات تتحرك على مسار مغلق؛ يتغير شكلها حسب حالتها (بخار/قطرة/مطر/ماء جوفي).
   خيار «تتبّع قطرة» يعرض حالة القطرة لحظة بلحظة. */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const D = WR.DATA.planet;

  // مسار الدورة المغلق، ونقاط بداية كل عملية عليه
  const PATH = 'M290 300 C 270 240 290 170 320 130 C 360 80 470 76 535 105 C 552 140 552 185 545 225 C 530 262 492 286 470 302 C 468 330 470 356 450 378 C 400 402 340 396 312 366 C 296 346 290 322 290 300 Z';
  const ANCHORS = { evap: [290, 300], cond: [330, 118], precip: [535, 105], collect: [545, 225], infil: [470, 302], return: [450, 378] };
  const STATION = { evap: [238, 210], cond: [318, 78], precip: [604, 150], collect: [600, 258], infil: [520, 360], return: [360, 430] };

  function scene() {
    const st = id => {
      const p = D.processes.find(x => x.id === id), [x, y] = STATION[id];
      return `<g class="hotspot station" data-id="${id}" tabindex="0" role="button" aria-label="محطة ${p.name}: اضغط لمعرفة المزيد">
        <circle class="hs-hit" cx="${x}" cy="${y}" r="34"/>
        <circle class="st-ring" cx="${x}" cy="${y}" r="27"/>
        <circle cx="${x}" cy="${y}" r="23" fill="#0b2a55" stroke="#5ff2ff" stroke-width="2.5"/>
        <text x="${x}" y="${y + 8}" text-anchor="middle" font-size="22">${p.icon}</text>
        <g class="st-check"><circle cx="${x + 18}" cy="${y - 18}" r="10" fill="#21a764" stroke="#fff" stroke-width="2"/><text x="${x + 18}" y="${y - 13}" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">✓</text></g>
      </g>`;
    };
    return S.wrap('0 0 800 520', `
      <defs>
        <clipPath id="pl-top"><ellipse cx="400" cy="300" rx="210" ry="64"/></clipPath>
        <radialGradient id="pl-atmo" cx=".5" cy=".7" r=".6"><stop offset=".6" stop-color="#5ff2ff" stop-opacity=".18"/><stop offset="1" stop-color="#5ff2ff" stop-opacity="0"/></radialGradient>
        <linearGradient id="pl-core" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d5f3e"/><stop offset=".6" stop-color="#5a3824"/><stop offset="1" stop-color="#2d1a10"/></linearGradient>
      </defs>
      <ellipse cx="400" cy="300" rx="330" ry="250" fill="url(#pl-atmo)"/>
      ${S.sun(700, 70, 38)}
      <!-- نصف الكرة السفلي: مقطع داخلي يُظهر التربة والمياه الجوفية -->
      <path d="M190 300 A210 210 0 0 0 610 300 Z" fill="url(#pl-core)"/>
      <path d="M200 300 L380 300 L380 340 C 320 346 250 336 203 330Z" fill="url(#g-ocean)"/>
      <path class="groundwater" d="M240 372 C 320 392 430 396 560 366 C 548 392 530 412 505 432 C 430 450 330 446 270 420 C 256 406 246 390 240 372Z" fill="url(#g-ground-water)"/>
      <text x="470" y="420" font-size="14" fill="#cfefff" text-anchor="middle">مياه جوفية</text>
      <path d="M190 300 A210 210 0 0 0 610 300" fill="none" stroke="#5ff2ff" stroke-opacity=".35" stroke-width="3"/>
      <!-- السطح العلوي -->
      <g clip-path="url(#pl-top)">
        <rect x="180" y="230" width="210" height="140" fill="url(#g-ocean)"/>
        <rect x="380" y="230" width="240" height="140" fill="url(#g-grass)"/>
        <path d="M370 236 C 392 270 372 300 392 364 L380 364 C 360 300 380 270 360 236Z" fill="#e8d29a"/>
        <path class="pl-river" d="M560 268 C 520 290 470 286 430 302 C 410 310 395 312 380 316" fill="none" stroke="url(#g-lake)" stroke-width="9" stroke-linecap="round"/>
      </g>
      <ellipse cx="400" cy="300" rx="210" ry="64" fill="none" stroke="#bdf2ff" stroke-opacity=".5" stroke-width="2"/>
      ${S.mountain(470, 290, 170, 150, true)}
      ${S.tree(450, 318, .55)}${S.tree(490, 322, .5)}${S.tree(600, 300, .45)}
      <g class="drift">${S.cloud(440, 96, .95)}</g>
      <path class="cycle-path" d="${PATH}" fill="none" stroke="#bdf2ff" stroke-width="2" stroke-dasharray="4 9" opacity=".55"/>
      <g class="particles"></g>
      ${Object.keys(STATION).map(st).join('')}
    `, 'كوكب مصغر تجري عليه دورة المياه: تبخر، تكاثف، هطول، تجمع، تسرب، ثم عودة إلى المحيط');
  }

  WR.views.planet = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'planet');
      sc.innerHTML = scene() + `<div class="track-hud" aria-live="polite" hidden></div>
        <div class="sim-controls"><button type="button" class="btn-icon" id="pl-pause" aria-label="إيقاف الحركة مؤقتًا">⏸️</button>
        <button type="button" class="btn btn-ghost btn-sm" id="pl-track" aria-pressed="false">📍 تتبّع قطرة</button></div>`;
      const svg = sc.querySelector('svg');
      const path = svg.querySelector('.cycle-path');
      const total = path.getTotalLength();
      const fresh = !store.isDone('planet');
      const explored = new Set(fresh ? D.processes.filter(p => store.state.awarded['pl-' + p.id]).map(p => p.id) : []);
      let running = true, tracking = false, raf = null, t0 = performance.now(), last = t0, offset = 0, quizStarted = false;

      // حساب موقع كل عملية على طول المسار
      const N = 400, samples = [];
      for (let i = 0; i <= N; i++) { const p = path.getPointAtLength(total * i / N); samples.push([p.x, p.y]); }
      const frac = {};
      Object.entries(ANCHORS).forEach(([k, [x, y]]) => {
        let best = 0, bd = 1e9;
        samples.forEach(([sx, sy], i) => { const d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd) { bd = d; best = i; } });
        frac[k] = best / N;
      });
      const order = D.processes.map(p => p.id).sort((a, b) => frac[a] - frac[b]);
      function procAt(f) { let cur = order[order.length - 1]; order.forEach(k => { if (f >= frac[k]) cur = k; }); return cur; }

      // القطرات
      const NP = u.reduced() ? 8 : 16;
      const pg = svg.querySelector('.particles');
      const parts = [];
      for (let i = 0; i < NP; i++) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = '<circle class="pt-halo" r="16"/><circle class="pt-vapor" r="9" fill="url(#g-vapor)"/><path class="pt-drop" d="M0 -9 C 3 -4 6 -1 6 3 a6 6 0 0 1 -12 0 C -6 -1 -3 -4 0 -9Z" fill="url(#g-drop)"/>';
        g.setAttribute('class', 'pt');
        pg.appendChild(g);
        parts.push({ g, phase: i / NP });
      }
      parts[0].g.classList.add('tracked');

      const hud = u.$('.track-hud', sc);
      function frame(now) {
        const dt = (now - last) / 1000; last = now;
        if (running) offset = (offset + dt / (u.reduced() ? 40 : 22)) % 1;
        parts.forEach(p => {
          const f = (p.phase + offset) % 1;
          const pt = path.getPointAtLength(f * total);
          const proc = procAt(f);
          p.g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
          p.g.dataset.state = proc;
          if (p === parts[0] && tracking) {
            const P = D.processes.find(x => x.id === proc);
            if (hud.dataset.p !== proc) { hud.dataset.p = proc; hud.innerHTML = `📍 القطرة الآن: <b>${P.icon} ${P.name}</b> · حالتها: <b>${P.state}</b>`; }
          }
        });
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      u.$('#pl-pause', sc).addEventListener('click', e => {
        running = !running; WR.audio.play('click');
        e.currentTarget.textContent = running ? '⏸️' : '▶️';
        e.currentTarget.setAttribute('aria-label', running ? 'إيقاف الحركة مؤقتًا' : 'تشغيل الحركة');
      });
      u.$('#pl-track', sc).addEventListener('click', e => {
        tracking = !tracking; WR.audio.play('click');
        e.currentTarget.setAttribute('aria-pressed', tracking);
        svg.classList.toggle('tracking', tracking);
        hud.hidden = !tracking; hud.dataset.p = '';
        if (tracking) {
          store.award('pl-track', 'star', 'تتبعت قطرة');
          WR.nemo.say('تابع القطرة المضيئة 📍 لاحظ كيف تتغير حالتها: سائل ← غاز ← سائل… لكنها لا تختفي أبدًا!', 'happy');
        }
      });

      panel.insertAdjacentHTML('beforeend', `
        <div class="cycle-strip glass" aria-label="محطات الدورة">
          <span class="cs-sun" aria-hidden="true">☀️</span>
          ${D.processes.map(p => `<button type="button" class="cs-step" data-id="${p.id}"><span aria-hidden="true">${p.icon}</span> ${p.name}<span class="cs-check" aria-hidden="true">✓</span></button>`).join('<span class="cs-arrow" aria-hidden="true">⬅</span>')}
          <span class="cs-arrow" aria-hidden="true">🔁</span>
        </div>
        <p class="muted small">🔍 اكتشفت <b class="ex-count"></b> من ${u.ar(D.processes.length)} محطات</p>
        <div class="card-slot"></div>`);
      const slot = u.$('.card-slot', panel);

      function refresh() {
        u.$('.ex-count', panel).textContent = u.ar(explored.size);
        u.$$('.station', svg).forEach(h => h.classList.toggle('explored', explored.has(h.dataset.id)));
        u.$$('.cs-step', panel).forEach(b => b.classList.toggle('done', explored.has(b.dataset.id)));
        if (explored.size === D.processes.length && !quizStarted) { quizStarted = true; setTimeout(quiz, 900); }
      }
      function open(id) {
        const p = D.processes.find(x => x.id === id);
        WR.audio.play('click');
        u.$$('.station', svg).forEach(h => h.classList.toggle('active', h.dataset.id === id));
        svg.dataset.focus = id;
        if (!quizStarted || explored.size < D.processes.length) {
          slot.innerHTML = `<div class="info-card glass"><div class="info-head"><span class="info-icon" aria-hidden="true">${p.icon}</span><h2>${p.name}</h2></div>
            <p>${p.text}</p><p class="state-tag">حالة الماء هنا: <b>${p.state}</b></p></div>`;
        }
        if (!explored.has(id)) { explored.add(id); store.award('pl-' + id, 'star', `اكتشفت: ${p.name}`); store.answer('pl-' + id, p.concept, true); }
        refresh();
      }
      function quiz() {
        WR.nemo.say('اكتشفت كل المحطات! الآن سؤالان للعالِم 🔬', 'think');
        slot.innerHTML = `<div class="info-card glass"><div class="q1"></div><div class="q2"></div></div>`;
        WR.ui.choices(u.$('.q1', slot), {
          q: D.checkQ.text, options: D.checkQ.options, qid: 'planet-cycle', concept: 'cycle', label: 'مختبر الكوكب: هل تتوقف الدورة؟',
          onCorrect: () => {
            store.discover('دورة المياه مستمرة لا تتوقف، والشمس هي مصدر طاقتها.');
            setTimeout(() => WR.ui.choices(u.$('.q2', slot), {
              q: D.energyQ.text, options: D.energyQ.options, qid: 'planet-energy', concept: 'sun', label: 'مختبر الكوكب: مصدر طاقة الدورة',
              onCorrect: () => {
                WR.nemo.say('أنت الآن عالم دورة مياه حقيقي 🌍 الدورة مستمرة… والشمس تحركها دائمًا.', 'cheer');
                WR.ui.button(slot, '✅ أنهِ المرحلة', () => WR.ui.finishStage('planet', 'دورة المياه <b>مستمرة</b>: تبخر ← تكاثف ← هطول ← تجمع ← تسرب ← عودة… والشمس تحركها ☀️'));
              }
            }), 700);
          }
        });
      }

      u.$$('.station', svg).forEach(h => u.activate(h, () => open(h.dataset.id)));
      u.$$('.cs-step', panel).forEach(b => b.addEventListener('click', () => open(b.dataset.id)));
      WR.nemo.say('هذا كوكب مصغّر 🌍 الماء عليه لا يتوقف عن الحركة! اضغط على كل محطة لتعرف ماذا يحدث فيها.', 'happy');
      slot.innerHTML = `<p class="muted center">👆 اضغط على محطة في الكوكب أو في الشريط أعلاه.</p>`;
      refresh();
      return () => cancelAnimationFrame(raf);
    }
  };
})();
