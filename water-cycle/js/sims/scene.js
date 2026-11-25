/* scene.js — canvas base class + shared painters (sky, sun, lake, hills, cloud).
   Simulations are deliberately simplified for learning: they show
   relationships (more heat → more vapour), not exact physics. */
window.WC = window.WC || {};

WC.Sim = class {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.w = 1; this.h = 1; this.t = 0; this.raf = 0;
    this.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.speed = this.reduced ? 0.55 : 1;
    var self = this;
    this.ro = new ResizeObserver(function () { self.resize(); });
    this.ro.observe(canvas);
    this.resize();
  }
  resize() {
    var r = this.c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (r.width < 2 || r.height < 2) return;
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.onResize) this.onResize();
  }
  start() {
    var self = this, last = performance.now();
    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000) * self.speed; last = now;
      self.t += dt;
      self.update(dt); self.draw();
      self.raf = requestAnimationFrame(loop);
    }
    this.raf = requestAnimationFrame(loop);
    return this;
  }
  stop() { cancelAnimationFrame(this.raf); this.ro.disconnect(); }
  update() {} draw() {}
};

WC.Paint = (function () {
  /* accepts '#rrggbb' or 'rgb(r,g,b)' so mixes can be nested */
  function hex(c) {
    if (c.charAt(0) === 'r') return c.match(/\d+/g).slice(0, 3).map(Number);
    c = c.replace('#', ''); return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b); t = Math.max(0, Math.min(1, t));
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function clamp(v, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v)); }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); }

  /* warm: 0..1 (sun heat), cold: 0..1 (air temperature) */
  function sky(ctx, w, h, warm, cold) {
    warm = warm || 0; cold = cold || 0;
    var top = mix(mix('#8EC2E4', '#79AEDC', warm * 0.4), '#5E8DBE', cold * 0.6);
    var bot = mix(mix('#EAF5FB', '#FCE6C4', warm), '#D9E6F2', cold * 0.7);
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  function sun(ctx, x, y, r, k, t) {
    var glowR = r * (1.8 + k * 2.6);
    var g = ctx.createRadialGradient(x, y, r * 0.6, x, y, glowR);
    g.addColorStop(0, 'rgba(255,214,120,' + (0.35 + k * 0.45) + ')');
    g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.08);
    ctx.strokeStyle = 'rgba(255,190,80,' + (0.25 + k * 0.6) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2, len = r * (0.35 + k * 0.9) * (i % 2 ? 0.7 : 1);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
      ctx.lineTo(Math.cos(a) * (r * 1.25 + len), Math.sin(a) * (r * 1.25 + len)); ctx.stroke();
    }
    ctx.restore();
    var core = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    core.addColorStop(0, '#FFF4C9'); core.addColorStop(1, mix('#FFD36B', '#FFA62B', k));
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function hills(ctx, w, h, baseY, c1, c2) {
    ctx.fillStyle = c1 || '#B9D3C2';
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (var x = 0; x <= w; x += 10) ctx.lineTo(x, baseY - 26 - Math.sin(x / w * 5.2 + 1) * 18 - Math.sin(x / w * 11) * 6);
    ctx.lineTo(w, baseY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c2 || '#9CC2A8';
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (x = 0; x <= w; x += 10) ctx.lineTo(x, baseY - 10 - Math.sin(x / w * 3.4 + 2.2) * 14);
    ctx.lineTo(w, baseY); ctx.closePath(); ctx.fill();
  }

  function lake(ctx, x0, x1, top, bottom, t, amp) {
    var g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, '#5DB2DE'); g.addColorStop(1, '#1B6A9A');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0, bottom);
    for (var x = x0; x <= x1; x += 8) ctx.lineTo(x, top + Math.sin(x * 0.03 + t * 1.6) * (amp || 2.5));
    ctx.lineTo(x1, bottom); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    for (var i = 0; i < 6; i++) {
      var yy = top + 12 + i * ((bottom - top) / 7), off = (t * 14 + i * 60) % (x1 - x0);
      ctx.beginPath(); ctx.moveTo(x0 + off, yy); ctx.lineTo(x0 + off + 26, yy); ctx.stroke();
    }
  }

  var BLOBS = [[-1.0, 0.12, 0.52], [-0.5, -0.22, 0.68], [0.15, -0.38, 0.8], [0.75, -0.1, 0.62], [1.18, 0.14, 0.46], [0.1, 0.16, 0.72], [-0.45, 0.2, 0.55], [0.65, 0.22, 0.55]];
  function cloud(ctx, cx, cy, s, dark, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30,50,70,.10)';
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.55, s * 1.4, s * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    var base = mix('#FFFFFF', '#7A8C9E', dark), shade = mix('#D5E0EA', '#4A5B6C', dark);
    // one unified silhouette (no seams between puffs), lit from above
    ctx.beginPath();
    BLOBS.forEach(function (b) { ctx.moveTo(cx + b[0] * s + b[2] * s, cy + b[1] * s); ctx.arc(cx + b[0] * s, cy + b[1] * s, b[2] * s, 0, Math.PI * 2); });
    var g = ctx.createLinearGradient(0, cy - s * 1.2, 0, cy + s * 0.9);
    g.addColorStop(0, base); g.addColorStop(0.55, mix(base, shade, 0.35)); g.addColorStop(1, shade);
    ctx.fillStyle = g; ctx.fill();
    // soft top highlight
    var hl = ctx.createRadialGradient(cx + s * 0.1, cy - s * 0.55, 0, cx + s * 0.1, cy - s * 0.55, s * 0.9);
    hl.addColorStop(0, 'rgba(255,255,255,' + (0.5 - dark * 0.3) + ')'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fill();
    ctx.restore();
  }

  function drop(ctx, x, y, r, color) {
    ctx.fillStyle = color || '#3A8FD0';
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.8);
    ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.2, x, y + r);
    ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.2, x, y - r * 1.8); ctx.fill();
  }

  /* water vapour: a soft, ring-less puff (reads as steam, not bubbles) */
  function wisp(ctx, x, y, r, a) {
    if (a <= 0.01) return;
    var R = r * 2.6, g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, 'rgba(250,253,255,' + (0.75 * a) + ')');
    g.addColorStop(0.45, 'rgba(214,232,245,' + (0.4 * a) + ')');
    g.addColorStop(1, 'rgba(214,232,245,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
  }

  return { mix: mix, clamp: clamp, smooth: smooth, sky: sky, sun: sun, hills: hills, lake: lake, cloud: cloud, drop: drop, wisp: wisp };
})();

