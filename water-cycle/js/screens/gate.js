/* gate.js — Screen 1: mission gate (cinematic, almost no elements) */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.gate = {
  rail: 1,
  mount: function (main, app) {
    main.innerHTML =
      '<section class="gate screen" aria-labelledby="gate-h">' +
      '<canvas aria-hidden="true"></canvas>' +
      '<div class="inner">' +
      '<p class="project">ماذا لو كان الدرس يعرفني؟<em>رحلة تكيفية لاكتشاف دورة المياه في الطبيعة</em></p>' +
      '<h1 id="gate-h"><span aria-hidden="true">🌍</span> حدث خلل في دورة المياه!</h1>' +
      '<p class="lead">بدأت المياه تختفي من إحدى المناطق…<br>مهمتك اكتشاف مكان الخلل وإعادة الدورة إلى توازنها.</p>' +
      '<button class="btn" id="start" type="button">ابدأ المهمة</button>' +
      '<p class="promise">رحلتك لن تكون مثل رحلة أي متعلم آخر.</p>' +
      '</div>' +
      '<div class="motto"><span>نفس الهدف… رحلات تعلم مختلفة.</span><button class="designer-link" type="button" data-designer>عرض منطق التصميم</button></div>' +
      '</section>';
    var sim = new WC.GateScene(main.querySelector('canvas')).start();
    var btn = main.querySelector('#start');
    btn.onclick = function () { app.go('diag'); };
    setTimeout(function () { btn.focus({ preventScroll: true }); }, 300);
    return function () { sim.stop(); };
  }
};
