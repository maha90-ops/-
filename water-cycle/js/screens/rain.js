/* rain.js — Screen 5: rain & precipitation lab. */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.rain = {
  rail: 5,
  mount: function (main, app) {
    var UI = WC.UI, ar = WC.ar, N = WC.Nuqta, L = app.learner, RR = WC.RAIN_RULE;
    var plan = WC.Engine.plan(L, 'precipitation');
    var moved = { vapor: false, size: false }, sawRain = false;
    var probe = null; // extra activity: must observe small drops (no rain) then big drops (rain)
    function amount(v, w) { return ar.pct(v) + ' · ' + UI.level3(v / 100, w); }

    main.innerHTML =
      '<section class="lab screen">' +
      '<div class="panel">' +
      '<header><span class="eyebrow">المختبر الثالث · داخل السحابة</span><h2>مختبر المطر</h2>' +
      '<p class="task">غيّر <b>كمية البخار</b> و<b>حجم القطرات</b>، وابحث عن الظروف التي يهطل فيها المطر.</p></header>' +
      '<div data-notes></div>' +
      '<div data-sliders style="display:grid;gap:12px"></div>' +
      '<div class="path-note" data-obs aria-live="polite"><span class="ico" aria-hidden="true">☁️</span><span></span></div>' +
      '<div class="balance" data-balance hidden>' +
      '<b>⚖️ ثقل القطرة ودفع الهواء</b>' +
      '<span class="muted" style="font-size:.88rem">الهواء يدفع القطرات إلى الأعلى. الخط الأسود هو قوة هذا الدفع.</span>' +
      '<span style="font-size:.85rem">ثقل القطرة</span><div class="scale" data-w><i></i><span class="line" style="inset-inline-start:' + RR.size + '%"></span></div>' +
      '<span style="font-size:.85rem">الماء في السحابة</span><div class="scale" data-v><i></i><span class="line" style="inset-inline-start:' + RR.vapor + '%"></span></div>' +
      '<div class="lbls"><span>خفيف</span><span>ثقيل</span></div></div>' +
      '<ul class="checks" aria-label="خطوات الملاحظة"><li data-c="try">جرّب المتغيّرين</li><li data-c="rain">اجعل المطر يهطل</li></ul>' +
      '<div data-flow></div>' +
      '</div>' +
      '<figure class="card stage" style="margin:0"><canvas role="img" aria-label="محاكاة: سحابة بداخلها قطرات ماء، يهطل منها المطر عندما تكبر القطرات"></canvas>' +
      '<figcaption class="caption"><span class="legend"><span>💧 قطرات داخل السحابة</span><span>🌧️ مطر</span></span><span data-live aria-live="polite"></span></figcaption></figure>' +
      '</section>';

    var $ = function (s) { return main.querySelector(s); };
    var sim = new WC.RainSim($('canvas')).start();
    var notes = $('[data-notes]'), bal = $('[data-balance]');
    if (plan.recap.indexOf('condensation') > -1)
      notes.appendChild(UI.pathNote('تذكير لأنك احتجت إلى دعم في التكاثف: البخار يبرد فيتحوّل إلى <b>قطرات صغيرة</b> تكوّن السحابة.', '↩️'));
    if (plan.toolFromStart) {
      bal.hidden = false;
      notes.appendChild(UI.pathNote('أضفنا لك <b>مقياس الثقل</b> ليُظهر ما يحدث داخل السحابة، لأن رحلتك احتاجت إلى دعم في مرحلة سابقة.'));
    }

    var sv = UI.slider({ id: 'vapor', label: '💨 كمية بخار الماء', value: 25, ends: ['قليلة', 'كثيرة'],
      format: function (v) { return amount(v, ['قليلة', 'متوسطة', 'كثيرة']); },
      onInput: function (v) { sim.set('vapor', v); moved.vapor = true; check(); } });
    var ss = UI.slider({ id: 'size', label: '💧 حجم قطرات الماء', value: 20, ends: ['صغيرة', 'كبيرة'],
      format: function (v) { return amount(v, ['صغيرة', 'متوسطة', 'كبيرة']); },
      onInput: function (v) { sim.set('size', v); moved.size = true; check(); } });
    $('[data-sliders]').append(sv.node, ss.node);

    function check() {
      var st = sim.state();
      if (moved.vapor && moved.size) $('[data-c=try]').classList.add('ok');
      if (st.raining && !sawRain) { sawRain = true; $('[data-c=rain]').classList.add('ok'); }
      if (probe) {
        if (!st.raining && st.size < RR.size && st.vapor >= RR.vapor) probe.small = true;
        if (st.raining && probe.small) { probe = null; flow.release(); }
      }
      flow.refresh();
    }

    function observe() {
      var st = sim.state(), t;
      if (st.raining) t = 'بدأ الهطول! ' + st.word + '.';
      else if (st.size < RR.size && st.vapor < RR.vapor) t = 'السحابة خفيفة وقطراتها صغيرة… لا مطر.';
      else if (st.size < RR.size) t = 'السحابة ممتلئة بالقطرات، لكنها صغيرة وتبقى معلّقة في الهواء.';
      else t = 'القطرات كبيرة، لكن الماء في السحابة قليل.';
      $('[data-obs] .ico').textContent = st.raining ? '🌧️' : '☁️';
      $('[data-obs] span:last-child').textContent = t;
      $('[data-live]').textContent = st.word;
      bal.querySelector('[data-w] i').style.width = st.size + '%';
      bal.querySelector('[data-v] i').style.width = st.vapor + '%';
    }
    var tick = setInterval(observe, 250); observe();

    var flow = new WC.LabFlow({
      app: app, concept: 'precipitation', host: $('[data-flow]'),
      gateText: 'جرّب المتغيّرين حتى يهطل المطر، ليظهر سؤال الاستنتاج.',
      isReady: function () { return moved.vapor && moved.size && sawRain; },
      whyText: 'لاحظتُ أن سبب سقوط القطرات يحتاج إلى نظرة من داخل السحابة، لذلك أضفتُ <b>مقياس ثقل القطرة ودفع الهواء</b>. اجعل البخار كثيرًا مع قطرات صغيرة، ثم كبّر القطرات.',
      onExtra: function () {
        bal.hidden = false; probe = { small: false };
        sv.set(80, true); ss.set(25, true);
        bal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ss.input.focus({ preventScroll: true });
      },
      scaffoldText: 'دعنا نجرّب بطريقة أخرى: اجعل البخار كثيرًا، ثم كبّر القطرات شيئًا فشيئًا. متى بدأت القطرات تسقط؟ وهل يستطيع الهواء حمل القطرات الثقيلة؟',
      onScaffold: function () { bal.hidden = false; ss.set(20, true); },
      onGuided: function (done) {
        bal.hidden = false;
        WC.guidedDemo([
          { apply: function () { sv.set(85, true); ss.set(25, true); }, say: 'البخار كثير، لكن القطرات صغيرة وخفيفة: الهواء يحملها فتبقى معلّقة.' },
          { apply: function () { ss.set(55, true); }, say: 'كبّرتُ القطرات قليلًا… ما زال الهواء قادرًا على حملها.' },
          { apply: function () { ss.set(85, true); }, say: 'الآن كبرت القطرات وثقلت أكثر من دفع الهواء… فسقطت مطرًا.' }
        ], done);
      },
      interactiveChallenge: function (box, done) {
        var cfb = UI.h('<div class="feedback show"><b>تحدٍّ أعلى: اجعل المطر غزيرًا</b><span>ما أقل تغيير يجعل المطر غزيرًا؟ جرّب، وراقب الوصف تحت المؤشرين.</span></div>');
        var skip = UI.h('<button class="btn small ghost" type="button">تخطَّ التحدي الآن</button>');
        box.append(cfb, skip);
        var t = setInterval(function () {
          if (sim.state().intensity >= RR.heavy) {
            clearInterval(t); skip.remove();
            UI.feedback(cfb, 'good', 'اجتزت التحدي!', 'مطر غزير: بخار كثير جدًا وقطرات كبيرة جدًا.');
            done(true);
          }
        }, 300);
        skip.onclick = function () { clearInterval(t); skip.remove(); UI.feedback(cfb, 'near', 'لا بأس', 'سنعود إلى هذا التحدي لاحقًا في المهمة النهائية.'); done(false); };
        cleanup.push(function () { clearInterval(t); });
      },
      next: 'mission', nextLabel: 'تابع إلى مهمة الإنقاذ'
    });

    var cleanup = [];
    return function () { clearInterval(tick); cleanup.forEach(function (f) { f(); }); sim.stop(); };
  }
};
