/* diagnostic.js — Screen 2: initial diagnosis.
   The answer is recorded and NOT corrected; it sets the support level of the next lab. */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.diag = {
  rail: 2,
  mount: function (main, app) {
    var K = WC.CONTENT.diagnostic, UI = WC.UI, chosen = null;
    main.innerHTML =
      '<section class="diag screen">' +
      '<div class="card scene"><canvas role="img" aria-label="بحيرة تحت شمس دافئة، وعلامة استفهام فوق سطح الماء"></canvas></div>' +
      '<div class="q">' +
      '<span class="eyebrow">قبل أن نبدأ · توقّع</span>' +
      '<h2 id="dq">' + K.prompt + '</h2>' +
      '<p class="muted">لا نبحث هنا عن إجابة صحيحة؛ توقّعك يساعد الرحلة على أن تناسبك.</p>' +
      '<div class="options" role="radiogroup" aria-labelledby="dq"></div>' +
      '<div class="row"><button class="btn" id="go" type="button" disabled>سجّل توقّعي وتابع <span class="arrow" aria-hidden="true">➜</span></button>' +
      '<button class="tool" type="button" id="listen">🔈 <span>استمع</span></button></div>' +
      '</div></section>';
    var list = main.querySelector('.options'), go = main.querySelector('#go');
    K.options.forEach(function (o, i) {
      var b = UI.h('<button type="button" class="opt" role="radio" aria-checked="false"><span class="k" aria-hidden="true">' + WC.ar.digits(i + 1) + '</span><span class="ico" aria-hidden="true">' + o.ico + '</span><span>' + o.text + '</span></button>');
      b.onclick = function () {
        list.querySelectorAll('.opt').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
        b.setAttribute('aria-checked', 'true'); chosen = o; go.disabled = false;
      };
      list.appendChild(b);
    });
    go.onclick = function () {
      WC.Engine.diagnose(app.learner, chosen.id, chosen.text);
      app.go('evap');
    };
    main.querySelector('#listen').onclick = function () {
      WC.Audio.speak(K.prompt + ' ' + K.options.map(function (o) { return o.text; }).join(' أم '), true);
    };
    var sim = new WC.DiagScene(main.querySelector('canvas')).start();
    return function () { sim.stop(); };
  }
};
