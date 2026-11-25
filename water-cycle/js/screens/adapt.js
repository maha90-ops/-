/* adapt.js — «كيف تكيفت رحلتي؟»: reveals the system's logic using the learner's REAL decision log,
   then compares it with sample learners run through the same engine. */
window.WC = window.WC || {}; WC.Screens = WC.Screens || {};

WC.Screens.adapt = {
  rail: 7,
  mount: function (main, app) {
    var L = app.learner, C = WC.CONCEPTS, ar = WC.ar;
    var FLOW = [
      ['استجابة المتعلم', 'ما تختاره وما تجرّبه في المحاكاة'],
      ['تشخيص الفهم', 'ماذا تكشف الاستجابة عن تفكيرك؟'],
      ['تحديد الاحتياج', 'أي علاقة تحتاج إلى اكتشاف؟'],
      ['اختيار النشاط', 'تجربة إضافية، سقالة، أو تحدٍّ أعلى'],
      ['التغذية الراجعة', 'فورية، لطيفة، ومرتبطة بالمفهوم'],
      ['إعادة التقييم', 'هل تحسّن الفهم؟ ثم تبدأ الدورة من جديد']
    ];
    var flow = FLOW.map(function (f, i) {
      return (i ? '<div class="down" aria-hidden="true">↓</div>' : '') +
        '<div class="fstep" data-f="' + i + '"><span class="i">' + ar.digits(i + 1) + '</span><span>' + f[0] + '<small>' + f[1] + '</small></span></div>';
    }).join('');

    // pick the most informative real decisions: support first, then challenges, then the diagnosis
    var weight = { guided: 6, scaffold: 5, extra: 5, hint: 4, 'mission-plan': 3, challenge: 3, 'challenge-result': 2 };
    var picked = L.log.filter(function (e) { return weight[e.action] || e.concept === 'diagnostic'; })
      .sort(function (a, b) { return (weight[b.action] || 1) - (weight[a.action] || 1) || a.id - b.id; }).slice(0, 4)
      .sort(function (a, b) { return a.id - b.id; });
    var cases = picked.map(function (e) { return caseCard(e, false); }).join("");
    if (!cases) {
      cases = caseCard({ concept: 'condensation', response: 'أخطأ في التكاثف مرتين.', diagnosis: 'حدد أن المفهوم يحتاج إلى دعم.',
        decision: 'تقديم تجربة التحكم بدرجة الحرارة.', result: 'تحسّن الأداء.' }, true);
    }
    function caseCard(e, demo) {
      var title = e.concept === 'diagnostic' ? 'التشخيص الأولي' : e.concept === 'mission' ? 'المهمة النهائية' : C[e.concept].name;
      return '<article class="card case"><div class="row" style="justify-content:space-between"><b>' + title + '</b>' +
        (demo ? '<span class="tag">مثال توضيحي</span>' : '<span class="tag">قرار حقيقي من رحلتك</span>') + '</div>' +
        '<div class="grid4"><div class="cell"><span>المتعلم</span>' + e.response + '</div>' +
        '<div class="cell"><span>النظام</span>' + e.diagnosis + '</div>' +
        '<div class="cell"><span>القرار</span>' + e.decision + '</div>' +
        '<div class="cell res' + (e.result ? '' : ' pend') + '"><span>النتيجة</span>' + (e.result || 'قيد المتابعة') + '</div></div></article>';
    }

    function journey(Lx, title, blurb, mine) {
      var steps = Lx.timeline.map(function (t) {
        var cls = t.kind === 'sup' ? 'sup' : t.kind === 'ch' ? 'ch' : '';
        var lab = t.kind === 'sup' ? 'دعم' : t.kind === 'ch' ? 'تحدٍّ' : 'تقدّم';
        return '<li class="' + cls + '"><b>' + lab + '</b><span>' + t.text + '</span></li>';
      }).join('');
      var states = WC.CONCEPT_ORDER.map(function (k) { var s = WC.Engine.status(Lx, k); return C[k].name + ': ' + s.label; }).join(' · ');
      return '<article class="card persona"' + (mine ? ' style="border-color:var(--water)"' : '') + '><h4>' + title + '</h4><p class="muted" style="font-size:.88rem">' + blurb + '</p>' +
        '<ol class="steps">' + (steps || '<li><b>—</b><span>لم تبدأ الرحلة بعد</span></li>') + '</ol><small class="muted">' + states + '</small></article>';
    }
    var personas = journey(L, L.name === 'أنت' ? 'رحلتك أنت' : 'رحلة ' + L.name, 'الرحلة التي بناها النظام من استجاباتك', true) +
      WC.PERSONAS.map(function (p) { return journey(WC.simulatePersona(p), p.name + ' (متعلم تجريبي)', p.blurb); }).join('');

    main.innerHTML =
      '<section class="adapt screen">' +
      '<header><span class="eyebrow">خلف الكواليس</span><h2>كيف تكيّفت رحلتي؟</h2>' +
      '<p class="muted" style="max-width:56ch">في كل خطوة، يقرأ النظام استجابتك، ويقرّر النشاط التالي. هذه هي القرارات التي اتخذها فعلًا في رحلتك.</p></header>' +
      '<div class="two"><div class="card flow" aria-label="دورة القرار التكيفي">' + flow + '</div>' +
      '<div class="cases"><div class="section-title"><h3>أمثلة من رحلتك</h3><p class="muted" style="font-size:.9rem">المتعلم ← النظام ← القرار ← النتيجة</p></div>' + cases + '</div></div>' +
      '<div class="section-title"><h3>نفس الهدف… رحلات تعلم مختلفة</h3><p class="muted" style="font-size:.9rem">المتعلمون التجريبيون مرّوا بالمحرك التكيفي نفسه، بإجابات مختلفة، فحصل كلٌّ منهم على مسار مختلف.</p></div>' +
      '<div class="personas">' + personas + '</div>' +
      '<p class="closing">لم نصمم درسًا رقميًا عن دورة المياه، بل صممنا بيئة تتغير عندما يتغير المتعلم.</p>' +
      '<div class="center-row"><button class="btn ghost" type="button" data-map>العودة إلى خريطة تعلّمي</button><button class="btn ghost" type="button" data-again>ابدأ رحلة جديدة</button></div>' +
      '<div class="center-row"><button class="designer-link" type="button" data-designer>عرض منطق التصميم</button></div>' +
      '</section>';

    // light the decision cycle step by step (motion here only emphasises the sequence)
    var i = 0, steps = main.querySelectorAll('.fstep');
    var t = setInterval(function () { steps.forEach(function (s, j) { s.classList.toggle('lit', j === i); }); i = (i + 1) % steps.length; }, 1400);
    main.querySelector('[data-map]').onclick = function () { app.go('map'); };
    main.querySelector('[data-again]').onclick = function () { app.restart(); };
    return function () { clearInterval(t); };
  }
};
