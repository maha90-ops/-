/* stage-whatif.js — المرحلة ٦: ماذا لو؟ (التفكير العلمي)
   توقّع ← شغّل المحاكاة ← قارن توقعك بالنتيجة. لا «صح/خطأ» جاف، بل مقارنة مرئية. */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const D = WR.DATA.whatif;
  const BASE = { sun: 1, lake: 65, soil: 60, clouds: 45, forest: 1, rain: 'light', ground: 60, evap: 50 };
  const METERS = [
    { k: 'lake', icon: '🏞️', name: 'مستوى البحيرة' },
    { k: 'soil', icon: '🟫', name: 'رطوبة التربة' },
    { k: 'ground', icon: '💧', name: 'المياه الجوفية' },
    { k: 'evap', icon: '♨️', name: 'التبخر' }
  ];
  const TREES = [[430, 360, .9], [470, 368, .8], [515, 358, 1], [560, 366, .85], [610, 356, .95], [655, 364, .8]];

  function scene() {
    const clouds = [[200, 90, .8], [360, 70, 1], [520, 95, .85], [640, 75, .7]].map(([x, y, s], i) =>
      `<g class="wi-cloud wi-c${i}"><g class="drift">${S.cloud(x, y, s)}</g><g class="wi-dark">${S.cloud(x, y, s, '', true)}</g></g>`).join('');
    const trees = TREES.map(([x, y, s], i) => `<g class="wi-tree" data-i="${i}">${S.tree(x, y, s)}<g class="stump"><rect x="${x - 6}" y="${y - 10}" width="12" height="10" rx="2" fill="#8a5a36"/><ellipse cx="${x}" cy="${y - 10}" rx="6" ry="2.5" fill="#d9b48a"/></g></g>`).join('');
    return S.wrap('0 0 800 460', `
      <rect width="800" height="460" fill="url(#g-sky)"/>
      <rect class="wi-heat" width="800" height="460" fill="#ff8a3c"/>
      <rect class="wi-gray" width="800" height="460" fill="#4d5d74"/>
      <g class="wi-sun">${S.sun(90, 80, 42)}</g>
      ${clouds}
      <g class="wi-rain-light">${S.rain(150, 700, 120, 250, 14)}</g>
      <g class="wi-rain-heavy">${S.rain(120, 720, 110, 260, 46)}</g>
      <g class="wi-vapor">${S.vapor(110, 330, 350, 220, 12)}</g>
      <path d="M0 340 C 200 330 600 336 800 330 L800 400 L0 400Z" fill="url(#g-grass)"/>
      <path class="wi-dryland" d="M0 340 C 200 330 600 336 800 330 L800 400 L0 400Z" fill="url(#g-dry)"/>
      <ellipse cx="220" cy="362" rx="190" ry="40" fill="#c9b27a"/>
      <ellipse class="wi-lake" cx="220" cy="364" rx="150" ry="28" fill="url(#g-lake)"/>
      ${trees}
      <g class="wi-runoff"><path d="M760 340 C 700 350 640 372 560 380 C 480 388 420 376 380 372" fill="none" stroke="#9b6b3f" stroke-width="10" stroke-linecap="round" opacity=".85"/>
        <g fill="#9b6b3f"><path d="M600 368 l-16 4 10 10z"/><path d="M470 378 l-16 2 12 10z"/></g></g>
      <rect x="0" y="400" width="800" height="60" fill="url(#g-soil)"/>
      <rect class="wi-soilwet" x="0" y="400" width="800" height="60" fill="#3fa9ff"/>
      <rect class="wi-ground" x="0" y="440" width="800" height="20" fill="url(#g-ground-water)"/>
      <text x="785" y="420" text-anchor="end" font-size="13" fill="#f3e2cf">التربة</text><text x="785" y="455" text-anchor="end" font-size="13" fill="#cfefff">مياه جوفية</text>
      <path class="wi-flood" d="M0 330 C 150 320 300 326 460 318 C 600 312 700 322 800 318 L800 400 L0 400Z" fill="#4fb6e6"/>
    `, 'محاكاة بيئية: بحيرة وغابة وتربة ومياه جوفية تتغير حسب السيناريو');
  }

  WR.views.whatif = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'whatif');
      sc.innerHTML = scene() + '<div class="scene-label" aria-hidden="true"></div>';
      const svg = sc.querySelector('svg');
      let cur = Object.assign({}, BASE), raf = null, idx = 0, timers = [];
      const doneSet = new Set(store.isDone('whatif') ? [] : D.scenarios.filter(s => store.state.awarded['wi-' + s.id]).map(s => s.id));
      idx = D.scenarios.findIndex(s => !doneSet.has(s.id)); if (idx < 0) idx = 0;

      panel.insertAdjacentHTML('beforeend', `
        <div class="sc-tabs" role="list">${D.scenarios.map((s, i) => `<span role="listitem" class="sc-tab" data-i="${i}"><span aria-hidden="true">${s.icon}</span><span class="sr-only">سيناريو ${i + 1}</span><b>${u.ar(i + 1)}</b></span>`).join('')}</div>
        <div class="meters glass">${METERS.map(m => `<div class="meter" data-k="${m.k}"><span class="m-name"><span aria-hidden="true">${m.icon}</span> ${m.name}</span><div class="m-bar"><span></span><i class="m-base" title="الوضع الطبيعي"></i></div><b class="m-val"></b></div>`).join('')}
          <small class="muted">الخط الأبيض ▏ = الوضع الطبيعي قبل التغيير</small></div>
        <div class="card-slot"></div>`);
      const slot = u.$('.card-slot', panel);

      function apply(v) {
        const st = svg.style;
        st.setProperty('--sunk', v.sun);
        st.setProperty('--heat', u.clamp((v.sun - 1) * 0.6, 0, 0.35));
        st.setProperty('--gray', v.rain === 'heavy' || v.rain === 'storm' ? 0.45 : 0);
        st.setProperty('--vapor', v.evap / 100);
        st.setProperty('--wet', v.soil / 100 * 0.55);
        st.setProperty('--dry', u.clamp((40 - v.soil) / 40, 0, 1));
        const lake = svg.querySelector('.wi-lake');
        lake.setAttribute('rx', (40 + 1.5 * v.lake).toFixed(1));
        lake.setAttribute('ry', (6 + 0.32 * v.lake).toFixed(1));
        const g = svg.querySelector('.wi-ground'), gh = 6 + v.ground / 100 * 34;
        g.setAttribute('y', 460 - gh); g.setAttribute('height', gh);
        const nC = Math.max(0, Math.round(v.clouds / 25));
        u.$$('.wi-cloud', svg).forEach((c, i) => { c.classList.toggle('on', i < nC); c.classList.toggle('dark', v.rain === 'heavy' || v.rain === 'storm'); });
        const nT = Math.round(v.forest * TREES.length);
        u.$$('.wi-tree', svg).forEach((t, i) => t.classList.toggle('cut', i >= nT));
        svg.classList.toggle('wilt', v.soil < 20);
        svg.dataset.rain = v.rain;
        svg.classList.toggle('runoff', !!v.runoff);
        svg.classList.toggle('flood', !!v.flood);
        METERS.forEach(m => {
          const el = u.$(`.meter[data-k="${m.k}"]`, panel), val = Math.round(v[m.k]);
          el.querySelector('.m-bar span').style.width = val + '%';
          el.querySelector('.m-base').style.insetInlineStart = BASE[m.k] + '%';
          const diff = val - BASE[m.k];
          el.querySelector('.m-val').textContent = `${u.ar(val)}${Math.abs(diff) >= 5 ? (diff > 0 ? ' ▲' : ' ▼') : ''}`;
          el.setAttribute('aria-label', `${m.name}: ${val}${diff >= 5 ? '، ارتفع' : diff <= -5 ? '، انخفض' : ''}`);
        });
      }
      function tween(target, ms, done) {
        cancelAnimationFrame(raf);
        const from = Object.assign({}, cur), t0 = performance.now(), dur = u.reduced() ? 300 : ms;
        Object.assign(cur, { rain: target.rain, runoff: target.runoff, flood: target.flood, forest: from.forest });
        const step = now => {
          const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          ['sun', 'lake', 'soil', 'clouds', 'forest', 'ground', 'evap'].forEach(key => { cur[key] = from[key] + (target[key] - from[key]) * e; });
          apply(cur);
          if (k < 1) raf = requestAnimationFrame(step); else if (done) done();
        };
        raf = requestAnimationFrame(step);
      }

      function tabs() {
        u.$$('.sc-tab', panel).forEach((t, i) => {
          t.classList.toggle('done', doneSet.has(D.scenarios[i].id));
          t.classList.toggle('current', i === idx);
        });
      }

      function showScenario() {
        const s = D.scenarios[idx];
        tabs();
        let choice = null;
        slot.innerHTML = `<div class="info-card glass scenario">
            <p class="sc-n">⚠️ سيناريو ${u.ar(idx + 1)} من ${u.ar(D.scenarios.length)}</p>
            <h2>${s.icon} ${s.title}</h2>
            <p class="muted">١) اختر توقعك:</p>
            <div class="opts predict" role="radiogroup" aria-label="توقعك">${u.shuffle(s.options).map(o => `<button type="button" class="opt" role="radio" aria-checked="false" data-ok="${!!o.ok}"><span class="opt-text">${o.t}</span><span class="opt-mark" aria-hidden="true"></span></button>`).join('')}</div>
            <p class="muted">٢) شغّل المحاكاة وراقب المشهد والمقاييس:</p>
            <button type="button" class="btn btn-primary run-btn" disabled>▶ شغّل المحاكاة</button>
            <div class="result" aria-live="polite"></div>
          </div>`;
        WR.nemo.say('العالِم الحقيقي يتوقع أولًا 🤔 ثم يجرّب. ما توقعك؟', 'think');
        const run = u.$('.run-btn', slot);
        u.$$('.predict .opt', slot).forEach(b => b.addEventListener('click', () => {
          if (run.dataset.used) return;
          u.$$('.predict .opt', slot).forEach(x => { x.classList.remove('chosen'); x.setAttribute('aria-checked', 'false'); x.querySelector('.opt-mark').textContent = ''; });
          b.classList.add('chosen'); b.setAttribute('aria-checked', 'true'); b.querySelector('.opt-mark').textContent = '●';
          choice = b; run.disabled = false; WR.audio.play('click');
        }));
        run.addEventListener('click', () => {
          run.dataset.used = '1'; run.disabled = true; run.textContent = '⏳ المحاكاة تعمل…';
          u.$$('.predict .opt', slot).forEach(x => { x.disabled = true; });
          WR.audio.play('whoosh');
          if (s.sim.rain === 'heavy' || s.sim.rain === 'storm') WR.audio.loop('rain', true);
          if (s.id === 'hot' || s.id === 'dry') WR.audio.loop('wind', true);
          const lbl = u.$('.scene-label', sc); lbl.textContent = `${s.icon} محاكاة: ${s.title.replace('ماذا يحدث إذا ', '').replace('؟', '')}`; lbl.classList.add('show');
          tween(s.sim, 2600, () => result(s, choice));
        });
      }

      function result(s, choice) {
        const ok = choice.dataset.ok === 'true';
        store.answer('whatif-' + s.id, 'impact', ok, `ماذا لو؟ ${s.title}`);
        const right = u.$$('.predict .opt', slot).find(x => x.dataset.ok === 'true');
        right.classList.add('is-right'); right.querySelector('.opt-mark').textContent = '✓';
        u.$('.result', slot).innerHTML = `
          <div class="compare">
            <div><small>توقعك</small><p>${choice.querySelector('.opt-text').textContent}</p></div>
            <div><small>ما حدث في المحاكاة</small><p>${s.result}</p></div>
          </div>
          <div class="fb ${ok ? 'fb-ok' : 'fb-try'}">${ok ? '✓ توقعك يطابق النتيجة! تفكير علمي رائع.' : '🔍 النتيجة مختلفة عن توقعك — وهذا ما يفعله العلماء: يتعلمون من التجربة! قارن بين المقاييس قبل التغيير وبعده.'}</div>`;
        WR.nemo.say(ok ? '👏 توقع دقيق! لاحظ كيف تغيرت المقاييس.' : '💙 لا بأس! انظر إلى الأسهم ▲▼ بجانب المقاييس لتعرف ماذا تغيّر.', ok ? 'happy' : 'think');
        doneSet.add(s.id);
        store.award('wi-' + s.id, 'leaf', 'فهمت أثرًا بيئيًا');
        tabs();
        const box = u.$('.result', slot);
        if (idx < D.scenarios.length - 1) {
          WR.ui.button(box, 'السيناريو التالي ⬅', () => {
            WR.audio.stopAll(); u.$('.scene-label', sc).classList.remove('show');
            idx++; tween(BASE, 900, () => {}); showScenario();
          });
        } else if (D.scenarios.every(x => doneSet.has(x.id))) {
          store.discover('التغيرات البيئية والإنسانية تؤثر في دورة المياه: الحرارة، والغابات، وكمية الأمطار.');
          WR.ui.button(box, '✅ أنهِ المرحلة', () => WR.ui.finishStage('whatif', 'أي تغيير في الحرارة أو الغابات أو الأمطار يغيّر رحلة الماء. حماية البيئة = حماية الماء 🌱'));
        } else {
          idx = D.scenarios.findIndex(x => !doneSet.has(x.id));
          WR.ui.button(box, 'السيناريو المتبقي ⬅', () => { WR.audio.stopAll(); tween(BASE, 900); showScenario(); });
        }
      }

      apply(cur);
      showScenario();
      return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    }
  };
})();
