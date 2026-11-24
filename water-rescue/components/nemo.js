/* nemo.js — الروبوت المساعد «نيمو»
   لا يعطي الإجابة مباشرة: يسأل، يلمّح، يشجّع، ويحتفل. */
(function () {
  const svg = `
  <svg class="nemo-svg" viewBox="0 0 120 130" aria-hidden="true">
    <defs>
      <linearGradient id="nm-head" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9e4f7"/></linearGradient>
      <linearGradient id="nm-visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173a6b"/><stop offset="1" stop-color="#0a1b38"/></linearGradient>
      <radialGradient id="nm-drop" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#bff4ff"/><stop offset="1" stop-color="#19a7e0"/></radialGradient>
    </defs>
    <ellipse cx="60" cy="124" rx="28" ry="4" fill="#000" opacity=".18" class="nemo-shadow"/>
    <g class="nemo-bob">
      <line x1="60" y1="22" x2="60" y2="10" stroke="#9cc3e2" stroke-width="3" stroke-linecap="round"/>
      <path class="nemo-antenna" d="M60 0 C 64 6 67 9 67 12 a7 7 0 0 1 -14 0 C 53 9 56 6 60 0Z" fill="url(#nm-drop)"/>
      <rect x="14" y="20" width="92" height="66" rx="30" fill="url(#nm-head)" stroke="#8fb8da" stroke-width="2"/>
      <rect x="8" y="44" width="10" height="20" rx="5" fill="#19a7e0"/>
      <rect x="102" y="44" width="10" height="20" rx="5" fill="#19a7e0"/>
      <rect x="24" y="32" width="72" height="42" rx="20" fill="url(#nm-visor)"/>
      <g class="nemo-eyes">
        <ellipse class="eye eye-r" cx="46" cy="52" rx="7" ry="9" fill="#5ff2ff"/>
        <ellipse class="eye eye-l" cx="74" cy="52" rx="7" ry="9" fill="#5ff2ff"/>
        <path class="eye-happy" d="M38 54 q8 -10 16 0 M66 54 q8 -10 16 0" stroke="#5ff2ff" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
      <path class="nemo-mouth" d="M52 65 q8 6 16 0" stroke="#5ff2ff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="30" rx="12" ry="4" fill="#fff" opacity=".8"/>
      <rect x="34" y="86" width="52" height="30" rx="14" fill="url(#nm-head)" stroke="#8fb8da" stroke-width="2"/>
      <path d="M60 92 C 63 97 65 99 65 102 a5 5 0 0 1 -10 0 C 55 99 57 97 60 92Z" fill="url(#nm-drop)"/>
    </g>
  </svg>`;

  let el, textEl, actionsEl, lastText = '';

  function build() {
    el = WR.u.html(`
      <aside class="nemo" data-mood="idle" aria-label="المساعد نيمو">
        <div class="nemo-avatar">${svg}</div>
        <div class="nemo-bubble">
          <div class="nemo-name">🤖 نيمو</div>
          <p class="nemo-text" role="status" aria-live="polite"></p>
          <div class="nemo-actions">
            <button class="btn-icon nemo-listen" type="button" aria-label="استمع إلى نيمو" title="استمع">🔊</button>
          </div>
        </div>
      </aside>`);
    textEl = el.querySelector('.nemo-text');
    actionsEl = el.querySelector('.nemo-actions');
    el.querySelector('.nemo-listen').addEventListener('click', () => {
      if (!WR.audio.speak(lastText)) WR.ui.toast('القراءة الصوتية غير متاحة في هذا المتصفح');
    });
  }

  WR.nemo = {
    /** وضع نيمو داخل حاوية (كل شاشة تضعه في مكانه المناسب) */
    attach(container, opts = {}) {
      if (!el) build();
      el.classList.toggle('nemo--compact', !!opts.compact);
      container.prepend(el);
      return el;
    },
    /** mood: idle | think | happy | cheer | alert */
    say(text, mood = 'idle') {
      if (!el) build();
      lastText = text;
      el.dataset.mood = mood;
      textEl.textContent = text;
      el.classList.remove('nemo--pop'); void el.offsetWidth; el.classList.add('nemo--pop');
    },
    right() { WR.nemo.say(WR.u.pick(WR.DATA.nemo.right), 'happy'); },
    wrong(extra) { WR.nemo.say(WR.u.pick(WR.DATA.nemo.wrong) + (extra ? ' ' + extra : ''), 'think'); },
    el() { if (!el) build(); return el; }
  };
})();
