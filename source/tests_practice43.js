'use strict';
const assert = require('node:assert/strict');
const P = require('./practice43.js');
const E = require('./engine.js');
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS', name); }
function initial(id = 'desk') {
  const s = E.initial('rush', '2026-11-09');
  s.practice43 = P.state(s);
  s.practice43.active = id;
  return s;
}
function complete(id, rows) {
  let s = initial(id);
  for (const row of rows) {
    const before = JSON.stringify(s);
    const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)]));
    s = P.submitValues(s, values);
    assert.equal(P.state(s).cases[id].feedback.good, true, JSON.stringify(P.state(s).cases[id].feedback));
    const savedCount = P.state(s).cases[id].answers.length;
    s = P.submitValues(s, values);
    assert.equal(P.state(s).cases[id].answers.length, savedCount, 'repeat submit must not duplicate evidence');
    assert.notEqual(JSON.stringify(s), before);
    s = P.advance(JSON.parse(JSON.stringify(s)));
  }
  assert.equal(P.state(s).cases[id].step, rows.length);
  assert.match(P.render(s), /客觀核對完成/);
  return s;
}
const deskOut = [
  {available:500, shortage:100, plan:'outsource', owner:'purchase', deadline:'1030'},
  {received:100, usable:0, control:'hold', deadline:'1030', approvedCost:4200},
  {shipped:600, received:575, unfulfilled:25, owner:'logistics', deadline:'today'},
  {totalReceived:600, lateQty:25, lateHours:17, proof:'pod'},
  {cost:4800, onTimeA:575, prevention:'loading'}
];
const deskWait = [
  {available:500, shortage:100, plan:'wait', owner:'purchase', deadline:'1030'},
  {received:100, usable:0, control:'hold', deadline:'1030', approvedCost:1200},
  {shipped:100, received:100, unfulfilled:500, owner:'qa', deadline:'today'},
  {totalReceived:600, lateQty:500, lateHours:21, proof:'pod'},
  {cost:1200, onTimeA:100, prevention:'capacity'}
];
const raw = [
  {usable:700, first:'R-C', cQty:400, dQty:50},
  {received:180, shortage:20, usable:0, owner:'split'},
  {shortReceived:20, close:'no', document:'POD-R1'},
  {total:450, status:'delivery'}
];
const oem = [
  {label:'L-M3', needed:7200, revision:'confirm'},
  {good:570, increment:270, balance:0, yield:95},
  {unmade:30, unshipped:10, shortReceived:10, action:'track'},
  {received:560, remaining:40, close:'short'}
];
const odm = [
  {block:'version', owner:'rd', next:'f2'},
  {label:'hold', proof:'pack'},
  {received:800, remaining:200, next:'confirm'}
];
const completed = {};
for (const [name,id,rows] of [['outsource','desk',deskOut],['wait','desk',deskWait],['raw','raw',raw],['oem','oem',oem],['odm','odm',odm]]) {
  test('complete '+name+' with reload and retry', () => { completed[name] = complete(id, rows); });
}
test('every rendered stage has unique IDs and usable field labels', () => {
  for (const [id, rows] of [['desk', deskOut], ['desk', deskWait], ['raw', raw], ['oem', oem], ['odm', odm]]) {
    let s = initial(id);
    for (const row of rows) {
      const html = P.render(s);
      const ids = [...html.matchAll(/\\bid="([^"]+)"/g)].map(match => match[1]);
      assert.equal(new Set(ids).size, ids.length, id + ': duplicate IDs can disable the wrong control');
      assert.match(html, /<button id="p43-next"/);
      for (const match of html.matchAll(/\\bfor="([^"]+)"/g)) assert(ids.includes(match[1]), 'label must target a field');
      s = P.advance(P.submitValues(s, Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v)]))));
    }
  }
});
test('branch outcomes use the selected plan', () => {
  assert.match(P.render(completed.outsource), /五日跟單/);
  assert(P.reportRows(completed.outsource).some(row => row[4] === '4800'));
  assert(P.reportRows(completed.wait).some(row => row[4] === '1200'));
});
test('old state has empty practice and unchanged existing orders', () => {
  const s = E.initial('rush','2026-11-09');
  const before = JSON.stringify(s);
  assert.equal(P.state(s).cases.desk.step,0);
  assert.match(P.render(s), /五日跟單/);
  assert.equal(JSON.stringify(s),before);
});
test('empty and non-finite numeric input cannot pass', () => {
  for (const value of ['', 'NaN', 'Infinity']) {
    const s = P.submitValues(initial(),{...deskOut[0],available:value});
    assert.equal(P.state(s).cases.desk.answers.length,0);
  }
});
test('unverified stage cannot advance', () => {
  assert.equal(P.state(P.advance(initial())).cases.desk.step,0);
});
test('critical wrong choices are rejected', () => {
  for (const [id,changes] of [
    ['desk',{...deskOut[0],plan:'holdstock'}],
    ['raw',{...raw[0],first:'R-B'}],
    ['raw',{...raw[0],cQty:'500'}],
    ['oem',{...oem[0],label:'L-OR3'}],
    ['oem',{...oem[0],label:'L-M2'}],
    ['odm',{...odm[0],owner:'pm'}]
  ]) {
    const values=Object.fromEntries(Object.entries(changes).map(([k,v])=>[k,String(v)]));
    assert.equal(P.state(P.submitValues(initial(id),values)).cases[id].answers.length,0);
  }
});
test('contradictory free text never receives semantic approval', () => {
  const values=Object.fromEntries(Object.entries(deskOut[0]).map(([k,v])=>[k,String(v)]));
  values.note='客戶催交時我會自行放行隔離料';
  const result=P.submitValues(initial(),values);
  assert.equal(P.state(result).cases.desk.answers[0].reasonReview,'pending');
  assert(P.reportRows(result).some(row=>row[4]===values.note&&row[5]==='待教練覆核'));
});
test('changing earlier plan invalidates all later attestations', () => {
  let s=completed.outsource;
  P.click({target:{closest:()=>({dataset:{p43Edit:'0'}})}},s,{setState:next=>{s=next;}});
  assert.equal(P.state(s).cases.desk.answers.length,0);
  assert.equal(P.state(s).cases.desk.step,0);
  assert.equal(P.state(s).cases.desk.drafts[1],undefined);
});
test('drafts persist and invalidate the current answer', () => {
  let s=initial();
  const values=Object.fromEntries(Object.entries(deskOut[0]).map(([k,v])=>[k,String(v)]));
  s=P.submitValues(s,values);
  P.input({target:{closest:()=>({id:'practice43Form'}),name:'available',value:'999'}},s,{persistState:next=>{s=next;}});
  const reloaded=P.state(JSON.parse(JSON.stringify(s)));
  assert.equal(reloaded.cases.desk.drafts[0].available,'999');
  assert.equal(reloaded.cases.desk.answers.length,0);
});
test('imported incorrect results cannot bypass verification', () => {
  const tampered=JSON.parse(JSON.stringify(completed.outsource));
  tampered.practice43.cases.desk.answers[0].values.available='1000';
  assert.equal(P.state(tampered).cases.desk.answers.length,0);
  assert.equal(P.state(tampered).cases.desk.step,0);
});
test('case switching preserves each case progress', () => {
  let s=completed.raw;
  P.click({target:{closest:()=>({dataset:{p43Case:'oem'}})}},s,{setState:next=>{s=next;}});
  assert.equal(P.state(s).cases.raw.step,4);
  assert.equal(P.state(s).cases.oem.step,0);
});
test('source download respects information available so far', () => {
  const rows=P.sourceRows(initial());
  assert(rows.some(row=>row[2].includes('INV-01')));
  assert(!rows.some(row=>row[2].includes('POD-A2')));
});
test('export and HTML retain safe raw text boundaries', () => {
  const s=initial();
  s.practice43.cases.desk.drafts[0]={note:'<img src=x onerror=alert(1)> =SUM(A1:A2)'};
  assert(!P.render(s).includes('<img src=x'));
  assert(P.render(s).includes('&lt;img'));
  assert(P.reportRows(s).some(row=>String(row[4]).includes('=SUM')));
});
test('normal submit handler and export actions dispatch', () => {
  const Original=global.FormData;
  let s=initial();
  try {
    global.FormData=class { constructor(form){this.values=form.values;} [Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();} };
    const values=Object.fromEntries(Object.entries(deskOut[0]).map(([k,v])=>[k,String(v)]));
    assert.equal(P.submit({target:{id:'practice43Form',values},preventDefault(){}},s,{setState:next=>{s=next;}}),true);
    assert.equal(P.state(s).cases.desk.answers.length,1);
    let exported;
    P.click({target:{closest:()=>({dataset:{p43:'report'}})}},s,{exportCsv:(name,rows)=>{exported={name,rows};}});
    assert(exported.rows.length>2);
  } finally {global.FormData=Original;}
});
console.log(count+' practical regression checks passed.');
