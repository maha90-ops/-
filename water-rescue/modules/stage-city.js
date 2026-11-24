/* stage-city.js — المرحلة ٧: أنقذ المدينة
   موارد محدودة (١٠ 🪙) وخمسة حلول؛ كل قرار يغيّر المقاييس والمشهد.
   النجاح: تحقيق الأهداف الأربعة معًا ← تتحول المدينة إلى مدينة خضراء مستدامة. */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const D = WR.DATA.city;
  const BUILD = [[150, 80, 170], [240, 70, 220], [320, 90, 150], [420, 70, 240], [500, 90, 180], [600, 80, 205]];

  function scene() {
    const b = BUILD.map(([x, w, h], i) => {
      let win = '';
      for (let yy = 360 - h + 18; yy < 345; yy += 26) for (let xx = x + 12; xx < x + w - 14; xx += 22) win += `<rect x="${xx}" y="${yy}" width="10" height="13" rx="2"/>`;
      return `<g class="bld"><rect x="${x}" y="${360 - h}" width="${w}" height="${h}" rx="6" fill="url(#g-building${i % 2 ? '2' : ''})"/><g fill="#ffe7a3" opacity=".75">${win}</g></g>`;
    }).join('');
    const tank = (x, y, lvl) => `<g class="act act-tanks lv${lvl}"><rect x="${x}" y="${y - 26}" width="34" height="26" rx="8" fill="#9fd8f2" stroke="#fff" stroke-width="2"/><rect x="${x + 4}" y="${y - 14}" width="26" height="10" rx="3" fill="#1aa0dc"/><rect x="${x + 6}" y="${y}" width="4" height="6" fill="#ccc"/><rect x="${x + 24}" y="${y}" width="4" height="6" fill="#ccc"/></g>`;
    const barrel = (x, lvl) => `<g class="act act-harvest lv${lvl}"><path d="M${x + 4} ${360 - 120} L${x + 4} 330" stroke="#c8d4e6" stroke-width="5" fill="none"/><rect x="${x - 10}" y="330" width="28" height="30" rx="6" fill="#2fbf71" stroke="#fff" stroke-width="2"/><text x="${x + 4}" y="351" text-anchor="middle" font-size="14">💧</text></g>`;
    const trees = (lvl, xs) => `<g class="act act-trees lv${lvl}">${xs.map(x => S.tree(x, 398, .7)).join('')}</g>`;
    const infil = (lvl, x) => `<g class="act act-infil lv${lvl}"><rect x="${x}" y="392" width="90" height="12" rx="6" fill="#4caf6d"/><g fill="#7fe6ff">${[10, 30, 50, 70].map(d => `<circle cx="${x + d + 6}" cy="398" r="3"/>`).join('')}</g><g stroke="#4fc3f7" stroke-width="2" stroke-linecap="round" class="infil-arrows">${[20, 50, 80].map(d => `<line x1="${x + d}" y1="408" x2="${x + d}" y2="424"/>`).join('')}</g></g>`;
    return S.wrap('0 0 800 460', `
      <rect width="800" height="460" fill="url(#g-sky)"/>
      <rect class="c-heat" width="800" height="460" fill="#ff7a2f"/>
      ${S.sun(720, 70, 40)}
      <g class="c-haze" fill="none" stroke="#ffd2a0" stroke-width="3" opacity=".6"><path d="M120 120 q 20 -10 40 0 t 40 0 t 40 0"/><path d="M400 100 q 20 -10 40 0 t 40 0 t 40 0"/><path d="M260 70 q 20 -10 40 0 t 40 0"/></g>
      <rect x="0" y="360" width="800" height="40" class="c-ground" fill="url(#g-dry)"/>
      <rect x="0" y="360" width="800" height="40" class="c-green" fill="url(#g-grass)"/>
      <!-- خزان المدينة -->
      <g class="reservoir"><rect x="22" y="290" width="96" height="70" rx="10" fill="#d9e6f2" stroke="#fff" stroke-width="3"/>
        <rect class="res-water" x="28" y="296" width="84" height="58" rx="6" fill="url(#g-lake)"/>
        <text x="70" y="284" text-anchor="middle" font-size="13" fill="#fff">خزان المدينة</text></g>
      ${b}
      ${tank(250, 360 - 220, 1)}${tank(438, 360 - 240, 1)}${tank(160, 360 - 170, 2)}${tank(520, 360 - 180, 2)}
      ${barrel(330, 1)}${barrel(700, 2)}
      <!-- تسريب أنبوب -->
      <g class="leak"><rect x="690" y="345" width="90" height="10" rx="5" fill="#9aa7b8"/><g class="leak-drops">${S.drop(735, 368, .6)}${S.drop(745, 384, .5)}</g><text x="735" y="338" text-anchor="middle" font-size="12" fill="#fff">تسريب!</text></g>
      <g class="fixed-pipe"><text x="735" y="338" text-anchor="middle" font-size="16">🔧✓</text></g>
      <rect x="0" y="400" width="800" height="60" fill="#5e6878"/>
      <g stroke="#f4f4f4" stroke-width="4" stroke-dasharray="26 22" opacity=".7"><line x1="0" y1="432" x2="800" y2="432"/></g>
      ${trees(1, [200, 380, 560])}${trees(2, [290, 470, 650])}
      ${infil(1, 40)}${infil(2, 690)}
      <rect class="c-flood" x="0" y="400" width="800" height="60" fill="#3fa9e8"/>
      <g class="c-banner"><rect x="230" y="20" width="340" height="50" rx="25" fill="#0b2a55" stroke="#5fe39a" stroke-width="2.5"/><text x="400" y="53" text-anchor="middle" font-size="22" fill="#fff" font-weight="700">🌿 مدينة خضراء مستدامة</text></g>
    `, 'مدينة تعاني من أزمة مياه: حرارة مرتفعة، أشجار قليلة، تسريب، وفيضان في الشوارع');
  }

  WR.views.city = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'city');
      sc.innerHTML = scene();
      const svg = sc.querySelector('svg');
      const used = {}; D.actions.forEach(a => { used[a.id] = 0; });
      let solved = false;

      panel.insertAdjacentHTML('beforeend', `
        <div class="info-card glass"><p class="lead">🌍 أنت الآن مهندس الاستدامة.</p><p class="muted">لديك موارد محدودة. أعد التوازن المائي للمدينة.</p>
          <p class="budget">🪙 الموارد المتبقية: <b class="bud-val"></b></p></div>
        <div class="meters glass city-meters">${D.meters.map(m => `<div class="meter" data-k="${m.id}"><span class="m-name"><span aria-hidden="true">${m.icon}</span> ${m.name}</span><div class="m-bar"><span></span><i class="m-goal"></i></div><b class="m-val"></b><small class="m-goal-t">${m.goalText}</small></div>`).join('')}</div>
        <div class="actions">${D.actions.map(a => `
          <div class="action glass" data-id="${a.id}">
            <span class="a-icon" aria-hidden="true">${a.icon}</span>
            <div class="a-text"><b>${a.name}</b><small>🪙 ${u.ar(a.cost)} · <span class="a-used"></span></small></div>
            <div class="a-btns">
              <button type="button" class="btn-icon a-add" aria-label="نفّذ: ${a.name} (التكلفة ${a.cost})">＋</button>
              <button type="button" class="btn-icon a-undo" aria-label="تراجع عن: ${a.name}">↩</button>
            </div>
          </div>`).join('')}</div>
        <div class="btn-row"><button type="button" class="btn btn-primary" id="c-commit">✅ اعتمد الخطة</button><button type="button" class="btn btn-ghost" id="c-reset">🔄 من جديد</button></div>
        <div class="card-slot"></div>`);
      const slot = u.$('.card-slot', panel);

      function values() {
        const v = Object.assign({}, D.start);
        D.actions.forEach(a => Object.entries(a.fx).forEach(([k, d]) => { v[k] += d * used[a.id]; }));
        Object.keys(v).forEach(k => { v[k] = u.clamp(v[k], 0, 100); });
        return v;
      }
      const spent = () => D.actions.reduce((s, a) => s + a.cost * used[a.id], 0);
      const meets = (k, v) => { const [t, n] = D.goals[k]; return t === 'min' ? v >= n : v <= n; };

      function update() {
        const v = values(), left = D.budget - spent();
        u.$('.bud-val', panel).textContent = `${u.ar(left)} من ${u.ar(D.budget)}`;
        D.meters.forEach(m => {
          const el = u.$(`.meter[data-k="${m.id}"]`, panel), ok = meets(m.id, v[m.id]);
          el.querySelector('.m-bar span').style.width = v[m.id] + '%';
          el.querySelector('.m-goal').style.insetInlineStart = D.goals[m.id][1] + '%';
          el.querySelector('.m-val').textContent = `${u.ar(v[m.id])} ${ok ? '✓' : ''}`;
          el.classList.toggle('ok', ok);
          el.setAttribute('aria-label', `${m.name}: ${v[m.id]}. ${m.goalText}. ${ok ? 'تحقق الهدف' : 'لم يتحقق بعد'}`);
        });
        D.actions.forEach(a => {
          const card = u.$(`.action[data-id="${a.id}"]`, panel);
          card.querySelector('.a-used').textContent = `نُفّذ ${u.ar(used[a.id])} من ${u.ar(a.max)}`;
          card.querySelector('.a-add').disabled = solved || used[a.id] >= a.max || a.cost > left;
          card.querySelector('.a-undo').disabled = solved || used[a.id] === 0;
          card.classList.toggle('active', used[a.id] > 0);
          for (let l = 1; l <= 2; l++) svg.classList.toggle(`${a.id}-${l}`, used[a.id] >= l);
        });
        const st = svg.style;
        st.setProperty('--heat', (v.heat / 100) * 0.4);
        st.setProperty('--green', v.green / 100);
        st.setProperty('--flood', v.flood / 100);
        const rw = svg.querySelector('.res-water'), h = 58 * v.water / 100;
        rw.setAttribute('y', 296 + 58 - h); rw.setAttribute('height', Math.max(2, h));
      }

      D.actions.forEach(a => {
        const card = u.$(`.action[data-id="${a.id}"]`, panel);
        card.querySelector('.a-add').addEventListener('click', () => {
          used[a.id]++; WR.audio.play(a.id === 'harvest' || a.id === 'tanks' ? 'drop' : 'bubble');
          if (used[a.id] === 1) store.award('city-' + a.id, 'leaf', `جربت: ${a.name}`);
          WR.nemo.say(`${a.icon} ${a.why}`, 'happy');
          update();
          if (D.budget - spent() === 0) WR.nemo.say(`${a.icon} ${a.why} — ${D.hints.budget}`, 'think');
        });
        card.querySelector('.a-undo').addEventListener('click', () => { used[a.id]--; WR.audio.play('click'); update(); });
      });
      u.$('#c-reset', panel).addEventListener('click', () => { if (solved) return; D.actions.forEach(a => { used[a.id] = 0; }); WR.audio.play('click'); update(); WR.nemo.say('خطة جديدة! فكّر: أيّ مشكلة أخطر في المدينة؟', 'think'); });
      u.$('#c-commit', panel).addEventListener('click', () => {
        if (solved) return;
        const v = values();
        const miss = D.meters.map(m => m.id).filter(k => !meets(k, v[k]));
        store.answer('city-plan', 'saving', miss.length === 0, 'أنقذ المدينة: خطة التوازن المائي');
        if (miss.length) {
          WR.audio.play('soft');
          WR.nemo.say(`💙 خطة جيدة، لكنها لم تكتمل بعد. ${D.hints[miss[0]]}`, 'think');
          slot.innerHTML = `<div class="fb fb-try">ما زالت ${u.ar(miss.length)} من الأهداف لم تتحقق: ${miss.map(k => D.meters.find(m => m.id === k).icon + ' ' + D.meters.find(m => m.id === k).name).join('، ')}</div>`;
          return;
        }
        solved = true; update();
        svg.classList.add('sustainable');
        WR.audio.play('success'); WR.audio.loop('rain', true); setTimeout(() => WR.audio.loop('rain', false), 2500);
        store.discover('نحافظ على الماء بزراعة الأشجار، وجمع المطر، وتقليل الهدر، وترك مساحات يتسرب فيها الماء.');
        WR.nemo.say('🎉 أنقذت المدينة! انظر: أشجار تظلل الشوارع، ومطر يُجمع، وماء يتسرب إلى التربة بدل أن يُغرق الطرقات.', 'cheer');
        slot.innerHTML = `<div class="concept-reveal"><span aria-hidden="true">🌿</span><div><b>مدينة مستدامة</b><p>عندما نتعاون مع دورة المياه بدل أن نعطلها، نحافظ على الماء للجميع.</p></div></div>`;
        WR.ui.button(slot, '✅ أنهِ المرحلة', () => WR.ui.finishStage('city', 'أعدت التوازن المائي للمدينة بخطة ذكية وموارد محدودة 🏙️🌳'));
      });

      WR.nemo.say('🚨 المدينة في أزمة: حرّ شديد، أشجار قليلة، تسريب في الأنابيب، والمطر يُغرق الشوارع! اختر حلولك بحكمة: الموارد ١٠ فقط.', 'alert');
      update();
    }
  };
})();
