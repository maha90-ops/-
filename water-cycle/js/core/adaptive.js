/* adaptive.js — the adaptive engine.
   ---------------------------------------------------------------
   RULES holds every pedagogical decision in one editable place.
   Engine reads the learner model + RULES and returns decisions
   that the screens actually execute (tools shown, options removed,
   challenge offered, mission faults chosen, hints targeted).
   --------------------------------------------------------------- */
window.WC = window.WC || {};

WC.RULES = {
  /* Initial diagnosis → starting support per concept */
  diagnostic: {
    same:  { support: { evaporation: 1 },
             diagnosis: 'لم يربط بعد بين حرارة الشمس وتغيّر الماء',
             decision: 'بدء مختبر الشمس بأداة المقارنة وتوجيه قصير من نُقطة' },
    vapor: { support: {},
             diagnosis: 'تصوّر أولي صحيح عن أثر الحرارة في الماء',
             decision: 'استكشاف حر في مختبر الشمس دون سقالات' },
    rain:  { support: { evaporation: 1, condensation: 1 },
             diagnosis: 'يقفز من الماء إلى المطر دون المرور بالبخار والسحب (تصوّر بديل شائع)',
             decision: 'دعم أولي في التبخر والتكاثف، مع تنبيه إلى المراحل الوسيطة' }
  },

  /* What happens after the n-th wrong answer on the same concept */
  ladder: {
    extraAt: 1,      // first error  → concept-specific extra activity
    scaffoldAt: 2,   // second error → نُقطة scaffold + options reduced
    guidedAt: 3,     // third error  → guided demonstration + two options only
    scaffoldKeep: 3, // options kept after scaffold
    guidedKeep: 2    // options kept in guided mode
  },

  /* Show a short recap of concept B at the start of lab A only if B needed support */
  recapIfErrorsIn: { condensation: ['evaporation'], precipitation: ['condensation'] },

  /* Start lab A with its support tool switched on if any of these concepts needed support */
  supportFromPrior: { precipitation: ['condensation'] },

  /* Mastery on first try → raise the challenge (no re-explanation) */
  challengeOnFirstTry: ['evaporation', 'condensation', 'precipitation'],

  /* Exploration that must happen before the inference question unlocks */
  explore: {
    evaporation: { low: 30, high: 70 },
    condensation: { cold: 70 },
    precipitation: { needRain: true }
  },

  /* Final mission */
  mission: {
    faultsFromErrors: true,        // concepts with errors become the faults to repair
    allFaultsWhenMastered: true,   // no errors at all → all three faults + no stage labels
    hintEveryChanges: { normal: 6, hard: 10 },
    hintIdleSeconds: 30,
    successRain: 0.2, successHold: 3
  }
};

