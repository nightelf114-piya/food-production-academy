/* Generic fictional food OEM/ODM production learning engine; no third party dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.PC=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const date=(s,delta=0)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)};
const daydiff=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
const workday=s=>![0,6].includes(new Date(s+'T12:00:00Z').getUTCDay());
const nextWork=s=>{let d=s;while(!workday(d))d=date(d,1);return d};
const plusWork=(s,n)=>{let d=s;for(let i=0;i<n;i++){do{d=date(d,1)}while(!workday(d));}return d};
const round=n=>Math.round((n+Number.EPSILON)*1000)/1000;
const PRODUCTS=[
 {id:'P-M',name:'芒果飲品（12 瓶／箱）',bom:{'M-MANGO':1.4,'M-SUGAR':.35,'M-BOTTLE':12,'M-CARTON':1,'M-LABEL':12}},
 {id:'P-O',name:'柳橙飲品（12 瓶／箱）',bom:{'M-ORANGE':1.2,'M-SUGAR':.3,'M-BOTTLE':12,'M-CARTON':1,'M-LABEL':12}},
 {id:'P-P',name:'百香果飲品（12 瓶／箱）',bom:{'M-PASSION':1.0,'M-SUGAR':.25,'M-BOTTLE':12,'M-CARTON':1,'M-LABEL':12}}
];
const MATERIALS=[
 {id:'M-MANGO',name:'芒果果泥',unit:'kg'}, {id:'M-ORANGE',name:'柳橙濃縮汁',unit:'kg'},
 {id:'M-PASSION',name:'百香果濃縮汁',unit:'kg'},{id:'M-SUGAR',name:'糖',unit:'kg'},
 {id:'M-BOTTLE',name:'PET 瓶',unit:'支'},{id:'M-CARTON',name:'外箱',unit:'個'},{id:'M-LABEL',name:'標籤',unit:'張'}
];
const product=id=>PRODUCTS.find(x=>x.id===id);
const mat=id=>MATERIALS.find(x=>x.id===id);
const SCENARIOS=[
 {id:'rush',name:'01｜客戶急單插入',tag:'急單',desc:'今日上午客戶要求提前交貨；既有兩張訂單共用一條產線。先查料況與客戶接受條件，再比較是否插單。',goal:'避免未確認就承諾急單，並揭露受影響的原訂單。',facts:[
  {id:'spec',q:'確認規格、數量與最晚出貨日',answer:'新單 R-900：芒果飲 280 箱，原交期＋2 天；規格已確認。',value:'pass'},
  {id:'material',q:'確認急單的原料及包材',answer:'主原料及包材帳上有足夠可用庫存，但尚須扣除其他排程的需求。',value:'pass'},
  {id:'qa',q:'確認品質與配方放行',answer:'既有核可配方；示範資料無品質封鎖。',value:'pass'},
  {id:'line',q:'詢問既有工廠可用時段',answer:'F-A 已確認檔期；需和 SO-102 競爭產能。',value:'pass'},
  {id:'approval',q:'詢問主管與業務是否授權更動原訂單',answer:'本次示範允許「內部試排」，但對客戶承諾仍須主管／業務正式核准。',value:'pass'},
  {id:'alt',q:'確認外部代工廠是否可接',answer:'代工廠 B 可做芒果飲，但可用檔期尚未確認。',value:'unknown'}],
  options:[{id:'keep',name:'A｜維持既有順序，急單排隊',kind:'keep',req:['spec','material','qa','line'],reason:'保護既有承諾，但急單可能無法滿足交期。'},
  {id:'insert',name:'B｜急單改為第一優先試排',kind:'priority',order:['R-900','SO-101','SO-102','SO-103'],req:['spec','material','qa','line','approval'],reason:'提高急單機會，但可能推遲其他訂單。'},
  {id:'transfer',name:'C｜轉由代工廠 B 承接急單',kind:'route',oid:'R-900',fid:'F-B',req:['alt','qa','approval'],reason:'相容但檔期 UNKNOWN，僅能做條件式預案。'}],coach:'急單不是特權。先核對規格、可用物料與放行，再檢查產能；試排後必須把被延後的訂單列出供業務與主管決策。'},
 {id:'delay',name:'02｜主要原料延遲到貨',tag:'缺料',desc:'百香果果泥原訂近期到貨，供應商通知延後；SO-103 的交期受威脅。',goal:'缺料不能偷占其他原料；追料與重排可同步進行。',facts:[
  {id:'eta',q:'向採購確認新到貨與可靠度',answer:'新的到貨日尚未取得供應商書面確認：UNKNOWN。',value:'unknown'},
  {id:'stock',q:'查詢可用庫存、已預留及其他訂單',answer:'百香果原料可用量不足；不能用未放行的原料。',value:'pass'},
  {id:'alternative',q:'確認可用的其他配方或供應商',answer:'目前無核准替代配方，替代物料不可直接使用。',value:'fail'},
  {id:'sales',q:'詢問業務能否協調交期',answer:'客戶回覆時間尚未確定：UNKNOWN。',value:'unknown'}],
  options:[{id:'wait',name:'A｜暫緩缺料單，先做料齊訂單',kind:'keep',req:['stock'],reason:'不讓產線空等，並同步請採購追料。'},
  {id:'early',name:'B｜把缺料單強行排到第一順位',kind:'priority',order:['SO-103','SO-101','SO-102'],req:['stock','eta'],reason:'缺料與到貨未知；不能當可執行排程。'},
  {id:'promise',name:'C｜先承諾客戶改交期',kind:'keep',req:['sales'],reason:'需業務及客戶確認，未確認前不可擅自改承諾。'}],coach:'缺料單是「處理優先」而非「開工優先」。物料不齊時先讓可執行訂單使用產能，採購追料與業務談交期可以同步。'},
 {id:'breakdown',name:'03｜代工廠機台故障',tag:'停機',desc:'F-A 灌裝線故障，今日預估停機 8 小時；一批在製飲品等待灌裝。',goal:'先保護在製品及食安，再確認修復時程和改派可能性。',facts:[
  {id:'wip',q:'先查在製品保存條件',answer:'在製品是否仍符合保存時限由品保判定：目前 UNKNOWN，必須先隔離或採取適當控管。',value:'unknown'},
  {id:'repair',q:'確認設備修復估計',answer:'維修估計當日無法復原，次日是否能恢復仍待確認。',value:'unknown'},
  {id:'slot',q:'確認代工 B 的檔期與相容性',answer:'B 可生產 P-M，但原定本週的可用空檔不足以接收全部數量；是否能加開時段 UNKNOWN。',value:'unknown'},
  {id:'orders',q:'盤點故障會影響哪些訂單',answer:'SO-101、SO-102 在 F-A，須比較可能延誤與可轉移的在製品。',value:'pass'}],
  options:[{id:'replan',name:'A｜保留 F-A，等待修復再重排',kind:'keep',req:['orders'],reason:'不新增轉廠風險，但修復時間須持續追蹤。'},
  {id:'move',name:'B｜嘗試改派 SO-101 至代工 B',kind:'route',oid:'SO-101',fid:'F-B',req:['slot','wip','orders'],reason:'尚須確認檔期、製程接續與品保權責。'}],coach:'設備停機若涉及已調配在製品，先採品質保護措施，再談交期；不要只盯著產能報表。'},
 {id:'quality',name:'04｜原料／產品檢驗異常',tag:'品質',desc:'SO-101 使用的芒果原料其中一批尚未放行，且成品出現待判定的品保事件。',goal:'品質限制應先控制，不能直接排產或出貨。',facts:[
  {id:'batch',q:'確認異常批號及隔離範圍',answer:'批號 L-M-HOLD 目前隔離；不能納入可用量。',value:'pass'},
  {id:'qa',q:'確認品保是否已正式放行',answer:'尚未放行，品保判定結果 UNKNOWN。',value:'unknown'},
  {id:'affected',q:'追查共用批號及受影響訂單',answer:'本示範先鎖定 SO-101；實務還要核對批次追溯記錄。',value:'pass'}],
  options:[{id:'hold',name:'A｜維持隔離，先安排其他可用訂單',kind:'keep',req:['batch','affected'],reason:'停止錯誤開工及出貨，避免擴大影響。'},
  {id:'unhold',name:'B｜直接解除品質限制趕交期',kind:'release',oid:'SO-101',req:['qa'],reason:'未放行不得解除。'}],coach:'P0 事件要先保護食安、停止不合格品流出，釐清批號與影響範圍，品保正式授權後才可重新評估。'},
 {id:'label',name:'05｜標籤與包材錯誤',tag:'包材',desc:'SO-102 的標籤印刷版本不符核可稿，部分包材需隔離重印。',goal:'物料帳面有數量，不等於可用來生產。',facts:[
  {id:'design',q:'比對客戶核准的標籤版次',answer:'本批印刷版次與客戶核准版次不同，不能使用。',value:'fail'},
  {id:'available',q:'確認其餘合格標籤數量',answer:'合格標籤帳面 2,100 張，其中預留 1,000 張；目前可用 1,100 張。SO-102 需要 220×12＝2,640 張，缺口至少 1,540 張（尚未分配給其他訂單）。',value:'pass'},
  {id:'reprint',q:'詢問重印交期',answer:'印刷廠尚未提供可承諾到貨日：UNKNOWN。',value:'unknown'}],
  options:[{id:'hold',name:'A｜先做其他料齊的產品',kind:'keep',req:['available','design'],reason:'錯誤標籤封存，避免錯標產品流入市場。'},
  {id:'reprint',name:'B｜等待重印後補生產',kind:'keep',req:['reprint'],reason:'到貨日未確認，僅能條件式預排。'}],coach:'標籤、規格、版次必須確認一致；不是有 5,000 張帳面數就能全部開工。'},
 {id:'variance',name:'06｜ERP 與實物盤點不符',tag:'帳實差',desc:'系統顯示 PET 瓶 6,000 支，現場實盤僅 3,600 支。未經調查不應擅自直接調整庫存。',goal:'釐清差異、隔離錯誤資料影響與盤點責任。',facts:[
  {id:'count',q:'重新盤點及確認計量單位',answer:'複盤確認可使用 PET 瓶 3,600 支，差額 2,400 支。',value:'pass'},
  {id:'records',q:'查近期領料、退料與入庫單',answer:'目前仍需庫管查核，帳差原因 UNKNOWN。',value:'unknown'},
  {id:'orders',q:'盤點哪些訂單會受影響',answer:'芒果、柳橙與百香果產品都使用 PET 瓶，共用物料受到影響。',value:'pass'}],
  options:[{id:'conservative',name:'A｜以現場確認量作保守試算',kind:'adjustStock',mid:'M-BOTTLE',qty:3600,req:['count','orders'],reason:'先做風險試算；不代表已正式修改 ERP 帳。'},
  {id:'blind',name:'B｜直接以 ERP 帳面數承諾交期',kind:'keep',req:['records'],reason:'帳實差未解，直接承諾有超賣及停線風險。'}],coach:'帳實差要複盤、追單據、核對批號與庫存狀態。盤點結果可用於保守試算，但正式調帳須依授權流程。'},
 {id:'change',name:'07｜客戶修改數量與交期',tag:'變更',desc:'SO-102 客戶希望數量從 220 箱增至 330 箱並提前一天，需先查是否已正式變更。',goal:'先管理訂單版本，再試算改單的交期和物料影響。',facts:[
  {id:'confirm',q:'確認客戶正式改單文件',answer:'業務已收到書面變更需求；是否接受尚須內部評估。',value:'pass'},
  {id:'materials',q:'確認新增 110 箱的 BOM 用料',answer:'增量用料需要重新核對目前可用庫存及預留。',value:'pass'},
  {id:'approve',q:'確認主管與業務是否同意承諾',answer:'目前尚未核准新交期，正式承諾 UNKNOWN。',value:'unknown'}],
  options:[{id:'old',name:'A｜維持舊版訂單，先評估影響',kind:'keep',req:['confirm'],reason:'避免尚未核准就直接覆蓋既有承諾。'},
  {id:'new',name:'B｜試算客戶要求的新數量與交期',kind:'orderChange',oid:'SO-102',newQty:330,dueOffset:2,req:['confirm','materials'],reason:'只做可行性試算，不能視為新交期已獲核准。'}],coach:'需求變更必須區分「收到要求、確認可行、正式接受」三個狀態，否則 ERP 訂單版本容易混亂。'},
 {id:'conflict',name:'08｜兩張重要訂單爭用產線',tag:'產能衝突',desc:'SO-101 與 SO-102 共用 F-A，兩張都是已確認訂單；測試兩種合理的優先順序，對照交期與換線負荷。',goal:'同一條線的產能不能重複賣給兩張訂單。',facts:[
  {id:'capacity',q:'確認 F-A 工作日、已占產能及清洗時間',answer:'每天 8 小時，單日基準 300 箱；改變產品需清洗換線約 1 小時。',value:'pass'},
  {id:'duedate',q:'確認兩張訂單交期與出貨前置',answer:'SO-101 交期＋2 天；SO-102 交期＋2 天；兩者都有品檢與物流前置時間。',value:'pass'},
  {id:'material',q:'確認兩張是否可完整備料',answer:'示範庫存足以支應 SO-101、SO-102 的剩餘需求。',value:'pass'},
  {id:'client',q:'確認延遲風險與客戶溝通權責',answer:'此情境未提供違約罰款；成本 UNKNOWN，交期協調由業務負責。',value:'pass'}],
  options:[{id:'aFirst',name:'A｜SO-101 優先，再排 SO-102',kind:'priority',order:['SO-101','SO-102','SO-103'],req:['capacity','duedate','material'],reason:'先保護 SO-101，觀察 SO-102 是否落後。'},
  {id:'bFirst',name:'B｜SO-102 優先，再排 SO-101',kind:'priority',order:['SO-102','SO-101','SO-103'],req:['capacity','duedate','material'],reason:'先保護 SO-102，觀察 SO-101 是否落後。'}],coach:'兩張都可開工時，可以比較交期、必要工時、換線及各自的客戶承諾；不能宣稱有永遠正確的固定順序。'},
 {id:'multi',name:'09｜上午四件事件同時發生',tag:'多重事件',desc:'09:00 品質批號疑慮；09:03 F-A 故障；09:05 客戶急單；09:08 下週盤點報表待更新。請分級、指定權責並同步追蹤。',goal:'P0 先止損，多部門工作可並行，不必將所有事情機械式串行。',facts:[
  {id:'qstatus',q:'確認疑似異常批號是否涉及已出貨品',answer:'批號範圍與是否涉及出貨尚在查核，需立即依品質流程管控。',value:'unknown'},
  {id:'machine',q:'確認停機對在製品的影響',answer:'F-A 今日停機 8 小時，SO-101 在製量 40 箱須請品保確認保存條件。',value:'pass'},
  {id:'rush',q:'查客戶急單是否具備接單條件',answer:'數量、規格、核可與交期尚未全數確認，不能先承諾。',value:'unknown'},
  {id:'report',q:'確認報表的期限與責任',answer:'盤點週報下週一才需要，本日可排低優先。',value:'pass'}],
  options:[{id:'safe',name:'A｜品質先控制，維修與業務同步分工',kind:'keep',req:['machine'],reason:'先執行風險控制，再由不同單位各自確認。'},
  {id:'rush',name:'B｜先處理大客戶急單再處理品質',kind:'priority',order:['R-900','SO-101'],req:['rush','qstatus'],reason:'忽略 P0 風險，不應執行。'}],coach:'P0 品保先隔離／暫停有風險的流向；設備部門同步修復、採購查料、業務核對急單；生管整合影響並追蹤。'}
];
const MULTI_EVENTS=[
 {id:'E-Q',time:'09:00',name:'批號疑慮，可能涉及已出貨批次',expected:'P0',owner:'品保',stop:true},
 {id:'E-M',time:'09:03',name:'F-A 灌裝線故障，在製品待確認',expected:'P1',owner:'設備',stop:false},
 {id:'E-R',time:'09:05',name:'客戶追加急單但規格未確認',expected:'P2',owner:'業務',stop:false},
 {id:'E-D',time:'09:08',name:'下週盤點週報尚未更新',expected:'P3',owner:'資材',stop:false}
];
function initial(id='rush',today=null){
 if(!SCENARIOS.some(s=>s.id===id))throw Error('未知情境');
 if(!today){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));today=`${parts.year}-${parts.month}-${parts.day}`;}
 const start=nextWork(today);
 const d=n=>date(start,n);
 const s={version:3,scenarioId:id,date:start,products:PRODUCTS,materials:MATERIALS,
  orders:[
   {id:'SO-101',productId:'P-M',qty:360,good:0,wip:0,consumed:{},shipped:0,due:d(3),factoryId:'F-A',rush:false,qa:'pending',approval:true},
   {id:'SO-102',productId:'P-O',qty:220,good:0,wip:0,consumed:{},shipped:0,due:d(3),factoryId:'F-A',rush:false,qa:'pending',approval:true},
   {id:'SO-103',productId:'P-P',qty:180,good:0,wip:0,consumed:{},shipped:0,due:d(6),factoryId:'F-C',rush:false,qa:'pending',approval:true}
  ],
  factories:[
   {id:'F-A',name:'示範自有灌裝線 A',capacity:300,compatible:['P-M','P-O'],confirmed:true,setupHours:1,qcDays:1,shipDays:0,reserved:{},downtime:{}},
   {id:'F-B',name:'示範代工廠 B',capacity:250,compatible:['P-M','P-O'],confirmed:false,setupHours:1.25,qcDays:1,shipDays:1,reserved:{},downtime:{}},
   {id:'F-C',name:'示範代工廠 C',capacity:220,compatible:['P-P'],confirmed:true,setupHours:.75,qcDays:1,shipDays:1,reserved:{},downtime:{}}
  ],
  lots:[
   {id:'L-M-1',mid:'M-MANGO',qty:850,reserved:0,status:'released'},
   {id:'L-M-HOLD',mid:'M-MANGO',qty:120,reserved:0,status:'hold'},
   {id:'L-O-1',mid:'M-ORANGE',qty:700,reserved:0,status:'released'},
   {id:'L-P-1',mid:'M-PASSION',qty:150,reserved:0,status:'released'},
   {id:'L-S-1',mid:'M-SUGAR',qty:350,reserved:35,status:'released'},
   {id:'L-B-1',mid:'M-BOTTLE',qty:15000,reserved:1200,status:'released'},
   {id:'L-C-1',mid:'M-CARTON',qty:1200,reserved:50,status:'released'},
   {id:'L-L-1',mid:'M-LABEL',qty:14500,reserved:1000,status:'released'}
  ],
  arrivals:[{id:'PO-P-01',mid:'M-PASSION',qty:300,date:d(2),confirmed:false,qaReleased:false}],
  issues:[],checkedFacts:[],triage:{},learning:{reason:'',protect:'',tradeoff:'',contact:'',follow:''},draft:null,logs:[],userPriority:[]};
 if(['rush','multi'].includes(id))s.orders.push({id:'R-900',productId:'P-M',qty:160,good:0,wip:0,consumed:{},shipped:0,due:d(2),factoryId:'F-A',rush:true,qa:'pending',approval:false});
 if(id==='rush'){s.orders.find(o=>o.id==='R-900').approval=true;s.orders.find(o=>o.id==='R-900').qty=280;s.lots.find(x=>x.id==='L-M-1').qty=1100;s.lots.find(x=>x.id==='L-S-1').qty=450;s.userPriority=['SO-101','SO-102','R-900','SO-103'];} // feasibility checked by user's verified facts
 if(id==='delay'){s.arrivals[0]={id:'PO-P-01',mid:'M-PASSION',qty:300,date:d(6),confirmed:false,qaReleased:false};}
 if(id==='breakdown'){s.factories.find(f=>f.id==='F-A').downtime[d(0)]=480;s.orders.find(o=>o.id==='SO-101').wip=40;}
 if(id==='quality'){
  s.issues.push({id:'EX-Q',name:'SO-101 成品檢驗待判定',orderIds:['SO-101'],type:'品質',severity:'P0',owner:'品保',status:'open',hardBlock:true,next:d(0),resolution:'取得品保正式放行並核對批次',note:'疑似批號異常；暫停相關品項出貨'});
  s.lots.find(x=>x.id==='L-M-1').status='hold';
 }
 if(id==='label'){
  s.lots.find(x=>x.id==='L-L-1').qty=2100;
  s.lots.push({id:'L-L-WRONG',mid:'M-LABEL',qty:5000,reserved:0,status:'hold'});
  s.issues.push({id:'EX-L',name:'標籤印刷版本錯誤',orderIds:['SO-102'],type:'品質',severity:'P0',owner:'品保',status:'open',hardBlock:true,next:d(0),resolution:'確認正確版次的標籤並由品保授權',note:'錯誤版本不得使用'});
 }
 if(id==='variance'){s.lots.find(x=>x.id==='L-B-1').qty=6000;}
 if(id==='conflict'){s.userPriority=['SO-101','SO-102','SO-103'];s.lots.find(x=>x.id==='L-P-1').qty=340;s.orders.find(x=>x.id==='SO-101').due=d(2);s.orders.find(x=>x.id==='SO-102').due=d(2);}
 if(id==='multi'){
  s.factories.find(f=>f.id==='F-A').downtime[d(0)]=480;
  s.orders.find(o=>o.id==='SO-101').wip=40;
  s.issues.push({id:'EX-M',name:'疑似批號異常、須立即控制',orderIds:['SO-101'],type:'品質',severity:'P0',owner:'品保',status:'open',hardBlock:true,next:d(0),resolution:'品保核查批號、影響範圍及授權放行',note:'可能涉及已出貨批次'});
 }
 return s;
}
function usable(stock,mid,onDate){const released=stock.lots.filter(x=>x.mid===mid&&x.status==='released').reduce((a,x)=>a+Math.max(0,x.qty-x.reserved),0);
 const incoming=stock.arrivals.filter(x=>x.mid===mid&&x.confirmed&&x.qaReleased&&x.date<=onDate).reduce((a,x)=>a+x.qty,0);
 return round(released+incoming);
}
function orderRemaining(o){return Math.max(0,o.qty-o.good-o.wip)}
function kitNeeds(o){const p=product(o.productId);if(!p)return {};return Object.fromEntries(Object.entries(p.bom).map(([k,v])=>[k,round(v*orderRemaining(o))]));}
function blockingIssues(s,o){return s.issues.filter(i=>i.status!=='closed'&&i.hardBlock&&i.orderIds.includes(o.id));}
function explainMaterials(s,o,onDate,ledger={}){const needs=kitNeeds(o),shortages=[];for(const [mid,need] of Object.entries(needs)){
 const free=Math.max(0,round(usable(s,mid,onDate)-(ledger[mid]||0)));
 if(free+1e-7<need)shortages.push({mid,need,free,short:round(need-free)});
}return {needs,shortages};}
function ordered(s,strategy='slack'){const arr=s.orders.filter(o=>o.good<o.qty||o.wip>0).slice();
 const base={...Object.fromEntries(arr.map(o=>[o.id,0]))};s.userPriority.forEach((id,i)=>{base[id]=1000-i*10});
 return arr.sort((a,b)=>{
  if(strategy==='rush')return Number(b.rush)-Number(a.rush)||a.due.localeCompare(b.due);
  if(strategy==='due')return a.due.localeCompare(b.due);
  if(strategy==='user')return (base[b.id]||0)-(base[a.id]||0)||a.due.localeCompare(b.due);
  const as=daydiff(s.date,a.due)-Math.ceil(orderRemaining(a)/(s.factories.find(f=>f.id===a.factoryId)?.capacity||1));
  const bs=daydiff(s.date,b.due)-Math.ceil(orderRemaining(b)/(s.factories.find(f=>f.id===b.factoryId)?.capacity||1));
  return as-bs||a.due.localeCompare(b.due);
 });}
function plan(s,strategy='slack',horizon=22){const daily={},timeline=[],byOrder={},materialAlloc={},limits={}, reasons=[];
 s.factories.forEach(f=>{limits[f.id]={};for(let i=0;i<horizon;i++){const d=date(s.date,i);if(!workday(d))continue;const downtime=f.downtime[d]||0;const reserved=f.reserved[d]||0;limits[f.id][d]={minutes:Math.max(0,480-downtime-reserved*(480/f.capacity)),reserved,downtime,capacity:f.capacity};}});
 for(const o of ordered(s,strategy)){
  const remaining=orderRemaining(o), f=s.factories.find(x=>x.id===o.factoryId), item={id:o.id,qty:o.qty,good:o.good,wip:o.wip,remaining,first:null,finish:null,delivery:null,slack:null,lateDays:null,status:'READY',blockers:[],materialShort:[],reason:''};
  if(o.good===o.qty){item.status='PRODUCTION_DONE';item.finish=s.date;item.delivery=o.qa==='released'?s.date:null;byOrder[o.id]=item;continue;}
  if(o.wip>0){item.blockers.push(`已有 ${o.wip} 箱在製，完工時間需另外確認`);item.status='CONDITIONAL';}
  if(blockingIssues(s,o).length){item.status='BLOCKED';item.blockers.push('品質事件尚未結案，禁止排產與出貨');}
  if(!f){item.status='BLOCKED';item.blockers.push('未指派工廠');}
  else if(!f.compatible.includes(o.productId)){item.status='BLOCKED';item.blockers.push(`${f.name} 無此品項核可相容資格`)}
  else if(!f.confirmed){item.status='CONDITIONAL';item.blockers.push(`${f.name} 檔期未確認，不可視為已確認可執行`)}
  if(o.approval===false){item.status='CONDITIONAL';item.blockers.push('訂單／產能安排尚待主管／業務核准')}
  if(item.status==='BLOCKED'||item.status==='CONDITIONAL'){const check=explainMaterials(s,o,s.date,materialAlloc);item.materialShort=check.shortages;byOrder[o.id]=item;continue;}
  let start=null,ready=null,notReady=null;
  for(let i=0;i<horizon;i++){const d=date(s.date,i);if(!workday(d))continue;
    const check=explainMaterials(s,o,d,materialAlloc);
    if(!check.shortages.length){start=d;ready=check;break}if(i===0||!notReady)notReady=check.shortages;
  }
  if(!start){item.status='BLOCKED';item.blockers.push('未有可確認的完整備料日（在途未放行／到貨不確定不計入）');item.materialShort=notReady||[];byOrder[o.id]=item;continue;}
  let left=remaining,last=null,first=null;const tentative=[];
  for(let i=0;i<horizon&&left>0;i++){
    const d=date(s.date,i);if(d<start||!workday(d))continue;
    const cap=limits[f.id][d];if(!cap||cap.minutes<=0)continue;
    const key=f.id+'|'+d;
    const used=(daily[key]||[]).reduce((a,x)=>a+x.minutes+x.setupMinutes,0);
    const previous=timeline.filter(x=>x.fid===f.id&&x.day<=d).sort((x,y)=>y.day.localeCompare(x.day)).at(0);
    const pendingPrev=tentative.at(-1);
    const lastProduct=(daily[key]||[]).at(-1)?.productId||pendingPrev?.productId||previous?.productId||null;
    const setup= lastProduct&&lastProduct!==o.productId?f.setupHours*60:0;
    const leftMinutes=Math.max(0,cap.minutes-used-setup);
    const n=Math.min(left,Math.floor((leftMinutes/480)*f.capacity+1e-7));if(n<=0)continue;
    const ev={oid:o.id,fid:f.id,day:d,qty:n,productId:o.productId,minutes:round(n*480/f.capacity),setupMinutes:setup};
    tentative.push(ev);last=d;first=first||d;left-=n;
    // staged items are not visible to other orders until a fully schedulable order is confirmed
    // same-order next-day lookup uses tentative above
  }
  if(left>0){item.status='CONDITIONAL';item.blockers.push(`可用期間產能不足，仍有 ${left} 箱尚未排入；不占用已確認庫存／產能`);item.materialShort=[];byOrder[o.id]=item;continue;}
  for(const [mid,need] of Object.entries(ready.needs))materialAlloc[mid]=round((materialAlloc[mid]||0)+need);
  for(const ev of tentative){const key=ev.fid+'|'+ev.day;(daily[key]??=[]).push(ev);timeline.push(ev)}
  item.first=first;item.finish=last;
  const lead=f.qcDays+f.shipDays;item.delivery=plusWork(last,lead);
  item.slack=daydiff(item.delivery,o.due);item.lateDays=Math.max(0,-item.slack);
  if(item.lateDays>0)item.status='RISK';
  if(o.wip>0){item.status='CONDITIONAL';item.blockers.push('在製品完成日 UNKNOWN，整單完成與交貨日期需重新確認');item.delivery=null;item.slack=null;item.lateDays=null;}
  item.reason= `${f.name}；${first} 起排 ${remaining} 箱；預留品檢／物流 ${lead} 個工作天`;
  byOrder[o.id]=item;
 }
 const byStatus=Object.values(byOrder),late=byStatus.filter(o=>o.lateDays>0);
 return {byOrder,timeline,daily,limits,materialAlloc,summary:{confirmed:byStatus.filter(x=>['READY','RISK'].includes(x.status)).length,blocked:byStatus.filter(x=>x.status==='BLOCKED').length,conditional:byStatus.filter(x=>x.status==='CONDITIONAL').length,late:late.length,lateDays:late.reduce((n,x)=>n+x.lateDays,0),total:byStatus.length},assumptions:['示範工作日為週一至週五，未納入國定假日','每箱工時為日產能線性換算，跨批換線以示範工時估算','在製品仍需品保／製程確認；僅排剩餘待投入量','僅計入已確認且放行的在途物料','非經過驗證的 ERP／APS 正式承諾工具']};
}
function optionStatus(s,option){const scene=SCENARIOS.find(x=>x.id===s.scenarioId);const lacks=[],failed=[],unknown=[];
 for(const id of option.req||[]){const q=scene.facts.find(x=>x.id===id);if(!s.checkedFacts.includes(id))lacks.push(q.q);else if(q.value==='fail')failed.push(q.q);else if(q.value==='unknown')unknown.push(q.q)}
 if(option.kind==='route'){const f=s.factories.find(x=>x.id===option.fid),o=s.orders.find(x=>x.id===option.oid);if(!f?.compatible.includes(o?.productId))failed.push('製程相容性不符');if(!f?.confirmed)unknown.push('代工廠檔期尚未確認')}
 if(option.kind==='release')failed.push('未授權的品質放行禁止執行');
 if(option.kind==='orderChange')unknown.push('客戶改單尚未獲正式核准；僅能試算');
 return {status:failed.length?'BLOCKED':lacks.length||unknown.length?'CONDITIONAL':'FEASIBLE',lacks,failed,unknown};}
function applyOption(base,option){const s=clone(base);s.draft=null;
 if(option.kind==='priority')s.userPriority=option.order.slice();
 if(option.kind==='route'){const o=s.orders.find(x=>x.id===option.oid);if(o&&o.wip===0&&o.good===0)o.factoryId=option.fid;}
 if(option.kind==='adjustStock'){const lots=s.lots.filter(x=>x.mid===option.mid&&x.status==='released');const amount=lots.reduce((a,x)=>a+x.qty,0);let reduce=Math.max(0,amount-option.qty);
  for(const lot of lots.slice().reverse()){const d=Math.min(lot.qty,reduce);lot.qty=round(lot.qty-d);reduce=round(reduce-d);}}
 if(option.kind==='orderChange'){const o=s.orders.find(x=>x.id===option.oid);if(o){o.qty=option.newQty;o.due=date(s.date,option.dueOffset);}}
 return s;}
function compare(s,option,strategy='slack'){const baseline=plan(s,strategy),feasibility=optionStatus(s,option),candidate=applyOption(s,option),alternative=plan(candidate,option.kind==='priority'?'user':strategy);
 const rows=s.orders.map(o=>{const a=baseline.byOrder[o.id],b=alternative.byOrder[o.id];return {id:o.id,oldStatus:a?.status||'UNKNOWN',newStatus:b?.status||'UNKNOWN',oldFinish:a?.finish||null,newFinish:b?.finish||null,oldDelivery:a?.delivery||null,newDelivery:b?.delivery||null,oldLate:a?.lateDays,newLate:b?.lateDays,changed: a?.finish!==b?.finish||a?.delivery!==b?.delivery||a?.status!==b?.status};});
 const loads=f=>f.timeline.reduce((z,x)=>(z[x.fid]=(z[x.fid]||0)+x.minutes+x.setupMinutes,z),{});
 const shortages=p=>{const result={};for(const entry of Object.values(p.byOrder)){for(const x of entry.materialShort||[])result[x.mid]=round((result[x.mid]||0)+x.short)}return result;};
 const setupH=p=>round(p.timeline.reduce((n,x)=>n+x.setupMinutes,0)/60);
 return {feasibility,baseline,alternative,rows,oldLoad:loads(baseline),newLoad:loads(alternative),oldAlloc:baseline.materialAlloc,newAlloc:alternative.materialAlloc,oldMissing:shortages(baseline),newMissing:shortages(alternative),oldSetupHours:setupH(baseline),newSetupHours:setupH(alternative),extraCost:null,tradeoffs:option.reason,assumptions:['額外加班、急運、轉廠費用：UNKNOWN（不可直接換算成本）','變更客戶交期須業務正式確認；試排不是交貨承諾']};}
function commitOption(s,option){const f=optionStatus(s,option);if(f.status!=='FEASIBLE')throw Error('尚有未確認／不允許的前提，禁止正式套用');
 if(option.kind==='release')throw Error('品質放行只能走品保授權流程');
 if(option.kind==='orderChange')throw Error('此案例新交期尚未核准，僅能試算，不得直接覆寫訂單');
 if(option.kind==='route'){
  const o=s.orders.find(x=>x.id===option.oid);if(!o||o.good||o.wip)throw Error('已開工訂單不可直接改派');
 }
 const newS=applyOption(s,option);newS.logs.push({at:s.date,action:'套用示範決策',detail:option.name});return newS;
}
function consume(s,mid,qty){let left=round(qty);const lots=s.lots.filter(x=>x.mid===mid&&x.status==='released').sort((a,b)=>a.id.localeCompare(b.id));
 if(round(lots.reduce((a,x)=>a+Math.max(0,x.qty-x.reserved),0))<left-1e-7)throw Error(`${mat(mid)?.name||mid} 可用量不足`);
 for(const lot of lots){let take=Math.min(left,Math.max(0,lot.qty-lot.reserved));lot.qty=round(lot.qty-take);left=round(left-take);if(left<=1e-7)break;}}
function reportGood(s,oid,target){const n=clone(s),o=n.orders.find(x=>x.id===oid);if(!o)throw Error('訂單不存在');target=Number(target);
 if(!Number.isInteger(target)||target<o.good||target>o.qty)throw Error('良品累計必須介於現值與訂單量之間');
 if(blockingIssues(n,o).length)throw Error('品質封鎖中，禁止新增完工良品');
 const d=target-o.good;const fromWip=Math.min(d,o.wip),needMaterial=d-fromWip;
 if(needMaterial>0){const needed=Object.entries(product(o.productId).bom).map(([mid,r])=>[mid,round(needMaterial*r)]);
  for(const [mid,qty] of needed)if(usable(n,mid,n.date)<qty-1e-7)throw Error(`${mat(mid).name} 可用量不足，無法回報`);
  for(const [mid,qty] of needed){consume(n,mid,qty);o.consumed[mid]=round((o.consumed[mid]||0)+qty);}}
 o.wip-=fromWip;o.good=target;if(d>0)o.qa='pending';n.logs.push({at:n.date,action:'回報累計良品',detail:`${oid} ${target} 箱（增加 ${d} 箱）`});return n;}
function qaRelease(s,oid){const n=clone(s),o=n.orders.find(x=>x.id===oid);if(!o)throw Error('訂單不存在');if(o.good<o.qty)throw Error('良品尚未完成全部訂單量');if(blockingIssues(n,o).length)throw Error('品質事件尚未解除，不能放行');o.qa='released';n.logs.push({at:n.date,action:'模擬品保放行',detail:oid});return n;}
function ship(s,oid,qty){const n=clone(s),o=n.orders.find(x=>x.id===oid);qty=Number(qty);if(!o)throw Error('訂單不存在');
 if(o.qa!=='released'||blockingIssues(n,o).length)throw Error('未完成品保放行，不得出貨');
 if(!Number.isInteger(qty)||qty<=0||qty>o.good-o.shipped)throw Error('出貨量不得超過已放行、尚未出貨的良品');
 o.shipped+=qty;n.logs.push({at:n.date,action:'模擬出貨',detail:`${oid} ${qty} 箱`});return n;}
function closeIssue(s,id,proof){const n=clone(s),i=n.issues.find(x=>x.id===id);if(!i)throw Error('事件不存在');
 if(!proof||proof.trim().length<10)throw Error('請至少說明 10 字的結案證據／核准依據');
 if(i.hardBlock)throw Error('品質／食安限制不可由一般異常結案功能解除；需品保授權程序');
 i.status='closed';i.proof=proof.trim();n.logs.push({at:n.date,action:'結案',detail:id});return n;}
function qaResolve(s,id,proof,checks){const n=clone(s),i=n.issues.find(x=>x.id===id);if(!i||!i.hardBlock)throw Error('沒有可處理的品質封鎖事件');
 if(!checks||!checks.batch||!checks.disposition||!checks.authorized)throw Error('需完成批次追溯、品保處置、模擬品保授權核對');
 if(!proof||proof.trim().length<12)throw Error('請至少提供 12 字的模擬品保放行證據');
 i.status='closed';i.proof=proof.trim();i.qaResolved=true;n.logs.push({at:n.date,action:'模擬品保解除限制',detail:`${id}（非正式品保證明）`});return n;}
function qaReleaseLot(s,lid,proof,checks){const n=clone(s),lot=n.lots.find(x=>x.id===lid);if(!lot)throw Error('批號不存在');
 if(lot.status==='released')throw Error('批號已放行，無須重複處理');
 if(lot.status==='rejected'||lid==='L-L-WRONG')throw Error('已拒收／確認錯版標籤不可透過本功能放行');
 if(!checks?.batch||!checks?.disposition||!checks?.authorized)throw Error('必須核對批號、品質結果與模擬授權');
 if(!proof||proof.trim().length<12)throw Error('請輸入至少12字的品質處置依據');
 if(n.issues.some(i=>i.hardBlock&&i.status!=='closed'&&i.type==='品質'))throw Error('仍有品質事件未解除，不允許先放行相關原料');
 lot.status='released';n.logs.push({at:n.date,action:'模擬原料批次放行',detail:`${lid}｜${proof.trim()}`});return n;}
function grade(s,option,triage){const scene=SCENARIOS.find(x=>x.id===s.scenarioId),feasibility=optionStatus(s,option);const out=[];
 const checks=s.checkedFacts.length;out.push(checks>=2?'已主動查詢至少兩項關鍵資料。':'關鍵資料不足：建議先查物料、品質、產能與客戶條件。');
 if(feasibility.status==='FEASIBLE')out.push('選擇的方案已符合本案例列出的已知前提；仍須區分試排與正式承諾。');
 if(feasibility.status==='CONDITIONAL')out.push('仍有待確認的前提，不應當成可執行方案。');
 if(feasibility.status==='BLOCKED')out.push('方案違反已知限制，應停止並找替代方案。');
 if(s.learning.reason.trim().length>=10&&s.learning.protect.trim()&&s.learning.contact.trim()&&s.learning.follow)out.push('你有寫出判斷理由、保護目標、溝通對象與下次追蹤。');
 else out.push('記得補上「原因、保護目標、聯絡對象、下次追蹤時間」。');
 if(s.scenarioId==='multi'){
  const evaluated=MULTI_EVENTS.map(e=>({id:e.id,right:triage[e.id]?.priority===e.expected,owner:triage[e.id]?.owner===e.owner}));
  const safe=triage['E-Q']?.priority==='P0'&&triage['E-Q']?.owner==='品保';
  out.push(safe?'品質事件已先列為 P0 並分派品保；其餘單位可同步行動。':'品質疑慮應先列 P0 並由品保啟動管控，其他事件可以同步委辦。');
  out.push(`事件分級符合示範判斷 ${evaluated.filter(x=>x.right).length}/4；分工符合 ${evaluated.filter(x=>x.owner).length}/4。沒有以填答順序扣分。`);
 }
 return {feasibility,feedback:out,coach:scene.coach,decisionSummary:`我會先釐清${scene.tag}事件的影響範圍、資料可靠度與品質限制，再核對物料、產能和交期。能同步處理的部分會分工請相關單位確認，自己則試算替代方案、列出對原訂單的影響，經主管及業務核准後才更新排程，並追蹤到問題解除。`};}
return {clone,date,daydiff,workday,nextWork,plusWork,round,PRODUCTS,MATERIALS,SCENARIOS,MULTI_EVENTS,initial,product,mat,usable,orderRemaining,kitNeeds,blockingIssues,explainMaterials,plan,optionStatus,applyOption,compare,commitOption,reportGood,qaRelease,ship,closeIssue,qaResolve,qaReleaseLot,grade};
});
