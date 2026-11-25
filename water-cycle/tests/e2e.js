const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../index.html');
const OUT = path.resolve(__dirname, 'screenshots');
require('fs').mkdirSync(OUT, { recursive: true });
const mode = process.argv[2] || 'struggle';
const errors = [];
let ok = 0, fail = 0;
function check(c, msg) { if (c) { ok++; console.log('  ✓', msg); } else { fail++; console.log('  ✗', msg); } }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = n => page.screenshot({ path: `${OUT}/${mode}-${n}.png` });
  const setRange = (sel, v) => page.$eval(sel, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  const opt = id => page.click(`.opt[data-id="${id}"]:not([hidden])`);
  const western = async () => page.evaluate(() => {
    const t = document.getElementById('main').innerText + ' ' + (document.querySelector('.nuqta')?.innerText || '') + ' ' + document.getElementById('topbar').innerText;
    return (t.match(/[0-9]/g) || []).length;
  });
  const visibleOpts = () => page.$$eval('.question .opt:not([hidden])', b => b.length);

  await page.goto(URL);
  await page.waitForTimeout(800);
  check(await page.evaluate(() => document.documentElement.dir === 'rtl'), 'RTL document');
  await shot('1-gate');
  check(await page.isVisible('text=حدث خلل في دورة المياه'), 'gate headline');
  await page.click('#start');

  // ---------- diagnostic ----------
  await page.waitForSelector('.diag');
  check(await page.isDisabled('#go'), 'continue disabled before a choice');
  const diagChoice = mode === 'struggle' ? 'يبقى الماء كما هو' : 'يتحول جزء من الماء إلى بخار';
  await page.click(`.opt:has-text("${diagChoice}")`);
  await shot('2-diag');
  check((await western()) === 0, 'diag: only Eastern Arabic digits');
  await page.click('#go');

  // ---------- evaporation ----------
  await page.waitForSelector('#sl-heat');
  const cmpVisible = await page.isVisible('[data-compare]');
  check(mode === 'struggle' ? cmpVisible : !cmpVisible, 'evap: compare tool ' + (mode === 'struggle' ? 'shown (diagnosed need)' : 'hidden (free exploration)'));
  check(await page.isHidden('.question'), 'evap: question locked before exploring');
  await setRange('#sl-heat', 10); await page.waitForTimeout(1200);
  const vLow = await page.$eval('#main', () => WC.App && document.querySelector('.meter:nth-child(2) .word').textContent);
  await setRange('#sl-heat', 95); await page.waitForTimeout(1800);
  const vHigh = await page.$eval('#main', () => document.querySelector('.meter:nth-child(2) .word').textContent);
  check(vLow !== vHigh, `evap: vapour meter responds (${vLow} → ${vHigh})`);
  await page.waitForSelector('.question');
  await shot('3-evap');
  check((await western()) === 0, 'evap: only Eastern Arabic digits');

  if (mode === 'struggle') {
    await opt('less');
    await page.waitForTimeout(300);
    check(await page.isVisible('.nuqta.why'), 'evap err1: نُقطة explains why the path changed');
    check(await page.isVisible('text=اقتربت'), 'evap err1: gentle feedback');
    check(await page.$eval('.opt[data-id="more"]', b => b.disabled), 'evap err1: question locked until comparison');
    await page.click('[data-m=low]'); await page.waitForTimeout(4500);
    await page.click('[data-m=high]'); await page.waitForTimeout(4500);
    const nums = await page.$$eval('[data-v]', e => e.map(x => x.textContent));
    check(nums.every(n => /^[٠-٩]+$/.test(n)), 'evap compare: counts in Arabic digits ' + nums.join(' / '));
    check(!(await page.$eval('.opt[data-id="more"]', b => b.disabled)), 'evap: released after comparison');
    await shot('3b-evap-compare');
    await opt('none');
    await page.waitForTimeout(300);
    check(await page.isVisible('.nuqta.scaffold'), 'evap err2: scaffold from نُقطة');
    check((await visibleOpts()) === 2 && await page.isHidden('.opt[data-id=less]'), 'evap err2: ruled-out options hidden');
    await opt('more');
  } else {
    await opt('more');
    await page.waitForSelector('text=تحدٍّ أعلى');
    check(true, 'evap first try: challenge offered');
    await opt('sun');
  }
  await page.waitForSelector('.discovery');
  check(await page.isVisible('.discovery:has-text("التبخر")'), 'evap: term revealed after discovery');
  await shot('3c-evap-done');
  await page.click('[data-next]');

  // ---------- condensation ----------
  await page.waitForSelector('#sl-air');
  check(await page.isVisible(mode === 'struggle' ? 'text=تذكير سريع' : 'text=فلن نعيد شرحه'), 'cloud: recap ' + (mode === 'struggle' ? 'shown' : 'skipped'));
  await setRange('#sl-air', 92);
  await page.waitForSelector('.chain3 .node.on[data-s=cloud]', { timeout: 40000 });
  check(true, 'cloud: vapour → drops → cloud observed');
  await page.waitForSelector('.question');
  await shot('4-cloud');
  check((await western()) === 0, 'cloud: only Eastern Arabic digits');
  if (mode === 'struggle') {
    await opt('gone');
    await page.waitForTimeout(300);
    check(await page.isVisible('[data-slow]'), 'cloud err1: slow-cooling experiment');
    check(await page.isDisabled('#sl-air'), 'cloud err1: free slider disabled during slow cooling');
    for (let i = 1; i <= 4; i++) { await page.click(`.steps4 button:nth-child(${i})`); await page.waitForTimeout(i < 4 ? 4500 : 9000); }
    const logs = await page.$$eval('.coollog tbody td:nth-child(2)', t => t.map(x => x.textContent));
    console.log('    log:', logs.join(' | '));
    check(!logs.includes('—'), 'cloud: observation log complete');
    await shot('4b-cloud-slow');
    await opt('hot');
    await page.waitForTimeout(300);
    check((await visibleOpts()) === 2 && await page.isHidden('.opt[data-id=gone]'), 'cloud err2: scaffold hides ruled-out options');
    check(await page.isVisible('text=برّد الهواء ببطء'), 'cloud err2: scaffold text from spec');
    await opt('rain');
    await page.waitForTimeout(300);
    check((await visibleOpts()) === 2, 'cloud err3: guided demo, 2 options');
    await page.waitForFunction(() => !document.querySelector('.opt[data-id="drops"]').disabled, null, { timeout: 30000 });
    await opt('drops');
  } else {
    await opt('drops');
    await page.waitForSelector('text=لماذا تتكوّن السحب');
    check(true, 'cloud first try: challenge offered');
    await opt('high');
  }
  await page.waitForSelector('.discovery:has-text("التكاثف")');
  await page.click('[data-next]');

  // ---------- precipitation ----------
  await page.waitForSelector('#sl-vapor');
  const balVis = await page.isVisible('[data-balance]');
  check(mode === 'struggle' ? balVis : !balVis, 'rain: weight gauge ' + (mode === 'struggle' ? 'shown from start (condensation needed support)' : 'hidden'));
  await setRange('#sl-vapor', 80); await setRange('#sl-size', 30); await page.waitForTimeout(600);
  check(await page.isVisible('text=تبقى معلّقة'), 'rain: small drops stay suspended');
  await setRange('#sl-size', 80); await page.waitForTimeout(1500);
  check(await page.isVisible('[data-obs]:has-text("بدأ الهطول")'), 'rain: precipitation starts');
  await page.waitForSelector('.question');
  await shot('5-rain');
  check((await western()) === 0, 'rain: only Eastern Arabic digits');
  await opt('heavy');
  await page.waitForSelector('text=اجعل المطر غزيرًا');
  check(true, 'rain first try: interactive challenge');
  await setRange('#sl-vapor', 100); await setRange('#sl-size', 100);
  await page.waitForSelector('text=اجتزت التحدي', { timeout: 5000 });
  check(true, 'rain: heavy-rain challenge passed');
  await page.click('[data-next]');

  // ---------- mission ----------
  await page.waitForSelector('.mission');
  await page.waitForTimeout(500);
  const vals = await page.$$eval('.mission input[type=range]', a => a.map(x => +x.value));
  console.log('    mission start controls [sun, air, vapor, size]:', vals.join(','));
  if (mode === 'struggle') check(vals[0] === 15 && vals[1] === 12 && vals[3] === 75, 'mission: faults = evaporation + condensation (the supported concepts)');
  else check(vals[0] === 15 && vals[1] === 12 && vals[3] === 20 && await page.isVisible('text=ثلاثة أعطال'), 'mission: hard mode, 3 faults');
  await shot('6-mission');
  check((await western()) === 0, 'mission: only Eastern Arabic digits');
  // fiddle with the wrong control to trigger a diagnosed hint
  for (let i = 0; i < 6; i++) await setRange('#sl-m-vapor', 40 + i * 10);
  await page.waitForTimeout(600);
  const hint = await page.$eval('.nuqta .msg', e => e.textContent).catch(() => '');
  console.log('    hint:', hint);
  if (mode === 'struggle') check(/بخار|الشمس/.test(hint), 'mission: hint targets the blocked link (evaporation)');
  else check(/لن أتدخل/.test(hint), 'mission hard: no automatic hint before 10 changes');
  await setRange('#sl-m-sun', 90);
  await page.waitForTimeout(400);
  await page.click('[data-hint]'); await page.waitForTimeout(300);
  const hint2 = await page.$eval('.nuqta .msg', e => e.textContent).catch(() => '');
  console.log('    hint2:', hint2);
  if (mode === 'struggle') check(/هواء|أبرد/.test(hint2), 'mission: after fixing sun, hint moves to condensation');
  await setRange('#sl-m-air', 85);
  if (mode !== 'struggle') await setRange('#sl-m-size', 85);
  await page.waitForTimeout(2500);
  await shot('6b-mission-cascade');
  await page.waitForSelector('text=نجحت في إعادة تشغيل الدورة', { timeout: 40000 });
  check(true, 'mission: success detected');
  // order chain (one wrong attempt first)
  const cards = { evaporation: 'سخّنت الشمس', condensation: 'برد البخار', precipitation: 'كبرت القطرات', collection: 'تجمّع ماء' };
  if (mode === 'struggle') {
    for (const k of ['condensation', 'evaporation', 'precipitation', 'collection']) await page.click(`.order-cards button:has-text("${cards[k]}")`);
    await page.waitForTimeout(300);
    check(await page.isVisible('text=راجع الحلقة رقم ١'), 'chain: wrong order → targeted feedback');
    await page.waitForTimeout(1000);
  }
  for (const k of ['evaporation', 'condensation', 'precipitation', 'collection']) await page.click(`.order-cards button:has-text("${cards[k]}")`);
  await page.waitForSelector('text=سلسلة صحيحة');
  await page.fill('#own', 'رفعتُ حرارة الشمس فتبخر الماء، ثم برّدت الهواء فتكوّنت سحابة وهطل المطر.');
  if (mode === 'struggle') { await opt('cloud'); await page.waitForTimeout(400); check(await page.isVisible('.nuqta.why'), 'collection err1: why + extra activity'); }
  await opt('pool');
  await page.waitForSelector('.discovery:has-text("التجمع")');
  await shot('6c-mission-explain');
  await page.click('text=اعرض خريطة تعلّمي');

  // ---------- map ----------
  await page.waitForSelector('.map');
  const st = await page.$$eval('.concept', cs => cs.map(c => c.querySelector('h3').textContent + ': ' + c.querySelector('.status').textContent));
  console.log('    map:', st.join(' | '));
  if (mode === 'struggle') {
    check(st[0].includes('أتقن بعد دعم من نُقطة'), 'map: evaporation = mastered after scaffold');
    check(st[1].includes('يحتاج إلى تحدٍ إضافي'), 'map: condensation = needs extra challenge (3 errors)');
    check(st[2].includes('متقن'), 'map: precipitation mastered');
    check(st[3].includes('أتقن بعد تجربة إضافية'), 'map: collection after extra experience');
  } else check(st.every(s => /متقن$/.test(s.trim())), 'map: all mastered');
  check((await western()) === 0, 'map: only Eastern Arabic digits');
  await page.setViewportSize({ width: 1440, height: 1500 });
  await shot('7-map');
  await page.click('[data-adapt]');
  await page.waitForSelector('.adapt');
  const nCases = await page.$$eval('.case', c => c.length);
  check(nCases >= 3, 'adapt: real decision cases shown (' + nCases + ')');
  check(await page.$$eval('.persona', p => p.length) === 4, 'adapt: own journey + 3 sample learners');
  check((await western()) === 0, 'adapt: only Eastern Arabic digits');
  await page.setViewportSize({ width: 1440, height: 2000 });
  await shot('8-adapt');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.click('[data-designer]');
  await page.waitForSelector('dialog.designer[open]');
  const logN = await page.$$eval('.livelog li', l => l.length);
  check(logN > 5, 'designer: live decision log (' + logN + ' entries)');
  await shot('9-designer');
  await page.click('[data-persona=layan]');
  await page.waitForSelector('.map');
  check(await page.isVisible('text=رحلة ليان'), 'designer: sample learner loaded into the map');

  // ---------- keyboard + mobile ----------
  await page.goto(URL);
  await page.waitForTimeout(700); await page.keyboard.press('Enter'); // start button is focused
  await page.waitForSelector('.diag');
  check(true, 'keyboard: start mission with Enter');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(URL + '#evap'); await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, 'mobile: no horizontal scroll (' + overflow + ')');
  await shot('10-mobile-evap');
  await page.goto(URL + '#mission'); await page.waitForTimeout(800);
  check((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, 'mobile mission: no horizontal scroll');
  await shot('11-mobile-mission');

  check(errors.length === 0, 'no console/page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`\n${mode}: ${ok} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message, errors); process.exit(2); });
