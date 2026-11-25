/* ui.js — small reusable UI building blocks shared by all screens. */
window.WC = window.WC || {};

WC.UI = (function () {
  var ar = WC.ar;

  function h(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Accessible slider with a live, Arabic-numeral output and word labels at both ends. */
  function slider(o) {
    var id = 'sl-' + o.id;
    var node = h(
      '<div class="control ' + (o.cls || '') + '">' +
      '<div class="head"><label for="' + id + '">' + o.label + '</label><output for="' + id + '" id="' + id + '-o"></output></div>' +
      '<input type="range" id="' + id + '" min="' + (o.min || 0) + '" max="' + (o.max || 100) + '" step="' + (o.step || 1) + '" value="' + o.value + '" aria-describedby="' + id + '-e">' +
      '<div class="ends" id="' + id + '-e"><span>' + o.ends[0] + '</span><span>' + o.ends[1] + '</span></div>' +
      '</div>');
    var input = node.querySelector('input'), out = node.querySelector('output');
    var fmt = o.format || function (v) { return ar.pct(v); };
    function paint() {
      var v = +input.value, f = (v - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--fill', f + '%');
      out.textContent = fmt(v);
      input.setAttribute('aria-valuetext', (o.valueText || fmt)(v));
    }
    input.addEventListener('input', function () { paint(); o.onInput && o.onInput(+input.value); });
    input.addEventListener('change', function () { o.onChange && o.onChange(+input.value); });
    paint();
    return {
      node: node, input: input,
      get value() { return +input.value; },
      set: function (v, fire) { input.value = v; paint(); if (fire && o.onInput) o.onInput(+input.value); },
      disable: function (d) { input.disabled = d; node.classList.toggle('locked', d); }
    };
  }

  /* Inference question. Wrong answers are never shown as "❌ wrong":
     tried options become dashed and the screen's adaptive logic decides what happens next. */
  function Question(container, o) {
    var self = this;
    this.o = o;
    this.node = h('<div class="question"><h3 id="q-' + o.id + '">' + o.prompt + '</h3>' +
      '<div class="options" role="group" aria-labelledby="q-' + o.id + '"></div></div>');
    var list = this.node.querySelector('.options');
    var keys = ['أ', 'ب', 'ج', 'د', 'هـ'];
    this.btns = {};
    o.options.forEach(function (opt, i) {
      var b = h('<button type="button" class="opt" data-id="' + opt.id + '"><span class="k" aria-hidden="true">' + keys[i] + '</span>' +
        (opt.ico ? '<span class="ico" aria-hidden="true">' + opt.ico + '</span>' : '') + '<span>' + opt.text + '</span></button>');
      b.addEventListener('click', function () {
        if (self.locked || b.classList.contains('tried')) return;
        o.onAnswer && o.onAnswer(opt, b);
      });
      list.appendChild(b);
      self.btns[opt.id] = b;
    });
    container.appendChild(this.node);
  }
  Question.prototype.markTried = function (id) { var b = this.btns[id]; b.classList.add('tried'); b.setAttribute('aria-disabled', 'true'); b.querySelector('.k').textContent = '↺'; };
  Question.prototype.markRight = function (id) { this.btns[id].classList.add('right'); this.btns[id].querySelector('.k').textContent = '✓'; this.lock(); };
  Question.prototype.lock = function () { this.locked = true; Object.values(this.btns).forEach(function (b) { b.disabled = true; }); };
  Question.prototype.unlock = function () { this.locked = false; Object.values(this.btns).forEach(function (b) { b.disabled = false; }); };
  /* keep the correct option + (n-1) distractors: untried ones first, then (re-enabled) tried ones */
  Question.prototype.reduceTo = function (n, allowTried) {
    var self = this, slots = n - 1;
    var wrong = this.o.options.filter(function (o) { return !o.correct; });
    var order = wrong.filter(function (o) { return !self.btns[o.id].classList.contains('tried'); })
      .concat(allowTried ? wrong.filter(function (o) { return self.btns[o.id].classList.contains('tried'); }) : []);
    wrong.forEach(function (o) { if (order.indexOf(o) === -1) self.btns[o.id].hidden = true; });
    order.forEach(function (opt, i) {
      var b = self.btns[opt.id];
      if (i < slots) {
        b.hidden = false;
        if (b.classList.contains('tried')) { b.classList.remove('tried'); b.removeAttribute('aria-disabled'); b.querySelector('.k').textContent = '•'; }
      } else b.hidden = true;
    });
  };
  Question.prototype.focusFirst = function () { var b = this.node.querySelector('.opt:not([hidden]):not(.tried)'); if (b) b.focus(); };

  function feedback(node, kind, title, text) {
    node.className = 'feedback show' + (kind === 'good' ? ' good' : '');
    node.innerHTML = '<b>' + title + '</b><span>' + text + '</span>';
    node.setAttribute('role', 'status');
  }

  function discovery(concept) {
    var c = WC.CONCEPTS[concept];
    WC.Audio.chime();
    return h('<div class="discovery" role="status"><div class="badge" aria-hidden="true">' + c.icon + '</div>' +
      '<div><small>اكتشاف جديد</small><strong>' + c.name + '</strong></div><p>' + c.definition + '</p></div>');
  }

  function pathNote(text, ico) {
    return h('<div class="path-note"><span class="ico" aria-hidden="true">' + (ico || '🧭') + '</span><span>' + text + '</span></div>');
  }

  function meter(label) {
    var n = h('<div class="meter"><span>' + label + '</span><span class="bar"><i></i></span><span class="word">—</span></div>');
    return { node: n, set: function (v, word) { n.querySelector('i').style.width = Math.round(v * 100) + '%'; n.querySelector('.word').textContent = word; } };
  }

  function level3(v, words) { return v < 0.34 ? words[0] : v < 0.67 ? words[1] : words[2]; }

  return { h: h, esc: esc, slider: slider, Question: Question, feedback: feedback, discovery: discovery,
           pathNote: pathNote, meter: meter, level3: level3 };
})();
