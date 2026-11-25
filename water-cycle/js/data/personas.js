/* personas.js — sample learner data.
   Each persona is a scripted sequence of RESPONSES (not results).
   The responses are run through the same adaptive engine the real learner uses,
   so the different journeys you see are produced by the engine itself.
   1 = correct, 0 = a wrong option (the first untried distractor is used). */
window.WC = window.WC || {};

WC.PERSONAS = [
  { id: 'sara', name: 'سارة', blurb: 'توقّع صحيح، واستنتاجات من المحاولة الأولى',
    diag: 'vapor',
    answers: { evaporation: [1], condensation: [1], precipitation: [1], collection: [1] },
    challenges: { evaporation: true, condensation: true, precipitation: true },
    missionHints: 0, explanation: 'رفعتُ حرارة الشمس فزاد البخار، ثم برّدت الهواء فتكوّنت سحابة، وكبّرت القطرات فهطل المطر.' },
  { id: 'yousef', name: 'يوسف', blurb: 'أتقن التبخر، واحتاج إلى دعم في التكاثف',
    diag: 'vapor',
    answers: { evaporation: [1], condensation: [0, 0, 1], precipitation: [1], collection: [1] },
    challenges: { evaporation: true, precipitation: false },
    missionHints: 1, explanation: '' },
  { id: 'layan', name: 'ليان', blurb: 'بدأت بتصوّر بديل: «الماء يصير مطرًا مباشرة»',
    diag: 'rain',
    answers: { evaporation: [0, 1], condensation: [0, 1], precipitation: [1], collection: [0, 1] },
    challenges: { precipitation: true },
    missionHints: 2, explanation: '' }
];

/* Run a persona's responses through WC.Engine and return the resulting learner model */
WC.simulatePersona = function (p) {
  var E = WC.Engine, K = WC.CONTENT, L = new WC.Learner(p.name);
  var dOpt = K.diagnostic.options.find(function (o) { return o.id === p.diag; });
  E.diagnose(L, p.diag, dOpt.text);
  function run(concept) {
    var wrong = K[concept].options.filter(function (o) { return !o.correct; }), wi = 0;
    var right = K[concept].options.find(function (o) { return o.correct; });
    p.answers[concept].forEach(function (a) {
      var res = E.answer(L, concept, a ? right : wrong[wi++ % wrong.length]);
      if (a && res.action === 'challenge' && p.challenges[concept] !== undefined) E.challengeResult(L, concept, p.challenges[concept]);
    });
  }
  run('evaporation'); run('condensation'); run('precipitation');
  var plan = E.planMission(L);
  for (var i = 0; i < p.missionHints; i++) { L.mission.changes += 6; E.missionHint(L, plan.faults[i % plan.faults.length], i + 1); }
  E.missionSuccess(L);
  run('collection');
  L.explanation = p.explanation ? { text: p.explanation, chainErrors: 0 } : null;
  return L;
};
