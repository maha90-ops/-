/* cycle.js — the full water cycle for the rescue mission.
   Four controls feed a causal chain with deliberate lag, so a change
   is seen travelling link by link:  ☀️ → 💧 → 💨 → ☁️ → 🌧️ → 🏞️  */
window.WC = window.WC || {};

WC.CYCLE_MODEL = {
  good:  { sun: 75, air: 75, vapor: 65, size: 75 },   // values that keep the cycle alive
  fault: { sun: 15, air: 12, size: 20 },              // values that break one link each
  /* stage targets (all 0..1) */
  evap:  function (c) { return c.sun / 100; },
  vapor: function (evap, c) { return evap * (0.35 + 0.65 * c.vapor / 100); },  // vapour comes only from evaporation
  coldF: function (c) { return WC.Paint.smooth(0.35, 0.8, c.air / 100); },
  cloud: function (vapor, coldF) { return vapor * coldF; },
  rain:  function (cloud, c) { var P = WC.Paint; return P.clamp((cloud - 0.4) / 0.35) * P.clamp((c.size / 100 - 0.5) / 0.35); }
};

WC.CycleSim = class extends WC.Sim {
  constructor(c, ctrl) {
    super(c);
    var M = WC.CYCLE_MODEL;
    this.ctrl = Object.assign({}, ctrl);
    this.s = { heat: 0, evap: 0, vapor: 0, coldF: 0, cloud: 0, rain: 0, lake: 0.22, size: 0 };
    // start the smoothed stages at their current equilibrium (so the broken state is visible at once)
    var e = M.evap(this.ctrl), v = M.vapor(e, this.ctrl), cf = M.coldF(this.ctrl), cl = M.cloud(v, cf);
    Object.assign(this.s, { heat: e, evap: e, vapor: v, coldF: cf, cloud: cl, rain: M.rain(cl, this.ctrl), size: this.ctrl.size / 100 });
    this.vp = []; this.rd = []; this.acc = 0; this.racc = 0; this.ready = true;
  }
  set(name, v) { this.ctrl[name] = v; }
  update(dt) {
    var M = WC.CYCLE_MODEL, s = this.s, c = this.ctrl, w = this.w, h = this.h, P = WC.Paint;
    function ease(key, target, rate) { s[key] += (target - s[key]) * Math.min(1, dt * rate); }
    ease('heat', c.sun / 100, 3);
    ease('evap', M.evap(c), 1.6);
    ease('vapor', M.vapor(s.evap, c), 1.1);
    ease('coldF', M.coldF(c), 2);
    ease('cloud', M.cloud(s.vapor, s.coldF), 0.9);
    ease('size', c.size / 100, 2);
    ease('rain', M.rain(s.cloud, c), 1.2);
    s.lake = P.clamp(s.lake + (s.rain * 0.08 - 0.004 - s.evap * 0.003) * dt, 0.08, 1);
    // particles
    var lx0 = w * 0.52, lx1 = w * 0.98, ly = this.lakeTop();
    this.acc += s.evap * 22 * dt;
    while (this.acc >= 1) { this.acc--; this.vp.push({ x: lx0 + Math.random() * (lx1 - lx0), y: ly, r: 2 + Math.random() * 1.5, wob: Math.random() * 6.28 }); }
    var t = this.t, cx = w * 0.34, cy = h * 0.2;
    this.vp = this.vp.filter(function (p) {
      p.y -= (24 + s.heat * 30) * dt;
      p.x += ((cx - p.x) * 0.25 + Math.sin(t * 1.5 + p.wob) * 10) * dt;
      p.r += dt * 1.2;
      p.a = P.clamp((p.y - h * 0.14) / (h * 0.3));
      return p.y > h * 0.14;
    });
    this.racc += s.rain * 120 * dt;
    var sc = this.cloudScale();
    while (this.racc >= 1) { this.racc--; this.rd.push({ x: cx + (Math.random() - 0.5) * sc * 2.3, y: cy + sc * 0.4, vy: 280 + c.size * 2 }); }
    var self = this;
    this.rd = this.rd.filter(function (r) { r.y += r.vy * dt; return r.y < self.groundY(r.x); });
  }
  lakeTop() { return this.h * (0.9 - this.s.lake * 0.12); }
  groundY(x) { return this.h * 0.62 + (x / this.w) * this.h * 0.2; }
  cloudScale() { return Math.min(this.w, this.h) * (0.07 + this.s.cloud * 0.1); }
  draw() {
    var ctx = this.ctx, w = this.w, h = this.h, P = WC.Paint, s = this.s, t = this.t;
    P.sky(ctx, w, h, s.heat * 0.8, s.coldF * 0.5);
    P.sun(ctx, w * 0.86, h * 0.15, Math.min(w, h) * (0.055 + s.heat * 0.02), s.heat, t);
    // land: dry when the lake is low, green when the cycle is restored
    var green = P.clamp((s.lake - 0.2) / 0.5);
    ctx.fillStyle = P.mix('#C8B184', '#8EBE7E', green);
    ctx.beginPath(); ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.5);
    ctx.quadraticCurveTo(w * 0.12, h * 0.36, w * 0.24, h * 0.55);
    ctx.lineTo(w * 0.5, h * 0.78); ctx.lineTo(w, h * 0.86); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    // river from the mountain to the lake (flows when rain feeds it)
    var flow = P.clamp(s.rain * 1.6 + (s.lake - 0.3));
    ctx.strokeStyle = 'rgba(43,134,186,' + (0.25 + flow * 0.7) + ')'; ctx.lineWidth = 3 + flow * 5; ctx.lineCap = 'round';
    ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 40 * flow;
    ctx.beginPath(); ctx.moveTo(w * 0.14, h * 0.5); ctx.quadraticCurveTo(w * 0.3, h * 0.74, w * 0.56, this.lakeTop() + 4); ctx.stroke();
    ctx.setLineDash([]);
    // lake
    P.lake(ctx, w * 0.52, w, this.lakeTop(), h, t, 1.5);
    ctx.fillStyle = 'rgba(120,90,50,.18)'; ctx.fillRect(w * 0.52, h * 0.9, w * 0.48, 3); // old shoreline mark
    this.vp.forEach(function (p) { P.wisp(ctx, p.x, p.y, p.r, p.a * 0.9); });
    P.cloud(ctx, w * 0.34, h * 0.2, this.cloudScale(), 0.1 + P.clamp(s.size) * s.cloud * 0.7, P.clamp(s.cloud * 1.6));
    ctx.strokeStyle = 'rgba(40,110,170,.7)'; ctx.lineWidth = 1.6 + s.size;
    this.rd.forEach(function (r) { ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 2, r.y - 12); ctx.stroke(); });
  }
};
