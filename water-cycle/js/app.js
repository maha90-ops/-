/* app.js — router, top bar, UDL tools. */
window.WC = window.WC || {};

WC.App = (function () {
  var RAIL = [['gate', 'البوابة'], ['diag', 'التشخيص'], ['evap', 'الشمس'], ['cloud', 'السحب'], ['rain', 'المطر'], ['mission', 'المهمة']];
  var main, bar, cleanup = null, current = null;

  var app = {
    learner: new WC.Learner(),
    go: function (id) {
      var S = WC.Screens[id] || WC.Screens.gate;
      if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } }
      WC.Nuqta.hide(); WC.Audio.stop();
      current = id;
      main.innerHTML = '';
      bar.hidden = id === 'gate';
      paintRail(S.rail);
      cleanup = S.mount(main, app) || null;
      window.scrollTo(0, 0);
      if (id !== 'gate') main.focus({ preventScroll: true });
      if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    },
    restart: function () { app.learner = new WC.Learner(); app.go('gate'); },
    get current() { return current; }
  };

  function paintRail(step) {
    bar.querySelector('.rail').innerHTML = RAIL.map(function (r, i) {
      var n = i + 1, cls = n < step ? 'done' : n === step ? 'now' : '';
      return '<li class="' + cls + '"' + (n === step ? ' aria-current="step"' : '') + '><span class="n">' + (n < step ? '✓' : WC.ar.digits(n)) + '</span><span class="t">' + r[1] + '</span></li>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    main = document.getElementById('main');
    bar = document.getElementById('topbar');
    var snd = document.getElementById('t-sound'), txt = document.getElementById('t-text');
    if (!WC.Audio.supported) snd.hidden = true;
    snd.onclick = function () {
      var on = WC.Audio.toggle(); snd.setAttribute('aria-pressed', on);
      snd.querySelector('.t').textContent = on ? 'الصوت يعمل' : 'الصوت';
      if (on) WC.Audio.speak('تم تشغيل الصوت. ستقرأ نُقطة رسائلها بصوت مسموع.');
    };
    txt.onclick = function () {
      var lg = document.documentElement.dataset.text !== 'lg';
      document.documentElement.dataset.text = lg ? 'lg' : '';
      txt.setAttribute('aria-pressed', lg);
    };
    document.getElementById('t-restart').onclick = function () { app.restart(); };
    document.addEventListener('click', function (e) { if (e.target.closest('[data-designer]')) WC.Designer.open(app); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') WC.Nuqta.hide();
      if (e.shiftKey && (e.key === 'D' || e.key === 'ي') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) WC.Designer.open(app);
    });
    var start = location.hash.slice(1);
    // deep links are for demos; without a journey, labs still work with a fresh learner model
    app.go(WC.Screens[start] ? start : 'gate');
  });

  return app;
})();
