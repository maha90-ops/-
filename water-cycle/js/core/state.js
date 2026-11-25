/* state.js — the learner model.
   Everything the adaptive engine knows about the learner lives here.
   Nothing is stored on a server; the model lives in memory for one journey. */
window.WC = window.WC || {};

WC.CONCEPT_ORDER = ['evaporation', 'condensation', 'precipitation', 'collection'];

WC.CONCEPTS = {
  evaporation:   { name: 'التبخر',  icon: '💨', lab: 'evap',
                   need: 'الربط بين حرارة الشمس وتحوّل الماء إلى بخار',
                   extra: 'تجربة مقارنة بين حرارة منخفضة وحرارة مرتفعة',
                   definition: 'تحوّل الماء من سائل إلى بخار عندما يسخن.' },
  condensation:  { name: 'التكاثف', icon: '☁️', lab: 'cloud',
                   need: 'الربط بين برودة الهواء وتحوّل البخار إلى قطرات',
                   extra: 'تجربة التبريد البطيء والتحكم بدرجة حرارة الهواء',
                   definition: 'تحوّل بخار الماء إلى قطرات صغيرة عندما يبرد، فتتكوّن السحب.' },
  precipitation: { name: 'الهطول',  icon: '🌧️', lab: 'rain',
                   need: 'الربط بين كِبَر القطرات وثقلها وسقوطها',
                   extra: 'مقياس «ثقل القطرة ودفع الهواء»',
                   definition: 'سقوط الماء من السحب عندما تكبر القطرات وتثقل.' },
  collection:    { name: 'التجمع',  icon: '🏞️', lab: 'mission',
                   need: 'تتبّع مسار ماء المطر بعد سقوطه',
                   extra: 'إعادة تتبّع مسار ماء المطر على الخريطة',
                   definition: 'تجمّع ماء المطر في البحيرات والأنهار وباطن الأرض، ثم يعود فيتبخر.' }
};

WC.Learner = function (name) {
  this.name = name || 'أنت';
  this.diagnostic = null;          // 'same' | 'vapor' | 'rain'
  this.c = {};
  var self = this;
  WC.CONCEPT_ORDER.forEach(function (k) {
    self.c[k] = {
      attempts: 0, errors: 0, done: false,
      wrong: [],            // option ids the learner chose wrongly
      activities: [],       // extra activities the engine assigned
      support: 0,           // starting support level (0 = free exploration)
      challenge: null,      // null | 'passed' | 'retry'
      hints: 0
    };
  });
  this.log = [];        // adaptive decisions (response → diagnosis → need → activity → feedback → re-assessment)
  this.timeline = [];   // human-readable journey steps for the learning map
  this.mission = { faults: [], hard: false, changes: 0, hints: 0, success: false, changeLog: [] };
  this.explanation = null;
};

WC.Learner.prototype.addTimeline = function (kind, text) {
  this.timeline.push({ kind: kind, text: text });
};
