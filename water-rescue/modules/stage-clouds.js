/* stage-clouds.js — المرحلة ٣: مصنع السحب
   يسحب الطالب جزيئات البخار إلى الأعلى ← تقل الحرارة ← تتكاثف ← تتكون سحابة ← الهطول
   بديل لوحة المفاتيح/اللمس: الضغط على الجزيء يرفعه تلقائيًا، والأسهم ↑↓ تحركه */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const D = WR.DATA.clouds;
  const SEA = 0.14, BAND = (1 - SEA) / D.layers.length;

  const bandOf = y => u.clamp(Math.floor((y - SEA) / BAND), 0, D.layers.length - 1);
  const condY = SEA + BAND * D.layers.findIndex(l => l.temp < D.condenseBelow);
  /** درجة حرارة باتجاه ثابت (يسار←يمين) حتى لا تنقلب إشارة السالب في RTL */
  const deg = t => `<bdi dir="ltr">${u.ar(t)}°</bdi>`;

  WR.views.clouds = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'clouds');
      let count = 0, timers = [], rainOn = false;
      const seen = { cooling: false, condense: false, cluster: false };

      const layersHtml = D.layers.slice().reverse().map((l, i) => {
        const idx = D.layers.length - 1 - i;
        return `<div class="f-layer f-layer-${idx}" style="--t:${idx / (D.layers.length - 1)}"><span class="f-tag">${l.name} · <b>${deg(l.temp)}</b></span></div>`;
      }).join('');
      sc.innerHTML = `
        <div class="factory" role="application" aria-label="مصنع السحب: ارفع جزيئات البخار إلى الأعلى">
          <div class="f-layers" aria-hidden="true">${layersHtml}</div>
          <div class="f-thermo" aria-hidden="true"><span class="ft-hot">حار</span><div class="ft-bar"></div><span class="ft-cold">بارد</span></div>
          <div class="f-cond-line" style="bottom:${condY * 100}%" aria-hidden="true"><span>❄️ هنا يبرد البخار فيتكاثف</span></div>
          <div class="f-cloud" aria-hidden="true" style="bottom:${(condY + 0.05) * 100}%">${S.wrap('-80 -60 160 100', S.cloud(0, 0, 1), 'سحابة')}</div>
          <div class="f-rain" aria-hidden="true"></div>
          <div class="f-sea" aria-hidden="true"><span class="f-sun">☀️</span><span class="f-sea-label">البحر الدافئ</span></div>
          <div class="f-mols"></div>
          <div class="f-readout" aria-live="polite">🌡️ اسحب جزيئًا إلى الأعلى</div>
          <div class="f-label" aria-hidden="true"></div>
        </div>`;
      const fac = u.$('.factory', sc), molsBox = u.$('.f-mols', sc), readout = u.$('.f-readout', sc);
      const cloudEl = u.$('.f-cloud', sc), labelEl = u.$('.f-label', sc);

      panel.insertAdjacentHTML('beforeend', `
        <div class="info-card glass">
          <p class="lead">🧪 ساعد بخار الماء على تكوين سحابة.</p>
          <p class="muted">اسحب كل جزيء ♨️ إلى الأعلى، أو اضغط عليه ليصعد وحده. (لوحة المفاتيح: الأسهم ↑ ↓)</p>
          <div class="drop-meter" aria-label="قطرات في السحابة"><span>☁️ قطرات في السحابة:</span> <b class="dm-count">٠ من ${u.ar(D.molecules)}</b>
            <div class="dm-dots">${Array.from({ length: D.molecules }, () => '<i></i>').join('')}</div></div>
        </div>
        <div class="observe glass"><h3>👀 ماذا تلاحظ؟</h3><ul class="obs-list"><li class="muted">ستظهر ملاحظاتك هنا…</li></ul></div>
        <div class="card-slot"></div>`);
      const slot = u.$('.card-slot', panel);

      function observe(t) {
        const ul = u.$('.obs-list', panel);
        const m = ul.querySelector('.muted'); if (m) m.remove();
        ul.insertAdjacentHTML('beforeend', `<li>${t}</li>`);
        WR.audio.play('bubble');
      }

      /* ---- الجزيئات ---- */
      const mols = [];
      for (let i = 0; i < D.molecules; i++) {
        const b = u.html(`<button type="button" class="mol" aria-label="جزيء بخار ماء ${u.ar(i + 1)}"><span class="mol-shape" aria-hidden="true"></span><span class="mol-t" aria-hidden="true">${deg(30)}</span></button>`);
        // صفّان من الجزيئات حتى لا تتداخل على الشاشات الصغيرة
        const half = Math.ceil(D.molecules / 2);
        const m = { el: b, x: 0.2 + (i % half) / (half - 1) * 0.56, y: i < half ? 0.05 : 0.16, done: false, busy: false };
        m.home = m.y;
        place(m); molsBox.appendChild(b); mols.push(m);
        bind(m);
      }

      function place(m) {
        m.el.style.left = (m.x * 100) + '%';
        m.el.style.bottom = (m.y * 100) + '%';
        const band = bandOf(m.y), L = D.layers[band];
        m.el.querySelector('.mol-t').innerHTML = deg(L.temp);
        m.el.classList.toggle('cold', m.y >= condY);
        m.el.style.setProperty('--cool', band / (D.layers.length - 1));
      }
      function report(m) {
        const L = D.layers[bandOf(m.y)];
        readout.innerHTML = `🌡️ ${L.name}: ${deg(L.temp)}`;
        if (!seen.cooling && bandOf(m.y) >= 2) { seen.cooling = true; observe('📉 كلما ارتفع البخار إلى الأعلى، انخفضت درجة الحرارة.'); }
      }

      function bind(m) {
        let start = null, dragged = false;
        m.el.addEventListener('pointerdown', e => {
          if (m.done || m.busy) return;
          start = { x: e.clientX, y: e.clientY }; dragged = false;
          m.el.setPointerCapture(e.pointerId);
          m.el.classList.add('dragging');
        });
        m.el.addEventListener('pointermove', e => {
          if (!start) return;
          if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) dragged = true;
          if (!dragged) return;
          const r = fac.getBoundingClientRect();
          m.x = u.clamp((e.clientX - r.left) / r.width, 0.04, 0.9);
          m.y = u.clamp(1 - (e.clientY - r.top) / r.height, 0.03, 0.95);
          place(m); report(m);
        });
        const end = () => {
          if (!start) return;
          start = null; m.el.classList.remove('dragging');
          if (dragged) { m.skipClick = true; release(m); }
        };
        m.el.addEventListener('pointerup', end);
        m.el.addEventListener('pointercancel', end);
        m.el.addEventListener('click', () => {
          if (m.skipClick) { m.skipClick = false; return; }
          if (!m.done && !m.busy) autoRise(m);
        });
        m.el.addEventListener('keydown', e => {
          if (m.done || m.busy) return;
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            m.y = u.clamp(m.y + (e.key === 'ArrowUp' ? 0.06 : -0.06), 0.03, 0.95);
            place(m); report(m);
            if (m.y >= condY + 0.04) condense(m);
          }
        });
      }

      function release(m) {
        if (m.y >= condY) condense(m);
        else {
          const L = D.layers[bandOf(m.y)];
          WR.nemo.say(`البخار ما زال دافئًا (${u.ar(L.temp)} درجة)… ارفعه أعلى حيث الهواء أبرد ❄️`, 'think');
          m.busy = true; m.el.classList.add('sinking');
          m.y = m.home; place(m);
          timers.push(setTimeout(() => { m.busy = false; m.el.classList.remove('sinking'); }, 700));
        }
      }

      function autoRise(m) {
        m.busy = true; WR.audio.play('bubble');
        const step = () => {
          m.y = Math.min(condY + 0.1, m.y + 0.05);
          place(m); report(m);
          if (m.y >= condY + 0.1) { m.busy = false; condense(m); }
          else timers.push(setTimeout(step, u.reduced() ? 40 : 140));
        };
        step();
      }

      function condense(m) {
        if (m.done) return;
        m.done = true; m.el.disabled = true;
        m.el.classList.add('condensed');
        WR.audio.play('drop');
        if (!seen.condense) {
          seen.condense = true; fac.classList.add('cond-seen');
          observe('💧 عندما برد البخار في الأعلى تحوّل إلى قطرة ماء صغيرة.');
          WR.nemo.say('لاحظ! عندما ارتفع البخار برد… فتحوّل إلى قطرة صغيرة 💧 تابع مع بقية الجزيئات.', 'happy');
        }
        // تنتقل القطرة إلى السحابة وتذوب فيها
        timers.push(setTimeout(() => {
          m.x = 0.5 + u.rand(-0.08, 0.08); m.y = condY + 0.1; place(m);
          m.el.classList.add('merged');
          count++;
          fac.style.setProperty('--cloud', count / D.molecules);
          u.$('.dm-count', panel).textContent = `${u.ar(count)} من ${u.ar(D.molecules)}`;
          u.$$('.dm-dots i', panel).forEach((d, i) => d.classList.toggle('on', i < count));
          if (count === Math.ceil(D.molecules / 2) && !seen.cluster) { seen.cluster = true; observe('☁️ القطرات الكثيرة تتجمع معًا… السحابة تكبر!'); }
          if (count === D.molecules) cloudFormed();
        }, u.reduced() ? 100 : 500));
      }

      function cloudFormed() {
        fac.classList.add('formed');
        readout.textContent = '☁️ تكوّنت السحابة!';
        labelEl.textContent = '☁️ التكاثف';
        labelEl.classList.add('show');
        WR.audio.play('success');
        store.discover('البخار يبرد في الأعلى فيتكاثف إلى قطرات صغيرة تكوّن السحب.');
        store.award('clouds-formed', 'drop', 'صنعت سحابة');
        WR.nemo.say('صنعت سحابة حقيقية! ☁️ السحابة ليست قطنًا… إنها ملايين القطرات الصغيرة.', 'cheer');
        slot.innerHTML = `<div class="concept-reveal"><span aria-hidden="true">☁️</span><div><b>التكاثف</b><p>تحوّل بخار الماء إلى قطرات ماء صغيرة عندما يبرد. القطرات تتجمع فتكوّن السحابة.</p></div></div>
          <div class="info-card glass"><div class="info-q"></div></div>`;
        timers.push(setTimeout(() => {
          WR.nemo.say('سؤال للخبير: القطرات تزداد وتكبر… ماذا تتوقع أن يحدث؟ 🤔', 'think');
          WR.ui.choices(u.$('.info-q', slot), {
            q: D.rainQ.text, options: D.rainQ.options, qid: 'clouds-rain', concept: 'precipitation', cols: 2, label: 'مصنع السحب: ماذا يحدث عندما تثقل القطرات؟',
            onCorrect: () => startRain()
          });
        }, 900));
      }

      function startRain() {
        const rain = u.$('.f-rain', sc);
        let s = '';
        for (let i = 0; i < 26; i++) s += `<i style="left:${u.rand(30, 70).toFixed(1)}%;animation-delay:-${u.rand(0, 1).toFixed(2)}s"></i>`;
        rain.innerHTML = s;
        rain.style.top = (100 - (condY + 0.1) * 100) + '%';
        fac.classList.add('raining');
        labelEl.textContent = '🌧️ الهطول';
        rainOn = true; WR.audio.loop('rain', true);
        timers.push(setTimeout(() => { WR.audio.loop('rain', false); rainOn = false; }, 5000));
        store.discover('عندما تثقل قطرات السحابة تسقط على الأرض: الهطول.');
        slot.insertAdjacentHTML('beforeend', `<div class="concept-reveal"><span aria-hidden="true">🌧️</span><div><b>الهطول</b><p>عندما تكبر القطرات وتثقل، تشدها الجاذبية فتسقط مطرًا.</p></div></div>`);
        WR.ui.button(slot, '✅ أنهِ المرحلة', () => WR.ui.finishStage('clouds', 'البخار البارد يتكاثف ويصنع السحب، والقطرات الثقيلة تهطل مطرًا 🌧️'));
      }

      WR.nemo.say('أهلًا في مصنع السحب! ☁️ البخار يصعد من البحر الدافئ. ارفعه إلى الأعلى وراقب ميزان الحرارة 🌡️', 'happy');
      return () => { timers.forEach(clearTimeout); if (rainOn) WR.audio.loop('rain', false); };
    }
  };
})();
