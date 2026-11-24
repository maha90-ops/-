/* ui.js — مكونات واجهة قابلة لإعادة الاستخدام:
   نافذة حوار، تأكيد، إشعار، مكافآت، احتفال بالشارة، أسئلة اختيار، هيكل المرحلة */
(function () {
  const u = WR.u;
  const ui = {};
  let modalChain = Promise.resolve();

  /* ---------- إشعار قصير ---------- */
  ui.toast = function (text) {
    const host = u.$('#toasts');
    const t = u.html(`<div class="toast" role="status">${u.escape(text)}</div>`);
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3200);
  };

  /* ---------- رقاقة المكافأة المتطايرة ---------- */
  const rewardIcon = { star: '⭐', drop: '💧', leaf: '🌱' };
  ui.rewardChip = function ({ type, label, amount }) {
    const host = u.$('#toasts');
    const t = u.html(`<div class="reward-chip reward-${type}" role="status">
      <span class="rc-icon">${rewardIcon[type]}</span>
      <span><b><bdi dir="ltr">+${u.ar(amount)}</bdi></b> ${u.escape(label || '')}</span></div>`);
    host.appendChild(t);
    WR.audio.play(type === 'drop' ? 'drop' : 'bubble');
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2800);
  };

  /* ---------- نافذة حوار عامة (بالدور، مع حبس التركيز و Esc) ---------- */
  ui.modal = function ({ title = '', body = '', actions = [{ label: 'حسنًا', primary: true }], cls = '', dismissible = true, onOpen }) {
    const run = () => new Promise(resolve => {
      const prevFocus = document.activeElement;
      const m = u.html(`
        <div class="modal-backdrop ${cls}">
          <div class="modal glass" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            ${title ? `<h2 id="modal-title" class="modal-title">${title}</h2>` : '<h2 id="modal-title" class="sr-only">نافذة</h2>'}
            <div class="modal-body">${body}</div>
            <div class="modal-actions"></div>
          </div>
        </div>`);
      const box = m.querySelector('.modal-actions');
      function close(val) {
        document.removeEventListener('keydown', onKey);
        m.classList.add('out');
        setTimeout(() => { m.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(val); }, 220);
      }
      actions.forEach((a, i) => {
        const b = u.html(`<button type="button" class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'} ${a.cls || ''}">${a.label}</button>`);
        b.addEventListener('click', () => { WR.audio.play('click'); close(a.value !== undefined ? a.value : i); });
        box.appendChild(b);
      });
      function onKey(e) {
        if (e.key === 'Escape' && dismissible) close(null);
        if (e.key === 'Tab') {
          const f = u.$$('button, [href], input, [tabindex]:not([tabindex="-1"])', m).filter(x => !x.disabled);
          if (!f.length) return;
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', onKey);
      document.body.appendChild(m);
      if (onOpen) onOpen(m);
      setTimeout(() => { const p = m.querySelector('.btn-primary') || m.querySelector('button'); if (p) p.focus(); }, 60);
    });
    const p = modalChain.then(run);
    modalChain = p.catch(() => {});
    return p;
  };

  ui.confirm = function (title, text, yes = 'نعم', no = 'إلغاء') {
    return ui.modal({ title, body: `<p>${text}</p>`, actions: [{ label: no, value: false }, { label: yes, primary: true, value: true, cls: 'btn-danger' }] })
      .then(v => v === true);
  };

  /* ---------- احتفال الشارة: قطرات ماء هادئة تتساقط (دون وميض) ---------- */
  ui.celebrateBadge = function (id) {
    const b = WR.DATA.badges[id];
    if (!b) return Promise.resolve();
    WR.audio.play('badge');
    let confetti = '';
    const n = u.reduced() ? 0 : 18;
    for (let i = 0; i < n; i++) {
      confetti += `<span class="confetti" style="--x:${u.rand(0, 100).toFixed(1)}%;--d:${u.rand(0, 1.4).toFixed(2)}s;--s:${u.rand(0.6, 1.2).toFixed(2)}">${u.pick(['💧', '✨', '💧', '🌱'])}</span>`;
    }
    return ui.modal({
      cls: 'modal-badge',
      title: '🏅 شارة جديدة!',
      body: `<div class="confetti-box" aria-hidden="true">${confetti}</div>
             <div class="badge-medal" role="img" aria-label="شارة ${b.name}"><span>${b.icon}</span></div>
             <p class="badge-name">${b.name}</p><p class="muted">${b.desc}</p>
             <p class="badge-points"><bdi dir="ltr">+${u.ar(WR.DATA.points.badge)}</bdi> نقطة</p>`,
      actions: [{ label: 'رائع! 🎉', primary: true }]
    });
  };

  /* ---------- سؤال اختيار بتغذية راجعة لطيفة ----------
     لا يعتمد على اللون وحده: ✓ و ✗ ونص مقروء لقارئ الشاشة */
  ui.choices = function (container, { q, options, qid, concept, onCorrect, shuffle = true, cols = 1, nemoWrong = true, label }) {
    const qLabel = label || q || qid;
    const opts = shuffle ? u.shuffle(options) : options;
    const wrap = u.html(`
      <div class="quiz">
        ${q ? `<p class="quiz-q">${q}</p>` : ''}
        <div class="opts ${cols > 1 ? 'opts-grid' : ''}" role="group" aria-label="${u.escape(q || 'الخيارات')}"></div>
        <div class="quiz-fb" aria-live="polite"></div>
      </div>`);
    const box = wrap.querySelector('.opts'), fb = wrap.querySelector('.quiz-fb');
    opts.forEach((o, i) => {
      const b = u.html(`<button type="button" class="opt">
          <span class="opt-letter" aria-hidden="true">${u.letters[i]}</span>
          <span class="opt-text">${o.t}</span>
          <span class="opt-mark" aria-hidden="true"></span>
          <span class="sr-only opt-sr"></span></button>`);
      b.addEventListener('click', () => {
        if (o.ok) {
          b.classList.add('is-right');
          b.querySelector('.opt-mark').textContent = '✓';
          b.querySelector('.opt-sr').textContent = '— إجابة صحيحة';
          u.$$('.opt', box).forEach(x => { x.disabled = true; });
          fb.innerHTML = `<div class="fb fb-ok">🎉 ممتاز! ${o.fb || ''}</div>`;
          WR.audio.play('success');
          WR.store.answer(qid, concept, true, qLabel);
          WR.nemo.right();
          if (onCorrect) onCorrect(o);
        } else {
          b.classList.add('is-wrong');
          b.disabled = true;
          b.querySelector('.opt-mark').textContent = '✗';
          b.querySelector('.opt-sr').textContent = '— ليست هذه';
          fb.innerHTML = `<div class="fb fb-try">💙 محاولة جيدة! ${o.fb || 'لنبحث عن دليل آخر.'}</div>`;
          WR.audio.play('soft');
          WR.store.answer(qid, concept, false, qLabel);
          if (nemoWrong) WR.nemo.wrong();
        }
      });
      box.appendChild(b);
    });
    container.appendChild(wrap);
    return wrap;
  };

  /* ---------- هيكل شاشة المرحلة: عنوان + مشهد + لوحة ---------- */
  ui.stageShell = function (view, stageId) {
    const s = WR.DATA.stages.find(x => x.id === stageId);
    const shell = u.html(`
      <section class="stage stage-${stageId}" aria-labelledby="stage-title">
        <header class="stage-head">
          <span class="stage-num">المرحلة ${u.ar(s.n)}</span>
          <h1 id="stage-title" class="stage-title"><span aria-hidden="true">${s.icon}</span> ${s.title}</h1>
          <p class="stage-goal">🎯 ${s.goal}</p>
        </header>
        <div class="stage-body">
          <div class="stage-scene glass"></div>
          <div class="stage-panel"><div class="panel-content"></div></div>
        </div>
      </section>`);
    view.appendChild(shell);
    const panel = shell.querySelector('.stage-panel');
    WR.nemo.attach(panel);
    return { shell, scene: shell.querySelector('.stage-scene'), panel: shell.querySelector('.panel-content'), meta: s };
  };

  /** إنهاء المرحلة: شارة ← رسالة ← التالي أو الخريطة */
  ui.finishStage = async function (stageId, message) {
    const s = WR.DATA.stages.find(x => x.id === stageId);
    const wasDone = WR.store.isDone(stageId);
    WR.store.award('done-' + stageId, 'drop', 'أكملت نشاطًا');
    WR.store.completeStage(stageId);
    if (s.badge && WR.store.giveBadge(s.badge)) await ui.celebrateBadge(s.badge);
    const idx = WR.store.stageIndex(stageId);
    const next = WR.DATA.stages[idx + 1];
    const v = await ui.modal({
      title: `✅ أكملت «${s.title}»`,
      body: `<p class="lead">${message || ''}</p>${!wasDone && next ? `<p class="unlock-note">🔓 فُتحت منطقة جديدة: <b>${next.icon} ${next.title}</b></p>` : ''}`,
      actions: [{ label: '🗺️ الخريطة', value: 'map' }].concat(next ? [{ label: `التالي: ${next.short} ⬅`, primary: true, value: next.id }] : []),
      dismissible: false
    });
    WR.go(v === 'map' || !v ? 'map' : v);
  };

  /** زر أساسي داخل اللوحة */
  ui.button = function (container, label, onClick, cls = 'btn-primary') {
    const b = u.html(`<button type="button" class="btn ${cls}">${label}</button>`);
    b.addEventListener('click', () => { WR.audio.play('click'); onClick(b); });
    container.appendChild(b);
    return b;
  };

  WR.ui = ui;
})();
