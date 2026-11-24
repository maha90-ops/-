/* stage-investigate.js — المرحلة ٢: غرفة التحقيق «أين اختفت المياه؟»
   خمسة أدلة ← خمس قطع للحل ← الاستنتاج المركزي: الماء لا يختفي بل ينتقل */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const D = WR.DATA.investigate;

  function scene() {
    const clue = (id, label, inner, hit, mx, my) =>
      `<g class="hotspot clue" data-id="${id}" tabindex="0" role="button" aria-label="دليل ${label}: اضغط للفحص">${inner}${hit}${S.marker(mx, my, '🔎')}</g>`;
    return S.wrap('0 0 800 480', `
      <rect width="800" height="480" fill="url(#g-sky)"/>
      ${S.mountain(-40, 330, 360, 200, true, 'g-mount2')}${S.mountain(150, 330, 260, 150, false)}
      ${clue('sun', 'الشمس', S.sun(700, 80, 42) + S.thermo(620, 40, 70, .9), '<circle class="hs-hit" cx="690" cy="80" r="72"/>', 640, 150)}
      ${clue('clouds', 'السحب', `<g class="drift">${S.cloud(400, 90, .9)}${S.cloud(520, 120, .6)}</g>`, '<rect class="hs-hit" x="300" y="40" width="280" height="120" rx="30"/>', 440, 150)}
      <path d="M0 320 C 200 300 600 300 800 320 L800 400 L0 400Z" fill="url(#g-grass)"/>
      <g class="lake">
        <ellipse cx="400" cy="345" rx="210" ry="42" fill="#c9b27a"/>
        <ellipse class="lake-water" cx="400" cy="347" rx="196" ry="34" fill="url(#g-lake)"/>
        <ellipse cx="400" cy="345" rx="206" ry="40" fill="none" stroke="#ff6b6b" stroke-width="2.5" stroke-dasharray="8 6"/>
        <text x="400" y="306" text-anchor="middle" font-size="14" fill="#fff" class="lvl-tag">— مستوى الأمس —</text>
      </g>
      <g class="inv-vapor" aria-hidden="true">${S.vapor(260, 540, 330, 200, 10)}</g>
      ${clue('trees', 'الأشجار', S.tree(660, 330, 1.1) + S.tree(720, 336, .9) + '<g class="roots" stroke="#7a4b2a" stroke-width="3" fill="none" stroke-linecap="round"><path d="M660 332 C 650 360 620 380 600 400"/><path d="M660 332 C 668 370 660 400 650 430"/><path d="M720 338 C 700 370 680 400 690 440"/></g>', '<rect class="hs-hit" x="620" y="250" width="140" height="160" rx="20"/>', 760, 260)}
      ${clue('river', 'النهر', '<path d="M196 350 C 150 360 120 352 80 366 C 50 376 20 372 0 380 L0 394 C 30 388 60 392 90 380 C 130 366 160 372 204 360Z" fill="url(#g-lake)"/><path class="river-flow" d="M190 356 C 150 364 110 360 60 376 C 40 382 20 384 0 388" fill="none" stroke="#c5f4ff" stroke-width="2.5" stroke-dasharray="8 12"/>', '<rect class="hs-hit" x="0" y="330" width="210" height="70" rx="16"/>', 80, 330)}
      ${clue('soil', 'التربة', '<rect x="0" y="400" width="800" height="80" fill="url(#g-soil)"/><g class="soil-wet" fill="#3fb7ff" opacity=".6"><circle cx="300" cy="420" r="4"/><circle cx="360" cy="440" r="3"/><circle cx="420" cy="425" r="4"/><circle cx="480" cy="450" r="3"/><circle cx="520" cy="430" r="4"/><circle cx="250" cy="455" r="3"/></g><text x="120" y="450" font-size="14" fill="#f3e2cf">باطن التربة</text>', '<rect class="hs-hit" x="200" y="400" width="400" height="80"/>', 400, 456)}
      <g class="inv-arrows" aria-hidden="true" fill="none" stroke-width="4" stroke-linecap="round">
        <path class="ar-up" d="M400 320 L400 170" stroke="#ffffff"/><path class="ar-soil" d="M330 360 L330 440" stroke="#3fb7ff"/>
        <path class="ar-tree" d="M560 360 C 600 360 630 340 650 330" stroke="#5fe39a"/><path class="ar-river" d="M200 360 L60 380" stroke="#7fe6ff"/>
      </g>
    `, 'مشهد بحيرة انخفض ماؤها، مع الشمس والسحب والأشجار والنهر والتربة');
  }

  WR.views.investigate = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'investigate');
      sc.innerHTML = scene();
      const svg = sc.querySelector('svg');
      const fresh = !store.isDone('investigate');
      const solved = new Set(fresh ? D.clues.filter(c => store.state.awarded['inv-' + c.id]).map(c => c.id) : []);
      let finalDone = false;

      // انخفاض مستوى البحيرة أمام الطالب
      requestAnimationFrame(() => setTimeout(() => svg.classList.add('lake-dropped'), 600));

      panel.insertAdjacentHTML('beforeend', `
        <div class="mystery glass"><b>🚨 لغز:</b> ${D.mystery}</div>
        <div class="evidence-board" aria-label="لوحة الأدلة">
          <h3>🧩 لوحة الحل <small class="ev-count"></small></h3>
          <ol class="pieces">${D.clues.map(c => `<li class="piece" data-id="${c.id}"><span class="piece-icon" aria-hidden="true">${c.icon}</span><span class="piece-text">؟ دليل لم يُكتشف بعد</span></li>`).join('')}</ol>
        </div>
        <div class="card-slot"></div>`);
      const slot = u.$('.card-slot', panel);

      function refresh() {
        u.$('.ev-count', panel).textContent = `(${u.ar(solved.size)} من ${u.ar(D.clues.length)})`;
        D.clues.forEach(c => {
          const li = u.$(`.piece[data-id="${c.id}"]`, panel);
          const has = solved.has(c.id);
          li.classList.toggle('found', has);
          li.querySelector('.piece-text').textContent = has ? c.piece : '؟ دليل لم يُكتشف بعد';
          const h = u.$(`.hotspot[data-id="${c.id}"]`, svg); h.classList.toggle('explored', has);
        });
        svg.classList.toggle('show-up', solved.has('sun') || solved.has('clouds'));
        svg.classList.toggle('show-soil', solved.has('soil'));
        svg.classList.toggle('show-tree', solved.has('trees'));
        svg.classList.toggle('show-river', solved.has('river'));
        if (solved.size === D.clues.length && !finalDone) askFinal();
      }

      function open(id) {
        if (finalDone) return;
        const c = D.clues.find(x => x.id === id);
        WR.audio.play('click');
        u.$$('.hotspot', svg).forEach(h => h.classList.toggle('active', h.dataset.id === id));
        if (solved.has(id)) { slot.innerHTML = `<div class="info-card glass"><p>✓ فحصت هذا الدليل: ${c.piece}</p></div>`; return; }
        slot.innerHTML = `<div class="info-card glass evidence-card"><div class="info-head"><span class="info-icon" aria-hidden="true">${c.icon}</span><h2>دليل: ${c.name}</h2></div>
          <p class="evidence">🔎 ${c.evidence}</p><div class="info-q"></div></div>`;
        WR.nemo.say('لاحظ الدليل جيدًا… ماذا يخبرك عن الماء المفقود؟', 'think');
        WR.ui.choices(u.$('.info-q', slot), {
          q: c.q, options: c.options, qid: 'inv-' + c.id, concept: c.concept, label: `غرفة التحقيق — دليل ${c.name}: ${c.q}`,
          onCorrect: () => {
            solved.add(c.id);
            store.award('inv-' + c.id, 'star', 'اكتشفت دليلًا');
            setTimeout(() => { if (solved.size < D.clues.length) slot.innerHTML = `<p class="muted center">🧩 أضيفت قطعة إلى لوحة الحل. ابحث عن 🔎 دليل آخر.</p>`; refresh(); }, 1100);
          }
        });
        if (window.innerWidth < 960) slot.scrollIntoView({ behavior: u.reduced() ? 'auto' : 'smooth', block: 'nearest' });
      }

      function askFinal() {
        finalDone = true;
        WR.audio.play('alert');
        WR.nemo.say('جمعت كل الأدلة! 🕵️ انظر إلى لوحة الحل… ما الذي تخبرنا به القطع الخمس معًا؟', 'think');
        slot.innerHTML = `<div class="info-card glass final-card"><h2>🧠 لحظة الاستنتاج</h2><div class="info-q"></div></div>`;
        WR.ui.choices(u.$('.info-q', slot), {
          q: D.finalQ, options: D.finalOptions, qid: 'inv-final', concept: 'conservation', label: 'غرفة التحقيق: الاستنتاج النهائي',
          onCorrect: () => {
            svg.classList.add('solved');
            store.discover(D.conclusion);
            store.award('inv-final', 'leaf', 'حللت اللغز');
            slot.insertAdjacentHTML('beforeend', `
              <div class="big-conclusion" role="note">
                <span class="bc-icon" aria-hidden="true">💡</span>
                <p><b>الماء لم يختفِ.</b><br>لقد انتقل من مكان إلى آخر وتغيرت حالته.</p>
                <ul class="bc-list"><li>☁️ إلى الهواء بخارًا</li><li>🟫 إلى باطن التربة</li><li>🌳 إلى النباتات</li><li>🏞️ مع النهر إلى الوادي</li></ul>
              </div>`);
            WR.nemo.say('هذا أهم اكتشاف في المهمة كلها: الماء لا يختفي، بل ينتقل ويتغير! 💙 احفظه في ذاكرتك.', 'cheer');
            WR.ui.button(slot, '✅ أنهِ التحقيق', () => WR.ui.finishStage('investigate', 'حللت اللغز: <b>الماء لا يختفي، بل ينتقل من مكان إلى آخر وتتغير حالته.</b>'));
          }
        });
      }

      u.$$('.hotspot', svg).forEach(h => u.activate(h, () => open(h.dataset.id)));
      WR.nemo.say(solved.size ? 'تابع التحقيق: ما زالت هناك أدلة 🔎 لم تفحصها.' : 'محقق جديد! 🕵️ راقب البحيرة… مستواها ينخفض. ابحث عن العلامات 🔎 في المشهد.', 'alert');
      slot.innerHTML = `<p class="muted center">👆 اضغط على علامة 🔎 لفحص الدليل.</p>`;
      refresh();
    }
  };
})();
