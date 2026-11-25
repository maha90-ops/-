/* nuqta.js — «نُقطة», the learning companion.
   She appears ONLY when she has a pedagogical job:
   a question, a hint, a scaffold, encouragement, or explaining why the path changed.
   She never gives the answer directly. */
window.WC = window.WC || {};

WC.Nuqta = (function () {
  var root, timer;
  var KINDS = {
    question: 'سؤال للتفكير',
    hint: 'تلميح',
    scaffold: 'سقالة: لنجرّب بطريقة أخرى',
    cheer: 'تشجيع',
    why: 'لماذا تغيّر مسارك؟'
  };
  var AVATAR =
    '<svg class="avatar" viewBox="0 0 64 76" aria-hidden="true">' +
    '<defs><linearGradient id="nq-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8BD0F2"/><stop offset="1" stop-color="#1D78AF"/></linearGradient></defs>' +
    '<path d="M32 3C32 3 7 33 7 50a25 25 0 0 0 50 0C57 33 32 3 32 3Z" fill="url(#nq-g)"/>' +
    '<ellipse cx="21" cy="39" rx="4.5" ry="8" fill="#fff" opacity=".35" transform="rotate(18 21 39)"/>' +
    '<g class="nq-eyes"><ellipse cx="24" cy="51" rx="3.2" ry="4.3" fill="#0F2236"/><ellipse cx="40" cy="51" rx="3.2" ry="4.3" fill="#0F2236"/>' +
    '<circle cx="25" cy="49.5" r="1" fill="#fff"/><circle cx="41" cy="49.5" r="1" fill="#fff"/></g>' +
    '<path d="M27.5 60q4.5 3.6 9 0" stroke="#0F2236" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';

  function ensure() {
    if (root) return root;
    root = document.createElement('aside');
    root.className = 'nuqta'; root.hidden = true;
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-label', 'نُقطة');
    document.body.appendChild(root);
    return root;
  }

  function say(o) {
    ensure();
    clearTimeout(timer);
    root.className = 'nuqta ' + (o.kind || 'hint');
    root.innerHTML = AVATAR +
      '<div class="bubble" role="status">' +
      '<div class="kind"><span>💧 نُقطة · ' + (KINDS[o.kind] || KINDS.hint) + '</span>' +
      '<button class="x" type="button" aria-label="إخفاء رسالة نُقطة">×</button></div>' +
      '<p class="msg">' + o.text + '</p>' +
      (o.actions && o.actions.length ? '<div class="acts"></div>' : '') +
      '</div>';
    root.hidden = false;
    root.querySelector('.x').onclick = hide;
    if (o.actions) {
      var acts = root.querySelector('.acts');
      o.actions.forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'btn small' + (a.ghost ? ' ghost' : '');
        b.textContent = a.label;
        b.onclick = function () { if (!a.keep) hide(); a.onClick && a.onClick(); };
        acts.appendChild(b);
      });
    }
    WC.Audio.speak(o.text);
    if (o.timeout) timer = setTimeout(hide, o.timeout);
  }

  function hide() { if (root) { root.hidden = true; root.innerHTML = ''; } clearTimeout(timer); }

  return { say: say, hide: hide, AVATAR: AVATAR };
})();
