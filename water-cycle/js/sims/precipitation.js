/* precipitation.js — Rain lab.
   Controls: vapour amount (0..100), droplet size (0..100).
   Rule (kept simple and visible): rain starts when the cloud holds enough water
   AND its droplets are big/heavy enough to beat the rising air. */
window.WC = window.WC || {};

WC.RAIN_RULE = { vapor: 50, size: 60, heavy: 0.85 };

WC.RainSim = class extends WC.Sim {
  constructor(c) {
    super(c);
    this.vapor = 25; this.size = 20; this.v = 0.25; this.s = 0.2;
    this.inner = Array.from({ length: 80 }, function () { var a = Math.random() * 6.28, r = Math.sqrt(Math.random()); return { a: a, r: r, wob: Math.random() * 6.28 }; });
    this.rain = []; this.splash = []; this.acc = 0; this.puddle = 0; this.ready = true;
  }
  set(name, val) { this[name] = val; }
  state() {
    var R = WC.RAIN_RULE, raining = this.vapor >= R.vapor && this.size >= R.size;
    var I = raining ? WC.Paint.clamp(((this.size - R.size) / (100 - R.size)) * 0.5 + ((this.vapor - R.vapor) / (100 - R.vapor)) * 0.5 + 0.2) : 0;
    return { raining: raining, intensity: I, vapor: this.vapor, size: this.size,
             word: !raining ? 'لا مطر' : I < 0.45 ? 'مطر خفيف' : I < WC.RAIN_RULE.heavy ? 'مطر متوسط' : 'مطر غزير' };
  }
  update(dt) {
    var w = this.w, h = this.h;
    this.v += (this.vapor / 100 - this.v) * Math.min(1, dt * 3);
    this.s += (this.size / 100 - this.s) * Math.min(1, dt * 3);
    var st = this.state(), cx = w * 0.5, cy = h * 0.28, sc = Math.min(w, h) * (0.12 + this.v * 0.06);
    this.acc += st.intensity * 150 * dt;
    while (this.acc >= 1) {
      this.acc--;
      this.rain.push({ x: cx + (Math.random() - 0.5) * sc * 2.4, y: cy + sc * 0.45, vy: 260 + this.size * 2.4, len: 8 + this.size * 0.12 });
    }
    var ground = h * 0.84, self = this;
    this.rain = this.rain.filter(function (r) {
      r.y += r.vy * dt;
      if (r.y > ground) { self.splash.push({ x: r.x, y: ground + Math.random() * 6, a: 1 }); return false; }
      return true;
    });
    this.splash = this.splash.filter(function (s) { s.a -= dt * 2.4; return s.a > 0; });
    this.puddle = Math.min(1, Math.max(0, this.puddle + (st.intensity * 0.06 - 0.01) * dt));
  }
  draw() {
    var ctx = this.ctx, w = this.w, h = this.h, P = WC.Paint, t = this.t;
    var st = this.state();
    P.sky(ctx, w, h, 0, 0.25 + this.v * 0.45);
    var ground = h * 0.84;
    ctx.fillStyle = '#9BC3A4'; ctx.fillRect(0, ground, w, h - ground);
    ctx.fillStyle = '#86B391'; ctx.fillRect(0, ground, w, 6);
    if (this.puddle > 0.01) {
      ctx.fillStyle = 'rgba(43,134,186,.75)';
      ctx.beginPath(); ctx.ellipse(w * 0.5, ground + 16, w * (0.08 + this.puddle * 0.3), 6 + this.puddle * 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    var cx = w * 0.5, cy = h * 0.28, sc = Math.min(w, h) * (0.12 + this.v * 0.06);
    P.cloud(ctx, cx, cy, sc, 0.08 + this.v * 0.6, 0.55 + this.v * 0.4);
    // droplets inside the cloud: more vapour → more droplets, size control → bigger droplets
    var n = Math.round(12 + this.v * 64), rad = 1.4 + this.s * 5;
    for (var i = 0; i < n; i++) {
      var d = this.inner[i], jig = st.raining ? 0 : Math.sin(t * 2.4 + d.wob) * 3;
      var x = cx + Math.cos(d.a) * d.r * sc * 1.25, y = cy + Math.sin(d.a) * d.r * sc * 0.35 + jig;
      P.drop(ctx, x, y, rad * 0.8, 'rgba(35,110,170,.75)');
    }
    ctx.strokeStyle = 'rgba(40,110,170,.7)'; ctx.lineCap = 'round'; ctx.lineWidth = 1.6 + this.s * 1.4;
    this.rain.forEach(function (r) { ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 2, r.y - r.len); ctx.stroke(); });
    this.splash.forEach(function (s) {
      ctx.strokeStyle = 'rgba(40,110,170,' + s.a * 0.6 + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, (1 - s.a) * 8 + 2, (1 - s.a) * 2 + 1, 0, 0, Math.PI * 2); ctx.stroke();
    });
  }
};
