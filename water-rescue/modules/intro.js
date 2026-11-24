/* intro.js — المشهد السينمائي: الأرض من الفضاء ← خلل ← إنذار ← بدء المهمة */
(function () {
  const u = WR.u, store = WR.store;
  WR.views = WR.views || {};

  /** كرة أرضية SVG بأسلوب ثلاثي الأبعاد: قارات تدور، سحب، غلاف جوي، ظل */
  WR.earthSVG = function (cls = '', id = 'e') {
    const land = (dx) => `
      <path class="land" d="M${40 + dx} 120 c 20 -30 60 -40 80 -20 c 18 18 -4 40 10 60 c 12 20 -10 40 -34 34 c -26 -6 -30 -30 -48 -40 c -16 -10 -18 -22 -8 -34z"/>
      <path class="land" d="M${160 + dx} 70 c 30 -14 70 -6 84 18 c 10 18 -12 26 -6 44 c 6 20 30 30 18 52 c -10 18 -40 12 -52 -6 c -14 -20 -40 -18 -50 -40 c -10 -24 -16 -54 6 -68z"/>
      <path class="land" d="M${300 + dx} 150 c 24 -10 56 0 64 22 c 8 22 -12 44 -38 48 c -26 4 -46 -14 -46 -36 c 0 -14 8 -28 20 -34z"/>
      <path class="land" d="M${120 + dx} 220 c 26 -8 50 6 52 24 c 2 20 -26 30 -46 22 c -18 -8 -26 -38 -6 -46z"/>
      <path class="land" d="M${390 + dx} 60 c 22 -10 48 -4 56 12 c 8 18 -10 30 -30 30 c -22 0 -40 -26 -26 -42z"/>
      <path class="river" d="M${200 + dx} 100 c 10 20 0 40 16 60 c 10 14 6 30 0 40" />`;
    const clouds = (dx) => `
      <ellipse cx="${80 + dx}" cy="90" rx="46" ry="10"/><ellipse cx="${210 + dx}" cy="200" rx="56" ry="11"/>
      <ellipse cx="${330 + dx}" cy="110" rx="40" ry="9"/><ellipse cx="${150 + dx}" cy="260" rx="44" ry="9"/><ellipse cx="${420 + dx}" cy="230" rx="38" ry="8"/>`;
    return `
    <svg class="earth ${cls}" viewBox="0 0 320 320" role="img" aria-label="كوكب الأرض من الفضاء">
      <defs>
        <clipPath id="${id}-clip"><circle cx="160" cy="160" r="120"/></clipPath>
        <radialGradient id="${id}-ocean" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#5fe0ff"/><stop offset=".55" stop-color="#1679cc"/><stop offset="1" stop-color="#0a2f6b"/></radialGradient>
        <radialGradient id="${id}-shade" cx=".32" cy=".28" r=".9"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
        <radialGradient id="${id}-atmo"><stop offset=".74" stop-color="#5ff2ff" stop-opacity="0"/><stop offset=".8" stop-color="#5ff2ff" stop-opacity=".55"/><stop offset="1" stop-color="#5ff2ff" stop-opacity="0"/></radialGradient>
      </defs>
      <circle class="earth-atmo" cx="160" cy="160" r="152" fill="url(#${id}-atmo)"/>
      <circle cx="160" cy="160" r="120" fill="url(#${id}-ocean)"/>
      <g clip-path="url(#${id}-clip)">
        <g class="earth-land">${land(0)}${land(480)}</g>
        <g class="earth-clouds" fill="#fff" opacity=".75">${clouds(0)}${clouds(480)}</g>
      </g>
      <circle cx="160" cy="160" r="120" fill="url(#${id}-shade)"/>
      <ellipse cx="118" cy="98" rx="34" ry="16" fill="#fff" opacity=".22" transform="rotate(-30 118 98)"/>
      <g class="earth-alerts">
        <g transform="translate(110 130)"><circle class="alert-ring" r="14"/><text y="6" text-anchor="middle" font-size="16">⚠️</text></g>
        <g transform="translate(210 190)"><circle class="alert-ring" r="14"/><text y="6" text-anchor="middle" font-size="16">⚠️</text></g>
        <g transform="translate(190 92)"><circle class="alert-ring" r="14"/><text y="6" text-anchor="middle" font-size="16">⚠️</text></g>
      </g>
    </svg>`;
  };

  WR.views.intro = {
    render(view) {
      let timers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, u.reduced() ? Math.min(ms, 400) : ms));
      const returning = store.hasProgress();

      view.innerHTML = `
        <section class="intro ${returning ? 'is-returning' : ''}" aria-labelledby="intro-title">
          <div class="intro-stage">
            <div class="intro-earth">${WR.earthSVG('', 'intro')}</div>
            <div class="intro-orbit" aria-hidden="true"><span>🛰️</span></div>
          </div>
          <div class="intro-text">
            <p class="intro-kicker">Water Rescue Mission · ${u.escape(WR.DATA.appSubtitle)}</p>
            <h1 id="intro-title" class="intro-title"><span aria-hidden="true">🌍💧</span> ${WR.DATA.appTitle}</h1>
            <p class="intro-caption" id="intro-caption">كوكبنا يعتمد على رحلةٍ لا تتوقف… رحلة الماء.</p>
          </div>
          <div class="intro-panel" id="intro-panel" aria-live="polite"></div>
          ${returning ? '' : '<button type="button" class="btn btn-ghost intro-skip" id="intro-skip">تخطَّ المقدمة ⏭</button>'}
        </section>`;

      const earth = u.$('.earth', view), panel = u.$('#intro-panel', view), caption = u.$('#intro-caption', view);

      if (returning) { showWelcomeBack(); return () => timers.forEach(clearTimeout); }

      // المشهد ١: الأرض سليمة ← المشهد ٢: الخلل ← المشهد ٣: الإنذار
      later(() => { caption.textContent = 'الماء يتبخر… يصنع السحب… يهطل… ويعود.'; }, 2200);
      later(() => { earth.classList.add('crisis'); view.querySelector('.intro').classList.add('crisis'); caption.textContent = '…لكن شيئًا ما حدث!'; WR.audio.play('alert'); }, 4600);
      later(showAlert, 6200);
      u.$('#intro-skip', view).addEventListener('click', () => { timers.forEach(clearTimeout); earth.classList.add('crisis'); view.querySelector('.intro').classList.add('crisis'); showAlert(); });

      function showAlert() {
        const sk = u.$('#intro-skip', view); if (sk) sk.remove();
        const I = WR.DATA.intro;
        panel.innerHTML = `
          <div class="alert-card glass" role="alertdialog" aria-labelledby="alert-t" aria-describedby="alert-d">
            <h2 id="alert-t" class="alert-title">${I.alertTitle}</h2>
            <div id="alert-d">${I.alertLines.map(l => `<p>${l}</p>`).join('')}<p class="alert-q"><b>${I.alertQuestion}</b></p></div>
            <button type="button" class="btn btn-primary btn-xl" id="start-btn">🚀 ابدأ مهمة الإنقاذ</button>
          </div>`;
        const b = u.$('#start-btn', panel);
        b.focus();
        b.addEventListener('click', () => { WR.audio.unlock(); WR.audio.play('whoosh'); askName(); });
      }

      function askName() {
        panel.innerHTML = `
          <form class="alert-card glass name-card" id="name-form" novalidate>
            <div class="name-nemo"></div>
            <label for="name-in" class="name-label">ما اسمك أيها الخبير؟</label>
            <input id="name-in" class="input" type="text" maxlength="30" autocomplete="given-name" placeholder="اكتب اسمك هنا" required>
            <p class="name-err" id="name-err" role="alert"></p>
            <button class="btn btn-primary btn-xl" type="submit">انطلق إلى المركز 🛰️</button>
          </form>`;
        WR.nemo.attach(u.$('.name-nemo', panel), { compact: true });
        WR.nemo.say('مرحبًا! أنا نيمو 🤖 سأرافقك في المهمة. سنكتب اسمك على شهادة الخبير في النهاية.', 'happy');
        const inp = u.$('#name-in', panel);
        inp.focus();
        u.$('#name-form', panel).addEventListener('submit', e => {
          e.preventDefault();
          const name = inp.value.trim().replace(/\s+/g, ' ');
          if (name.length < 2) { u.$('#name-err', panel).textContent = '✍️ اكتب اسمك (حرفان على الأقل) ليظهر على شهادتك.'; inp.focus(); return; }
          Object.assign(store.state, { name, started: true, startedAt: store.state.startedAt || Date.now() });
          store.save();
          WR.audio.play('success');
          WR.go('map');
        });
      }

      function showWelcomeBack() {
        const st = store.state, pct = store.percent();
        const cur = WR.DATA.stages.find(s => s.id === st.current);
        if (pct >= 50) earth.classList.add('healing');
        panel.innerHTML = `
          <div class="alert-card glass welcome-card">
            <h2 class="alert-title ok">👋 مرحبًا مجددًا يا ${u.escape(st.name)}!</h2>
            <p>أنجزت <b>${u.ar(pct)}٪</b> من المهمة، وجمعت <b>${u.ar(st.points)}</b> نقطة و<b>${u.ar(st.badges.length)}</b> شارة.</p>
            <div class="hud-bar big" aria-hidden="true"><span style="width:${pct}%"></span></div>
            ${cur ? `<p class="muted">آخر محطة: ${cur.icon} ${cur.title}</p>` : ''}
            <div class="btn-row">
              <button type="button" class="btn btn-primary btn-xl" id="resume-btn">🔄 متابعة المهمة</button>
              <button type="button" class="btn btn-ghost" id="new-btn">🆕 بدء مهمة جديدة</button>
            </div>
          </div>`;
        u.$('#resume-btn', panel).addEventListener('click', () => { WR.audio.unlock(); WR.audio.play('whoosh'); WR.go(st.current && store.isUnlocked(st.current) ? st.current : 'map'); });
        u.$('#new-btn', panel).addEventListener('click', () => { WR.audio.unlock(); WR.newMission(); });
        u.$('#resume-btn', panel).focus();
      }

      return () => timers.forEach(clearTimeout);
    }
  };
})();
