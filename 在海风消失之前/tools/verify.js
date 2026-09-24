#!/usr/bin/env node
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const mem=new Map();
global.localStorage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
global.window={};
require(path.join(root,'js','data.js'));
require(path.join(root,'js','resources.js'));
require(path.join(root,'js','bonus.js'));
require(path.join(root,'js','engine.js'));
const D=window.GAME_DATA,E=window.VN.Engine,R=window.RES;
for(const [seg,nodes] of Object.entries(D)){
  if(!Array.isArray(nodes))continue;
  for(const [i,n] of nodes.entries()){
    if(n.t==='c')for(const o of n.o){
      assert(!/→|⇒|获得|GOOD END|BAD END|路线《/.test(o.x),`${seg}:${i} choice spoiler`);
      assert(o.i>=0&&o.i<(D[o.seg||seg]||[]).length,`${seg}:${i} target invalid`);
    }
    if(n.t==='bg')assert(R.bg[n.id],`${seg}:${i} missing bg ${n.id}`);
  }
}
for(const conf of Object.values(R.bg))if(conf.file)assert(fs.existsSync(path.join(root,conf.file)),conf.file);
for(const conf of Object.values(R.char)){
  assert(fs.existsSync(path.join(root,conf.img)),conf.img);
  for(const v of Object.values(conf.expr||{}))assert(fs.existsSync(path.join(root,v.file)),v.file);
}
for(const route of ['A','B','C','D']){
  const cgNodes=D[route].filter(n=>n.t==='bg'&&n.id.startsWith(({A:'misaki',B:'reina',C:'himari',D:'noa'})[route]+'_'));
  assert.equal(cgNodes.length,8,`${route} should show eight character CGs`);
}
const bonusIds=[];
assert.equal(window.SWIMSUIT_CHAPTERS.length,3);
for(const chapter of window.SWIMSUIT_CHAPTERS){
  assert(!E.bonusUnlocked(chapter.seg),`${chapter.seg} unlocked too early`);
  assert.equal(E.start(chapter.seg),null,`${chapter.seg} should block direct start`);
  const nodes=D[chapter.seg];
  assert(nodes?.[0]?.t==='ch',`${chapter.seg} missing chapter opening`);
  const ids=nodes.filter(n=>n.t==='bg'&&n.id.startsWith('swim_')).map(n=>n.id);
  assert.equal(ids.length,chapter.count,`${chapter.seg} image count`);
  bonusIds.push(...ids);
}
mem.set('seaVN_save_1',JSON.stringify({seg:'swim_misaki',idx:0}));
assert.equal(E.loadGame(1),false,'locked bonus save should not load');
mem.delete('seaVN_save_1');
assert.equal(bonusIds.length,10);
assert.equal(new Set(bonusIds).size,10,'duplicate bonus image');
assert.equal(Object.keys(R.bg).filter(id=>id.startsWith('swim_')).length,10);
function run(route,final){
  let n=E.start(route==='true'?'true':'main'),guard=2000;
  while(n&&guard--){
    if(n.t==='e')return E.hitEnding();
    if(n.t==='c'){
      const opts=n.o;
      let pick=0;
      if(opts.some(o=>o.seg))pick=opts.findIndex(o=>o.seg===route);
      else if(n.o.some(o=>o.i!==undefined)&&D[E.state.seg].slice(E.state.idx+1).some(x=>x.t==='e')){
        // 只有本段最终选项之后才紧跟结局正文。
        if(['A','B','C','D','E','true'].includes(E.state.seg)&&n===D[E.state.seg].filter(x=>x.t==='c').at(-1))pick=final;
      }
      assert(pick>=0,`route ${route} unavailable`);
      n=E.choose(pick);
    }else n=E.advance();
  }
  throw Error(`did not finish ${route}/${final}, at ${E.state.seg}:${E.state.idx}`);
}
const seen=[];
for(const route of ['A','B','C','D']){
  const chapter=window.SWIMSUIT_CHAPTERS.find(c=>c.unlock==='GOOD'+route);
  for(const i of [1,2]){
    const e=run(route,i);seen.push(e.kind+e.line);
    if(chapter)assert(!E.bonusUnlocked(chapter.seg),`${chapter.seg} unlocked by non-GOOD ending`);
  }
  const e=run(route,0);seen.push(e.kind+e.line);
  if(chapter)assert(E.bonusUnlocked(chapter.seg),`${chapter.seg} did not unlock after GOOD ending`);
}
for(let i=0;i<2;i++){const e=run('E',i);seen.push(e.kind+e.line);}
assert(E.trueUnlocked(),'TRUE should unlock after four GOOD endings');
seen.push(run('true',0).kind+'T');
assert.equal(new Set(seen).size,15,`unreachable ending: ${seen}`);
assert.equal(E.stats().endings,15);
mem.set('seaVN_save_0','main-progress-sentinel');
for(const chapter of window.SWIMSUIT_CHAPTERS){
  let node=E.start(chapter.seg),guard=100;
  while(node&&guard--)node=E.advance();
  assert.equal(node,null,`${chapter.seg} should return to title`);
  assert(guard>0,`${chapter.seg} did not finish`);
}
assert.equal(mem.get('seaVN_save_0'),'main-progress-sentinel','bonus must not overwrite main autosave');
mem.delete('seaVN_save_0');
console.log(`Verified ${seen.length} reachable endings, eight CGs per heroine, three bonus chapters with ten portrait images, branching, unlock, and all referenced image files.`);