/* ---------- Gate: slow cinematic landscape ---------- */
WC.GateScene = class extends WC.Sim {
  constructor(c) {
    super(c);
    this.clouds = [0.12, 0.42, 0.7, 0.95].map(function (x, i) { return { x: x, y: 0.14 + (i % 2) * 0.1, s: 0.05 + (i % 3) * 0.018, v: 0.004 + i * 0.0015 }; });
    this.drops = Array.from({ length: 26 }, function () { return { x: Math.random(), y: Math.random(), v: 0.012 + Math.random() * 0.02, r: 1 + Math.random() * 1.6 }; });
  }
  update(dt) {
    this.clouds.forEach(function (c) { c.x += c.v * dt; if (c.x > 1.25) c.x = -0.25; });
    this.drops.forEach(function (d) { d.y -= d.v * dt; if (d.y < -0.05) { d.y = 1.05; d.x = Math.random(); } });
  }
  draw() {
    var ctx = this.ctx, w = this.w, h = this.h, P = WC.Paint, t = this.t;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0F3A5A'); g.addColorStop(0.55, '#3C7FA8'); g.addColorStop(0.85, '#B9D7E6'); g.addColorStop(1, '#E7D2B4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var sg = ctx.createRadialGradient(w * 0.5, h * 0.78, 10, w * 0.5, h * 0.78, w * 0.45);
    sg.addColorStop(0, 'rgba(255,214,150,.55)'); sg.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
    var m = Math.min(w, h);
    this.clouds.forEach(function (c) { P.cloud(ctx, c.x * w, c.y * h, c.s * m * 1.6, 0.15, 0.55); });
    P.hills(ctx, w, h, h * 0.86, '#2E5E72', '#244E60');
    P.lake(ctx, 0, w, h * 0.86, h, t, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, h * 0.86, w, h * 0.14);
    this.drops.forEach(function (d) {
      ctx.globalAlpha = 0.35 * Math.sin(Math.PI * d.y);
      P.drop(ctx, d.x * w, d.y * h, d.r * 1.4, '#CFE8F6');
    });
    ctx.globalAlpha = 1;
  }
};

/* ---------- Diagnostic: lake warmed by the sun (no vapour shown — no answer given) ---------- */
WC.DiagScene = class extends WC.Sim {
  draw() {
    var ctx = this.ctx, w = this.w, h = this.h, P = WC.Paint, t = this.t;
    P.sky(ctx, w, h, 0.55, 0);
    P.sun(ctx, w * 0.78, h * 0.22, Math.min(w, h) * 0.085, 0.7, t);
    P.hills(ctx, w, h, h * 0.66);
    P.lake(ctx, 0, w, h * 0.66, h, t, 2);
    var a = 0.18 + 0.1 * Math.sin(t * 2);
    ctx.fillStyle = 'rgba(255,200,110,' + a + ')';
    ctx.fillRect(0, h * 0.66, w, 6);
    // question mark above the water: the learner predicts what will happen
    ctx.font = '700 ' + Math.round(h * 0.12) + 'px "Kufi Display", sans-serif';
    ctx.fillStyle = 'rgba(14,74,107,' + (0.35 + 0.15 * Math.sin(t * 1.5)) + ')';
    ctx.textAlign = 'center'; ctx.fillText('؟', w * 0.45, h * 0.52 + Math.sin(t * 1.2) * 4);
  }
};
