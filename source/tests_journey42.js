'use strict';
const assert=require('node:assert/strict');const E=require('./engine.js');global.PC=E;
const J=require('./journey42.js');const {FormData}=global;let rs=[];
function test(name,fn){try{fn();rs.push({name,result:'PASS'});console.log('PASS',name)}catch(err){rs.push({name,result:'FAIL',error:err.stack});console.error('FAIL',name,err.message)}}
function f(answer=null,check=null){const x=new FormData();if(answer!==null)x.set('answer',String(answer));if(check)for(const s of check)x.append('check',s);return x;}
const data=J.start('2026-11-09'),order=()=>data.sim.orders.find(x=>x.id==='SO-101');
test('J42-01 study copy matches existing engine and original scenario stays intact',()=>{assert.equal(data.sim.orders.find(o=>o.id==='SO-101').qty,360);assert.equal(data.stage,0);assert.equal(E.plan(data.sim).byOrder['SO-101'].status,'READY')});
test('J42-02 wrong order blocked with specific feedback',()=>{J.check(data,f('SO-102'));assert.equal(data.passed,false);assert.match(data.feedback.reason,/選錯/);assert.equal(data.sim.logs.length,0)});
const answers=['SO-101',504,204,'F-A','trial',null,180,360,'qa',360,'track'];
for(let i=0;i<answers.length;i++){
 test('J42-'+String(i+3).padStart(2,'0')+' guided step '+(i+1),()=>{assert.equal(data.stage,i);let v=i===5?f(null,['purchase','factory','qa']):f(answers[i]);J.check(data,v);assert.equal(data.passed,true,data.feedback?.reason);assert.equal(data.history.length,i+1);data.stage++;data.passed=false;});
}
test('J42-14 after full lifecycle good/ship/qa and material consumption correct',()=>{assert.equal(order().good,360);assert.equal(order().shipped,360);assert.equal(order().qa,'released');assert.equal(order().consumed['M-MANGO'],504);assert.equal(data.stage,11)});
test('J42-15 label scenario fact uses reserved amount and matches live model',()=>{const s=E.initial('label','2026-11-09');const usable=E.usable(s,'M-LABEL',s.date);assert.equal(usable,1100);const desc=E.SCENARIOS.find(x=>x.id==='label').facts.find(x=>x.id==='available').answer;assert.match(desc,/1,100/);assert.match(desc,/1,540/)});
test('J42-16 shipping before QA must be blocked by original engine',()=>{const s=E.initial('rush','2026-11-09');assert.throws(()=>E.ship(s,'SO-101',1),/品保放行/)});
test('J42-17 incorrect quantity does not consume materials',()=>{const j=J.start('2026-11-09');j.stage=6;const before=JSON.stringify(j.sim);J.check(j,f(700));assert.equal(j.passed,false);assert.equal(JSON.stringify(j.sim),before)});
test('J42-18 contains complete guided page and focus button',()=>{const h=J.render({journey42:J.start('2026-11-09')});assert.match(h,/帶我去操作/);assert.match(h,/檢查我的判斷/);assert.match(h,/我看不懂/);});
require('node:fs').writeFileSync(require('node:path').join(__dirname,'..','JOURNEY42_TEST_RESULTS.json'),JSON.stringify(rs,null,2));
const bad=rs.filter(x=>x.result==='FAIL');console.log(`${rs.length-bad.length} PASS ${bad.length} FAIL`); if(bad.length)process.exit(1);
