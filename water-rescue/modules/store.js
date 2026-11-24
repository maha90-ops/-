/* store.js — نظام التقدم والنقاط والشارات (يُحفظ في localStorage) */
(function () {
  const KEY = 'water-rescue-progress-v1';
  const listeners = [];

  function fresh() {
    return {
      version: 1,
      name: '',
      started: false,
      current: null,          // آخر مرحلة دخلها الطالب
      unlocked: 1,            // عدد المراحل المفتوحة
      completed: [],          // معرّفات المراحل المكتملة
      points: 0, stars: 0, drops: 0, leaves: 0,
      badges: [],
      awarded: {},            // مفاتيح المكافآت التي مُنحت (لا تتكرر عند الإعادة)
      answers: {},            // qid -> {ok: نتيجة المحاولة الأولى, tries}
      stats: {},              // concept -> {right, wrong}
      mistakes: [],           // [{qid, concept}]
      discoveries: [],        // استنتاجات اكتشفها الطالب
      settings: { sound: true, contrast: false, motion: 'auto', bigText: false },
      startedAt: null, updatedAt: null
    };
  }

  function safeGet() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function safeSet(v) { try { localStorage.setItem(KEY, v); return true; } catch (e) { return false; } }
  function safeDel() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

  const store = {
    state: fresh(),
    load() {
      const raw = safeGet();
      if (raw) {
        try {
          const s = JSON.parse(raw);
          const base = fresh();
          store.state = Object.assign(base, s, { settings: Object.assign(base.settings, s.settings || {}) });
        } catch (e) { store.state = fresh(); }
      }
      return store.state;
    },
    save() { store.state.updatedAt = Date.now(); safeSet(JSON.stringify(store.state)); store.emit('save'); },
    reset() {
      const keepSettings = store.state.settings;
      safeDel();
      store.state = fresh();
      store.state.settings = keepSettings;
      store.save();
      store.emit('reset');
    },
    hasProgress() { return store.state.started && !!store.state.name; },
    on(fn) { listeners.push(fn); },
    emit(type, data) { listeners.forEach(fn => { try { fn(type, data); } catch (e) { console.error(e); } }); },

    stageIndex(id) { return WR.DATA.stages.findIndex(s => s.id === id); },
    isUnlocked(id) { return store.stageIndex(id) < store.state.unlocked; },
    isDone(id) { return store.state.completed.includes(id); },
    percent() {
      const total = WR.DATA.stages.length - 1; // دون مركز الإنجاز
      return Math.round(store.state.completed.filter(id => id !== 'achieve').length / total * 100);
    },

    /** مكافأة لمرة واحدة. type: star | drop | leaf */
    award(key, type, label) {
      if (store.state.awarded[key]) return false;
      store.state.awarded[key] = type;
      const P = WR.DATA.points;
      if (type === 'star') { store.state.stars++; store.state.points += P.star; }
      if (type === 'drop') { store.state.drops++; store.state.points += P.drop; }
      if (type === 'leaf') { store.state.leaves++; store.state.points += P.leaf; }
      store.save();
      store.emit('reward', { type, label, amount: P[type] });
      return true;
    },
    giveBadge(id) {
      if (!id || store.state.badges.includes(id)) return false;
      store.state.badges.push(id);
      store.state.points += WR.DATA.points.badge;
      store.save();
      store.emit('badge', id);
      return true;
    },
    /** تسجيل إجابة لأغراض التقويم الذكي */
    answer(qid, concept, ok, label) {
      const st = store.state;
      if (concept) {
        st.stats[concept] = st.stats[concept] || { right: 0, wrong: 0 };
        st.stats[concept][ok ? 'right' : 'wrong']++;
      }
      const a = st.answers[qid];
      if (!a) st.answers[qid] = { ok, tries: 1 };
      else if (!a.solved) a.tries++;
      if (ok) st.answers[qid].solved = true;
      if (!ok && !st.mistakes.some(m => m.qid === qid)) st.mistakes.push({ qid, concept, label: label || '' });
      store.save();
    },
    discover(text) {
      if (!store.state.discoveries.includes(text)) { store.state.discoveries.push(text); store.save(); }
    },
    completeStage(id) {
      const st = store.state;
      if (!st.completed.includes(id)) st.completed.push(id);
      const idx = store.stageIndex(id);
      const before = st.unlocked;
      st.unlocked = Math.max(st.unlocked, Math.min(WR.DATA.stages.length, idx + 2));
      store.save();
      store.emit('complete', { id, newlyUnlocked: st.unlocked > before });
    },
    setCurrent(id) { store.state.current = id; store.save(); }
  };

  WR.store = store;
})();
