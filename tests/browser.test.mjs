import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(new URL('..', import.meta.url).pathname);
const liveKey = 'gzw-companion';
const previewKey = 'gzw-companion-image-test-111';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC1sAAAAASUVORK5CYII=', 'base64');
let server, browser, origin;

before(async () => {
  server = createServer(async (req, res) => {
    const path = resolve(root, '.' + new URL(req.url, 'http://local').pathname);
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
      const data = await readFile(path);
      res.setHeader('Content-Type', path.endsWith('.html') ? 'text/html' : 'application/octet-stream');
      res.end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function pageFor(t, { preview = false, seed = {}, mobile = false, failImages = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  t.after(() => context.close());
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    if (failImages) return route.abort();
    return route.fulfill({ status: 200, contentType: 'image/png', body: png });
  });
  await context.addInitScript(({ seed, preview, liveKey, previewKey }) => {
    if (!sessionStorage.getItem('seeded')) {
      for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
      for (const key of [liveKey, previewKey]) if (!localStorage.getItem(key + '-seen')) localStorage.setItem(key + '-seen', '0.1.7');
      sessionStorage.setItem('seeded', 'yes');
    }
  }, { seed, preview, liveKey, previewKey });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  t.after(() => assert.deepEqual(errors, [], 'no uncaught browser errors'));
  await page.goto(origin + '/index.html' + (preview ? '?image-test=111' : '') + '#/hideout/inventory');
  await page.waitForSelector('#inv-search');
  await page.waitForTimeout(800); // both existing welcome add-ons schedule their popup after startup
  await page.evaluate(() => closeModal());
  return page;
}

const storedState = (page, key = liveKey) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const search = (page, query) => page.locator('#inv-search').fill(query);
const step = (page, id, direction = '1') => page.locator(`[data-step="${direction}"][data-id="${id}"]`).click();


function assertPreserved(expected, actual, label = 'saved data') {
  if (Array.isArray(expected)) {
    assert.equal(actual.length, expected.length, label + ' length');
    expected.forEach((value, index) => assertPreserved(value, actual[index], label + '[' + index + ']'));
  } else if (expected && typeof expected === 'object') {
    for (const [key, value] of Object.entries(expected)) assertPreserved(value, actual?.[key], label + '.' + key);
  } else assert.deepEqual(actual, expected, label);
}

function fullSave() {
  const end = Date.now() + 86_400_000;
  const recipe = { id: 'custom-recipe', name: 'My custom craft', room: 'workshop', output: { item: 'custom-supply', qty: 2 }, ingredients: [{ item: 'steel', qty: 3, unsure: true }], station: null, stationGuess: false, cap: null, needsRecipe: false, task: '', power: 0, time: 5, notes: 'Keep my notes', source: 'Added by you' };
  return {
    saveVersion: 2, counts: { steel: 14, 'analog-indicator': 2, 'artillery-ballistic-calculator': 3, 'laf-artillery-data-logs': 7, 'custom-supply': 9 },
    favorites: ['steel', 'custom-supply', 'artillery-ballistic-calculator'], order: ['custom-supply', 'artillery-ballistic-calculator', 'steel'],
    customItems: [{ id: 'custom-supply', name: 'My Supply', category: 'other', image: 'https://example.test/custom.png', info: 'Keep my item', step: 3, custom: true }],
    stationLevels: { generator: 1, 'heat-source': 2 }, pins: ['generator'], customRecipes: [recipe], recipeOverrides: {}, recipeFlags: { 'custom-recipe': { found: true, task: true } }, recipePins: { 'custom-recipe': 3 },
    jobs: [{ id: 'saved-job', recipeId: 'custom-recipe', name: 'My custom craft', room: 'workshop', output: { item: 'custom-supply', qty: 2 }, used: [{ item: 'steel', qty: 3 }], start: end - 60000, end }],
    prefs: { needMode: 'pinned', sort: 'custom', category: 'all', neededOnly: false, hideBanner: true, roomFilter: 'all', craftRoom: 'all', craftStatus: 'all', hideCraftNote: true, disSlots: 2, disFilter: 'all', hideDisNote: true },
    disCustom: [{ id: 'dis-custom-supply', input: 'custom-supply', outputs: [{ item: 'steel', qty: 4, unsure: false }], time: 2, station: null, notes: 'My disassembly note', source: 'Added by you' }],
    disOverrides: { 'dis-artillery-ballistic-calculator': { id: 'dis-artillery-ballistic-calculator', input: 'artillery-ballistic-calculator', outputs: [{ item: 'cpu-card', qty: 4, unsure: false }], time: 5, station: null, notes: 'My correction', source: 'Custom' } },
    disQueue: [{ id: 'saved-dis', recipeId: 'dis-artillery-ballistic-calculator', input: 'artillery-ballistic-calculator', outputs: [{ item: 'cpu-card', qty: 4 }], dur: 86_400_000, added: end - 60000, start: end - 60000 }],
  };
}

for (const mobile of [false, true]) test(`all item images render and decode on ${mobile ? 'mobile' : 'desktop'}`, async (t) => {
  const page = await pageFor(t, { mobile });
  const items = await page.evaluate(() => allItems().map(({ id, name, image }) => ({ id, name, image })));
  assert.ok(items.length > 111);
  assert.ok(items.every((i) => i.image.startsWith('https://')));
  let decoded = 0;
  for (const category of ['building', 'production', 'crafting', 'crafted', 'disassembly', 'intel']) {
    await page.locator(`[data-act="inv-cat"][data-v="${category}"]`).click();
    const sizes = await page.locator('#inv-list .icon-wrap img').evaluateAll((images) => Promise.all(images.map(async (image) => {
      image.loading = 'eager';
      await image.decode();
      return image.naturalWidth;
    })));
    assert.ok(sizes.length > 0 && sizes.every((width) => width > 0), `${category} images decode`);
    decoded += sizes.length;
    assert.equal(await page.locator('#inv-list .noimg').count(), 0);
  }
  assert.equal(decoded, items.length, 'every mapped item rendered and decoded');
  await search(page, 'UNLRA Relief');
  assert.equal(await page.locator('#inv-list .row').count(), 1);
  assert.equal(await page.locator('#inv-list .hn').textContent(), 'UNLRA Relief Manifest');
});

test('existing save survives startup, inventory edits, reload and backup round trip', async (t) => {
  const seed = fullSave();
  const page = await pageFor(t, { seed: { [liveKey]: JSON.stringify(seed) } });
  assert.equal(await page.evaluate(() => localStorage.getItem('gzw-companion')), JSON.stringify(seed), 'loading never rewrites the original save');
  const loaded = await page.evaluate(() => JSON.parse(backupText()).state);
  for (const field of ['counts', 'favorites', 'customItems', 'stationLevels', 'pins', 'customRecipes', 'recipeFlags', 'recipePins', 'jobs', 'disCustom', 'disOverrides', 'disQueue', 'prefs']) assertPreserved(seed[field], loaded[field], field);
  assert.deepEqual(loaded.order.slice(0, seed.order.length), seed.order);
  assert.equal(loaded.order.length, await page.evaluate(() => allItems().length));
  await search(page, 'My Supply');
  assert.equal(await page.locator('#inv-list img[src="https://example.test/custom.png"]').getAttribute('src'), seed.customItems[0].image);
  await step(page, 'custom-supply');
  assert.equal((await storedState(page)).counts['custom-supply'], 12);
  await page.reload();
  assert.equal(await page.evaluate(() => have('custom-supply')), 12);
  const beforeBackup = await page.evaluate(() => JSON.parse(backupText()).state);
  assert.deepEqual(await page.evaluate(() => parseBackup(backupText())), beforeBackup);
  await page.locator('[data-act="inv-menu"]').click();
  await page.locator('[data-act="copy-backup"]').click();
  const exported = JSON.parse(await page.locator('#backup-text').inputValue());
  assert.deepEqual(exported.state, beforeBackup);
  await page.locator('[data-act="modal-close"]').click();
  await page.locator('[data-act="inv-menu"]').click();
  if (!(await page.locator('[data-act="paste-backup"]').isVisible())) await page.locator('[data-act="inv-menu"]').click();
  await page.locator('[data-act="paste-backup"]').click();
  await page.locator('textarea[name="text"]').fill(JSON.stringify(exported));
  await page.locator('form[data-form="import"] button[type="submit"]').click();
  await page.locator('[data-act="modal-ok"]').click();
  assert.deepEqual(await storedState(page), beforeBackup);
});

test('preview inventory, art, cache, and welcome state never read or overwrite live keys', async (t) => {
  const live = { [liveKey]: JSON.stringify(fullSave()), [liveKey + '-art']: JSON.stringify({ v: 1, slots: { banner: 'https://example.test/live-banner.png' } }), [liveKey + '-seen']: 'keep-my-version', [liveKey + '-art-files']: JSON.stringify({ icon: 'https://example.test/live-icon.png' }), unrelated: 'keep-me' };
  const page = await pageFor(t, { preview: true, seed: { ...live, [previewKey + '-seen']: '0.1.5' } });
  assert.equal(await page.evaluate(() => have('steel')), 0, 'preview does not read live inventory');
  assert.equal(await page.evaluate(() => localStorage.getItem('gzw-companion-image-test-111-art')), null, 'preview starts with no uploaded art');
  assert.match(await page.locator('body').innerText(), /test/i);
  await search(page, 'Steel');
  await step(page, 'steel');
  assert.equal((await storedState(page, previewKey)).counts.steel, 1);
  await page.goto(origin + '/index.html?image-test=111#/art');
  assert.equal(await page.locator('#art-url-banner').inputValue(), '', 'preview does not read live uploaded art');
  await page.locator('#art-url-banner').fill('https://example.test/test-banner.png');
  await page.locator('[data-act="art-link"][data-slot="banner"]').click();
  await page.waitForFunction(() => localStorage.getItem('gzw-companion-image-test-111-art'));
  await page.waitForFunction(() => localStorage.getItem('gzw-companion-image-test-111-art-files'));
  const values = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  for (const [key, value] of Object.entries(live)) assert.equal(values[key], value, `live key ${key} unchanged byte-for-byte`);
  assert.ok(values[previewKey + '-art'].includes('test-banner.png'));
  assert.equal(values[previewKey + '-seen'], '0.1.7', 'welcome state writes only to preview namespace');
  await page.goto(origin + '/index.html#/hideout/inventory');
  assert.equal(await page.evaluate(() => have('steel')), 14, 'normal tracker retains the live inventory');
});

test('mobile fallback initials, count controls, favorites, search and custom image links keep working', async (t) => {
  const page = await pageFor(t, { mobile: true, failImages: true });
  await search(page, 'Analog Indicator');
  await page.waitForSelector('#inv-list .icon-wrap.noimg');
  assert.equal(await page.locator('#inv-list .placeholder').innerText(), 'AI');
  await step(page, 'analog-indicator');
  assert.equal(await page.evaluate(() => have('analog-indicator')), 1);
  await page.locator('[data-act="fav"][data-id="analog-indicator"]').click();
  assert.deepEqual((await storedState(page)).favorites, ['analog-indicator']);
  await page.locator('[data-act="add-item"]').click();
  await page.locator('input[name="name"]').fill('Personal crate');
  await page.locator('input[name="image"]').fill('https://example.test/my-crate.webp');
  await page.locator('input[name="step"]').fill('5');
  await page.locator('form[data-form="item"] button[type="submit"]').click();
  await search(page, 'Personal crate');
  assert.equal(await page.locator('#inv-list img').getAttribute('src'), 'https://example.test/my-crate.webp');
  const id = await page.evaluate(() => state.customItems[0].id);
  await step(page, id);
  assert.equal((await storedState(page)).counts[id], 5);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile layout fits the viewport');
});

test('station building/pinning, crafting collection and disassembly queue still update inventory', async (t) => {
  const page = await pageFor(t);
  await page.evaluate(() => { setCountRaw('steel', 10); setCountRaw('mechanical-parts', 10); setCountRaw('motor-oil', 10); setCountRaw('dynamo', 10); saveState(); });
  await page.goto(origin + '/index.html#/hideout/station/generator');
  await page.locator('[data-act="pin-station"]').click();
  await page.locator('[data-act="build"]').click();
  assert.equal((await storedState(page)).stationLevels.generator, 1);
  assert.equal((await storedState(page)).counts.steel, 9);
  assert.deepEqual((await storedState(page)).pins, ['generator']);
  const recipeId = await page.evaluate(() => {
    const r = getRecipe('craft-basic-hacking-tool') || allRecipes().find((r) => r.output?.item === 'basic-hacking-tool');
    for (const st of STATIONS) state.stationLevels[st.id] = st.levels.length;
    for (const item of r.ingredients) setCountRaw(item.item, item.qty + 10);
    state.recipeFlags[r.id] = { found: true, task: true };
    state.recipeOverrides[r.id] = { ...r, time: 1 }; // exercise the existing timed-craft path
    saveState(); return r.id;
  });
  await page.goto(origin + '/index.html#/hideout/recipe/' + recipeId);
  await page.locator('[data-act="craft"]').click();
  if (await page.locator('[data-act="modal-ok"]').isVisible()) await page.locator('[data-act="modal-ok"]').click();
  assert.equal((await storedState(page)).jobs.length, 1);
  await page.evaluate(() => { state.jobs[0].end = Date.now() - 1; saveState(); render(); });
  await page.locator('[data-act="collect"]').click();
  assert.equal((await storedState(page)).counts['basic-hacking-tool'], 1);
  assert.equal((await storedState(page)).jobs.length, 0);
  await page.evaluate(() => { setCountRaw('artillery-ballistic-calculator', 2); saveState(); });
  await page.goto(origin + '/index.html#/hideout/dis/dis-artillery-ballistic-calculator');
  await page.locator('[data-act="dis-add"]').click();
  assert.equal((await storedState(page)).counts['artillery-ballistic-calculator'], 1);
  assert.equal((await storedState(page)).disQueue.length, 1);
  await page.evaluate(() => { state.disQueue[0].start = Date.now() - state.disQueue[0].dur - 1000; saveState(); render(); });
  await page.locator('[data-act="dis-collect"]').click();
  const saved = await storedState(page);
  assert.equal(saved.disQueue.length, 0);
  assert.equal(saved.counts['laf-artillery-data-logs'], 1);
  assert.ok(saved.counts['cpu-card'] >= 1);
});

test('multiple capability requirements gate crafting and survive editing', async(t)=>{
 const page=await pageFor(t);
 const checks=await page.evaluate(()=>{
   const r=getRecipe('basic-hacking-tool');
   const required=recipeRequirements(r);
   const vector=Object.fromEntries(required.map(c=>[c.id,c.min]));
   return {required,valid:recipeHardOk(r,{},vector),blocked:required.map(c=>recipeHardOk(r,{}, {...vector,[c.id]:c.min-1})),production:recipeRequirements(getRecipe('low-quality-morphine-base')).length};
 });
 assert.equal(checks.required.length,2);assert.equal(checks.valid,true);assert.deepEqual(checks.blocked,[false,false]);assert.equal(checks.production,4);
 await page.evaluate(()=>{state.stationLevels={'hardware':1}; const r=getRecipe('basic-hacking-tool');for(const i of r.ingredients)setCountRaw(i.item,i.qty);state.recipeFlags[r.id]={found:true,task:true};saveState();});
 await page.goto(origin+'/index.html#/hideout/recipe/basic-hacking-tool');
 assert.equal(await page.locator('[data-act="craft"]').isDisabled(),true);
 await page.evaluate(()=>{state.stationLevels['machine-tools']=1;saveState();render();});
 assert.equal(await page.locator('[data-act="craft"]').isEnabled(),true);
 await page.evaluate(()=>openRecipeForm('basic-hacking-tool'));
 assert.equal(await page.locator('.cap-row').count(),2);
 assert.equal(await page.locator('[name="seconds"]').inputValue(),'1');
 await page.locator('form[data-form="recipe"] button[type="submit"]').click();
 const saved=await storedState(page);
 assert.equal(saved.recipeOverrides['basic-hacking-tool'].time,1/60);
 assert.equal(saved.recipeOverrides['basic-hacking-tool'].caps.length,2);
 await page.reload();
 assert.equal(await page.evaluate(()=>recipeRequirements(getRecipe('basic-hacking-tool')).length),2);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>openRecipeForm('low-quality-morphine-base'));
 assert.equal(await page.locator('.cap-row').count(),4);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile capability editor fits');
});

test('one-second craft timers and undo work without rounding to instant crafts',async(t)=>{
 const page=await pageFor(t);
 const started=await page.evaluate(()=>{
  state.stationLevels={hardware:1,'machine-tools':1};
  const r=getRecipe('basic-hacking-tool');for(const i of r.ingredients)setCountRaw(i.item,i.qty);state.recipeFlags[r.id]={found:true,task:true};saveState();doCraft(r,1);
  return {duration:state.jobs[0].end-state.jobs[0].start,display:fmtMinutes(r.time),used:r.ingredients.map(i=>have(i.item)),output:have(r.output.item)};
 });
 assert.equal(started.duration,1000);assert.equal(started.display,'1s');assert.deepEqual(started.used,[0,0,0]);assert.equal(started.output,0);
 await page.locator('[data-act="undo"]').click();
 assert.equal(await page.evaluate(()=>state.jobs.length),0);
 assert.deepEqual(await page.evaluate(()=>getRecipe('basic-hacking-tool').ingredients.map(i=>have(i.item))),[1,1,1]);
 const fractional=await page.evaluate(()=>{const r=cleanRecipe({...getRecipe('tracking-tag'),time:1/60});return {time:r.time,roundtrip:parseBackup(JSON.stringify({counts:{},customRecipes:[{...r,id:'custom-seconds'}]})).customRecipes[0].time};});
 assert.equal(fractional.time,1/60);assert.equal(fractional.roundtrip,1/60);
});

test('new builtin IDs do not discard colliding custom items, recipes, flags or queued work',async(t)=>{
 const seed=fullSave();
 const custom={id:'dt-0x',name:'My existing detox item',category:'crafted',image:'https://example.test/my-detox.png',info:'Keep me',step:2,custom:true};
 seed.customItems.push(custom);seed.counts['dt-0x']=7;seed.favorites.push('dt-0x');seed.order.unshift('dt-0x');
 const recipe={...seed.customRecipes[0],id:'dt-0x',name:'My existing detox recipe',output:{item:'dt-0x',qty:3},cap:{id:'compute',min:2},time:9};
 seed.customRecipes.push(recipe);seed.recipeFlags['dt-0x']={found:true,task:true};seed.recipePins['dt-0x']=2;
 seed.recipeOverrides['basic-hacking-tool']={...recipe,id:'basic-hacking-tool',name:'My hacking correction',output:{item:'basic-hacking-tool',qty:2}};
 const page=await pageFor(t,{seed:{[liveKey]:JSON.stringify(seed)}});
 const loaded=await page.evaluate(()=>JSON.parse(backupText()).state);
 for(const field of ['counts','favorites','customItems','customRecipes','recipeOverrides','recipePins','recipeFlags','jobs','disQueue'])assertPreserved(seed[field],loaded[field],field);
 assert.equal(await page.evaluate(()=>getItem('dt-0x').image),custom.image);
 assert.equal(await page.evaluate(()=>allItems().filter(i=>i.id==='dt-0x').length),1);
 assert.equal(await page.evaluate(()=>getRecipe('dt-0x').name),recipe.name);
 assert.equal(await page.evaluate(()=>allRecipes().filter(r=>r.id==='dt-0x').length),1);
 assert.deepEqual(await page.evaluate(()=>recipeRequirements(getRecipe('dt-0x'))),[{id:'compute',min:2}]);
 await page.evaluate(()=>saveState());await page.reload();
 assert.equal(await page.evaluate(()=>have('dt-0x')),7);
 assert.equal(await page.evaluate(()=>state.disQueue[0].dur),seed.disQueue[0].dur);
 assert.equal(await page.evaluate(()=>state.jobs[0].end),seed.jobs[0].end);
});

test('new disassembly defaults apply only to new jobs and keep uncertainty when edited',async(t)=>{
 const seed=fullSave();delete seed.disOverrides['dis-artillery-ballistic-calculator'];
 const page=await pageFor(t,{seed:{[liveKey]:JSON.stringify(seed)}});
 await page.goto(origin+'/index.html#/hideout/dis/dis-artillery-ballistic-calculator');
 assert.match(await page.locator('body').innerText(),/4h.*community estimate/);
 await page.locator('[data-act="dis-add"]').click();
 const saved=await storedState(page);assert.equal(saved.disQueue[0].dur,seed.disQueue[0].dur);assert.equal(saved.disQueue[1].dur,4*60*60000);
 await page.locator('[data-act="dis-edit"]').click();
 assert.equal(await page.locator('input[name="timeUnconfirmed"]').isChecked(),true);
 await page.locator('form[data-form="dis"] button[type="submit"]').click();
 assert.equal((await storedState(page)).disOverrides['dis-artillery-ballistic-calculator'].timeUnconfirmed,true);
 assert.equal((await storedState(page)).disOverrides['dis-artillery-ballistic-calculator'].time,240);
});
