/* stage-weather.js — المرحلة ٤: محاكاة الطقس
   أربعة متحكمات تؤثر بصريًا في المشهد؛ المطر يهطل فقط عندما تجتمع الظروف المناسبة.
   اكتشاف إضافي: إذا كان الجو باردًا جدًا يصبح الهطول ثلجًا. */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const D = WR.DATA.weather;

  // تقييم كل عامل بين ٠ و ١ (نموذج مبسّط مناسب للمرحلة الأساسية)
  const lin = (v, a, b) => u.clamp((v - a) / (b - a), 0, 1);
  function factors(v) {
    return {
      temp: 1 - lin(v.temp, 45, 80),
      hum: lin(v.hum, 30, 70),
      cloud: lin(v.cloud, 25, 65),
      wind: v.wind < 25 ? 0.3 + 0.7 * lin(v.wind, 0, 25) : v.wind > 75 ? 1 - 0.8 * lin(v.wind, 75, 100) : 1
    };
  }
  const word = (v) => v < 34 ? 'منخفضة' : v < 67 ? 'متوسطة' : 'مرتفعة';

  function scene() {
    const clouds = [[180, 90, .9], [380, 70, 1.1], [560, 100, .95], [290, 140, .8], [470, 150, .85]]
      .map(([x, y, s], i) => `<g class="w-cloud w-cloud-${i}"><g class="drift">${S.cloud(x, y, s)}</g><g class="w-dark">${S.cloud(x, y, s, '', true)}</g></g>`).join('');
    let snow = '';
    for (let i = 0; i < 30; i++) snow += `<circle cx="${u.rand(120, 660).toFixed(0)}" cy="${u.rand(150, 170).toFixed(0)}" r="${u.rand(2.5, 5).toFixed(1)}" style="--fall:260px;animation-delay:-${u.rand(0, 3).toFixed(2)}s"/>`;
    return S.wrap('0 0 800 460', `
      <rect class="w-sky" width="800" height="460" fill="url(#g-sky)"/>
      <rect class="w-gray" width="800" height="460" fill="#55657c"/>
      <rect class="w-heat" width="800" height="460" fill="#ff9a3c"/>
      <g class="w-sun">${S.sun(700, 80, 44)}</g>
      <g class="w-wind" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7">
        <path d="M60 210 q 40 -14 80 0 t 80 0"/><path d="M300 250 q 40 -14 80 0 t 80 0"/><path d="M520 200 q 30 -10 60 0 t 60 0"/></g>
      ${clouds}
      <g class="w-rain">${S.rain(130, 660, 170, 240, 40)}</g>
      <g class="w-snow" fill="#fff">${snow}</g>
      ${S.mountain(480, 400, 340, 230, true)}
      <path d="M0 380 C 200 370 500 380 800 372 L800 460 L0 460Z" fill="url(#g-grass)"/>
      ${S.waves(0, 400, 330, 60)}
      <g class="w-vapor">${S.vapor(30, 300, 400, 200, 14)}</g>
      <path class="w-river" d="M640 380 C 560 400 480 392 420 410 C 380 420 350 416 320 430" fill="none" stroke="url(#g-lake)" stroke-linecap="round"/>
      ${S.tree(420, 390, .8, 'sway')}${S.tree(470, 395, .7, 'sway')}${S.tree(760, 384, .9, 'sway')}
    `, 'مشهد طقس يتغير حسب الحرارة والرطوبة والسحب والرياح');
  }

  WR.views.weather = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'weather');
      sc.innerHTML = scene() + `
        <div class="rain-gauge" aria-hidden="true"><div class="rg-tube"><span class="rg-fill"></span></div><b class="rg-val">٠٪</b><small>احتمال المطر</small></div>
        <div class="scene-label" aria-hidden="true"></div>`;
      const svg = sc.querySelector('svg');
      const vals = {}; D.controls.forEach(c => { vals[c.id] = c.start; });
      let raining = false, holdTimer = null, phase = 'tune', snowSeen = false, idleTimer = null;
      const timers = [];

      panel.insertAdjacentHTML('beforeend', `
        <div class="info-card glass"><p class="lead">🎛️ أنت الآن مسؤول عن الطقس.</p><p class="muted">اضبط الظروف المناسبة لتكوين المطر.</p></div>
        <div class="controls glass">${D.controls.map(c => `
          <div class="ctl">
            <label for="ctl-${c.id}"><span aria-hidden="true">${c.icon}</span> ${c.name} <b class="ctl-val" id="v-${c.id}"></b></label>
            <div class="ctl-row"><small>${c.lo}</small><input type="range" id="ctl-${c.id}" min="${c.min}" max="${c.max}" step="1" value="${c.start}"><small>${c.hi}</small></div>
          </div>`).join('')}
          <button type="button" class="btn btn-ghost btn-sm" id="w-hint">💡 تلميح من نيمو</button>
        </div>
        <div class="card-slot"></div>`);
      const slot = u.$('.card-slot', panel);

      function update() {
        const f = factors(vals);
        const p = Math.round(100 * f.temp * f.hum * f.cloud * f.wind);
        const ready = f.temp >= 0.99 && f.hum >= 0.99 && f.cloud >= 0.99 && f.wind >= 0.99;
        const cold = vals.temp <= 12;
        // مرئيات
        const st = svg.style;
        st.setProperty('--heat', u.clamp((vals.temp - 50) / 50, 0, 1) * 0.35);
        st.setProperty('--sun', 0.35 + vals.temp / 100 * 0.65);
        st.setProperty('--vapor', vals.hum / 100);
        st.setProperty('--gray', (vals.cloud / 100) * (vals.hum / 100) * 0.7);
        st.setProperty('--dark', u.clamp((vals.hum - 40) / 60, 0, 1) * (vals.cloud / 100));
        st.setProperty('--windop', vals.wind / 100);
        st.setProperty('--drift', (14 - vals.wind / 100 * 11).toFixed(1) + 's');
        st.setProperty('--sway', (vals.wind / 100 * 6).toFixed(1) + 'deg');
        const nClouds = Math.ceil(vals.cloud / 20);
        u.$$('.w-cloud', svg).forEach((c, i) => c.classList.toggle('on', i < nClouds && !(vals.wind > 85 && i % 2)));
        u.$('.rg-fill', sc).style.height = p + '%';
        u.$('.rg-val', sc).textContent = u.ar(p) + '٪';
        D.controls.forEach(c => {
          const v = vals[c.id], inp = u.$('#ctl-' + c.id, panel);
          u.$('#v-' + c.id, panel).textContent = `${word(v)} (${u.ar(v)})`;
          inp.setAttribute('aria-valuetext', `${c.name}: ${word(v)}، ${v}`);
          inp.style.setProperty('--pct', v + '%');
        });
        if (phase !== 'tune') return;
        clearTimeout(holdTimer);
        if (ready) holdTimer = setTimeout(() => precipitate(cold), 700);
        else stopPrecip();
      }

      function precipitate(cold) {
        if (cold) {
          svg.classList.add('snowing'); svg.classList.remove('raining');
          WR.audio.loop('rain', false); WR.audio.loop('wind', true);
          showLabel('❄️ هطول على شكل ثلج');
          if (!snowSeen) {
            snowSeen = true;
            store.award('weather-snow', 'star', 'اكتشفت الثلج');
            store.discover('الهطول قد يكون مطرًا أو ثلجًا حسب درجة الحرارة.');
          }
          WR.nemo.say('واو! ❄️ الجو بارد جدًا فهطل الماء ثلجًا. هذا هطول أيضًا! لكن المدينة تحتاج مطرًا… ارفع الحرارة قليلًا.', 'happy');
          return;
        }
        svg.classList.remove('snowing'); svg.classList.add('raining');
        if (!raining) {
          raining = true; phase = 'done';
          WR.audio.loop('wind', false); WR.audio.loop('rain', true);
          showLabel('🌧️ الهطول');
          WR.nemo.say('🎉 نجحت! السحب ثقلت بالقطرات فهطل المطر. انظر إلى النهر يمتلئ!', 'cheer');
          store.discover('المطر يحتاج هواءً رطبًا وسحبًا كثيفة وبرودة في الأعلى.');
          store.award('weather-rain', 'drop', 'صنعت المطر');
          u.$$('.controls input', panel).forEach(i => { i.disabled = true; });
          slot.innerHTML = `<div class="concept-reveal"><span aria-hidden="true">🌧️</span><div><b>الهطول</b><p>سقوط الماء من السحب إلى الأرض: مطرًا أو ثلجًا أو بَرَدًا.</p></div></div><div class="info-card glass"><div class="info-q"></div></div>`;
          timers.push(setTimeout(() => WR.ui.choices(u.$('.info-q', slot), {
            q: D.reflectQ.text, options: D.reflectQ.options, qid: 'weather-reflect', concept: 'precipitation', label: 'محاكاة الطقس: لماذا هطل المطر؟',
            onCorrect: () => WR.ui.button(slot, '✅ أنهِ المرحلة', () => WR.ui.finishStage('weather', 'المطر يهطل عندما يكون الهواء رطبًا، والسحب كثيفة، والجو باردًا في الأعلى، والرياح معتدلة 🌧️'))
          }), 1200));
        }
      }
      function stopPrecip() {
        if (svg.classList.contains('snowing')) { svg.classList.remove('snowing'); WR.audio.loop('wind', false); hideLabel(); }
      }
      function showLabel(t) { const l = u.$('.scene-label', sc); l.textContent = t; l.classList.add('show'); }
      function hideLabel() { u.$('.scene-label', sc).classList.remove('show'); }

      function hint() {
        const f = factors(vals);
        let key = Object.keys(f).sort((a, b) => f[a] - f[b])[0];
        if (f[key] >= 0.99) { WR.nemo.say('الظروف ممتازة! انتظر لحظة وراقب السماء 👀', 'happy'); return; }
        if (key === 'wind') key = vals.wind > 75 ? 'windHigh' : 'windLow';
        WR.nemo.say(D.hints[key], 'think');
      }

      D.controls.forEach(c => {
        const inp = u.$('#ctl-' + c.id, panel);
        inp.addEventListener('input', () => {
          vals[c.id] = +inp.value; update();
          clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (phase === 'tune') hint(); }, 9000);
        });
      });
      u.$('#w-hint', panel).addEventListener('click', () => { WR.audio.play('click'); hint(); });

      WR.nemo.say('الجو الآن حار وجاف ☀️ ولا سحب تقريبًا. حرّك المتحكمات وراقب ما يحدث في السماء و«مقياس احتمال المطر».', 'happy');
      update();
      return () => { timers.forEach(clearTimeout); clearTimeout(holdTimer); clearTimeout(idleTimer); };
    }
  };
})();
