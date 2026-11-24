/* achievement.js — مركز الإنجاز + التقويم الذكي + الشهادة القابلة للطباعة (PDF عبر المتصفح) */
(function () {
  const u = WR.u, store = WR.store;

  /** تحليل الأداء لكل مفهوم */
  function analyze() {
    const st = store.state, C = WR.DATA.concepts;
    const rows = Object.keys(C).map(k => {
      const s = st.stats[k] || { right: 0, wrong: 0 };
      const total = s.right + s.wrong;
      return { k, name: C[k].name, stage: C[k].stage, right: s.right, wrong: s.wrong, total, acc: total ? s.right / total : null };
    });
    const strong = rows.filter(r => r.total && r.acc >= 0.75);
    const weak = rows.filter(r => r.total && r.acc < 0.75).sort((a, b) => a.acc - b.acc);
    return { rows, strong, weak };
  }
  WR.analyze = analyze;

  WR.views.achieve = {
    render(view) {
      const st = store.state, B = WR.DATA.badges;
      if (!store.isDone('achieve')) store.completeStage('achieve');
      const { rows, strong, weak } = analyze();
      const stageName = id => WR.DATA.stages.find(s => s.id === id);

      let rec;
      if (weak.length) {
        const s = stageName(weak[0].stage);
        rec = `${strong.length ? `🌟 يبدو أنك ممتاز في ${strong.slice(0, 2).map(r => r.name).join(' و')}.<br>` : ''}💧 ننصحك بإعادة تجربة «${s.title}» لتقوية فهمك لـ«${weak[0].name}».`;
      } else {
        rec = '🌟 أداؤك متميز في كل المفاهيم! جرّب «تحدي الخبير» مرة أخرى وحاول أن تجيب عن كل الأسئلة من المحاولة الأولى.';
      }
      const reviewStages = [...new Set(weak.map(w => w.stage))].slice(0, 3);

      view.innerHTML = `
        <section class="achieve" aria-labelledby="ach-title">
          <div class="ach-hero glass">
            <div class="trophy" aria-hidden="true">🏆</div>
            <h1 id="ach-title">تهانينا يا ${u.escape(st.name)}!</h1>
            <p class="lead">لقد أكملت مهمة إنقاذ كوكب الماء.</p>
            <p>أصبحت الآن: <b class="ach-title-badge">🌍 خبير دورة المياه وحامي كوكب الأرض</b></p>
            <div class="ach-stats">
              <div><b>${u.ar(st.points)}</b><small>⭐ نقطة</small></div>
              <div><b>${u.ar(st.stars)}</b><small>⭐ نجمة</small></div>
              <div><b>${u.ar(st.drops)}</b><small>💧 قطرة</small></div>
              <div><b>${u.ar(st.leaves)}</b><small>🌱 ورقة</small></div>
              <div><b>${u.ar(st.badges.length)}</b><small>🏅 شارة</small></div>
            </div>
            <div class="btn-row center">
              <button type="button" class="btn btn-primary btn-xl" id="cert-btn">📜 إنشاء شهادتي</button>
              <button type="button" class="btn btn-ghost" id="ach-map">🗺️ الخريطة</button>
            </div>
          </div>

          <div class="ach-nemo"></div>

          <h2 class="sec-title">🏅 شاراتك</h2>
          <div class="badge-grid wide">${Object.keys(B).map(k => { const has = st.badges.includes(k); return `<div class="badge-cell ${has ? 'has' : 'locked'}"><span class="badge-mini" aria-hidden="true">${has ? B[k].icon : '🔒'}</span><b>${B[k].name}</b><small>${has ? '✓ حصلت عليها' : 'لم تُفتح'}</small></div>`; }).join('')}</div>

          <h2 class="sec-title">🧠 التقويم الذكي</h2>
          <div class="eval-grid">
            <div class="eval glass"><h3>✅ ماذا أتقنت؟</h3>${strong.length ? `<ul>${strong.map(r => `<li>${r.name} <span class="acc">${u.ar(Math.round(r.acc * 100))}٪</span></li>`).join('')}</ul>` : '<p class="muted">ستظهر هنا المفاهيم التي تتقنها.</p>'}</div>
            <div class="eval glass"><h3>🔍 ماذا اكتشفت؟</h3>${st.discoveries.length ? `<ul>${st.discoveries.map(d => `<li>${d}</li>`).join('')}</ul>` : '<p class="muted">—</p>'}</div>
            <div class="eval glass"><h3>📝 أين أخطأت؟</h3>${st.mistakes.length ? `<ul>${st.mistakes.slice(0, 8).map(m => `<li>${u.escape(m.label || m.qid)}</li>`).join('')}</ul><p class="muted small">الخطأ جزء من التعلم 💙 وقد صحّحت كل هذه الأخطاء بنفسك.</p>` : '<p>🌟 لم تخطئ أبدًا! أداء مذهل.</p>'}</div>
            <div class="eval glass"><h3>🔁 ما الذي يحتاج إلى مراجعة؟</h3>${weak.length ? `<ul>${weak.map(r => `<li>${r.name} <span class="acc low">${u.ar(Math.round(r.acc * 100))}٪</span></li>`).join('')}</ul>` : '<p>لا شيء! أنت جاهز ✓</p>'}
              ${reviewStages.map(id => { const s = stageName(id); return `<button type="button" class="btn btn-ghost btn-sm review-btn" data-go="${id}">${s.icon} أعد تجربة «${s.title}»</button>`; }).join('')}</div>
          </div>
          <div class="recommend glass" role="note"><p>${rec}</p></div>

          <div class="concept-bars glass"><h3>📊 دقتك في كل مفهوم</h3>
            ${rows.filter(r => r.total).map(r => `<div class="cb-row"><span>${r.name}</span><div class="m-bar"><span style="width:${Math.round(r.acc * 100)}%"></span></div><b>${u.ar(Math.round(r.acc * 100))}٪</b></div>`).join('')}
          </div>

          <div class="btn-row center"><button type="button" class="btn btn-ghost btn-danger" id="ach-new">🆕 بدء مهمة جديدة</button></div>
        </section>`;

      WR.nemo.attach(u.$('.ach-nemo', view));
      WR.nemo.say(`أنا فخور بك يا ${st.name}! 🎉 لقد أنقذت النظام المائي للكوكب. اضغط «إنشاء شهادتي» لتحصل على شهادة الخبير.`, 'cheer');
      WR.audio.play('badge');
      u.$('#cert-btn', view).addEventListener('click', () => { WR.audio.play('click'); WR.go('certificate'); });
      u.$('#ach-map', view).addEventListener('click', () => WR.go('map'));
      u.$('#ach-new', view).addEventListener('click', () => WR.newMission());
      u.$$('.review-btn', view).forEach(b => b.addEventListener('click', () => WR.go(b.dataset.go)));
    }
  };

  /* ---------- الشهادة ---------- */
  WR.views.certificate = {
    render(view) {
      if (!store.isDone('challenge')) { setTimeout(() => WR.go('map', { replace: true })); return; }
      const st = store.state, B = WR.DATA.badges;
      let date;
      try { date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { date = u.ar(new Date().toISOString().slice(0, 10)); }
      view.innerHTML = `
        <div class="cert-tools no-print">
          <button type="button" class="btn btn-primary" id="print-btn">🖨️ طباعة / حفظ PDF</button>
          <button type="button" class="btn btn-ghost" id="back-btn">↩ العودة إلى مركز الإنجاز</button>
          <p class="muted small">لحفظها PDF: اضغط «طباعة» ثم اختر «حفظ بتنسيق PDF».</p>
        </div>
        <article class="certificate" aria-label="شهادة خبير دورة المياه">
          <div class="cert-border">
            <div class="cert-top"><span class="cert-logo" aria-hidden="true">🌍💧</span><span>مركز إنقاذ كوكب الماء</span></div>
            <h1 class="cert-title">شهادة خبير دورة المياه</h1>
            <p class="cert-line">تشهد إدارة مركز إنقاذ كوكب الماء بأن الخبير/ة</p>
            <p class="cert-name">${u.escape(st.name)}</p>
            <p class="cert-line">قد أتمّ/ت بنجاح <b>مهمة اكتشاف دورة المياه في الطبيعة</b>،<br>وأصبح/ت <b>خبيرًا في دورة المياه وحاميًا لكوكب الأرض</b>.</p>
            <div class="cert-badges" aria-label="الشارات">${st.badges.map(k => `<span title="${B[k].name}">${B[k].icon}</span>`).join('')}</div>
            <div class="cert-meta">
              <div><small>النقاط</small><b>${u.ar(st.points)}</b></div>
              <div><small>الشارات</small><b>${u.ar(st.badges.length)}</b></div>
              <div><small>التاريخ</small><b>${date}</b></div>
            </div>
            <div class="cert-sign"><div><span class="sig">🤖 نيمو</span><small>المساعد العلمي</small></div><div><span class="sig">.................</span><small>المعلم/ة</small></div></div>
          </div>
        </article>`;
      u.$('#print-btn', view).addEventListener('click', () => window.print());
      u.$('#back-btn', view).addEventListener('click', () => WR.go('achieve'));
    }
  };
})();
