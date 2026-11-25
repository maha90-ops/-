/* evaporation.js — Sun lab.
   Control: heat 0..100.  Visible relationships:
   heat ↑ → water particles move faster → more vapour rises → faster evaporation. */
window.WC = window.WC || {};

WC.EvapSim = class extends WC.Sim {
  constructor(c) {
    super(c);
    this.heat = 20; this.k = 0.2;
    this.mol = []; this.vap = []; this.acc = 0; this.emitted = 0;
    this.ready = true; this.onResize();
  }
  onResize() {
    if (!this.ready) return;
    this.top = this.h * 0.64;
    if (!this.mol.length) {
      for (var i = 0; i < 42; i++) this.mol.push({ x: Math.random() * this.w, y: this.top + 14 + Math.random() * (this.h - this.top - 22), vx: 0, vy: 0 });
    }
  }
  set(v) { this.heat = v; }
  update(dt) {
    var P = WC.Paint, w = this.w, h = this.h, top = this.top;
    this.k += (this.heat / 100 - this.k) * Math.min(1, dt * 3);
    var k = this.k, sp = 6 + k * 110;
    this.mol.forEach(function (m) {
      m.vx += (Math.random() - 0.5) * sp * 9 * dt; m.vy += (Math.random() - 0.5) * sp * 9 * dt;
      var v = Math.hypot(m.vx, m.vy); if (v > sp) { m.vx *= sp / v; m.vy *= sp / v; }
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < 4 || m.x > w - 4) { m.vx *= -1; m.x = P.clamp(m.x, 4, w - 4); }
      if (m.y < top + 8 || m.y > h - 6) { m.vy *= -1; m.y = P.clamp(m.y, top + 8, h - 6); }
    });
    var rate = 0.3 + Math.pow(k, 1.6) * 24;
    this.acc += rate * dt;
    while (this.acc >= 1) {
      this.acc--; this.emitted++;
      this.vap.push({ x: Math.random() * w, y: top, vy: -(22 + k * 46 + Math.random() * 10), r: 2.4 + Math.random() * 2, wob: Math.random() * 6.28 });
    }
    var t = this.t;
    this.vap = this.vap.filter(function (p) {
      p.y += p.vy * dt; p.x += Math.sin(t * 1.6 + p.wob) * 14 * dt; p.r += dt * 2.4;
      p.a = P.clamp((p.y - h * 0.06) / (top * 0.55));
      return p.y > h * 0.05;
    });
  }
  draw() {
    var ctx = this.ctx, w = this.w, h = this.h, P = WC.Paint, k = this.k, t = this.t, top = this.top;
    P.sky(ctx, w, h, k, 0);
    P.sun(ctx, w * 0.84, h * 0.2, Math.min(w, h) * (0.07 + k * 0.025), k, t);
    P.hills(ctx, w, h, top + 2);
    P.lake(ctx, 0, w, top, h, t, 1.5 + k * 2);
    // heat shimmer on the surface
    ctx.fillStyle = 'rgba(255,190,90,' + (k * 0.35) + ')'; ctx.fillRect(0, top - 1, w, 5);
    ctx.lineCap = 'round';
    this.mol.forEach(function (m) {
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.15 + k * 0.35) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.06, m.y - m.vy * 0.06); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(m.x, m.y, 3.2, 0, Math.PI * 2); ctx.fill();
    });
    this.vap.forEach(function (p) { P.wisp(ctx, p.x, p.y, p.r, p.a); });
  }
  /* words for the meters — so understanding never depends on motion alone */
  read() {
    var k = this.k;
    return {
      motion: k, motionWord: WC.UI.level3(k, ['بطيئة', 'متوسطة', 'سريعة']),
      vapor: Math.min(1, Math.pow(k, 1.3) * 1.05), vaporWord: WC.UI.level3(Math.pow(k, 1.3), ['قليل', 'متوسط', 'كثير'])
    };
  }
  /* compare tool: count vapour produced in a fixed window */
  measure(sec) {
    var self = this, start = this.emitted;
    return new Promise(function (res) { setTimeout(function () { res(self.emitted - start); }, sec * 1000 / self.speed); });
  }
};