WC.Engine = (function () {
  var R = WC.RULES;
  var C = WC.CONCEPTS;

  function push(L, entry) {
    entry.id = L.log.length + 1;
    entry.result = entry.result || null;
    L.log.push(entry);
    return entry;
  }

  /* ---------- diagnostic ---------- */
  function diagnose(L, optionId, optionText) {
    var rule = R.diagnostic[optionId];
    L.diagnostic = optionId;
    Object.keys(rule.support).forEach(function (k) { L.c[k].support = rule.support[k]; });
    var entry = push(L, {
      concept: 'diagnostic',
      response: 'اختار في التشخيص: «' + optionText + '»',
      diagnosis: rule.diagnosis,
      need: optionId === 'vapor' ? 'استكشاف أعمق دون شرح مسبق' : C.evaporation.need,
      decision: rule.decision,
      feedback: 'لا تُعرض الإجابة الصحيحة؛ التجربة هي التي ستجيب.'
    });
    L.addTimeline(optionId === 'vapor' ? 'ok' : 'sup',
      optionId === 'vapor' ? 'التشخيص: تصوّر صحيح → استكشاف حر' : 'التشخيص: يحتاج إلى دعم في البداية');
    return entry;
  }

  /* ---------- plan of a lab, computed from the learner model ---------- */
  function plan(L, concept) {
    var c = L.c[concept];
    var p = { support: c.support, recap: [], toolFromStart: c.support >= 1, intro: c.support >= 1,
              misconceptionNote: false, hard: false };
    (R.recapIfErrorsIn[concept] || []).forEach(function (k) { if (L.c[k].errors > 0) p.recap.push(k); });
    (R.supportFromPrior[concept] || []).forEach(function (k) {
      if (L.c[k].errors > 0) { p.toolFromStart = true; p.intro = true; p.priorSupport = k; }
    });
    if (L.diagnostic === 'rain' && (concept === 'evaporation' || concept === 'condensation')) p.misconceptionNote = true;
    return p;
  }

  /* ---------- an inference answer on a concept ---------- */
  function answer(L, concept, opt) {
    var c = L.c[concept];
    c.attempts++;
    if (opt.correct) {
      var first = c.errors === 0;
      c.done = true;
      var challenge = first && R.challengeOnFirstTry.indexOf(concept) > -1;
      // re-assessment closes earlier support decisions for this concept
      L.log.forEach(function (e) {
        if (e.concept === concept && !e.result) {
          e.result = 'تحسّن الأداء: استنتج المفهوم بعد ' + (e.action === 'extra' ? 'التجربة الإضافية' : e.action === 'scaffold' ? 'سقالة نُقطة' : 'العرض الموجّه');
        }
      });
      var entry = push(L, {
        concept: concept, action: challenge ? 'challenge' : 'advance',
        response: first ? 'استنتج ' + C[concept].name + ' من المحاولة الأولى' : 'استنتج ' + C[concept].name + (c.errors === 1 ? ' بعد محاولة إضافية' : c.errors === 2 ? ' بعد محاولتين إضافيتين' : ' بعد عدة محاولات'),
        diagnosis: first ? 'فهم متقن للعلاقة' : 'اكتمل الفهم بعد الدعم',
        need: first ? 'تحدٍّ أعلى بدل إعادة الشرح' : 'تثبيت المفهوم في سياق جديد',
        decision: challenge ? 'رفع مستوى التحدي دون إعادة الشرح' : 'الانتقال إلى المرحلة التالية',
        feedback: 'كشف المصطلح العلمي: ' + C[concept].name,
        result: first ? 'متقن من المحاولة الأولى' : 'تحسّن الأداء بعد الدعم'
      });
      L.addTimeline('ok', 'اكتشاف: ' + C[concept].name + (first ? ' (من أول محاولة)' : ''));
      if (challenge) L.addTimeline('ch', 'تحدٍّ أعلى في ' + C[concept].name);
      return { action: entry.action, entry: entry, firstTry: first };
    }

    c.errors++;
    c.wrong.push(opt.id);
    var L2 = R.ladder, action, decision;
    if (c.errors >= L2.guidedAt) {
      action = 'guided';
      decision = 'عرض موجّه: نُقطة تضبط التجربة وتصف ما يحدث، ثم يبقى خياران فقط';
    } else if (c.errors >= L2.scaffoldAt) {
      action = 'scaffold';
      decision = 'تفعيل سقالة من نُقطة وإخفاء الخيارات التي استُبعدت';
    } else {
      action = 'extra';
      decision = 'تقديم ' + C[concept].extra;
      c.activities.push(C[concept].extra);
    }
    var entry2 = push(L, {
      concept: concept, action: action,
      response: 'أخطأ في ' + C[concept].name + ' ' + WC.ar.times(c.errors) + (opt.text ? ' (اختار: «' + opt.text + '»)' : ''),
      diagnosis: opt.why || ('لم يتضح بعد ' + C[concept].need),
      need: C[concept].need,
      decision: decision,
      feedback: opt.fb || ''
    });
    L.addTimeline('sup', (action === 'extra' ? 'تجربة إضافية: ' + C[concept].extra
                       : action === 'scaffold' ? 'سقالة من نُقطة في ' + C[concept].name
                       : 'عرض موجّه في ' + C[concept].name));
    return { action: action, entry: entry2, keep: action === 'scaffold' ? L2.scaffoldKeep : action === 'guided' ? L2.guidedKeep : null };
  }

  function challengeResult(L, concept, passed) {
    L.c[concept].challenge = passed ? 'passed' : 'retry';
    push(L, {
      concept: concept, action: 'challenge-result',
      response: passed ? 'اجتاز التحدي الأعلى في ' + C[concept].name : 'لم يجتز التحدي الأعلى في ' + C[concept].name + ' بعد',
      diagnosis: passed ? 'قدرة على نقل المفهوم إلى موقف جديد' : 'الفهم متقن لكن النقل إلى موقف جديد يحتاج إلى وقت',
      need: passed ? 'لا حاجة إلى دعم' : 'تحدٍّ إضافي لاحقًا',
      decision: passed ? 'متابعة دون تدخل' : 'تسجيل الحاجة في خريطة التعلم دون إيقاف الرحلة',
      feedback: '', result: passed ? 'نجح' : 'مؤجّل'
    });
  }

  /* ---------- mission planning ---------- */
  function planMission(L) {
    var weak = ['evaporation', 'condensation', 'precipitation'].filter(function (k) { return L.c[k].errors > 0; });
    var hard = false;
    if (weak.length === 0 && R.mission.allFaultsWhenMastered) { weak = ['evaporation', 'condensation', 'precipitation']; hard = true; }
    L.mission.faults = weak; L.mission.hard = hard;
    push(L, {
      concept: 'mission', action: 'mission-plan',
      response: hard ? 'أتقن المفاهيم الثلاثة من المحاولة الأولى' : 'احتاج إلى دعم في: ' + weak.map(function (k) { return C[k].name; }).join('، '),
      diagnosis: hard ? 'جاهز لمهمة مركّبة' : 'المفاهيم التي احتاجت دعمًا هي الأولى بالتطبيق',
      need: hard ? 'تحدٍّ مركّب بأقل قدر من المساعدة' : 'تطبيق المفهوم الضعيف في موقف حقيقي',
      decision: hard ? 'تعطيل الحلقات الثلاث وإخفاء أسماء المراحل' : 'تعطيل الحلقة المرتبطة بالمفهوم الذي احتاج دعمًا فقط',
      feedback: '', result: null
    });
    L.addTimeline(hard ? 'ch' : 'sup', hard ? 'المهمة النهائية: ثلاثة أعطال (مستوى أعلى)' : 'المهمة النهائية: أعطال مرتبطة بما احتاج دعمًا');
    return { faults: weak, hard: hard };
  }

  /* Which link of the chain is blocking the rain right now? (diagnosis from simulation state) */
  function missionBlock(s) {
    if (s.evap < 0.45) return 'evaporation';
    if (s.coldF < 0.5) return 'condensation';
    if (s.cloud < 0.45) return 'evaporation';
    if (s.size < 0.6) return 'precipitation';
    return null;
  }

  function missionHint(L, block, tier) {
    L.mission.hints++;
    if (block) L.c[block].hints++;
    var e = push(L, {
      concept: 'mission', action: 'hint',
      response: 'غيّر المتغيرات ' + WC.ar.times(Math.max(1, L.mission.changes)) + ' ولم يعد المطر بعد',
      diagnosis: 'الحلقة المتوقفة في الدورة: ' + (block ? C[block].name : 'غير محددة'),
      need: block ? C[block].need : '',
      decision: 'تلميح ' + (tier === 1 ? 'عام (سؤال)' : 'موجّه') + ' من نُقطة عن ' + (block ? C[block].name : 'الدورة'),
      feedback: '', result: null
    });
    L.addTimeline('sup', 'تلميح موجّه في المهمة: ' + (block ? C[block].name : ''));
    return e;
  }

  function missionSuccess(L) {
    L.mission.success = true;
    L.log.forEach(function (e) { if (e.concept === 'mission' && e.action === 'hint' && !e.result) e.result = 'عاد المطر بعد التلميح'; });
    L.addTimeline('ok', 'أعاد تشغيل دورة المياه');
  }

  /* ---------- learning-map status: a state, not a score ---------- */
  function status(L, concept) {
    var c = L.c[concept];
    if (!c.done && c.attempts === 0) return { key: 'pending', shape: '◌', label: 'لم يبدأ بعد' };
    if (!c.done || c.errors >= R.ladder.guidedAt) return { key: 'needs', shape: '○', emoji: '🟠', label: 'يحتاج إلى تحدٍ إضافي' };
    if (c.errors === 0) return { key: 'mastered', shape: '●', emoji: '🟢', label: 'متقن' };
    if (c.errors === 1) return { key: 'extra', shape: '◐', emoji: '🟡', label: 'أتقن بعد تجربة إضافية' };
    return { key: 'guided', shape: '◐', emoji: '🟡', label: 'أتقن بعد دعم من نُقطة' };
  }

  return { diagnose: diagnose, plan: plan, answer: answer, challengeResult: challengeResult,
           planMission: planMission, missionBlock: missionBlock, missionHint: missionHint,
           missionSuccess: missionSuccess, status: status };
})();
