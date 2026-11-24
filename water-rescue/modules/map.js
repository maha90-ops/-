/* map.js — خريطة «مركز إنقاذ كوكب الماء»: مناطق تفتح بالتدريج */
(function () {
  const u = WR.u, store = WR.store;

  WR.views.map = {
    render(view) {
      const stages = WR.DATA.stages;
      const st = store.state;
      const currentIdx = stages.findIndex(s => store.isUnlocked(s.id) && !store.isDone(s.id));
      const pct = store.percent();

      view.innerHTML = `
        <section class="map" aria-labelledby="map-title">
          <header class="map-head">
            <div class="map-planet ${pct >= 50 ? 'healing' : 'crisis'} ${pct === 100 ? 'healed' : ''}">${WR.earthSVG('', 'map')}</div>
            <div>
              <h1 id="map-title" class="map-title">🛰️ مركز إنقاذ كوكب الماء</h1>
              <p class="map-sub">الخبير: <b>${u.escape(st.name)}</b> · صحة النظام المائي: <b>${u.ar(pct)}٪</b></p>
              <div class="map-nemo"></div>
            </div>
          </header>
          <div class="map-path-wrap">
            <svg class="map-lines" aria-hidden="true"></svg>
            <ol class="map-path" aria-label="مناطق المهمة"></ol>
          </div>
          <div class="map-foot"><button type="button" class="btn btn-ghost" id="my-badges">🏅 شاراتي (${u.ar(st.badges.length)} من ${u.ar(Object.keys(WR.DATA.badges).length)})</button></div>
        </section>`;

      const list = u.$('.map-path', view);
      stages.forEach((s, i) => {
        const unlocked = store.isUnlocked(s.id), done = store.isDone(s.id), isCur = i === currentIdx;
        const status = done ? '✓ مكتملة' : unlocked ? (isCur ? '▶ ابدأ هنا' : '▶ متاحة') : '🔒 مقفلة';
        const li = u.html(`
          <li class="map-item" style="--i:${i}">
            <button type="button" class="map-node ${done ? 'is-done' : ''} ${unlocked ? '' : 'is-locked'} ${isCur ? 'is-current' : ''}"
              aria-disabled="${!unlocked}" aria-label="${s.n}. ${s.title} — ${status.replace(/^(✓|▶|🔒)\s?/u, '')}">
              <span class="node-orb"><span class="node-icon" aria-hidden="true">${unlocked ? s.icon : '🔒'}</span><span class="node-n">${u.ar(s.n)}</span></span>
              <span class="node-text"><b>${s.title}</b><small>${status}</small></span>
            </button>
          </li>`);
        u.activate(li.querySelector('button'), () => {
          if (!unlocked) {
            WR.audio.play('soft');
            const prev = stages[i - 1];
            WR.nemo.say(`هذه المنطقة مقفلة 🔒 أكمل «${prev.title}» أولًا لتفتحها.`, 'think');
            return;
          }
          WR.audio.play('whoosh');
          WR.go(s.id);
        });
        list.appendChild(li);
      });

      WR.nemo.attach(u.$('.map-nemo', view), { compact: true });
      const M = WR.DATA.nemo.map;
      if (store.isDone('challenge')) WR.nemo.say(M.done, 'cheer');
      else if (st.completed.length === 0) WR.nemo.say(M.first, 'happy');
      else WR.nemo.say(`${M.next} المحطة التالية: «${stages[currentIdx].title}».`, 'happy');

      u.$('#my-badges', view).addEventListener('click', () => {
        WR.audio.play('click');
        const B = WR.DATA.badges;
        WR.ui.modal({
          title: '🏅 شاراتي',
          body: `<div class="badge-grid">${Object.keys(B).map(k => {
            const has = st.badges.includes(k);
            return `<div class="badge-cell ${has ? 'has' : 'locked'}"><span class="badge-mini" aria-hidden="true">${has ? B[k].icon : '🔒'}</span><b>${B[k].name}</b><small>${has ? '✓ حصلت عليها' : 'لم تُفتح بعد'}</small></div>`;
          }).join('')}</div>`
        });
      });

      // خطوط الربط بين المناطق
      const lines = u.$('.map-lines', view);
      function draw() {
        const wrap = u.$('.map-path-wrap', view); if (!wrap) return;
        const r0 = wrap.getBoundingClientRect();
        const pts = u.$$('.node-orb', view).map(o => { const r = o.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; });
        lines.setAttribute('viewBox', `0 0 ${r0.width} ${r0.height}`);
        let html = '';
        for (let i = 0; i < pts.length - 1; i++) {
          const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
          const done = store.isDone(stages[i].id);
          html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${done ? 'ln-done' : store.isUnlocked(stages[i + 1].id) ? 'ln-open' : 'ln-locked'}"/>`;
        }
        lines.innerHTML = html;
      }
      requestAnimationFrame(draw);
      window.addEventListener('resize', draw);
      const focusEl = u.$('.map-node.is-current', view);
      if (focusEl) setTimeout(() => focusEl.focus({ preventScroll: true }), 300);
      return () => window.removeEventListener('resize', draw);
    }
  };
})();
