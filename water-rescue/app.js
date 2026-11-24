/* app.js — نقطة التشغيل: الموجّه (Router)، شريط التقدم، الإعدادات، PWA */
(function () {
  const u = WR.u, store = WR.store;
  WR.views = WR.views || {};
  let cleanup = null, currentView = null, installPrompt = null;

  /* ---------- الموجّه ---------- */
  WR.go = function (id, { replace = false } = {}) {
    const hash = '#/' + id;
    if (location.hash !== hash) {
      if (replace) history.replaceState(null, '', hash); else history.pushState(null, '', hash);
    }
    render(id);
  };

  function render(id) {
    if (!WR.views[id]) id = store.hasProgress() ? 'map' : 'intro';
    const isStage = store.stageIndex(id) >= 0;
    if (isStage && !store.isUnlocked(id)) id = 'map';
    if (id !== 'intro' && !store.hasProgress()) id = 'intro';

    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
    cleanup = null;
    WR.audio.stopAll();

    const view = u.$('#view');
    view.innerHTML = '';
    view.className = 'view view-' + id;
    document.body.dataset.view = id;
    currentView = id;
    if (isStage) store.setCurrent(id);

    cleanup = WR.views[id].render(view) || null;
    updateHud();
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
    const s = WR.DATA.stages.find(x => x.id === id);
    announce(s ? `${s.title}` : id === 'map' ? 'خريطة المركز' : '');
  }

  window.addEventListener('popstate', () => render((location.hash || '').replace('#/', '')));
  window.addEventListener('hashchange', () => { const id = location.hash.replace('#/', ''); if (id !== currentView) render(id); });

  function announce(t) { const a = u.$('#sr-announce'); a.textContent = ''; setTimeout(() => { a.textContent = t; }, 50); }
  WR.announce = announce;

  /* ---------- شريط التقدم العلوي ---------- */
  function updateHud() {
    const hud = u.$('#hud');
    hud.hidden = currentView === 'intro' || currentView === 'certificate';
    const st = store.state;
    const pct = store.percent();
    const s = WR.DATA.stages.find(x => x.id === currentView);
    u.$('#hud-stage').textContent = s ? `${s.icon} ${s.short}` : currentView === 'map' ? '🛰️ الخريطة' : '—';
    u.$('#hud-fill').style.width = pct + '%';
    u.$('#hud-pct').textContent = u.ar(pct + '%');
    hud.querySelector('.hud-progress').setAttribute('aria-valuenow', pct);
    hud.querySelector('.hud-progress').setAttribute('aria-valuetext', `أنجزت ${u.ar(pct)} بالمئة`);
    u.$('#hud-points b').textContent = u.ar(st.points);
    u.$('#hud-badges b').textContent = u.ar(st.badges.length);
    const snd = st.settings.sound;
    const sb = u.$('#hud-sound');
    sb.textContent = snd ? '🔊' : '🔇';
    sb.setAttribute('aria-pressed', snd);
    sb.setAttribute('aria-label', snd ? 'الصوت مفعّل — اضغط لإيقافه' : 'الصوت متوقف — اضغط لتشغيله');
  }
  WR.updateHud = updateHud;

  store.on((type, data) => {
    if (type === 'reward') { WR.ui.rewardChip(data); bump('#hud-points'); }
    if (type === 'badge') bump('#hud-badges');
    updateHud();
  });
  function bump(sel) { const e = u.$(sel); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }

  /* ---------- الإعدادات وإمكانية الوصول ---------- */
  function applySettings() {
    const s = store.state.settings;
    document.documentElement.dataset.contrast = s.contrast ? 'high' : 'normal';
    document.documentElement.dataset.motion = u.reduced() ? 'low' : 'full';
    document.documentElement.dataset.bigtext = s.bigText ? 'on' : 'off';
  }
  WR.applySettings = applySettings;

  function toggleSound() {
    const s = store.state.settings;
    s.sound = !s.sound; store.save();
    if (s.sound) { WR.audio.unlock(); WR.audio.play('click'); WR.ui.toast('🔊 تم تشغيل الصوت'); }
    else { WR.audio.stopAll(); WR.ui.toast('🔇 تم إيقاف الصوت'); }
    updateHud();
  }

  function openSettings() {
    const s = store.state.settings;
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    const row = (id, icon, label, on, help) => `
      <div class="setting-row">
        <div><b>${icon} ${label}</b><small class="muted">${help}</small></div>
        <button type="button" class="switch" role="switch" aria-checked="${on}" data-set="${id}" aria-label="${label}"><span></span><em>${on ? 'مفعّل' : 'متوقف'}</em></button>
      </div>`;
    WR.ui.modal({
      title: '⚙️ الإعدادات وإمكانية الوصول',
      body: `
        ${row('sound', '🔊', 'الأصوات', s.sound, 'قطرات، مطر، رياح، ونغمات النجاح.')}
        ${row('contrast', '🎨', 'تباين مرتفع', s.contrast, 'ألوان أوضح وحدود أقوى.')}
        ${row('motion', '🐢', 'حركة أقل', u.reduced(), 'يخفف الحركات المستمرة.')}
        ${row('bigText', '🔎', 'خط أكبر', s.bigText, 'يكبّر النصوص والأزرار.')}
        <div class="setting-row"><div><b>⌨️ لوحة المفاتيح</b><small class="muted">Tab للتنقل، Enter أو المسافة للاختيار، والأسهم في الأنشطة.</small></div></div>
        <div class="setting-row"><div><b>${navigator.onLine ? '🌐 متصل بالإنترنت' : '📴 دون اتصال'}</b>
          <small class="muted">${sw ? '✓ التطبيق محفوظ على جهازك ويعمل دون إنترنت.' : 'افتح التطبيق عبر خادم محلي ليعمل دون إنترنت (راجع README).'}</small></div></div>
        <div class="settings-actions">
          ${installPrompt ? '<button type="button" class="btn btn-primary" data-act="install">📲 ثبّت التطبيق على جهازك</button>' : ''}
          <button type="button" class="btn btn-ghost btn-danger" data-act="reset">🆕 بدء مهمة جديدة</button>
        </div>`,
      actions: [{ label: 'إغلاق', primary: true }],
      onOpen(m) {
        u.$$('.switch', m).forEach(b => b.addEventListener('click', () => {
          const k = b.dataset.set;
          if (k === 'sound') { toggleSound(); }
          else if (k === 'motion') { s.motion = u.reduced() ? 'full' : 'low'; store.save(); }
          else { s[k] = !s[k]; store.save(); }
          applySettings();
          const on = k === 'motion' ? u.reduced() : s[k];
          b.setAttribute('aria-checked', on); b.querySelector('em').textContent = on ? 'مفعّل' : 'متوقف';
          WR.audio.play('click');
        }));
        const inst = m.querySelector('[data-act="install"]');
        if (inst) inst.addEventListener('click', async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; inst.remove(); });
        m.querySelector('[data-act="reset"]').addEventListener('click', () => { m.querySelector('.modal-actions .btn').click(); setTimeout(WR.newMission, 260); });
      }
    });
  }

  WR.newMission = async function () {
    const ok = await WR.ui.confirm('🆕 بدء مهمة جديدة؟', 'سيُمسح كل تقدمك: النقاط والشارات والمراحل المكتملة. هل أنت متأكد؟', 'نعم، ابدأ من جديد', 'لا، تراجع');
    if (!ok) return;
    store.reset();
    WR.ui.toast('تم مسح التقدم. مهمة جديدة تبدأ الآن!');
    WR.go('intro');
  };

  /* ---------- PWA ---------- */
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
  function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW', err));
  }
  window.addEventListener('online', () => WR.ui.toast('🌐 عاد الاتصال بالإنترنت'));
  window.addEventListener('offline', () => WR.ui.toast('📴 لا يوجد إنترنت — المهمة مستمرة دون انقطاع'));

  /* ---------- التشغيل ---------- */
  function boot() {
    document.body.insertAdjacentHTML('afterbegin', WR.S.defs);
    store.load();
    applySettings();
    u.$('#hud-map').addEventListener('click', () => { WR.audio.play('click'); WR.go('map'); });
    u.$('#hud-sound').addEventListener('click', toggleSound);
    u.$('#hud-settings').addEventListener('click', () => { WR.audio.play('click'); openSettings(); });
    // أول تفاعل يفتح الصوت (سياسة المتصفحات)
    document.addEventListener('pointerdown', () => WR.audio.unlock(), { once: true });
    document.addEventListener('keydown', () => WR.audio.unlock(), { once: true });
    // عند كل عودة: الشاشة الترحيبية تعرض «🔄 متابعة المهمة» أو «🆕 بدء مهمة جديدة»
    history.replaceState(null, '', '#/intro');
    render('intro');
    registerSW();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
