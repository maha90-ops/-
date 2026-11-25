/* cloud.js — Screen 4: clouds & condensation lab. */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.cloud = {
  rail: 4,
  mount: function (main, app) {
    var UI = WC.UI, ar = WC.ar, N = WC.Nuqta, L = app.learner;
    var plan = WC.Engine.plan(L, 'condensation');
    var R = WC.RULES.explore.condensation;
    var cooled = false, sawCloud = false, slowNeeded = false, log = {};
    var STEPS = [{ v: 0, t: 'دافئ جدًا' }, { v: 30, t: 'دافئ' }, { v: 65, t: 'بارد' }, { v: 95, t: 'بارد جدًا' }];
    var STAGE = { vapor: 'بخار فقط', drops: 'قطرات صغيرة', cloud: 'سحابة' };
    function word(v) { return v < 20 ? 'دافئ جدًا' : v < 45 ? 'دافئ' : v < 65 ? 'معتدل' : v < 85 ? 'بارد' : 'بارد جدًا'; }

    main.innerHTML =
      '<section class="lab screen">' +
      '<div class="panel">' +
      '<header><span class="eyebrow">المختبر الثاني · الهواء والبخار</span><h2>مختبر السحب</h2>' +
      '<p class="task">برّد <b>الهواء</b> تدريجيًا، وراقب ما يحدث لبخار الماء الصاعد.</p></header>' +
      '<div data-notes></div>' +
      '<div data-slider></div>' +
      '<div class="chain3" aria-live="polite" aria-label="مرحلة البخار الآن">' +
      '<div class="node" data-s="vapor"><b aria-hidden="true">💨</b>بخار ماء</div><span class="sep" aria-hidden="true">←</span>' +
      '<div class="node" data-s="drops"><b aria-hidden="true">💧</b>قطرات صغيرة</div><span class="sep" aria-hidden="true">←</span>' +
      '<div class="node" data-s="cloud"><b aria-hidden="true">☁️</b>سحابة</div></div>' +
      '<ul class="checks" aria-label="خطوات الملاحظة"><li data-c="cool">برّد الهواء حتى يصبح باردًا</li><li data-c="see">لاحظ ما تكوّن في الأعلى</li></ul>' +
      '<div class="step-block" data-slow hidden>' +
      '<b>🌡️ تجربة التبريد البطيء</b><span class="muted">اختر الدرجات بالترتيب من الأدفأ إلى الأبرد، وانتظر قليلًا عند كل درجة.</span>' +
      '<div class="steps4" role="group" aria-label="درجات حرارة الهواء"></div>' +
      '<table class="coollog"><thead><tr><th>الهواء</th><th>ماذا تكوّن؟</th></tr></thead><tbody></tbody></table></div>' +
      '<div data-flow></div>' +
      '</div>' +
      '<figure class="card stage" style="margin:0"><canvas role="img" aria-label="محاكاة: بخار يصعد من بحيرة نحو هواء يبرد، فيتحول إلى قطرات تتجمع في سحابة"></canvas>' +
      '<figcaption class="caption"><span class="legend"><span>◌ بخار</span><span>💧 قطرة صغيرة</span><span>☁️ سحابة</span></span><span data-live aria-live="polite"></span></figcaption></figure>' +
      '</section>';

    var $ = function (s) { return main.querySelector(s); };
    var sim = new WC.CloudSim($('canvas')).start();
    var notes = $('[data-notes]');
    // adaptation visible to the learner: recap only if evaporation needed support
    if (plan.recap.indexOf('evaporation') > -1)
      notes.appendChild(UI.pathNote('تذكير سريع لأنك احتجت إلى تجربة إضافية في التبخر: حرارة الشمس تحوّل الماء إلى <b>بخار يصعد</b> إلى الأعلى.', '↩️'));
    else
      notes.appendChild(UI.pathNote('أتقنتَ <b>التبخر</b>، فلن نعيد شرحه. ننتقل مباشرة إلى ما يحدث للبخار في الأعلى.', '⏭️'));

    var sl = UI.slider({ id: 'air', label: '🌡️ درجة حرارة الهواء', value: 10, ends: ['دافئ', 'بارد'], cls: 'cold-track',
      format: function (v) { return ar.deg(30 - v * 0.32) + ' · ' + word(v); },
      onInput: function (v) { sim.set(v); if (v >= R.cold) { cooled = true; $('[data-c=cool]').classList.add('ok'); } flow.refresh(); } });
    $('[data-slider]').appendChild(sl.node);
    sim.set(10);

    var tick = setInterval(function () {
      var st = sim.stage();
      main.querySelectorAll('.chain3 .node').forEach(function (n) { n.classList.toggle('on', n.dataset.s === st); });
      if (st === 'cloud' && !sawCloud) { sawCloud = true; $('[data-c=see]').classList.add('ok'); flow.refresh(); }
      $('[data-live]').textContent = 'الهواء: ' + word(sl.value) + ' · الآن: ' + STAGE[st];
    }, 300);

    // extra activity: slow, stepwise cooling with an observation log
    var slow = $('[data-slow]'), steps = slow.querySelector('.steps4'), tbody = slow.querySelector('tbody'), wait;
    STEPS.forEach(function (s, i) {
      var b = UI.h('<button type="button" aria-pressed="false">' + s.t + '</button>');
      b.onclick = function () {
        steps.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        sl.set(s.v, true);
        clearTimeout(wait);
        renderLog(i, '… راقب');
        wait = setTimeout(function () {
          log[i] = STAGE[sim.stage()]; renderLog(i);
          if (Object.keys(log).length === STEPS.length && slowNeeded) {
            slowNeeded = false; sl.disable(false);
            N.say({ kind: 'question', text: 'انظر إلى جدول ملاحظاتك: كلما برد الهواء أكثر… ماذا حدث للبخار؟', timeout: 8000 });
            flow.release();
          }
        }, 4200);
      };
      steps.appendChild(b);
    });
    function renderLog(cur, pending) {
      tbody.innerHTML = STEPS.map(function (s, i) {
        var val = log[i] || (i === cur && pending ? pending : '—');
        return '<tr class="' + (i === cur ? 'cur' : '') + '"><td>' + s.t + '</td><td>' + val + '</td></tr>';
      }).join('');
    }
    renderLog(-1);

    var flow = new WC.LabFlow({
      app: app, concept: 'condensation', host: $('[data-flow]'),
      gateText: 'برّد الهواء ولاحظ ما يتكوّن في الأعلى، ليظهر سؤال الاستنتاج.',
      isReady: function () { return cooled && sawCloud; },
      whyText: 'لاحظتُ أن العلاقة بين برودة الهواء والبخار تحتاج إلى تجربة أبطأ، لذلك أضفتُ لك <b>تجربة التبريد البطيء</b>. سجّل ما يتكوّن عند كل درجة، ثم أجب من جديد.',
      onExtra: function () {
        slow.hidden = false; slowNeeded = true; log = {}; renderLog(-1);
        sl.disable(true); sl.set(0, true);
        slow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        steps.querySelector('button').focus({ preventScroll: true });
      },
      scaffoldText: 'دعنا نجرّب بطريقة أخرى. برّد الهواء ببطء ولاحظ ما يحدث للبخار. انظر إليه عندما يصل إلى الطبقة الباردة في الأعلى: هل يبقى بخارًا؟',
      onScaffold: function () { sl.set(0, true); },
      onGuided: function (done) {
        WC.guidedDemo([
          { apply: function () { sl.set(5, true); }, say: 'الهواء دافئ جدًا الآن: البخار يصعد ويبقى بخارًا.', wait: 4200 },
          { apply: function () { sl.set(65, true); }, say: 'برّدتُ الهواء… لاحظ أن بعض البخار يتحوّل إلى قطرات صغيرة في الأعلى.', wait: 4600 },
          { apply: function () { sl.set(95, true); }, say: 'الهواء بارد جدًا: القطرات الصغيرة تتجمّع وتكوّن سحابة.', wait: 4600 }
        ], done);
      },
      next: 'rain', nextLabel: 'تابع إلى مختبر المطر'
    });

    if (plan.misconceptionNote) {
      setTimeout(function () { N.say({ kind: 'why', text: 'في توقّعك الأول ظننتَ أن الماء يصير مطرًا مباشرة. هنا ستكتشف المرحلة التي تحدث <b>بين</b> البخار والمطر.' }); }, 700);
    } else if (plan.intro) {
      setTimeout(function () { N.say({ kind: 'question', text: 'ماذا يحدث لبخار الماء عندما يواجه هواءً أبرد؟ جرّب أن تغيّر درجة الحرارة.' }); }, 700);
    }
    return function () { clearInterval(tick); clearTimeout(wait); sim.stop(); };
  }
};
