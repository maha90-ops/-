/* designer.js — «عرض منطق التصميم»: a panel for academic supervisors.
   Shows the frameworks, the live rules (read from WC.RULES), the live decision log,
   and quick tools for a demo (jump to a screen, load a sample learner). */
window.WC = window.WC || {};

WC.Designer = (function () {
  var dlg;
  function rulesTable() {
    var R = WC.RULES, C = WC.CONCEPTS, ar = WC.ar;
    var rows = [
      ['التشخيص الأولي', 'اختيار «يبقى الماء كما هو» أو «يتحول مباشرة إلى مطر»', 'بدء مختبر الشمس بأداة المقارنة وتوجيه من نُقطة', 'RULES.diagnostic'],
      ['أول خطأ في مفهوم', 'عدد الأخطاء = ' + ar.digits(R.ladder.extraAt), 'تجربة إضافية خاصة بالمفهوم (مقارنة، تبريد بطيء، مقياس الثقل)', 'RULES.ladder.extraAt'],
      ['تكرار الخطأ', 'عدد الأخطاء = ' + ar.digits(R.ladder.scaffoldAt), 'سقالة من نُقطة + إخفاء الخيارات المستبعدة (' + ar.digits(R.ladder.scaffoldKeep) + ' على الأكثر)', 'RULES.ladder.scaffoldAt'],
      ['خطأ ثالث', 'عدد الأخطاء = ' + ar.digits(R.ladder.guidedAt), 'عرض موجّه تضبط فيه نُقطة التجربة، ثم خياران', 'RULES.ladder.guidedAt'],
      ['إتقان من أول محاولة', 'لا أخطاء في المفهوم', 'لا إعادة للشرح + تحدٍّ أعلى (سؤال نقل أو مهمة أصعب)', 'RULES.challengeOnFirstTry'],
      ['احتاج التبخر إلى دعم', 'أخطاء في التبخر', 'تذكير قصير في بداية مختبر السحب (ويُحذف لمن أتقن)', 'RULES.recapIfErrorsIn'],
      ['احتاج التكاثف إلى دعم', 'أخطاء في التكاثف', 'مقياس الثقل يظهر من بداية مختبر المطر', 'RULES.supportFromPrior'],
      ['المهمة النهائية', 'المفاهيم التي فيها أخطاء', 'تصبح هي الأعطال؛ ومن أتقن كل شيء يواجه ثلاثة أعطال دون أسماء للمراحل', 'RULES.mission'],
      ['تعثّر في المهمة', 'تغيير المتغيرات ' + ar.digits(R.mission.hintEveryChanges.normal) + ' مرات دون مطر، أو ' + ar.digits(R.mission.hintIdleSeconds) + ' ثانية', 'تشخيص الحلقة المتوقفة من حالة المحاكاة ← تلميح موجّه عنها', 'Engine.missionBlock']
    ];
    return '<table class="rules"><thead><tr><th>الموقف</th><th>الشرط</th><th>القرار</th><th>في الكود</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td><code>' + r[3] + '</code></td></tr>'; }).join('') + '</tbody></table>';
  }
  function logList(app) {
    var C = WC.CONCEPTS, log = app.learner.log;
    if (!log.length) return '<li>لا توجد قرارات بعد. ابدأ الرحلة، ثم افتح هذه اللوحة من جديد.</li>';
    return log.map(function (e) {
      var who = e.concept === 'diagnostic' ? 'التشخيص' : e.concept === 'mission' ? 'المهمة' : C[e.concept].name;
      return '<li>[' + WC.ar.digits(e.id) + '] ' + who + ' — ' + e.response + ' ← ' + e.decision + (e.result ? ' ← ' + e.result : '') + '</li>';
    }).join('');
  }
  function open(app) {
    if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'designer'; document.body.appendChild(dlg); }
    var screens = [['gate', 'البوابة'], ['diag', 'التشخيص'], ['evap', 'مختبر الشمس'], ['cloud', 'مختبر السحب'], ['rain', 'مختبر المطر'], ['mission', 'المهمة'], ['map', 'خريطة التعلم'], ['adapt', 'كيف تكيفت رحلتي؟']];
    dlg.innerHTML =
      '<div class="dz"><header><h2>كيف صممنا هذه البيئة؟</h2><button class="tool" type="button" data-close aria-label="إغلاق">✕ <span class="t">إغلاق</span></button></header>' +
      '<div class="body">' +
      '<div class="fw">' +
      '<div class="f"><b>ADDIE</b><p>الإطار العام لتصميم البيئة: تحليل ← تصميم ← تطوير ← تنفيذ ← تقويم.</p></div>' +
      '<div class="f"><b>Adaptive Learning</b><p>تكييف مسار التعلم بناءً على استجابة المتعلم: النشاط التالي ومستوى الدعم يتغيّران وفق ما يُظهره المتعلم.</p></div>' +
      '<div class="f"><b>UDL</b><p>تقديم أكثر من طريقة للمشاركة والفهم والتفاعل: نص وصوت اختياري، رموز مع كلمات، مؤشرات لفظية بجانب الحركة، لوحة مفاتيح، وتكبير الخط.</p></div>' +
      '<div class="f"><b>الاستقصاء</b><p>الطالب يغيّر المتغيرات ويلاحظ النتائج ويستنتج العلاقات؛ المصطلح العلمي يظهر بعد الاكتشاف لا قبله.</p></div>' +
      '</div>' +
      '<div class="section-title"><h3>قواعد التكيّف (تُقرأ من الكود مباشرة)</h3><p class="muted" style="font-size:.88rem">كل القواعد في كائن واحد قابل للتعديل: <code style="direction:ltr;unicode-bidi:isolate">js/core/adaptive.js → WC.RULES</code></p></div>' +
      rulesTable() +
      '<div class="section-title"><h3>سجل القرارات الحي لهذه الرحلة</h3></div><ol class="livelog">' + logList(app) + '</ol>' +
      '<div class="section-title"><h3>أدوات العرض</h3><p class="muted" style="font-size:.88rem">للانتقال السريع أثناء العرض، أو لتحميل رحلة متعلم تجريبي مرّت بالمحرك نفسه.</p></div>' +
      '<div class="jump">' + screens.map(function (s) { return '<button class="tool" type="button" data-go="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>' +
      '<div class="jump">' + WC.PERSONAS.map(function (p) { return '<button class="btn small ghost" type="button" data-persona="' + p.id + '">حمّل رحلة ' + p.name + ': ' + p.blurb + '</button>'; }).join('') + '</div>' +
      '</div></div>';
    dlg.querySelector('[data-close]').onclick = function () { dlg.close(); };
    dlg.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { dlg.close(); app.go(b.dataset.go); }; });
    dlg.querySelectorAll('[data-persona]').forEach(function (b) {
      b.onclick = function () {
        var p = WC.PERSONAS.find(function (x) { return x.id === b.dataset.persona; });
        app.learner = WC.simulatePersona(p); dlg.close(); app.go('map');
      };
    });
    dlg.showModal();
  }
  return { open: open };
})();
