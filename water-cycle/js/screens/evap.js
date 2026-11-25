/* evap.js — Screen 3: the sun & evaporation lab (core simulation). */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.evap = {
  rail: 3,
  mount: function (main, app) {
    var UI = WC.UI, ar = WC.ar, N = WC.Nuqta, L = app.learner;
    var plan = WC.Engine.plan(L, 'evaporation');
    var R = WC.RULES.explore.evaporation;
    var seenLow = false, seenHigh = false, compareNeeded = false, measured = { low: null, high: null }, busy = false;

    main.innerHTML =
      '<section class="lab screen">' +
      '<div class="panel">' +
      '<header><span class="eyebrow">المختبر الأول · الشمس والماء</span><h2>مختبر الشمس</h2>' +
      '<p class="task">حرّك <b>حرارة الشمس</b>، وراقب الماء وما يصعد منه.</p></header>' +
      '<div data-notes></div>' +
      '<div data-slider></div>' +
      '<div class="meters" data-meters></div>' +
      '<ul class="checks" aria-label="خطوات الملاحظة"><li data-c="low">جرّب حرارة منخفضة</li><li data-c="high">جرّب حرارة مرتفعة</li></ul>' +
      '<div class="compare" data-compare hidden>' +
      '<b>🔬 تجربة مقارنة</b><span class="muted">قِس كمية البخار في ٤ ثوانٍ عند حرارتين مختلفتين.</span>' +
      '<div class="row"><button class="btn small ghost" type="button" data-m="low">قِس عند ٢٠٪</button><button class="btn small ghost" type="button" data-m="high">قِس عند ٩٠٪</button></div>' +
      '<div class="bars"><div class="cbar"><span>حرارة منخفضة</span><span class="bar"><i data-b="low"></i></span><b data-v="low">—</b></div>' +
      '<div class="cbar"><span>حرارة مرتفعة</span><span class="bar"><i data-b="high"></i></span><b data-v="high">—</b></div></div>' +
      '<small class="muted" data-unit>الأرقام: عدد نفثات البخار التي صعدت.</small></div>' +
      '<div data-flow></div>' +
      '</div>' +
      '<figure class="card stage" style="margin:0"><canvas role="img" aria-label="محاكاة: شمس فوق بحيرة، جزيئات ماء تتحرك، وبخار يتصاعد"></canvas>' +
      '<figcaption class="caption"><span class="legend"><span>⚪ جزيئات الماء</span><span>◌ بخار الماء</span></span><span data-live aria-live="polite"></span></figcaption></figure>' +
      '</section>';

    var $ = function (s) { return main.querySelector(s); };
    var sim = new WC.EvapSim($('canvas')).start();
    var notes = $('[data-notes]');
    if (plan.support >= 1) notes.appendChild(UI.pathNote('بناءً على توقّعك في البداية، أضفنا لك <b>أداة مقارنة</b> تساعدك على ملاحظة أثر الحرارة.'));
    else notes.appendChild(UI.pathNote('توقّعك الأول يدل على فهم جيد، لذلك ستستكشف بحرية <b>دون تلميحات</b>.', '🚀'));

    var mMotion = UI.meter('حركة جزيئات الماء'), mVapor = UI.meter('البخار المتصاعد');
    $('[data-meters]').append(mMotion.node, mVapor.node);

    var sl = UI.slider({ id: 'heat', label: '☀️ حرارة الشمس', value: 20, ends: ['ضعيفة', 'قوية'], cls: 'sun-track',
      onInput: function (v) { sim.set(v); track(v); } });
    $('[data-slider]').appendChild(sl.node);
    sim.set(20);

    function track(v) {
      if (v <= R.low) { seenLow = true; $('[data-c=low]').classList.add('ok'); }
      if (v >= R.high) { seenHigh = true; $('[data-c=high]').classList.add('ok'); }
      flow.refresh();
    }

    var tick = setInterval(function () {
      var r = sim.read();
      mMotion.set(r.motion, r.motionWord); mVapor.set(r.vapor, r.vaporWord);
      $('[data-live]').textContent = 'حرارة الشمس: ' + ar.pct(sl.value);
    }, 250);

    // compare tool (shown from the start for supported learners, or as the extra activity after a first error)
    var cmp = $('[data-compare]');
    if (plan.toolFromStart) cmp.hidden = false;
    cmp.querySelectorAll('[data-m]').forEach(function (b) {
      b.onclick = function () {
        if (busy) return;
        busy = true; var which = b.dataset.m, val = which === 'low' ? 20 : 90;
        sl.set(val, true); b.textContent = 'جارٍ القياس…';
        sim.measure(4).then(function (n) {
          busy = false; measured[which] = n;
          b.textContent = which === 'low' ? 'قِس عند ٢٠٪ ✓' : 'قِس عند ٩٠٪ ✓';
          var max = Math.max(measured.low || 0, measured.high || 0, 1);
          ['low', 'high'].forEach(function (k) {
            if (measured[k] === null) return;
            cmp.querySelector('[data-b=' + k + ']').style.width = (measured[k] / max * 100) + '%';
            cmp.querySelector('[data-v=' + k + ']').textContent = ar.digits(measured[k]);
          });
          if (measured.low !== null && measured.high !== null) {
            N.say({ kind: 'question', text: 'عند ٢٠٪ صعدت ' + ar.digits(measured.low) + ' نفثات بخار، وعند ٩٠٪ صعدت ' + ar.digits(measured.high) + '. ماذا تخبرك هذه المقارنة؟', timeout: 9000 });
            if (compareNeeded) { compareNeeded = false; flow.release(); }
          }
        });
      };
    });

    var flow = new WC.LabFlow({
      app: app, concept: 'evaporation', host: $('[data-flow]'),
      gateText: 'جرّب حرارة منخفضة ثم مرتفعة، ليظهر سؤال الاستنتاج.',
      isReady: function () { return seenLow && seenHigh; },
      nearTitle: 'اقتربت…',
      whyText: 'لاحظتُ أن العلاقة بين الحرارة والبخار تحتاج إلى ملاحظة أدق، لذلك أضفتُ لك <b>تجربة مقارنة</b>. جرّب مقارنة الحرارة المنخفضة بالحرارة المرتفعة، ثم أجب من جديد.',
      onExtra: function () {
        cmp.hidden = false; compareNeeded = true;
        measured = { low: null, high: null };
        cmp.querySelectorAll('.bar i').forEach(function (i) { i.style.width = 0; });
        cmp.querySelectorAll('[data-v]').forEach(function (i) { i.textContent = '—'; });
        cmp.querySelector('[data-m=low]').textContent = 'قِس عند ٢٠٪'; cmp.querySelector('[data-m=high]').textContent = 'قِس عند ٩٠٪';
        cmp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cmp.querySelector('[data-m=low]').focus({ preventScroll: true });
      },
      scaffoldText: 'دعنا نجرّب بطريقة أخرى: ضع الحرارة على ٢٠٪ وراقب البخار، ثم ارفعها إلى ٩٠٪. من أين صعد بخار أكثر؟ ولماذا تسارعت الجزيئات؟',
      onGuided: function (done) {
        WC.guidedDemo([
          { apply: function () { sl.set(15, true); }, say: 'انظر: الحرارة الآن ١٥٪. الجزيئات بطيئة، والبخار المتصاعد قليل جدًا.' },
          { apply: function () { sl.set(55, true); }, say: 'رفعتُ الحرارة إلى ٥٥٪… لاحظ أن الجزيئات أسرع، وبدأ البخار يزداد.' },
          { apply: function () { sl.set(95, true); }, say: 'والآن ٩٥٪: الجزيئات سريعة جدًا، والبخار يتصاعد بكثرة.' }
        ], done);
      },
      next: 'cloud', nextLabel: 'تابع إلى مختبر السحب'
    });

    if (plan.intro) {
      setTimeout(function () {
        N.say({ kind: 'question', text: plan.misconceptionNote
          ? 'توقّعتَ أن الماء يصير مطرًا مباشرة. لنختبر ذلك: حرّك حرارة الشمس، وتتبّع ما يصعد من سطح الماء.'
          : 'هل يبقى الماء كما هو فعلًا؟ حرّك حرارة الشمس من منخفضة إلى مرتفعة، وقارن ما تراه.' });
      }, 700);
    }
    return function () { clearInterval(tick); sim.stop(); };
  }
};
