/* labflow.js — the shared cycle every lab follows:
   short task → interaction → observation → inference question → adaptive feedback.
   The lab supplies what is concept-specific (its extra activity, scaffold, guided demo,
   challenge); LabFlow executes whatever the engine decides. */
window.WC = window.WC || {};

WC.LabFlow = function (o) {
  var UI = WC.UI, E = WC.Engine, N = WC.Nuqta, K = WC.CONTENT[o.concept];
  var L = o.app.learner, self = this;
  var held = false, solved = false, unlocked = false, q;

  var gate = UI.h('<p class="path-note" data-role="gate"><span class="ico" aria-hidden="true">🔒</span><span>' + (o.gateText || 'سيظهر سؤال الاستنتاج بعد أن تجرّب وتلاحظ.') + '</span></p>');
  var qBlock = UI.h('<div class="step-block" hidden></div>');
  var fb = UI.h('<div class="feedback" aria-live="polite"></div>');
  var after = UI.h('<div class="step-block"></div>');
  o.host.appendChild(gate); o.host.appendChild(qBlock); o.host.appendChild(after);

  q = new UI.Question(qBlock, { id: o.concept, prompt: K.prompt, options: K.options, onAnswer: onAnswer });
  qBlock.appendChild(fb);

  this.refresh = function () {
    if (!unlocked && o.isReady()) {
      unlocked = true; gate.hidden = true; qBlock.hidden = false;
      if (!o.quietUnlock) N.say({ kind: 'question', text: 'لاحظتَ ما يكفي. ' + K.prompt + ' اختر ما يصف ملاحظتك.', timeout: 9000 });
    }
  };
  /* called by the lab when its extra activity is complete */
  this.release = function () {
    if (!held) return;
    held = false; q.unlock();
    UI.feedback(fb, 'near', 'أكملتَ التجربة الإضافية', 'استخدم ما لاحظته الآن، وأجب من جديد.');
    N.say({ kind: 'cheer', text: 'أحسنت! الآن صار لديك دليل أوضح. أجب من جديد.', timeout: 7000 });
    q.focusFirst();
  };
  this.isHeld = function () { return held; };

  function onAnswer(opt) {
    var d = E.answer(L, o.concept, opt);
    if (opt.correct) {
      solved = true; q.markRight(opt.id); N.hide();
      UI.feedback(fb, 'good', 'استنتاج دقيق', opt.fb);
      after.appendChild(UI.discovery(o.concept));
      if (d.action === 'challenge' && (K.challenge || o.interactiveChallenge)) runChallenge();
      else showNext();
      o.onSolved && o.onSolved(d);
      return;
    }
    q.markTried(opt.id);
    var line = '<br><small class="muted">استجابتك تعطينا دليلًا على ما تحتاج إلى اكتشافه بعد ذلك.</small>';
    if (d.action === 'extra') {
      held = true; q.lock();
      UI.feedback(fb, 'near', o.nearTitle || 'اقتربت…', opt.fb + line);
      N.say({ kind: 'why', text: o.whyText });
      o.onExtra(self);
    } else if (d.action === 'scaffold') {
      q.reduceTo(d.keep, false);
      UI.feedback(fb, 'near', 'لنقترب أكثر', opt.fb + line);
      N.say({ kind: 'scaffold', text: o.scaffoldText });
      o.onScaffold && o.onScaffold();
    } else {
      q.reduceTo(d.keep, true); q.lock();
      UI.feedback(fb, 'near', 'لنشاهد معًا', 'ستعرض نُقطة التجربة خطوة بخطوة، ثم تختار من خيارين.');
      o.onGuided(function () { q.unlock(); q.focusFirst(); });
    }
  }

  function runChallenge() {
    var box = UI.h('<div class="step-block"><span class="tag challenge">⬆ رُفع مستوى التحدي لأنك أتقنت المفهوم من المحاولة الأولى</span></div>');
    after.appendChild(box);
    if (o.interactiveChallenge) {
      o.interactiveChallenge(box, function (passed) { E.challengeResult(L, o.concept, passed); showNext(); });
      return;
    }
    var first = true, cfb = UI.h('<div class="feedback"></div>');
    var cq = new UI.Question(box, { id: o.concept + '-ch', prompt: K.challenge.prompt, options: K.challenge.options,
      onAnswer: function (opt) {
        if (opt.correct) {
          cq.markRight(opt.id);
          E.challengeResult(L, o.concept, first);
          UI.feedback(cfb, 'good', first ? 'اجتزت التحدي!' : 'وصلت!', 'نقلتَ ما اكتشفته إلى موقف جديد من الحياة.');
          showNext();
        } else { first = false; cq.markTried(opt.id); UI.feedback(cfb, 'near', 'فكّر مرة أخرى', opt.fb); }
      } });
    box.appendChild(cfb);
  }

  function showNext() {
    if (after.querySelector('[data-next]')) return;
    var row = UI.h('<div class="row end"><button class="btn" data-next type="button">' + o.nextLabel + ' <span class="arrow" aria-hidden="true">➜</span></button></div>');
    row.querySelector('button').onclick = function () { o.app.go(o.next); };
    after.appendChild(row);
    setTimeout(function () { row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 200);
  }

  this.question = q;
};

/* helper for the guided demonstration: step a slider through values with narration */
WC.guidedDemo = function (steps, done) {
  var i = 0;
  (function next() {
    if (i >= steps.length) { WC.Nuqta.say({ kind: 'question', text: 'شاهدتَ التجربة كاملة. ما الذي يفسّر ما رأيت؟ اختر من الخيارين.' }); done(); return; }
    var s = steps[i++];
    s.apply();
    WC.Nuqta.say({ kind: 'scaffold', text: s.say });
    setTimeout(next, s.wait || 3600);
  })();
};
