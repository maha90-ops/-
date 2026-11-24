/* stage-lab.js — المرحلة ١: مختبر الماء السري
   يستكشف الطالب ٧ عناصر؛ سؤال الشمس يوقظ محاكاة التبخر */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const D = WR.DATA.lab;

  function scene() {
    const hs = (id, label, inner, hit, mx, my) =>
      `<g class="hotspot" data-id="${id}" tabindex="0" role="button" aria-label="${label}: اضغط للاستكشاف">${inner}${hit}${S.marker(mx, my, '🔍')}</g>`;
    return S.wrap('0 0 800 480', `
      <rect width="800" height="480" fill="url(#g-sky)"/>
      ${hs('sun', 'الشمس', S.sun(724, 78, 40), '<circle class="hs-hit" cx="724" cy="78" r="64"/>', 668, 130)}
      ${hs('cloud', 'السحابة', `<g class="drift">${S.cloud(250, 100, 1.1)}</g>`, '<ellipse class="hs-hit" cx="250" cy="96" rx="90" ry="50"/>', 320, 140)}
      ${hs('mountain', 'الجبل', S.mountain(470, 390, 330, 250, true) + S.mountain(640, 390, 200, 150, true, 'g-mount2'), '<path class="hs-hit" d="M470 390 L635 140 L800 390Z"/>', 700, 250)}
      ${hs('rain', 'المطر', `<g class="drift slow">${S.cloud(470, 165, .75, '', true)}</g>${S.rain(430, 515, 190, 150, 12)}`, '<rect class="hs-hit" x="410" y="125" width="130" height="200" rx="20"/>', 540, 175)}
      <path d="M300 372 C 420 352 520 360 800 350 L800 480 L300 480 Z" fill="url(#g-grass)"/>
      ${hs('river', 'النهر', '<path class="river-path" d="M600 352 C 560 380 520 372 480 392 C 440 412 400 400 330 418 L320 440 C 400 424 450 432 490 410 C 530 392 570 400 612 360 Z" fill="url(#g-lake)"/><path class="river-flow" d="M598 360 C 560 384 520 380 480 400 C 440 418 400 410 326 428" fill="none" stroke="#c5f4ff" stroke-width="3" stroke-dasharray="10 14"/>',
        '<path class="hs-hit" d="M300 400 L620 340 L630 380 L310 460Z"/>', 450, 440)}
      ${hs('trees', 'الأشجار', S.tree(560, 395, 1) + S.tree(612, 400, .85) + S.tree(660, 392, 1.05), '<rect class="hs-hit" x="530" y="310" width="160" height="100" rx="20"/>', 720, 330)}
      ${hs('ocean', 'المحيط', S.waves(0, 360, 330, 120) + '<path d="M300 360 C 330 362 340 372 330 480 L300 480Z" fill="#e8d29a"/>', '<rect class="hs-hit" x="0" y="360" width="320" height="120"/>', 150, 420)}
      <g class="lab-vapor" aria-hidden="true">${S.vapor(30, 300, 370, 230, 16)}</g>
      <g class="lab-label" aria-hidden="true"><rect x="70" y="250" width="180" height="50" rx="25" fill="#0b2a55" stroke="#5ff2ff" stroke-width="2"/><text x="160" y="283" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">💧 التبخر</text></g>
    `, 'مشهد طبيعي يحتوي على الشمس والمحيط والجبال والأشجار والسحب والمطر والنهر');
  }

  WR.views.lab = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'lab');
      sc.innerHTML = scene();
      const svg = sc.querySelector('svg');
      const fresh = !store.isDone('lab');
      const explored = new Set(fresh ? D.elements.filter(e => store.state.awarded['lab-' + e.id]).map(e => e.id) : []);
      let evaporated = explored.has('sun');

      panel.insertAdjacentHTML('beforeend', `
        <div class="explore-tracker"><span>🔍 اكتشفت <b class="ex-count">٠</b> من ${u.ar(D.elements.length)}</span>
          <div class="ex-chips">${D.elements.map(e => `<span class="ex-chip" data-id="${e.id}" title="${e.name}"><span aria-hidden="true">${e.icon}</span><span class="sr-only">${e.name}</span></span>`).join('')}</div></div>
        <div class="card-slot"></div>`);
      const slot = u.$('.card-slot', panel);

      function refresh() {
        u.$('.ex-count', panel).textContent = u.ar(explored.size);
        u.$$('.ex-chip', panel).forEach(c => c.classList.toggle('done', explored.has(c.dataset.id)));
        u.$$('.hotspot', svg).forEach(h => h.classList.toggle('explored', explored.has(h.dataset.id)));
        svg.classList.toggle('evaporating', evaporated);
      }
      refresh();
      WR.nemo.say(explored.size ? 'عدنا إلى المختبر! تابع اكتشاف العناصر المتبقية 🔍' : 'هذا مختبري السري! كل عنصر في الطبيعة يخفي سرًّا عن الماء. اضغط على العناصر المضيئة 🔍', 'happy');

      function markExplored(el) {
        if (!explored.has(el.id)) {
          explored.add(el.id);
          store.award('lab-' + el.id, 'star', `اكتشفت: ${el.name}`);
        }
        refresh();
        if (explored.size === D.elements.length) {
          slot.innerHTML = `<div class="info-card glass done-card"><p class="lead">🎉 اكتشفت كل عناصر المختبر!</p>
            <p>لاحظت أن <b>الشمس</b> تحرّك الماء: تسخّنه فيتبخر ويصعد إلى الهواء.</p></div>`;
          WR.nemo.say('عمل رائع يا خبير! هل لاحظت؟ كل العناصر مرتبطة بالماء… والشمس هي التي تبدأ الحركة ☀️', 'cheer');
          WR.ui.button(slot, '✅ أنهِ المرحلة', () => WR.ui.finishStage('lab', 'الشمس تسخّن ماء المحيط فيتحول إلى بخار يصعد إلى الهواء: هذا هو <b>التبخر</b> 💧'));
        }
      }

      function open(id) {
        const el = D.elements.find(e => e.id === id);
        WR.audio.play('click');
        u.$$('.hotspot', svg).forEach(h => h.classList.toggle('active', h.dataset.id === id));
        slot.innerHTML = `<div class="info-card glass"><div class="info-head"><span class="info-icon" aria-hidden="true">${el.icon}</span><h2>${el.name}</h2></div>
          <p class="speech">«${el.text}»</p><div class="info-q"></div></div>`;
        const qBox = u.$('.info-q', slot);
        if (el.q) {
          WR.nemo.say(el.id === 'sun' ? 'الشمس تسخّن سطح البحر… هل تتوقع أن تبقى المياه في مكانها؟ 🤔' : 'فكّر جيدًا ثم اختر 🤔', 'think');
          WR.ui.choices(qBox, {
            q: el.q.text, options: el.q.options, qid: 'lab-' + el.id, concept: el.q.concept, label: `مختبر الماء: ${el.q.text}`,
            onCorrect: () => {
              if (el.reveal === 'evaporation') {
                evaporated = true; refresh();
                WR.audio.play('whoosh');
                store.discover('الشمس تسخّن الماء فيتبخر ويصعد إلى الهواء.');
                qBox.insertAdjacentHTML('beforeend', `<div class="concept-reveal"><span aria-hidden="true">💧</span><div><b>التبخر</b><p>تحوّل الماء من سائل إلى بخار (غاز) بسبب الحرارة. انظر إلى البخار يصعد من المحيط!</p></div></div>`);
                WR.nemo.say('🎉 ممتاز! انظر إلى المحيط… الماء يصعد بخارًا! هذا هو التبخر 💧', 'cheer');
              }
              markExplored(el);
            }
          });
        } else {
          WR.nemo.say(`${el.icon} ${el.name} يخبرك بسرّ. اقرأه ثم تابع.`, 'idle');
          WR.ui.button(qBox, '👍 فهمت', () => { markExplored(el); if (explored.size < D.elements.length) slot.innerHTML = `<p class="muted center">اختر عنصرًا آخر من المشهد 🔍</p>`; }, 'btn-ghost');
        }
        if (window.innerWidth < 960) slot.scrollIntoView({ behavior: u.reduced() ? 'auto' : 'smooth', block: 'nearest' });
      }

      u.$$('.hotspot', svg).forEach(h => u.activate(h, () => open(h.dataset.id)));
      if (explored.size === D.elements.length) markExplored(D.elements[0]);
      else slot.innerHTML = `<p class="muted center">👆 اضغط على أي عنصر في المشهد لتبدأ.</p>`;
    }
  };
})();
