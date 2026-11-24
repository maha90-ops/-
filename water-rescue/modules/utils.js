/* utils.js — أدوات صغيرة مشتركة */
(function () {
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const u = {
    /** تحويل الأرقام إلى الأرقام العربية الشرقية */
    ar(v) { return String(v).replace(/[0-9]/g, d => AR[d]).replace(/%/g, '٪').replace(/-/g, '−'); },
    $(sel, root) { return (root || document).querySelector(sel); },
    $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },
    html(str) { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstElementChild; },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    rand(a, b) { return a + Math.random() * (b - a); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sleep(ms) { return new Promise(r => setTimeout(r, u.reduced() ? Math.min(ms, 150) : ms)); },
    /** هل يفضّل المستخدم حركة أقل؟ */
    reduced() {
      const s = WR.store && WR.store.state.settings.motion;
      if (s === 'low') return true;
      if (s === 'full') return false;
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    /** تفعيل عنصر بالنقر وبلوحة المفاتيح (Enter / Space) */
    activate(el, fn) {
      el.addEventListener('click', fn);
      if (el.tagName !== 'BUTTON') {
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
      }
    },
    escape(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    letters: ['أ', 'ب', 'ج', 'د', 'هـ']
  };
  WR.u = u;
})();
