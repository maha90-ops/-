/* condensation.js — Clouds lab.
   Control: air coldness 0 (warm) .. 100 (cold).
   Rising vapour → (cold air) → tiny droplets → gather into a cloud.
   Warm air makes droplets turn back into vapour. */
window.WC = window.WC || {};

WC.CloudSim = class extends WC.Sim {
  constructor(c) {
    super(c);
    this.cold = 10; this.k = 0.1; this.p = []; this.acc = 0; this.ready = true;
  }
  set(v) { this.cold = v; }
  temp() { return 30 - this.cold * 0.32; }
  update(dt) {
    var P = WC.Paint, w = this.w, h = this.h, t = this.t;
    this.k += (this.cold / 100 - this.k) * Math.min(1, dt * 2.5);
    var f = P.smooth(0.35, 0.85, this.k);
    var cx = w * 0.5, cy = h * 0.25, rx = w * 0.26, ry = h * 0.085;
    this.acc += 15 * dt;
    while (this.acc >= 1 && this.p.length < 280) {
      this.acc--;
      this.p.push({ s: 'v', x: w * 0.12 + Math.random() * w * 0.76, y: h * 0.9, r: 2.4 + Math.random() * 1.6, wob: Math.random() * 6.28 });
    }
    if (this.acc > 2) this.acc = 0;
    this.p = this.p.filter(function (q) {
      if (q.s === 'v') {
        q.y -= (30 + Math.random() * 6) * dt; q.x += Math.sin(t * 1.5 + q.wob) * 12 * dt; q.r += dt * 0.8;
        if (q.y < h * 0.58 && Math.random() < f * 1.9 * dt) {
          q.s = 'd'; q.r = 2.2;
          var a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random());
          q.tx = cx + Math.cos(a) * rx * rr; q.ty = cy + Math.sin(a) * ry * rr;
        }
        return q.y > h * 0.06;
      }
      if (q.s === 'd') {
        q.x += (q.tx - q.x) * 1.3 * dt; q.y += (q.ty - q.y) * 1.3 * dt;
        if (Math.abs(q.tx - q.x) + Math.abs(q.ty - q.y) < 8) q.s = 'c';
      } else {
        q.x = q.tx + Math.sin(t * 2 + q.wob) * 2; q.y = q.ty + Math.cos(t * 1.7 + q.wob) * 2;
      }
      if (Math.random() < (1 - f) * 0.9 * dt) { q.s = 'v'; q.r = 3; }
      return true;
    });
    this.counts = { v: 0, d: 0, c: 0 };
    var cnt = this.counts; this.p.forEach(function (q) { cnt[q.s]++; });
  }
  stage() {
    var n = this.counts || { v: 0, d: 0, c: 0 };
    if (n.c > 70) return 'cloud';
    if (n.d + n.c > 12) return 'drops';
    return 'vapor';
  }
  draw() {
    var ctx = this.ctx, w = this.w, h = this.h, P = WC.Paint, k = this.k, t = this.t;
    P.sky(ctx, w, h, (1 - k) * 0.5, k);
    // the air gets colder higher up: a soft cold band that strengthens with the control
    var g = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    g.addColorStop(0, 'rgba(120,170,225,' + (k * 0.45) + ')'); g.addColorStop(1, 'rgba(120,170,225,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.6);
    P.hills(ctx, w, h, h * 0.92, '#BCD6C6', '#A4C8B0');
    P.lake(ctx, w * 0.08, w * 0.92, h * 0.9, h, t, 1.5);
    var n = this.counts || { c: 0 };
    var mass = Math.min(1, n.c / 120);
    P.cloud(ctx, w * 0.5, h * 0.25, Math.min(w, h) * (0.1 + mass * 0.07), 0.1 + mass * 0.2, Math.min(0.95, n.c / 90));
    this.p.forEach(function (q) {
      if (q.s === 'v') P.wisp(ctx, q.x, q.y, q.r, P.clamp((q.y - h * 0.06) / (h * 0.3)) * 0.9);
      else if (q.s === 'd') P.drop(ctx, q.x, q.y, q.r, '#2F86C8');
      else { ctx.fillStyle = 'rgba(47,134,200,' + (0.55 - mass * 0.35) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.9, 0, Math.PI * 2); ctx.fill(); }
    });
  }
};
