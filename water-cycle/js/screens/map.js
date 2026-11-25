/* map.js — «خريطة تعلمي»: learning states, not a score. */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.map = {
  rail: 7,
  mount: function (main, app) {
    var UI = WC.UI, E = WC.Engine, L = app.learner, C = WC.CONCEPTS;

    function trail(k) {
      var items = [];
      if (k === 'evaporation' && L.diagnostic) items.push(L.diagnostic === 'vapor' ? 'بدأ بتوقّع صحيح' : 'بدأ بتوقّع يحتاج إلى اختبار');
      L.log.forEach(function (e) {
        if (e.concept === k) {
          if (e.action === 'extra') items.push('تجربة إضافية: ' + C[k].extra);
          else if (e.action === 'scaffold') items.push('سقالة من نُقطة وخيارات أقل');
          else if (e.action === 'guided') items.push('عرض موجّه خطوة بخطوة');
          else if (e.action === 'challenge') items.push('استنتج من أول محاولة ← رُفع مستوى التحدي');
          else if (e.action === 'advance') items.push(L.c[k].errors ? 'استنتج المفهوم بعد الدعم' : 'استنتج المفهوم من أول محاولة');
          else if (e.action === 'challenge-result') items.push(L.c[k].challenge === 'passed' ? 'اجتاز التحدي الأعلى' : 'التحدي الأعلى: يحتاج إلى محاولة أخرى');
        }
        if (e.concept === 'mission' && e.action === 'hint' && e.diagnosis.indexOf(C[k].name) > -1) items.push('تلميح موجّه في المهمة النهائية');
      });
      if (k !== 'collection' && L.mission.faults.indexOf(k) > -1 && L.mission.success) items.push('أصلح هذه الحلقة في المهمة النهائية');
      return items.length ? items : ['لم تبدأ هذه المرحلة بعد'];
    }

    var cards = WC.CONCEPT_ORDER.map(function (k) {
      var st = E.status(L, k);
      return '<article class="card concept"><div class="top"><span class="ico" aria-hidden="true">' + C[k].icon + '</span>' +
        '<span class="status ' + st.key + '"><span class="shape" aria-hidden="true">' + (st.emoji || st.shape) + '</span>' + st.label + '</span></div>' +
        '<h3>' + C[k].name + '</h3><ul class="trail">' + trail(k).map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></article>';
    }).join('');

    var line = L.timeline.map(function (t) { return '<li class="' + (t.kind === 'sup' ? 'sup' : t.kind === 'ch' ? 'ch' : t.kind === 'ok' ? 'ok' : '') + '">' + t.text + '</li>'; }).join('');
    var own = L.explanation && L.explanation.text ? '<div class="card journey-line"><b>شرحك بكلماتك</b><p>«' + UI.esc(L.explanation.text) + '»</p></div>' : '';

    main.innerHTML =
      '<section class="map screen">' +
      '<header><span class="eyebrow">' + (L.name === 'أنت' ? 'رحلتك' : 'رحلة ' + L.name) + '</span><h2><span aria-hidden="true">🌧️</span> خريطة تعلّمي</h2>' +
      '<p class="quote">هذه الخريطة لا تصف نتيجتك فقط، بل تصف كيف تعلّمت.</p></header>' +
      '<div class="concepts">' + cards + '</div>' +
      '<div class="card journey-line"><b>مسار رحلتك كما بناه النظام</b><ol>' + (line || '<li>لم تبدأ الرحلة بعد</li>') + '</ol>' +
      '<small class="muted">● متقن · ◐ أتقن بعد دعم · ○ يحتاج إلى تحدٍ إضافي — الحالة مكتوبة دائمًا، ولا تعتمد على اللون وحده.</small></div>' +
      own +
      '<p class="closing">لم نصمم درسًا رقميًا عن دورة المياه، بل صممنا بيئة تتغير عندما يتغير المتعلم.</p>' +
      '<div class="center-row"><button class="btn" type="button" data-adapt>كيف تكيّفت رحلتي؟ <span class="arrow" aria-hidden="true">➜</span></button>' +
      '<button class="btn ghost" type="button" data-again>ابدأ رحلة جديدة</button></div>' +
      '<div class="center-row"><button class="designer-link" type="button" data-designer>عرض منطق التصميم</button></div>' +
      '</section>';
    main.querySelector('[data-adapt]').onclick = function () { app.go('adapt'); };
    main.querySelector('[data-again]').onclick = function () { app.restart(); };
  }
};
