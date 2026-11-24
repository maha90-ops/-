/* stage-challenge.js — المرحلة ٨: تحدي الخبير
   ثمانية أسئلة بأنماط مختلفة: موقف مصوّر، ترتيب، سحب وإفلات على رسم، سبب ونتيجة،
   اكتشاف الخطأ، اختيار صورة، حل مشكلة. محاولات غير محدودة بتغذية راجعة لطيفة. */
(function () {
  const u = WR.u, S = WR.S, store = WR.store;
  const Q = WR.DATA.challenge;
  // أماكن المصطلحات على رسم «diagram» (نسب مئوية من العرض/الارتفاع)
  const ZONES = { 'التبخر': [21, 55], 'التكاثف': [47, 12], 'الهطول': [75, 40], 'التجمع': [57, 80] };

  WR.views.challenge = {
    render(view) {
      const { scene: sc, panel } = WR.ui.stageShell(view, 'challenge');
      view.querySelector('.stage').classList.add('stage-single');
      const fresh = !store.isDone('challenge');
      let i = fresh ? Q.findIndex(q => !(store.state.answers[q.id] && store.state.answers[q.id].solved)) : 0;
      if (i < 0) i = 0;
      let firstTry = true;

      function header() {
        return `<div class="ch-progress" aria-label="السؤال ${i + 1} من ${Q.length}">${Q.map((q, k) => `<span class="${k < i ? 'done' : k === i ? 'cur' : ''}">${k < i ? '✓' : u.ar(k + 1)}</span>`).join('')}</div>`;
      }

      function show() {
        const q = Q[i];
        firstTry = true;
        sc.innerHTML = `${header()}<div class="ch-card"><p class="ch-n">🎯 السؤال ${u.ar(i + 1)} من ${u.ar(Q.length)}</p><div class="ch-body"></div><div class="ch-fb" aria-live="polite"></div><div class="ch-foot"></div></div>`;
        const body = u.$('.ch-body', sc);
        panel.innerHTML = `<button type="button" class="btn btn-ghost btn-sm" id="ch-hint">💡 أحتاج تلميحًا</button>`;
        u.$('#ch-hint', panel).addEventListener('click', () => { WR.audio.play('click'); WR.nemo.say('💡 ' + q.hint, 'think'); });
        WR.nemo.say(['مستعد؟ اقرأ الموقف جيدًا 👀', 'فكّر كعالِم 🔬', 'تذكّر ما اكتشفته في المختبر 🧪'][i % 3], 'idle');
        ({ scene: tScene, order: tOrder, place: tPlace, match: tMatch, error: tError, pictures: tPictures })[q.type](q, body);
      }

      function wrong(q, extra) {
        firstTry = false;
        store.answer(q.id, q.concept, false, `تحدي الخبير: ${q.q}`);
        WR.audio.play('soft');
        u.$('.ch-fb', sc).innerHTML = `<div class="fb fb-try">💙 محاولة جيدة! ${extra || 'لنبحث عن دليل آخر.'}</div>`;
        WR.nemo.wrong('💡 ' + q.hint);
      }
      function right(q, extra) {
        store.answer(q.id, q.concept, true, `تحدي الخبير: ${q.q}`);
        if (firstTry) store.award('ch-first-' + q.id, 'star', 'من المحاولة الأولى');
        store.award('ch-' + q.id, 'drop', 'حللت سؤالًا');
        WR.audio.play('success');
        WR.nemo.right();
        u.$('.ch-fb', sc).innerHTML = `<div class="fb fb-ok">🎉 ممتاز! ${extra || ''}</div>`;
        const foot = u.$('.ch-foot', sc);
        foot.innerHTML = '';
        WR.ui.button(foot, i < Q.length - 1 ? 'السؤال التالي ⬅' : '🏁 أنهِ التحدي', () => { if (i < Q.length - 1) { i++; show(); } else finish(); });
        setTimeout(() => { const b = foot.querySelector('button'); if (b) b.focus(); }, 50);
      }
      function lock(body) { u.$$('button', body).forEach(b => { b.disabled = true; }); }

      /* ---- ١) موقف مصوّر + اختيار ---- */
      function tScene(q, body) {
        body.innerHTML = `<div class="ch-art">${S.art[q.art]()}</div><p class="ch-text">${q.text}</p>`;
        WR.ui.choices(body, { q: q.q, options: q.options, qid: q.id, concept: q.concept, cols: 2, nemoWrong: false, label: `تحدي الخبير: ${q.text}`,
          onCorrect: () => { store.award('ch-' + q.id, 'drop', 'حللت سؤالًا'); if (firstTry) store.award('ch-first-' + q.id, 'star', 'من المحاولة الأولى'); right2(q); } });
        // ui.choices يسجّل الإجابات بنفسه؛ نتتبع المحاولة الأولى عبر أي خطأ
        body.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b && b.classList.contains('is-wrong')) { firstTry = false; WR.nemo.say('💙 محاولة جيدة! 💡 ' + q.hint, 'think'); } });
      }
      function right2(q) {
        const foot = u.$('.ch-foot', sc);
        WR.ui.button(foot, i < Q.length - 1 ? 'السؤال التالي ⬅' : '🏁 أنهِ التحدي', () => { if (i < Q.length - 1) { i++; show(); } else finish(); });
      }

      /* ---- ٢) ترتيب الخطوات ---- */
      function tOrder(q, body) {
        let items = u.shuffle(q.items);
        while (items.join() === q.items.join()) items = u.shuffle(q.items);
        body.innerHTML = `<p class="quiz-q">${q.q}</p><p class="muted small">استخدم الأسهم ▲▼ لتحريك كل خطوة، أو اسحبها.</p><ol class="order-list"></ol><button type="button" class="btn btn-primary" id="ord-check">تحقّق ✓</button>`;
        const ol = u.$('.order-list', body);
        function draw(focusIdx, dir) {
          ol.innerHTML = items.map((t, k) => `<li class="order-item" draggable="true" data-k="${k}"><span class="oi-n">${u.ar(k + 1)}</span><span class="oi-t">${t}</span><span class="oi-mark" aria-hidden="true"></span>
            <span class="oi-btns"><button type="button" class="btn-icon sm" data-mv="-1" aria-label="حرّك «${t}» إلى أعلى" ${k === 0 ? 'disabled' : ''}>▲</button><button type="button" class="btn-icon sm" data-mv="1" aria-label="حرّك «${t}» إلى أسفل" ${k === items.length - 1 ? 'disabled' : ''}>▼</button></span></li>`).join('');
          if (focusIdx !== undefined) { const b = ol.children[focusIdx].querySelector(`[data-mv="${dir}"]`) || ol.children[focusIdx].querySelector('button:not([disabled])'); if (b) b.focus(); }
        }
        draw();
        ol.addEventListener('click', e => {
          const b = e.target.closest('[data-mv]'); if (!b) return;
          const k = +b.closest('li').dataset.k, d = +b.dataset.mv, j = k + d;
          [items[k], items[j]] = [items[j], items[k]]; WR.audio.play('click'); draw(j, d);
        });
        let dragK = null;
        ol.addEventListener('dragstart', e => { const li = e.target.closest('li'); dragK = +li.dataset.k; e.dataTransfer.effectAllowed = 'move'; });
        ol.addEventListener('dragover', e => e.preventDefault());
        ol.addEventListener('drop', e => { e.preventDefault(); const li = e.target.closest('li'); if (!li || dragK === null) return; const j = +li.dataset.k; const [m] = items.splice(dragK, 1); items.splice(j, 0, m); dragK = null; draw(); });
        u.$('#ord-check', body).addEventListener('click', () => {
          const ok = items.every((t, k) => t === q.items[k]);
          u.$$('.order-item', ol).forEach((li, k) => { const good = items[k] === q.items[k]; li.classList.toggle('good', good); li.classList.toggle('bad', !good); li.querySelector('.oi-mark').textContent = good ? '✓' : '✗'; });
          if (ok) { lock(body); right(q, 'تبخر ← تكاثف ← هطول ← تجمع… ثم تبدأ الدورة من جديد 🔁'); }
          else wrong(q, 'الخطوات المعلّمة بـ ✓ في مكانها الصحيح. رتّب البقية.');
        });
      }

      /* ---- ٣) سحب وإفلات على الرسم (مع بديل: اختر ثم ضع) ---- */
      function tPlace(q, body) {
        body.innerHTML = `<p class="quiz-q">${q.q}</p>
          <div class="place-wrap"><div class="place-art">${S.art.diagram()}</div>
            ${Object.entries(ZONES).map(([term, [x, y]], k) => `<button type="button" class="drop-zone" data-term="${term}" style="left:${x}%;top:${y}%" aria-label="المكان ${k + 1} على الرسم">${u.ar(k + 1)} ؟</button>`).join('')}
          </div>
          <div class="term-bank" aria-label="المصطلحات">${u.shuffle(q.terms).map(t => `<button type="button" class="term" data-term="${t}">${t}</button>`).join('')}</div>
          <button type="button" class="btn btn-primary" id="pl-check" disabled>تحقّق ✓</button>`;
        const zones = u.$$('.drop-zone', body), bank = u.$('.term-bank', body);
        let selected = null;
        const placed = {}; // zone-term -> placed term
        function select(t) {
          selected = t;
          u.$$('.term', body).forEach(x => x.classList.toggle('selected', x === t));
          if (t) WR.nemo.say(`اخترت «${t.dataset.term}». الآن اضغط على مكانه في الرسم 👆`, 'idle');
        }
        function put(zone, termBtn) {
          const prev = placed[zone.dataset.term];
          if (prev) u.$$('.term', body).forEach(x => { if (x.dataset.term === prev) { x.hidden = false; } });
          // إزالة المصطلح من أي مكان آخر
          Object.keys(placed).forEach(k => { if (placed[k] === termBtn.dataset.term) { delete placed[k]; const z = zones.find(z => z.dataset.term === k); z.textContent = `${u.ar(zones.indexOf(z) + 1)} ؟`; z.classList.remove('filled', 'good', 'bad'); } });
          placed[zone.dataset.term] = termBtn.dataset.term;
          zone.textContent = termBtn.dataset.term; zone.classList.add('filled'); zone.classList.remove('good', 'bad');
          termBtn.hidden = true; select(null); WR.audio.play('drop');
          u.$('#pl-check', body).disabled = Object.keys(placed).length < zones.length;
        }
        u.$$('.term', body).forEach(t => {
          t.addEventListener('click', () => { if (t.dataset.dragged) { delete t.dataset.dragged; return; } select(selected === t ? null : t); WR.audio.play('click'); });
          // سحب باللمس أو الفأرة
          t.addEventListener('pointerdown', e => {
            const sx = e.clientX, sy = e.clientY; let ghost = null;
            const move = ev => {
              if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { ghost = t.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); }
              if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
            };
            const up = ev => {
              document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
              if (!ghost) return;
              ghost.remove(); t.dataset.dragged = '1';
              const el = document.elementFromPoint(ev.clientX, ev.clientY);
              const z = el && el.closest('.drop-zone');
              if (z && body.contains(z)) put(z, t);
              setTimeout(() => delete t.dataset.dragged, 50);
            };
            document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
          });
        });
        zones.forEach(z => z.addEventListener('click', () => {
          if (selected) put(z, selected);
          else if (placed[z.dataset.term]) { // أعِد المصطلح إلى البنك
            const t = u.$$('.term', body).find(x => x.dataset.term === placed[z.dataset.term]); t.hidden = false;
            delete placed[z.dataset.term]; z.textContent = `${u.ar(zones.indexOf(z) + 1)} ؟`; z.classList.remove('filled', 'good', 'bad');
            u.$('#pl-check', body).disabled = true;
          } else WR.nemo.say('اختر مصطلحًا من الأسفل أولًا، ثم ضعه هنا 👇', 'idle');
        }));
        u.$('#pl-check', body).addEventListener('click', () => {
          let ok = true;
          zones.forEach(z => { const good = placed[z.dataset.term] === z.dataset.term; ok = ok && good; z.classList.toggle('good', good); z.classList.toggle('bad', !good); if (!good) z.textContent = `✗ ${placed[z.dataset.term] || ''}`; else z.textContent = `✓ ${z.dataset.term}`; });
          if (ok) { lock(body); bank.remove(); right(q, 'وضعت كل مصطلح في مكانه على الدورة!'); }
          else {
            wrong(q, 'الأماكن المعلّمة بـ ✗ تحتاج إلى تصحيح. اضغط عليها لإعادة المصطلح.');
          }
        });
      }

      /* ---- ٤) سبب ونتيجة ---- */
      function tMatch(q, body) {
        const effects = u.shuffle(q.pairs.map(p => p.effect));
        body.innerHTML = `<p class="quiz-q">${q.q}</p><p class="muted small">اضغط على السبب، ثم على نتيجته.</p>
          <div class="match"><div class="m-col">${q.pairs.map((p, k) => `<button type="button" class="m-item cause" data-k="${k}">${p.cause}<span class="m-tag" aria-hidden="true"></span></button>`).join('')}</div>
          <div class="m-arrow" aria-hidden="true">⬅</div>
          <div class="m-col">${effects.map(e => `<button type="button" class="m-item effect" data-e="${e}">${e}<span class="m-tag" aria-hidden="true"></span></button>`).join('')}</div></div>
          <button type="button" class="btn btn-primary" id="m-check" disabled>تحقّق ✓</button>`;
        let cur = null; const link = {}; // k -> effect
        const tags = ['①', '②', '③'];
        function paint() {
          u.$$('.cause', body).forEach(c => { const k = c.dataset.k; c.querySelector('.m-tag').textContent = link[k] !== undefined ? tags[k] : ''; c.classList.toggle('selected', cur === k); c.classList.toggle('linked', link[k] !== undefined); c.setAttribute('aria-label', `${c.textContent.trim()}${link[k] ? ' — مرتبط بـ: ' + link[k] : ''}`); });
          u.$$('.effect', body).forEach(e => { const k = Object.keys(link).find(k => link[k] === e.dataset.e); e.querySelector('.m-tag').textContent = k !== undefined ? tags[k] : ''; e.classList.toggle('linked', k !== undefined); });
          u.$('#m-check', body).disabled = Object.keys(link).length < q.pairs.length;
        }
        u.$$('.cause', body).forEach(c => c.addEventListener('click', () => { cur = cur === c.dataset.k ? null : c.dataset.k; WR.audio.play('click'); paint(); }));
        u.$$('.effect', body).forEach(e => e.addEventListener('click', () => {
          if (cur === null) { WR.nemo.say('اختر السبب أولًا من العمود الأيمن 👉', 'idle'); return; }
          Object.keys(link).forEach(k => { if (link[k] === e.dataset.e) delete link[k]; });
          link[cur] = e.dataset.e; cur = null; WR.audio.play('bubble'); paint();
        }));
        u.$('#m-check', body).addEventListener('click', () => {
          let ok = true;
          u.$$('.cause', body).forEach(c => { const good = link[c.dataset.k] === q.pairs[c.dataset.k].effect; ok = ok && good; c.classList.toggle('good', good); c.classList.toggle('bad', !good); c.querySelector('.m-tag').textContent = good ? '✓' : '✗'; });
          if (ok) { lock(body); right(q, 'كل سبب يقود إلى نتيجة… وهكذا تعمل الدورة!'); }
          else { wrong(q, 'الأسباب المعلّمة بـ ✗ تحتاج إلى نتيجة أخرى.'); Object.keys(link).forEach(k => { if (link[k] !== q.pairs[k].effect) delete link[k]; }); setTimeout(paint, 1200); }
        });
      }

      /* ---- ٥) اكتشف الخطأ ---- */
      function tError(q, body) {
        body.innerHTML = `<p class="quiz-q">${q.q}</p><div class="notebook">${q.lines.map((l, k) => `<button type="button" class="nb-line" data-k="${k}"><span class="nb-n">${u.ar(k + 1)}.</span> ${l.t}<span class="nb-mark" aria-hidden="true"></span></button>`).join('')}</div>`;
        u.$$('.nb-line', body).forEach(b => b.addEventListener('click', () => {
          const l = q.lines[b.dataset.k];
          if (l.wrong) { b.classList.add('caught'); b.querySelector('.nb-mark').textContent = '✗ خطأ'; lock(body); body.insertAdjacentHTML('beforeend', `<div class="fix">✏️ ${q.fix}</div>`); right(q, 'أنت محقق علمي دقيق!'); }
          else { b.classList.add('correct-line'); b.disabled = true; b.querySelector('.nb-mark').textContent = '✓ صحيحة'; wrong(q, 'هذه الجملة صحيحة علميًا. ابحث عن غيرها.'); }
        }));
      }

      /* ---- ٦) اختر الصورة ---- */
      function tPictures(q, body) {
        body.innerHTML = `<p class="quiz-q">${q.q}</p><div class="pics">${u.shuffle(q.pics).map(p => `<button type="button" class="pic" data-ok="${!!p.ok}"><span class="pic-art">${S.art[p.art]()}</span><span class="pic-label">${p.label}</span><span class="pic-mark" aria-hidden="true"></span></button>`).join('')}</div>`;
        u.$$('.pic', body).forEach(b => b.addEventListener('click', () => {
          if (b.dataset.ok === 'true') { b.classList.add('is-right'); b.querySelector('.pic-mark').textContent = '✓'; lock(body); right(q, 'الهطول = سقوط الماء من السحب إلى الأرض 🌧️'); }
          else { b.classList.add('is-wrong'); b.disabled = true; b.querySelector('.pic-mark').textContent = '✗'; wrong(q); }
        }));
      }

      async function finish() {
        const firsts = Q.filter(q => store.state.awarded['ch-first-' + q.id]).length;
        store.discover('أصبحت قادرًا على تفسير مواقف الحياة اليومية باستخدام دورة المياه.');
        WR.ui.finishStage('challenge', `أجبت عن <b>${u.ar(firsts)}</b> من ${u.ar(Q.length)} أسئلة من المحاولة الأولى. توجّه إلى <b>مركز الإنجاز</b> لاستلام شهادتك! 🏆`);
      }

      show();
    }
  };
})();
