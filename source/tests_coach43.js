'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const memory = new Map();
const context = vm.createContext({
  console, structuredClone, setTimeout:()=>0, clearTimeout:()=>{},
  localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},
  FormData:class {constructor(form){this.values=form.values;}get(key){return this.values[key]??null;}}
});
for (const name of ['engine.js','academy.js','coach41.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),context,{filename:name});
}
const E=context.PC, A=context.ACADEMY;
const s=E.initial('rush','2026-11-09'), plan=E.plan(s);
let count=0;
function test(name,fn){fn();count++;console.log('PASS',name);}
test('round 2 delay renders current confirmation',()=>{
  A.__teacherUpdate(st=>{
    st.view='rounds';
    st.teacher={welcomeSeen:true,rounds:{scene:'delay',round:1,checked:{'delay-1':['eta']},options:{},drafts:{},logs:{}}};
  });
  const html=A.render(s,plan);
  assert(html.includes('已取得供應商書面到貨預計日'));
  assert(!html.includes('新的到貨日尚未取得供應商書面確認'));
});
test('round 3 factory availability matches model and risk assessment',()=>{
  const snapshot=A.__coachTest.roundsSnapshot('breakdown',2,s.date);
  const scenario=A.__coachTest.roundScenario('breakdown',2,snapshot);
  assert.equal(snapshot.factories[1].confirmed,true);
  assert.match(scenario.facts.find(x=>x.id==='repair').answer,/仍停機整日/);
  assert(!scenario.facts.find(x=>x.id==='repair').answer.includes('次日是否'));
  assert.equal(scenario.facts.find(x=>x.id==='slot').value,'pass');
  const option=scenario.options.find(x=>x.id==='move');
  const result=A.__coachTest.roundFeasibility(snapshot,scenario,option,scenario.facts.map(x=>x.id),2);
  assert(!result.unknown.some(x=>x.includes('檔期')));
  assert.equal(result.status,'BLOCKED','in-progress material transfer still blocked');
});
test('normal lesson submit separates objective answer from unreviewed reasoning',()=>{
  A.__teacherUpdate(st=>{st.active='m01';st.stage=4;st.view='lesson';st.teacher={welcomeSeen:true,draft:{},progress:{}};});
  A.submit({preventDefault(){},target:{id:'coachPractice',values:{answer:'品保',reason:'但是如果客戶著急我就自己放行隔離原料並直接出貨'}}},s,plan,{render(){}});
  const result=A.state().teacher.feedback;
  assert.equal(result.objectivePassed,true);
  assert.equal(result.reasonReview,'pending');
  assert.match(result.reason,/文字理由待教練覆核/);
  assert.match(A.render(s,plan),/文字理由待覆核/);
});
test('unsafe objective option is rejected',()=>{
  A.submit({preventDefault(){},target:{id:'coachPractice',values:{answer:'生管',reason:'我會依照需求自行決定是否放行並且通知相關人員'}}},s,plan,{render(){}});
  assert.equal(A.state().teacher.feedback.ok,false);
});
test('changing an already verified answer revokes its progression gate',()=>{
  A.submit({preventDefault(){},target:{id:'coachPractice',values:{answer:'品保',reason:'應由品保依照公司授權判定，生管負責協調交期與追蹤。'}}},s,plan,{render(){}});
  assert(A.state().teacher.progress.m01.passed);
  A.input({target:{closest:()=>({id:'coachPractice'}),name:'answer',type:'text',value:'生管',hasAttribute:()=>false}});
  assert.equal(A.state().teacher.progress.m01.passed,null);
});
test('legacy completed levels stay readable with review warning',()=>{
  A.__teacherUpdate(st=>{st.view='levels';st.levels[0]={reason:'舊版已保存的學習紀錄',date:s.date};});
  const html=A.render(s,plan);
  assert.match(html,/文字理由待教練覆核/);
  assert.match(html,/舊版已保存的學習紀錄/);
});
console.log(count+' teaching regression checks passed.');
