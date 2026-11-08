/* v4.2 guided order lifecycle. Training scenario is an isolated clone of the existing E engine. */
(function (root, factory) {
  const api = factory(root.PC);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.JOURNEY42 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  const ORDER_ID = 'SO-101';
  const NAMES = [
    '確認接單與訂單資料', 'BOM 毛需求計算', '共用物料與可用庫存',
    '確認產線與代工條件', '排程與交期風險判斷', '跨部門任務交接',
    '第一批良品進度回報', '剩餘良品完工回報', '品保放行條件',
    '模擬出貨與數量核對', '交貨結案與追蹤'
  ];
  const HINTS = [
    ['先找「SO-101」這張訂單，核對產品、箱數、交期與核准狀態。','SO-101 是已核准的 360 箱芒果飲品，其他訂單不能拿來代替。'],
    ['毛需求＝尚待投入箱數 × BOM 每箱耗用量。','SO-101：360 箱 × 1.4 kg／箱＝504 kg。'],
    ['先看品保已放行且扣預留的可用量，再計算其他共用訂單的需求。','目前芒果可用 1,100 kg；SO-101 與 R-900 合計需要 (360＋280)×1.4＝896 kg；餘 204 kg。'],
    ['工廠有產能不代表可承接，還要看產品相容與檔期確認。','F-A 能做 P-M，檔期已確認；F-B 檔期尚未確認，F-C 製程不相容。'],
    ['試排日期只是模型預估，還不等於對客戶承諾的交貨日期。','應選「可以作內部試排，但需進一步核對品保、物流和正式承諾」。'],
    ['你需要分工，不是生管一個人批准品質或替業務承諾。','採購查料、工廠回報、品保核准，生管整合與追蹤；不要勾選生管自行放行。'],
    ['先回報 180 箱；欄位填的是「累計良品」，不是本次新增量。','360 箱的一半是 180 箱。系統會依差額扣耗料，不會多扣一輪。'],
    ['上一輪已回報 180 箱，這次要回報「累計」完成數。','累計完成量應填 360 箱，不是再填 180。'],
    ['完成 360 箱不等於允許出貨。','必須由品保依授權流程模擬放行，生管不能自行略過品質狀態。'],
    ['目前已完成 360 箱且完成模擬放行，請核對尚未出貨數量。','本次練習要模擬出貨 360 箱；多填、負數或超過可出貨量都應被阻擋。'],
    ['「系統已記錄出貨」不等於「客戶已簽收」。','結案前還要查物流簽收、數量差異、回單與異常紀錄，未取得證據要列待追蹤。']
  ];
  const e = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=n=>Number(n||0).toLocaleString('zh-TW',{maximumFractionDigits:2});
  const button=(label,action,cls='')=>`<button type="button" class="btn ${cls}" data-j42="${action}">${label}</button>`;
  const current=j=>j.sim.orders.find(o=>o.id===ORDER_ID);
  const openStage=j=>Math.min(j.stage,NAMES.length-1);
  const ready=j=>E.plan(j.sim,'user').byOrder[ORDER_ID];
  function start(today){return {schema:1,stage:0,passed:false,hint:0,feedback:null,sim:E.initial('rush',today),history:[]};}
  function feedback(j,good,reason,guide){j.feedback={good,reason,guide:guide||''};j.passed=good; if(good)j.history.push({step:j.stage,when:j.sim.date,result:'PASS'});return j;}
  function check(j,form){
    const step=j.stage, o=current(j), val=String(form.get('answer')||''), many=form.getAll('check');
    if(j.passed)return feedback(j,true,'這一步已完成，請按「下一步」。');
    switch(step){
      case 0:
        return feedback(j,val===ORDER_ID,val===ORDER_ID?'正確：SO-101 是已核准的芒果飲品 360 箱，接單先核對單號、規格與交期。':'訂單選錯了。請先看資料卡的產品名稱、數量、交期及核准狀態，選擇 SO-101。','請按「SO-101｜芒果飲 360 箱」這個選項。');
      case 1: {
        const x=Number(val), expected=360*E.product('P-M').bom['M-MANGO'];
        if(!val || !Number.isFinite(x) || x<0)return feedback(j,false,'請輸入非負的公斤數。只需輸入數字，不要輸入 kg。','點選「芒果果泥毛需求（kg）」欄位。');
        if(Math.abs(x-expected)>.001)return feedback(j,false,x===360?'你輸入的是箱數，不是原料重量。要用「剩餘箱數 × 每箱 BOM 用量」。':`你填入 ${num(x)} kg，但和 BOM 毛需求不符。請核對 360 箱與每箱 1.4 kg。`,'請重新計算 BOM 毛需求。');
        return feedback(j,true,'正確：360 箱 × 1.4 kg／箱＝504 kg。這是毛需求，不代表要採購 504 kg。');
      }
      case 2: {
        const x=Number(val), available=E.usable(j.sim,'M-MANGO',j.sim.date), same=j.sim.orders.filter(a=>a.productId==='P-M').reduce((n,a)=>n+E.orderRemaining(a),0), expected=E.round(available-same*1.4);
        if(!val || !Number.isFinite(x))return feedback(j,false,'請輸入計算後的剩餘公斤數。','先確認已放行可用量，以及兩張芒果訂單的合計需求。');
        if(Math.abs(x-expected)>.001)return feedback(j,false,Math.abs(x-(available-504))<.001?'你只扣了 SO-101，忘了 R-900 也共用芒果果泥。':'計算結果不一致。應由真正可用量扣除「所有共用這個原料的未投入需求」，隔離與在途不可當成今日可用。','請回到庫存表，核對 1,100 kg、360 箱與 280 箱。');
        return feedback(j,true,`正確：${num(available)} − (${num(same)} × 1.4)＝${num(expected)} kg。這是指定兩張單的簡化合計，並非已發出正式領料單。`);
      }
      case 3: {
        const f=j.sim.factories.find(x=>x.id===val);
        if(val!=='F-A')return feedback(j,false,!f?'請先選一座工廠。':val==='F-B'?'F-B 雖可做這項產品，但示範檔期尚未確認，不能視為已可承接。':'F-C 不在芒果飲品相容清單，不能因為有空就直接轉廠。','請選擇製程相容且檔期已確認的 F-A。');
        return feedback(j,true,'正確：F-A 產品相容、檔期已確認。仍需看其他訂單負荷與換線時間，不能只憑「每天 300 箱」保證交貨。');
      }
      case 4: {
        const p=ready(j);
        if(!p||!['READY','RISK'].includes(p.status))return feedback(j,false,'排程引擎目前無法確認這張訂單可試排，必須先解除資料或品質限制。','檢查排程的「不可開工／條件式」訊息。');
        return feedback(j,val==='trial',val==='trial'?`正確：模型預估完工 ${p.finish||'UNKNOWN'}、交貨 ${p.delivery||'UNKNOWN'}；仍須核對品保、物流、正式交期承諾。`:'「模型可排」不等於「可以立即對客戶承諾」。必須核對完整交貨條件及核准權限。','請選「先作內部試排並確認條件」。');
      }
      case 5: {
        const must=['purchase','factory','qa'];
        if(!must.every(x=>many.includes(x))||many.includes('selfqa'))return feedback(j,false,'請把採購追料、工廠回報、品保檢驗分工；生管不能自行進行品質放行。','勾選三個必要角色，不要勾選「生管自行放行」。');
        return feedback(j,true,'正確：生管整合訂單與進度，採購查料，工廠回報生產，品保確認放行；各角色可同步工作。');
      }
      case 6: case 7:{
        const expected=step===6?180:360, x=Number(val);
        if(!val||!Number.isInteger(x)||x<0)return feedback(j,false,'請輸入非負整數的「累計完成良品箱數」。','請確認欄位不是「本次新增箱數」。');
        if(x!==expected)return feedback(j,false,step===7&&x===180?'這次還填 180，代表累計量沒有增加；第二次應填整張訂單累計良品。':`目前要練習回報累計 ${expected} 箱，不是 ${num(x)} 箱。`,'請修改累計良品箱數後重新驗證。');
        try {j.sim=E.reportGood(j.sim,ORDER_ID,x);}catch(err){return feedback(j,false,'引擎阻擋回報：'+err.message,'請核對原料可用量、品質狀態與已完成數量。');}
        return feedback(j,true,`已透過原有引擎回報累計良品 ${expected} 箱。注意是差額耗料，不會重複扣料；後續仍須品保放行。`);
      }
      case 8:
        if(val!=='qa')return feedback(j,false,'生管不能把「生產完成」當成「品保已放行」。','請選「由品保依核准流程放行」。');
        try{j.sim=E.qaRelease(j.sim,ORDER_ID);}catch(err){return feedback(j,false,'引擎阻擋：'+err.message,'請核對良品完成量和未結案的品質事件。');}
        return feedback(j,true,'已在教學副本中模擬品保放行。這不是正式簽核；真實工作必須由授權角色及品質證據決定。');
      case 9: {
        const x=Number(val), max=o.good-o.shipped;
        if(!val||!Number.isInteger(x)||x<=0)return feedback(j,false,'出貨箱數必須是大於零的整數。','請查看尚未出貨的已放行良品數。');
        if(x!==360)return feedback(j,false,x>max?'出貨量超過可出貨的已放行良品，系統必須阻擋。':`本次練習要求出貨 360 箱，你填入 ${num(x)} 箱。請核對剩餘出貨量，不能把「已出貨」當「已簽收」。`,'請按「模擬出貨箱數」重新輸入 360。');
        try{j.sim=E.ship(j.sim,ORDER_ID,x);}catch(err){return feedback(j,false,'引擎阻擋出貨：'+err.message,'請先檢查品保放行狀態與出貨箱數。');}
        return feedback(j,true,'已記錄模擬出貨 360 箱。此時沒有實際物流回單，仍不能稱「客戶已簽收結案」。');
      }
      case 10:
        return feedback(j,val==='track',val==='track'?'正確：已出貨不等於已交貨。生管應追查物流簽收、數量差異、缺件與客訴，再依公司制度結案。':'不能只因系統顯示出貨 360 箱就宣稱整張訂單已完全結案；需要交貨簽收與相關紀錄。','請選擇「簽收待確認，建立追蹤事項」。');
    }
    return feedback(j,false,'步驟不存在，請重啟練習。');
  }
  function stageBody(j){
    const st=j.stage,o=current(j),p=ready(j),f=j.sim.factories.find(x=>x.id===o.factoryId);
    switch(st){
      case 0:return `<div class="j42-card"><h3>訂單收到後，不是先按排程</h3><p>先確認單號、產品規格、箱數、交期以及是否有正式接單依據。</p><div class="j42-table"><div>SO-101｜芒果飲品｜360 箱｜交期 ${e(o.due)}｜已核准</div><div>SO-102｜柳橙飲品｜220 箱｜交期 ${e(j.sim.orders.find(x=>x.id==='SO-102').due)}</div><div>R-900｜芒果急單｜280 箱｜需一起考慮共用料</div></div></div>${select('請選擇這次要核對的正式訂單',[['','先選一張訂單'],['SO-101','SO-101｜芒果飲 360 箱'],['SO-102','SO-102｜柳橙飲 220 箱'],['R-900','R-900｜急單 280 箱']])}`;
      case 1:return `<div class="j42-card"><h3>看懂 BOM，不能拿訂單箱數當原料公斤</h3><p>產品：芒果飲品；剩餘待投入 360 箱；每箱需要芒果果泥 1.4 公斤。</p><p>公式：剩餘待投入箱數 × BOM 每箱用量＝原料毛需求。</p></div>${numeric('芒果果泥毛需求（kg）','例如：504')}`;
      case 2:{const available=E.usable(j.sim,'M-MANGO',j.sim.date);return `<div class="j42-card"><h3>同一種料可能有不只一張訂單要用</h3><p>芒果果泥已放行可用量：<b>${num(available)} kg</b>。SO-101 要 360 箱、R-900 要 280 箱，兩者每箱各用 1.4 kg。</p><p>兩張單合計的剩餘需求，不能只算你手上的 SO-101。</p><div class="j42-mini">隔離原料與尚未驗收的在途原料，不算今日可用。此題僅核算兩張芒果訂單的合計缺口，不代表正式配料預留。</div></div>${numeric('扣除這兩張訂單需求後，還剩多少 kg？','請填剩餘公斤數')}`;}
      case 3:return `<div class="j42-card"><h3>有產能 ≠ 有資格、已確認可承接</h3>${j.sim.factories.map(x=>`<div class="j42-factory"><b>${e(x.id)}｜${e(x.name)}</b><span>每日示範產能 ${x.capacity} 箱；芒果相容：${x.compatible.includes('P-M')?'是':'否'}；檔期：${x.confirmed?'已確認':'待確認'}</span></div>`).join('')}</div>${select('哪一座適合本次已確認的生產排程？',[['','請選擇工廠'],['F-C','F-C：代工廠 C'],['F-B','F-B：代工廠 B'],['F-A','F-A：自有灌裝線 A']])}`;
      case 4:return `<div class="j42-card"><h3>排出日期，不代表可以直接向客戶承諾</h3><p>依現有引擎與原順序試算 SO-101：<b>${p?.status||'UNKNOWN'}</b>；預計完工 ${e(p?.finish||'UNKNOWN')}；預計交貨 ${e(p?.delivery||'UNKNOWN')}；交期 ${e(o.due)}。</p><p>還須核對品檢、物流、客戶收貨時間與授權承諾。</p></div>${select('主管問：這個日期可以直接答應客戶嗎？',[['','請選擇你的判斷'],['promise','可以，系統排得出來就保證準時'],['trial','不能直接承諾，先作內部試排並確認品檢、物流與核准']])}`;
      case 5:return `<div class="j42-card"><h3>不要把全部事情攬在自己身上</h3><p>已確認可試排，接下來要同步交接、回報、追蹤。請勾選必要的權責，**可複選**。</p></div>${checks([['purchase','採購：確認原料與到貨'],['factory','產線／代工廠：回報實際生產進度'],['qa','品保：依規定確認品質及放行'],['selfqa','生管：不用品保就自行核准放行']])}`;
      case 6:return `<div class="j42-card"><h3>第一次生產進度回報</h3><p>訂單總量 ${o.qty} 箱；模擬產線回報：今天累計已完成一半良品。</p><p>注意欄位是<strong>「累計完成良品」</strong>，不只是這次增加多少。</p></div>${numeric('請輸入累計完成良品（箱）','例如：180')}`;
      case 7:return `<div class="j42-card"><h3>第二次回報：做完剩下的良品</h3><p>前次已完成 <b>${o.good} 箱</b>。代工廠通知這張單全部已生產完成。</p><p>回報累計時，應填整張單的累計數；引擎只扣差額，不會重複扣料。</p></div>${numeric('這次累計完成良品（箱）','請填全單累計數量')}`;
      case 8:return `<div class="j42-card"><h3>「已完工」不是「已允許出貨」</h3><p>目前累計良品 ${o.good}／${o.qty} 箱，品質狀態 ${e(o.qa)}。未完成品保放行前，不能出貨。</p></div>${select('下一步最合理的作法？',[['','請選擇'],['self','生管直接改為已放行，快點出貨'],['qa','由品保依品質判定與授權程序核准，才可放行']])}`;
      case 9:return `<div class="j42-card"><h3>確認可出貨量，不要出超過良品的數字</h3><p>SO-101 良品 ${o.good} 箱、已出貨 ${o.shipped} 箱、品保狀態 ${e(o.qa)}。</p><p>此步驟是教學模擬出貨，並非真實物流出貨單。</p></div>${numeric('要記錄的模擬出貨箱數','請輸入箱數')}`;
      case 10:return `<div class="j42-card"><h3>最後一道常被忽略的關卡</h3><p>目前引擎紀錄已出貨 ${o.shipped}／${o.qty} 箱，但尚未提供物流簽收回單。</p><p>可以直接把這張訂單標示「客戶已收貨且全部結案」嗎？</p></div>${select('你會怎麼處理？',[['','請選擇'],['close','可以，系統已經記錄出貨'],['track','不行；先追簽收回單、交貨差異及未結事項，再依制度結案']])}`;
    }
    return '';
  }
  function select(title,items){return `<label class="fieldlabel j42-target" id="j42-task">${e(title)}<select class="select j42-input" name="answer" required>${items.map(([v,t])=>`<option value="${e(v)}">${e(t)}</option>`).join('')}</select></label>`;}
  function numeric(title,placeholder){return `<label class="fieldlabel j42-target" id="j42-task">${e(title)}<input class="field j42-input" type="number" min="0" step="any" inputmode="decimal" name="answer" placeholder="${e(placeholder)}" required></label>`;}
  function checks(items){return `<fieldset class="j42-target j42-checks" id="j42-task"><legend>應由哪些單位負責？</legend>${items.map(([v,t])=>`<label><input type="checkbox" name="check" value="${e(v)}">${e(t)}</label>`).join('')}</fieldset>`;}
  function render(s){const j=s.journey42;
    if(!j||j.schema!==1)return `<div class="panel j42-intro"><div class="j42-label">NEW · V4.2 引導式跟班實作</div><h2>從接單到交貨｜跟著主管完成一張訂單</h2><p>你不需要先懂 ERP。這個單元會用同一張 SO-101 訂單，帶你從核對資料、算 BOM、查原料、確認產能，到生產進度、品質放行、出貨與交貨追蹤。每一步都有「為什麼」、「下一步按哪裡」和「我看不懂」。</p><p class="j42-mini">本單元使用原有排程引擎的獨立教學副本，不會偷偷修改其他九種突發情境或十門課的資料。全部為虛構資料。</p>${button('開始：從接單核對學起','start','primary')}<div class="j42-kinds"><div><b>原料供應</b><small>常重視庫存、批次、效期與規格</small></div><div><b>OEM 代工</b><small>常重視規格、物料、產能與委外</small></div><div><b>ODM 開發</b><small>另需關注試產、包裝版次與量產導入</small></div></div></div>`;
    if(j.stage>=NAMES.length){const o=current(j);return `<section class="panel j42-finish"><div class="j42-label">全部步驟完成</div><h2>你已完成 SO-101 的跟班流程</h2><p>模擬完成良品 <b>${o.good} 箱</b>、模擬已出貨 <b>${o.shipped} 箱</b>。但客戶簽收仍為 UNKNOWN，不應虛構真正完成交貨。</p><div class="j42-mini">真正的生管還要檢查簽收回單、異常結案及 ERP 單據一致性。此單元的「完成」代表完成學習，不代表具備實際企業獨立排程資格。</div><div class="j42-result">${NAMES.map((x,i)=>`<div>✓ ${String(i+1).padStart(2,'0')}｜${e(x)}</div>`).join('')}</div><div class="line topspace">${button('重新練習完整訂單','reset')}${button('回專業課程','academy','primary')}</div></section>`;}
    const n=openStage(j),hint=HINTS[n],pct=Math.round((n/NAMES.length)*100);
    return `<section class="panel j42-shell"><div class="line"><div><span class="j42-label">實務跟班 · 第 ${n+1}／${NAMES.length} 步</span><h2>${e(NAMES[n])}</h2></div>${button('重新開始這張訂單','reset')}</div><div class="j42-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><div class="j42-guide"><strong>現在應該做什麼？</strong><p>${e(['先確認正式訂單資訊，再決定接下來查什麼。','用剩餘箱數與 BOM 用量計算毛需求。','別只看一張訂單，先確認共用原料及真正可用量。','查核產品相容性、已確認檔期與產能。','先判斷排程可行性，再檢查是否能對客戶承諾。','分工追蹤：採購、產線、品保各有不同責任。','練習第一筆累計良品回報，觀察數量與耗料連動。','練習最終累計完工，不重複扣料。','確認誰有權核准品保放行。','在符合品質條件後模擬出貨。','核對交貨證據，知道出貨與簽收的差別。'][n])}</p><p><b>下一步按哪裡：</b>先閱讀下方資料，填寫「${e(n===5?'應由哪些單位負責？':n===2?'扣除這兩張訂單需求後的剩餘公斤數':'本步驟題目')}」，再按「檢查我的判斷」。</p><div class="line">${button('我看不懂','hint')}${button('帶我去操作','focus')}</div></div><div class="j42-lesson"><form id="journey42Form" novalidate>${stageBody(j)}${j.passed?'':`<div class="line topspace"><button type="submit" class="btn primary">檢查我的判斷</button>${button('我需要提示','hint')}</div>`}</form></div>${j.hint?`<div class="j42-hint"><b>老師提示 ${Math.min(j.hint,2)}／2</b><p>${e(hint[Math.min(j.hint-1,1)])}</p>${j.hint===1?button('我還是不會，顯示完整步驟','hint'):''}</div>`:''}${j.feedback?`<div class="j42-feedback ${j.feedback.good?'good':'bad'}" role="status"><strong>${j.feedback.good?'✓ 這步判斷通過':'請修正這一步'}</strong><p>${e(j.feedback.reason)}</p>${j.feedback.guide?`<p><b>要按哪裡：</b>${e(j.feedback.guide)}</p>`:''}<div class="line">${j.feedback.good?button('下一步：'+e(NAMES[n+1]||'看總結'),'next','primary'):button('帶我回題目修正','focus')}</div></div>`:''}<div class="j42-mini">此單元只使用虛構資料，生產進度與出貨由既有模型即時計算；實際工作須遵守公司授權、品保與現場紀錄。</div></section>`;
  }
  function click(ev,s,ctx){const b=ev.target.closest('[data-j42]');if(!b)return false;
    const act=b.dataset.j42;
    if(act==='academy'){ctx.navigate('academy');return true;}
    if(act==='focus'){
      const target=document.getElementById('j42-task');target?.scrollIntoView({behavior:'smooth',block:'center'});target?.querySelector('input,select')?.focus();return true;
    }
    const next=E.clone(s);let j=next.journey42;
    if(act==='start'){next.journey42=start(s.date);ctx.setState(next);return true;}
    if(act==='reset'){
      if(!rootConfirm('要重啟此張模擬訂單嗎？只會清除此單元的跟班進度，不會刪除其他課程或工作台資料。'))return true;
      next.journey42=start(s.date);ctx.setState(next);return true;
    }
    if(!j)return false;
    if(act==='hint'){j.hint=Math.min(2,(j.hint||0)+1);ctx.setState(next);return true;}
    if(act==='next'){if(!j.passed){j.feedback={good:false,reason:'本步尚未驗證通過。請先完成題目。',guide:'請按「檢查我的判斷」。'};}else{j.stage+=1;j.passed=false;j.hint=0;j.feedback=null;}ctx.setState(next);return true;}
    return false;
  }
  function rootConfirm(t){return typeof confirm==='function'?confirm(t):true;}
  function submit(ev,s,ctx){if(ev.target.id!=='journey42Form')return false;
    ev.preventDefault();const next=E.clone(s),j=next.journey42;if(!j){return true;}
    try{check(j,new FormData(ev.target));}catch(err){j.passed=false;j.feedback={good:false,reason:'無法完成這一步：'+err.message,guide:'請重新檢查對應數字與前置限制。'};}
    ctx.setState(next);return true;
  }
  return {start,check,render,click,submit,NAMES};
});
