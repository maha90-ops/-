/* arabic.js — Eastern Arabic numerals for every learner-facing number. */
window.WC = window.WC || {};

WC.ar = (function () {
  var D = '٠١٢٣٤٥٦٧٨٩';
  function digits(v) {
    return String(v).replace(/[0-9]/g, function (d) { return D[+d]; }).replace(/\./g, '٫');
  }
  return {
    digits: digits,
    /** 45 → "٤٥٪" */
    pct: function (v) { return digits(Math.round(v)) + '٪'; },
    /** 18 → "١٨°" */
    deg: function (v) { return digits(Math.round(v)) + '°'; },
    /** ordinal word for 1..6 used in UI copy */
    times: function (n) {
      if (n === 1) return 'مرة واحدة';
      if (n === 2) return 'مرتين';
      return digits(n) + (n <= 10 ? ' مرات' : ' مرة');
    }
  };
})();
