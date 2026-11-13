import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
function dataContext(search='') {
 const context=vm.createContext({console,URLSearchParams,location:{search},document:{title:'GZW Companion'}});
 const game=scripts.find(s=>s.includes('const RAW_ITEMS = ['));
 vm.runInContext(game.slice(0,game.indexOf('const esc =')),context);
 const dis=scripts.find(s=>s.includes('const NEW_ITEMS = ['));
 vm.runInContext(dis.slice(dis.indexOf('const otherAt ='),dis.indexOf('// ---------- Saving:')),context);
 return code=>JSON.parse(JSON.stringify(vm.runInContext(code,context)));
}
test('0.1.7 keeps all original111 images and covers all135 inventory items',async()=>{
 const get=dataContext(); const items=get('BUILT_IN_ITEMS'), map=get('ITEM_IMAGE_URLS');
 const baseline=JSON.parse(await readFile(new URL('fixtures/v0.1.6-images.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(baseline).length,111);for(const[id,url]of Object.entries(baseline))assert.equal(map[id],url,id);
 assert.equal(items.length,135);assert.equal(new Set(items.map(i=>i.id)).size,135);
 for(const item of items){assert.equal(new URL(item.image).protocol,'https:');assert.equal(item.image,map[item.id]);}
 assert.equal(get('APP_VERSION'),'0.1.7');
});
test('22 complete recipes retain original8 stable IDs and reference valid items/capabilities',()=>{
 const get=dataContext();const recipes=get('BUILT_IN_RECIPES'),items=new Set(get('BUILT_IN_ITEMS').map(i=>i.id)),caps=new Set(get('CAPS').map(c=>c.id));
 assert.equal(recipes.length,22);assert.equal(recipes.filter(r=>r.room==='workshop').length,6);assert.equal(recipes.filter(r=>r.room==='laboratory').length,16);
 for(const id of ['basic-hacking-tool','advanced-hacking-tool','superior-hacking-tool','tracking-tag','methylphenidate','epo','ori-12','hpr-3-s'])assert.ok(recipes.some(r=>r.id===id));
 for(const r of recipes){assert.ok(items.has(r.output.item));assert.ok(r.ingredients.length>0);assert.ok(r.task);assert.ok(r.time>0);for(const i of r.ingredients)assert.ok(items.has(i.item));for(const cap of r.caps)assert.ok(caps.has(cap.id));}
 assert.equal(recipes.filter(r=>r.time===1/60).length,14);
 assert.equal(recipes.filter(r=>r.timeUnconfirmed).length,8);
 assert.equal(recipes.find(r=>r.id==='basic-hacking-tool').caps.length,2);
 assert.equal(recipes.find(r=>r.id==='low-quality-morphine-base').caps.length,4);
});
test('15disassembly recipes have individual4/6/8h defaults and explicit uncertainty',()=>{
 const get=dataContext();const rows=get('DIS_BUILT_IN');assert.equal(rows.length,15);
 assert.equal(rows.filter(r=>r.time===240).length,3);assert.equal(rows.filter(r=>r.time===360).length,6);assert.equal(rows.filter(r=>r.time===480).length,6);
 for(const r of rows){assert.equal(r.timeUnconfirmed,true);assert.equal(r.station,null);assert.ok(r.outputs.every(o=>o.qty===1&&o.unsure));}
 assert.equal(get('STATIONS.length'),15);assert.equal(get('TOTAL_LEVELS'),36);
});
test('live keys/schema stay compatible and opt-in review storage remains separate',()=>{
 const live=dataContext(),preview=dataContext('?image-test=111');assert.equal(live('STORAGE_KEY'),'gzw-companion');assert.equal(live('SAVE_VERSION'),2);
 for(const suffix of ['','-art','-seen','-art-files'])assert.equal(preview(`storageKey(${JSON.stringify(suffix)})`),'gzw-companion-image-test-111'+suffix);
 assert.equal((html.match(/const VERSION = "0.1.7";/g)||[]).length,2);
});

test('all36 existing room upgrade costs, capability effects and prerequisites stay unchanged',async()=>{
 const get=dataContext();const actual=get('STATIONS.map(s=>({...s,levels:s.levels.map(({warn,...level})=>level)}))');
 const expected=JSON.parse(await readFile(new URL('fixtures/v0.1.6-stations.json',import.meta.url),'utf8'));
 assert.deepEqual(actual,expected);
});
