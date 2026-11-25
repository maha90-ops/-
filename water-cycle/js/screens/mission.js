/* mission.js — Screen 6: rescue the water cycle.
   Faults are chosen by the engine from the learner model; hints are targeted
   by diagnosing which link of the chain is blocked right now. */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.mission = {
  rail: 6,
  mount: function (main, app) {
    var UI = WC.UI, ar = WC.ar, N = WC.Nuqta, E = WC.Engine, L = app.learner, M = WC.CYCLE_MODEL, RM = WC.RULES.mission, K = WC.CONTENT;
    var plan = E.planMission(L);
    var ctrl = Object.assign({}, M.good);
    plan.faults.forEach(function (f) {
      if (f === 'evaporation') ctrl.sun = M.fault.sun;
      if (f === 'condensation') ctrl.air = M.fault.air;
      if (f === 'precipitation') ctrl.size = M.fault.size;
    });
    var start = Object.assign({}, ctrl);
    var sinceHint = 0, tier = 0, lastHintAt = performance.now(), hold = 0, done = false;
    var hintEvery = plan.hard ? RM.hintEveryChanges.hard : RM.hintEveryChanges.normal;

    var NODES = [
      { k: 'heat', e: '☀️', l: 'حرارة الشمس' }, { k: 'evap', e: '💧', l: 'تبخّر الماء' }, { k: 'vapor', e: '💨', l: 'بخار في الهواء' },
      { k: 'cloud', e: '☁️', l: 'سحب' }, { k: 'rain', e: '🌧️', l: 'مطر' }, { k: 'lake', e: '🏞️', l: 'مياه البحيرة' }
    ];
    var chainHtml = NODES.map(function (n, i) {
      return (i ? '<span class="arr" aria-hidden="true">←</span>' : '') +
        '<div class="cnode" data-n="' + n.k + '"><span class="e" aria-hidden="true">' + n.e + '</span>' +
        (plan.hard ? '' : '<span class="l">' + n.l + '</span>') + '<span class="mbar"><i></i></span><span class="w">—</span></div>';
    }).join('');

    main.innerHTML =
      '<section class="mission screen">' +
      '<div class="alert" data-alert role="status"><span aria-hidden="true" style="font-size:1.4rem">🚨</span><div><h2>حدث خلل في الدورة!</h2><p>اجعل المطر يهطل من جديد.</p></div></div>' +
      '<div class="card cycle-chain" aria-label="سلسلة دورة المياه الآن">' + chainHtml + '</div>' +
      '<div class="grid">' +
      '<div class="panel">' +
      '<div class="card weather" style="padding:18px"><h3><span aria-hidden="true">🎛️</span> أنت تتحكم في الطقس</h3>' +
      (plan.hard ? '<span class="tag challenge">⬆ مستوى أعلى: ثلاثة أعطال، ودون أسماء للمراحل</span>' : '<span class="tag support">اخترنا الأعطال من المراحل التي احتجت فيها إلى دعم</span>') +
      '<div data-sliders style="display:grid;gap:10px"></div>' +
      '<div class="row"><button class="btn small ghost" type="button" data-hint>💧 أحتاج إلى تلميح</button></div></div>' +
      '<div data-explain></div>' +
      '</div>' +
      '<figure class="card stage" style="margin:0"><canvas role="img" aria-label="محاكاة دورة المياه: شمس، بحيرة، بخار، سحابة، مطر، ونهر يعود إلى البحيرة"></canvas>' +
      '<figcaption class="caption"><span data-live aria-live="polite"></span><span class="muted">التغيير ينتقل من حلقة إلى أخرى ببطء… راقب السلسلة.</span></figcaption></figure>' +
      '</div></section>';

    var $ = function (s) { return main.querySelector(s); };
    var sim = new WC.CycleSim($('canvas'), ctrl).start();
    var SL = [
      { k: 'sun', label: '☀️ حرارة الشمس', ends: ['ضعيفة', 'قوية'], cls: 'sun-track' },
      { k: 'air', label: '🌡️ درجة حرارة الهواء', ends: ['دافئ', 'بارد'], cls: 'cold-track' },
      { k: 'vapor', label: '💨 كمية بخار الماء', ends: ['قليلة', 'كثيرة'] },
      { k: 'size', label: '💧 حجم قطرات الماء', ends: ['صغيرة', 'كبيرة'] }
    ];
    var sliders = {};
    SL.forEach(function (d) {
      var prev = ctrl[d.k];
      var s = UI.slider({ id: 'm-' + d.k, label: d.label, value: ctrl[d.k], ends: d.ends, cls: d.cls || '',
        onInput: function (v) { sim.set(d.k, v); },
        onChange: function (v) {
          if (done) return;
          L.mission.changes++; sinceHint++;
          L.mission.changeLog.push({ k: d.k, label: d.label.replace(/^\S+\s/, ''), from: prev, to: v });
          prev = v;
        } });
      sliders[d.k] = s; $('[data-sliders]').appendChild(s.node);
    });

    function hint(manual) {
      var s = sim.s, block = E.missionBlock(s);
      tier = Math.min(2, tier + 1);
      E.missionHint(L, block, tier);
      var text = K.missionHints[block || 'none'][tier - 1];
      N.say({ kind: manual ? 'hint' : 'question', text: text });
      sinceHint = 0; lastHintAt = performance.now();
      if (tier >= 2 && !plan.hard && block) {
        var map = { evaporation: s.evap < 0.45 ? 'evap' : 'vapor', condensation: 'cloud', precipitation: 'rain' };
        main.querySelectorAll('.cnode').forEach(function (n) { n.classList.toggle('blocked', n.dataset.n === map[block]); });
      }
    }
    $('[data-hint]').onclick = function () { hint(true); };

    var lastT = performance.now();
    var tick = setInterval(function () {
      var now = performance.now(), dt = (now - lastT) / 1000; lastT = now;
      var s = sim.s;
      NODES.forEach(function (n) {
        var v = n.k === 'lake' ? s.lake : s[n.k], node = main.querySelector('[data-n=' + n.k + ']');
        node.querySelector('i').style.width = Math.round(v * 100) + '%';
        node.querySelector('.w').textContent = UI.level3(v, ['ضعيف', 'متوسط', 'قوي']);
        node.querySelector('.e').style.transform = 'scale(' + (0.85 + v * 0.35) + ')';
      });
      $('[data-live]').textContent = s.rain > 0.05 ? '🌧️ المطر يهطل، والبحيرة تمتلئ' : '☁️ لا مطر بعد';
      if (done) return;
      hold = s.rain >= RM.successRain ? hold + dt : 0;
      if (hold >= RM.successHold) return succeed();
      var idle = (now - lastHintAt) / 1000;
      if (sinceHint >= hintEvery || (idle >= RM.hintIdleSeconds && L.mission.changes > 0)) hint(false);
    }, 250);

    function succeed() {
      done = true; E.missionSuccess(L); N.hide();
      main.querySelectorAll('.cnode').forEach(function (n) { n.classList.remove('blocked'); });
      var a = $('[data-alert]'); a.classList.add('ok');
      a.innerHTML = '<span aria-hidden="true" style="font-size:1.4rem">🎉</span><div><h2>نجحت في إعادة تشغيل الدورة!</h2><p>عاد المطر، وبدأت البحيرة تمتلئ من جديد.</p></div>';
      WC.Audio.chime(); WC.Audio.speak('نجحت في إعادة تشغيل الدورة!');
      explain();
    }

    /* ---------- explanation: your changes → causal chain → collection ---------- */
    function explain() {
      var host = $('[data-explain]');
      var changes = [];
      SL.forEach(function (d) {
        if (sliders[d.k].value !== start[d.k]) changes.push('<li>' + d.label.replace(/^\S+\s/, '') + ': من ' + ar.pct(start[d.k]) + ' إلى ' + ar.pct(sliders[d.k].value) + '</li>');
      });
      var box = UI.h('<div class="card step-block" style="padding:18px">' +
        '<h3>اشرح كيف أدت تغييراتك إلى عودة المطر.</h3>' +
        '<div><b style="font-size:.9rem">ما غيّرتَه:</b><ul class="changes">' + (changes.join('') || '<li>انتظرتَ حتى استقرّت الدورة</li>') + '</ul></div>' +
        '<p class="muted" style="font-size:.92rem">رتّب ما حدث بالضغط على البطاقات بالترتيب الصحيح:</p>' +
        '<div class="order-cards"></div>' +
        '<div class="row"><button class="btn small ghost" type="button" data-reset>إعادة الترتيب</button></div>' +
        '<div class="feedback" data-cfb></div>' +
        '<div class="step-block" data-words hidden><label for="own" style="font-weight:700">اشرح بكلماتك (اختياري):</label><textarea id="own" placeholder="مثلًا: عندما رفعتُ…"></textarea></div>' +
        '<div data-coll></div></div>');
      host.appendChild(box);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var order = [], chainErrors = 0, right = ['evaporation', 'condensation', 'precipitation', 'collection'];
      var cards = box.querySelector('.order-cards'), cfb = box.querySelector('[data-cfb]');
      K.chain.forEach(function (c) {
        var b = UI.h('<button type="button"><span class="num" aria-hidden="true">·</span><span>' + c.text + '</span></button>');
        b.onclick = function () {
          if (b.classList.contains('picked') || order.length >= 4) return;
          order.push(c.id); b.classList.add('picked'); b.querySelector('.num').textContent = ar.digits(order.length);
          b.setAttribute('aria-label', 'الخطوة ' + ar.digits(order.length) + ': ' + c.text);
          if (order.length === 4) checkOrder();
        };
        cards.appendChild(b);
      });
      function reset() { order = []; cards.querySelectorAll('button').forEach(function (b) { b.classList.remove('picked'); b.querySelector('.num').textContent = '·'; b.disabled = false; b.removeAttribute('aria-label'); }); }
      box.querySelector('[data-reset]').onclick = reset;
      function checkOrder() {
        var bad = order.findIndex(function (id, i) { return id !== right[i]; });
        if (bad === -1) {
          cards.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
          box.querySelector('[data-reset]').hidden = true;
          UI.feedback(cfb, 'good', 'سلسلة صحيحة', 'تبخّر ← تكاثف ← هطول ← تجمّع: كل تغيير قاد إلى الذي بعده.');
          L.addTimeline(chainErrors ? 'sup' : 'ok', chainErrors ? 'رتّب سلسلة الدورة بعد محاولة إضافية' : 'رتّب سلسلة الدورة من أول محاولة');
          box.querySelector('[data-words]').hidden = false;
          collection();
        } else {
          chainErrors++;
          var prevTxt = bad === 0 ? 'البداية' : '«' + WC.CONCEPTS[order[bad - 1]].name + '»';
          UI.feedback(cfb, 'near', 'راجع الحلقة رقم ' + ar.digits(bad + 1), 'ماذا يجب أن يحدث بعد ' + prevTxt + '؟ تذكّر: لا مطر دون سحابة، ولا سحابة دون بخار.');
          setTimeout(reset, 900);
        }
      }

      function collection() {
        var host2 = box.querySelector('[data-coll]');
        var cq, qfb = UI.h('<div class="feedback"></div>');
        var Kc = K.collection;
        cq = new UI.Question(host2, { id: 'collection', prompt: Kc.prompt, options: Kc.options, onAnswer: function (opt) {
          var d = E.answer(L, 'collection', opt);
          if (opt.correct) {
            cq.markRight(opt.id); N.hide();
            UI.feedback(qfb, 'good', 'استنتاج دقيق', opt.fb);
            host2.appendChild(UI.discovery('collection'));
            var fin = UI.h('<div class="row end"><button class="btn" type="button">اعرض خريطة تعلّمي <span class="arrow" aria-hidden="true">➜</span></button></div>');
            fin.querySelector('button').onclick = function () {
              L.explanation = { text: box.querySelector('#own').value.trim(), chainErrors: chainErrors };
              app.go('map');
            };
            host2.appendChild(fin);
            return;
          }
          cq.markTried(opt.id);
          UI.feedback(qfb, 'near', 'اقتربت…', opt.fb);
          if (d.action === 'extra') {
            N.say({ kind: 'why', text: 'لاحظتُ أن مسار ماء المطر بعد سقوطه يحتاج إلى متابعة، لذلك سأجعل المطر يهطل بقوة. تتبّع النهر والبحيرة في المشهد.' });
            sliders.sun.set(85, true); sliders.air.set(90, true); sliders.vapor.set(90, true); sliders.size.set(90, true);
          } else {
            cq.reduceTo(d.keep, d.action === 'guided');
            N.say({ kind: 'scaffold', text: 'انظر إلى النهر في المشهد: إلى أين يحمل ماء المطر؟ وماذا تفعل الشمس بماء البحيرة بعد ذلك؟' });
          }
        } });
        host2.appendChild(qfb);
      }
    }

    var intro = setTimeout(function () {
      if (tier > 0 || done) return;
      N.say({ kind: 'question', text: plan.hard
        ? 'هذه مهمة لمن أتقن المراحل كلها: ثلاث حلقات معطّلة. لن أتدخل إلا إذا طال البحث أو طلبتَ تلميحًا.'
        : 'لاحظتُ في رحلتك ما احتاج إلى دعم، فجعلتُ الخلل هناك. أين تتوقف السلسلة؟ راقبها في الأعلى.', timeout: 9000 });
    }, 800);

    return function () { clearInterval(tick); clearTimeout(intro); sim.stop(); };
  }
};
