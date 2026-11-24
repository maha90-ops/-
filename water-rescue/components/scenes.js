/* scenes.js — مكتبة رسومات SVG مولّدة برمجيًا بأسلوب 3D كرتوني
   كل عنصر يخدم هدفًا تعليميًا. يمكن استبدالها لاحقًا بصور في assets/images */
(function () {
  const u = WR.u;
  const S = {};

  /* تدرجات ومرشحات مشتركة تُحقن مرة واحدة في الصفحة */
  S.defs = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2f66"/><stop offset=".55" stop-color="#2b78c9"/><stop offset="1" stop-color="#a7ddf5"/></linearGradient>
      <linearGradient id="g-sky-soft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#174a8f"/><stop offset="1" stop-color="#8fd0f0"/></linearGradient>
      <linearGradient id="g-ocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2cc0ea"/><stop offset="1" stop-color="#0a4d8c"/></linearGradient>
      <linearGradient id="g-lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fd2f2"/><stop offset="1" stop-color="#1772b8"/></linearGradient>
      <radialGradient id="g-sun" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#fffbe0"/><stop offset=".45" stop-color="#ffd84a"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient>
      <radialGradient id="g-sun-glow"><stop offset="0" stop-color="#ffd84a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>
      <linearGradient id="g-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d2e3f3"/></linearGradient>
      <linearGradient id="g-cloud-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9b6c8"/><stop offset="1" stop-color="#5a687d"/></linearGradient>
      <linearGradient id="g-mount" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fa2bf"/><stop offset="1" stop-color="#43526d"/></linearGradient>
      <linearGradient id="g-mount2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f86a8"/><stop offset="1" stop-color="#34425a"/></linearGradient>
      <linearGradient id="g-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fdc8c"/><stop offset="1" stop-color="#2a9455"/></linearGradient>
      <linearGradient id="g-dry" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3c27d"/><stop offset="1" stop-color="#b08442"/></linearGradient>
      <linearGradient id="g-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d5f3e"/><stop offset="1" stop-color="#523221"/></linearGradient>
      <linearGradient id="g-ground-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e9fe0" stop-opacity=".2"/><stop offset="1" stop-color="#2e9fe0" stop-opacity=".75"/></linearGradient>
      <radialGradient id="g-tree" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#8af0a0"/><stop offset="1" stop-color="#1f8045"/></radialGradient>
      <radialGradient id="g-drop" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#d6f8ff"/><stop offset="1" stop-color="#1aa0dc"/></radialGradient>
      <radialGradient id="g-vapor"><stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
      <linearGradient id="g-building" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#efe3c8"/><stop offset="1" stop-color="#cbb48a"/></linearGradient>
      <linearGradient id="g-building2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6d6b4"/><stop offset="1" stop-color="#bfa577"/></linearGradient>
      <radialGradient id="g-olive" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#c9d9a0"/><stop offset=".55" stop-color="#8aa75a"/><stop offset="1" stop-color="#4f6b32"/></radialGradient>
      <radialGradient id="g-gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff1a8"/><stop offset=".5" stop-color="#e8b923"/><stop offset="1" stop-color="#a87a0c"/></radialGradient>
      <filter id="f-soft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#06142e" flood-opacity=".28"/></filter>
      <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="f-blur"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
  </svg>`;

  S.wrap = (vb, inner, label, cls = '') =>
    `<svg class="scene-svg ${cls}" viewBox="${vb}" role="img" aria-label="${u.escape(label)}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  S.sun = (cx, cy, r = 46, cls = '') => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = i * 30 * Math.PI / 180;
      rays += `<line x1="${(cx + Math.cos(a) * (r + 10)).toFixed(1)}" y1="${(cy + Math.sin(a) * (r + 10)).toFixed(1)}" x2="${(cx + Math.cos(a) * (r + 26)).toFixed(1)}" y2="${(cy + Math.sin(a) * (r + 26)).toFixed(1)}"/>`;
    }
    return `<g class="sun ${cls}">
      <circle class="sun-glow" cx="${cx}" cy="${cy}" r="${r * 2.4}" fill="url(#g-sun-glow)"/>
      <g class="sun-rays" stroke="#ffd84a" stroke-width="5" stroke-linecap="round" opacity=".85">${rays}</g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g-sun)"/>
      <ellipse cx="${cx - r * .3}" cy="${cy - r * .35}" rx="${r * .32}" ry="${r * .18}" fill="#fff" opacity=".55"/>
    </g>`;
  };

  S.cloud = (x, y, s = 1, cls = '', dark = false) => `
    <g class="cloud ${cls}"><g transform="translate(${x} ${y}) scale(${s})">
      <g filter="url(#f-soft)" fill="url(#${dark ? 'g-cloud-dark' : 'g-cloud'})">
        <circle cx="-38" cy="6" r="24"/><circle cx="-6" cy="-12" r="34"/><circle cx="30" cy="0" r="27"/>
        <rect x="-62" y="4" width="118" height="28" rx="14"/>
      </g>
      <ellipse cx="-14" cy="-26" rx="16" ry="6" fill="#fff" opacity="${dark ? .25 : .7}"/>
    </g></g>`;

  S.mountain = (x, base, w, h, snow = true, grad = 'g-mount') => {
    const p = `M${x} ${base} L${x + w / 2} ${base - h} L${x + w} ${base} Z`;
    const sh = h * 0.28, sw = w * 0.28 / 2;
    const snowP = `M${x + w / 2 - sw} ${base - h + sh} L${x + w / 2} ${base - h} L${x + w / 2 + sw} ${base - h + sh} L${x + w / 2 + sw * .4} ${base - h + sh * .8} L${x + w / 2} ${base - h + sh * 1.1} L${x + w / 2 - sw * .5} ${base - h + sh * .8} Z`;
    return `<g class="mountain"><path d="${p}" fill="url(#${grad})"/>
      <path d="M${x + w / 2} ${base - h} L${x + w} ${base} L${x + w * .62} ${base} Z" fill="#000" opacity=".12"/>
      ${snow ? `<path class="snow" d="${snowP}" fill="#f4f9ff"/>` : ''}</g>`;
  };

  /* شجرة زيتون: جذع ملتوٍ وتاج فضي مخضر وثمار صغيرة */
  S.tree = (x, y, s = 1, cls = '') => `
    <g class="tree olive ${cls}"><g transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="0" cy="2" rx="20" ry="4" fill="#000" opacity=".15"/>
      <path d="M-6 2 C -7 -6 -2 -10 -7 -22 L -3 -23 C 0 -15 1 -12 0 -7 C 2 -14 5 -17 6 -24 L 10 -23 C 7 -15 6 -7 6 2Z" fill="#7a5a3a"/>
      <g class="tree-crown">
        <ellipse cx="-12" cy="-30" rx="15" ry="10" fill="url(#g-olive)"/><ellipse cx="11" cy="-33" rx="16" ry="11" fill="url(#g-olive)"/>
        <ellipse cx="-1" cy="-43" rx="16" ry="11" fill="url(#g-olive)"/><ellipse cx="17" cy="-24" rx="9" ry="7" fill="url(#g-olive)"/>
        <g fill="#3f3355"><circle cx="-8" cy="-27" r="1.8"/><circle cx="6" cy="-38" r="1.8"/><circle cx="14" cy="-28" r="1.8"/><circle cx="-4" cy="-45" r="1.6"/></g>
        <ellipse cx="-5" cy="-49" rx="8" ry="3.5" fill="#fff" opacity=".3"/>
      </g>
    </g></g>`;

  S.waves = (x, y, w, h, cls = '') => `
    <g class="ocean ${cls}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#g-ocean)"/>
      <g class="wave-line" fill="none" stroke="#bdf2ff" stroke-width="3" opacity=".6" stroke-linecap="round">
        <path d="M${x - 60} ${y + 14} q 15 -8 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0"/>
        <path d="M${x - 40} ${y + 38} q 15 -6 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0" opacity=".5"/>
      </g>
    </g>`;

  /* قطرات مطر متحركة (CSS) */
  S.rain = (x1, x2, yTop, len = 140, n = 18, cls = '') => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = u.rand(x1, x2).toFixed(0), y = u.rand(yTop, yTop + 20).toFixed(0);
      s += `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${+y + 14}" style="--fall:${len}px;animation-delay:-${u.rand(0, 1).toFixed(2)}s"/>`;
    }
    return `<g class="rain ${cls}" stroke="#9fe3ff" stroke-width="3" stroke-linecap="round">${s}</g>`;
  };

  /* بخار متصاعد (CSS) */
  S.vapor = (x1, x2, y, rise = 150, n = 10, cls = '') => {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += `<circle cx="${u.rand(x1, x2).toFixed(0)}" cy="${y}" r="${u.rand(8, 16).toFixed(0)}" fill="url(#g-vapor)" style="--rise:${rise}px;animation-delay:-${u.rand(0, 4).toFixed(2)}s"/>`;
    }
    return `<g class="vapor ${cls}">${s}</g>`;
  };

  S.drop = (x, y, s = 1, cls = '') => `<path class="${cls}" transform="translate(${x} ${y}) scale(${s})" d="M0 -14 C 5 -6 9 -2 9 4 a9 9 0 0 1 -18 0 C -9 -2 -5 -6 0 -14Z" fill="url(#g-drop)"/>`;

  /* علامة نقطة ساخنة نابضة (اكتشاف) */
  S.marker = (x, y, icon = '🔍') => `
    <g class="marker" aria-hidden="true"><g transform="translate(${x} ${y})">
      <circle class="marker-ring" r="22" fill="none" stroke="#fff" stroke-width="3"/>
      <circle r="17" fill="#0b2a55" stroke="#5ff2ff" stroke-width="2.5"/>
      <text class="marker-icon" y="7" text-anchor="middle" font-size="18">${icon}</text>
      <g class="marker-done"><circle r="17" fill="#21a764" stroke="#fff" stroke-width="2.5"/><text y="7" text-anchor="middle" font-size="18" fill="#fff" font-weight="bold">✓</text></g>
    </g></g>`;

  /* لوحة حرارية صغيرة (مقياس حرارة) */
  S.thermo = (x, y, h, pct) => `
    <g class="thermo" transform="translate(${x} ${y})">
      <rect x="-7" y="0" width="14" height="${h}" rx="7" fill="#fff" opacity=".85"/>
      <rect class="thermo-fill" x="-4" y="${h * (1 - pct)}" width="8" height="${h * pct}" rx="4" fill="#ff5b4a"/>
      <circle cx="0" cy="${h + 8}" r="11" fill="#ff5b4a" stroke="#fff" stroke-width="3"/>
    </g>`;

  /* ========== رسومات أسئلة تحدي الخبير ========== */
  S.art = {
    'cup-sun': () => S.wrap('0 0 320 180', `
      <rect width="320" height="180" rx="16" fill="url(#g-sky-soft)"/>${S.sun(260, 46, 26)}
      <rect y="140" width="320" height="40" fill="#c89b62"/>
      ${S.vapor(120, 170, 80, 50, 5)}
      <path d="M115 80 L125 145 L175 145 L185 80 Z" fill="#e8f6ff" opacity=".55" stroke="#fff" stroke-width="3"/>
      <path d="M119 104 L125 145 L175 145 L181 104 Z" fill="url(#g-lake)" opacity=".9"/>
      <line x1="112" y1="92" x2="190" y2="92" stroke="#ff6b6b" stroke-dasharray="5 4" stroke-width="2"/>
      <text x="196" y="96" font-size="11" fill="#fff">مستوى الأمس</text>`, 'كوب ماء تحت الشمس ومستوى الماء أقل من الأمس'),
    'cold-glass': () => S.wrap('0 0 320 180', `
      <rect width="320" height="180" rx="16" fill="#203f6e"/>
      <text x="40" y="60" font-size="34">❄️</text>
      <path d="M120 40 L130 150 L190 150 L200 40 Z" fill="#ffb347" opacity=".85" stroke="#fff" stroke-width="3"/>
      <rect x="128" y="44" width="64" height="12" fill="#fff" opacity=".35"/>
      ${[[124, 70], [196, 90], [130, 110], [192, 125], [126, 135], [198, 60], [160, 140]].map(([x, y]) => S.drop(x, y, .55)).join('')}`, 'كوب بارد تظهر على سطحه الخارجي قطرات ماء'),
    'yard': () => S.wrap('0 0 320 180', `
      <rect width="320" height="180" rx="16" fill="url(#g-sky-soft)"/>
      ${S.cloud(90, 36, .6, '', true)}${S.cloud(230, 30, .55, '', true)}${S.rain(40, 300, 50, 70, 16)}
      <rect x="0" y="120" width="160" height="60" fill="#9aa4b1"/><rect x="0" y="112" width="160" height="16" fill="#4fb6e6" opacity=".85"/>
      <text x="80" y="160" text-anchor="middle" font-size="13" fill="#fff">ساحة إسمنتية</text>
      <rect x="160" y="120" width="160" height="60" fill="url(#g-soil)"/><rect x="160" y="114" width="160" height="10" fill="url(#g-grass)"/>
      ${S.tree(205, 118, .6)}${S.tree(270, 118, .7)}
      <g stroke="#7fd3ff" stroke-width="3" stroke-linecap="round" opacity=".9"><line x1="190" y1="130" x2="190" y2="150"/><line x1="240" y1="128" x2="240" y2="152"/><line x1="290" y1="130" x2="290" y2="148"/></g>
      <text x="240" y="172" text-anchor="middle" font-size="13" fill="#fff">حديقة</text>`, 'ساحة إسمنتية غارقة بالماء بجانب حديقة لم تغرق'),
    'p-evap': () => S.wrap('0 0 160 120', `<rect width="160" height="120" fill="url(#g-sky-soft)"/>${S.sun(130, 26, 14)}${S.waves(0, 84, 160, 36)}${S.vapor(30, 120, 80, 50, 6)}`, 'بخار يصعد من البحر'),
    'p-cloud': () => S.wrap('0 0 160 120', `<rect width="160" height="120" fill="url(#g-sky-soft)"/>${S.cloud(80, 50, .75)}<g fill="#fff" opacity=".8"><circle cx="40" cy="95" r="4"/><circle cx="70" cy="88" r="3"/><circle cx="110" cy="92" r="4"/></g>`, 'سحابة تتكون من قطرات صغيرة'),
    'p-rain': () => S.wrap('0 0 160 120', `<rect width="160" height="120" fill="url(#g-sky-soft)"/>${S.cloud(80, 34, .7, '', true)}${S.rain(30, 130, 56, 50, 12)}<rect y="108" width="160" height="12" fill="url(#g-grass)"/>`, 'قطرات مطر تسقط من السحابة'),
    'p-river': () => S.wrap('0 0 160 120', `<rect width="160" height="120" fill="url(#g-grass)"/><path d="M0 40 C 50 30 60 80 100 70 S 150 90 160 84 L160 104 C 130 110 110 92 90 94 S 40 70 0 64Z" fill="url(#g-lake)"/>${S.tree(30, 30, .45)}${S.tree(130, 50, .45)}`, 'نهر يجري على الأرض'),
    /* رسم لنشاط وضع المصطلحات */
    'diagram': () => S.wrap('0 0 520 300', `
      <rect width="520" height="300" rx="18" fill="url(#g-sky)"/>${S.sun(470, 50, 28)}
      ${S.mountain(300, 250, 240, 150, true)}
      ${S.waves(0, 230, 300, 70)}<rect x="300" y="250" width="220" height="50" fill="url(#g-grass)"/>
      ${S.cloud(250, 70, .8, '', true)}
      <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 10" opacity=".95">
        <path d="M110 220 C 110 160 150 110 190 80"/><path d="M330 110 C 360 150 390 190 400 220"/><path d="M380 262 C 330 270 300 262 250 250"/>
      </g>
      <path d="M182 72 l14 2 -6 12z" fill="#fff"/><path d="M394 214 l8 12 -14 -2z" fill="#fff"/><path d="M256 244 l-10 4 6 8z" fill="#fff"/>
      ${S.vapor(60, 160, 220, 80, 6)}${S.rain(310, 380, 100, 90, 8)}`, 'رسم دورة المياه مع أماكن فارغة للمصطلحات')
  };

  WR.S = S;
})();
