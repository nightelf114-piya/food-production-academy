/* Practical training with fictional documents. No real ERP or company policy. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PRACTICE43 = api;
})(globalThis, function () {
  'use strict';

  const CASES = [
    { id: 'desk', title: '五日跟單實戰', subtitle: '追料、方案成本、交貨短收與結案', count: 5 },
    { id: 'raw', title: '原料供應', subtitle: '批號效期、預留、到貨與簽收', count: 4 },
    { id: 'oem', title: 'OEM 委外對帳', subtitle: '包材版次、累計回報與耗料單據', count: 4 },
    { id: 'odm', title: 'ODM 量產交接', subtitle: '配方、技轉、包材與核准數量', count: 3 }
  ];
  const copy = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const number = (name, label, answer, explanation) =>
    ({ name, label, answer, explanation, type: 'number' });
  const choice = (name, label, options, answer, explanation) =>
    ({ name, label, options, answer, explanation, type: 'choice' });
  const evidenceTable = (id, columns, rows) => ({ id, columns, rows });
  const option = (value, label) => [value, label];
  const qaAction = () => choice('control', '目前這批待驗料應如何處理？', [
    option('hold', '維持待驗管制，向品保追蹤放行結果'),
    option('use', '貨已到倉，先投入再補驗收'),
    option('self', '生管自行勾選放行')
  ], 'hold', '到貨與品質放行是不同狀態。待驗料保持管制，由品保依授權判定。');

  function stage(caseId, index, progress) {
    if (caseId === 'desk') return deskStage(index, progress);
    if (caseId === 'raw') return rawStages()[index];
    if (caseId === 'oem') return oemStages()[index];
    return odmStages()[index];
  }

  function deskStage(index, progress) {
    const outsourced = progress.answers[0]?.values.plan === 'outsource';
    const shipped = outsourced ? 600 : 100;
    const received = outsourced ? 575 : 100;
    const late = outsourced ? 25 : 500;
    const plannedCost = outsourced ? 4200 : 1200;
    const finalCost = outsourced ? 4800 : 1200;
    const route = outsourced ? '已選代工支援' : '已選原廠等待並協調改期';
    const stages = [
      {
        title: '星期一｜整理料況並提出方案', time: '2026-11-09 09:00',
        brief: 'A 單 600 箱、B 單 300 箱原承諾都在星期三 17:00 前簽收。每箱用料 1 kg，案例良率設為 100%，其他物料充足。客戶允許分批。生產完成後隔工作日 09:00 品保判定，放行後 10:00 出車、14:00 到貨。',
        tables: [
          evidenceTable('INV-01｜倉管 09:00', ['原料狀態', '數量 kg', '用途'], [
            ['已放行且未預留', 500, '可分配 A'], ['已放行並預留', 300, 'B 專用'], ['隔離', 200, '禁止投入']]),
          evidenceTable('CAP-01｜工廠 09:00', ['廠別', '星期二可用箱數', '星期三可用箱數', '條件'], [
            ['主廠', 400, 500, '已扣除其他工作與清洗'], ['合格代工廠', 500, 0, 'A 規格/製程已核准，週一12:00前保留檔期並送料，運輸4小時']]),
          evidenceTable('QUOTE-01｜採購/物流', ['項目', '費用', '條件'], [
            ['補料100 kg加急', 1200, '週二到貨；須另等品保放行'], ['代工加價', '4元/箱', '安排500箱'], ['代工額外運輸', 1000, '本案固定費用']]),
          evidenceTable('SO-01｜業務', ['方案', 'A預計收齊', '核准要求'], [
            ['代工500＋主廠100；B主廠300', '星期三14:00', '主管費用核准、工廠及物流書面確認'], ['全由主廠完成', '星期四14:00', '業務取得客戶書面改期；仍保留原承諾日']])
        ],
        fields: [
          number('available', '目前可分配給 A 的原料（kg）', 500, '1,000－隔離200－B預留300＝500 kg。'),
          number('shortage', 'A 的原料缺口（kg）', 100, 'A需求600 kg，現有可分配500 kg，缺100 kg。'),
          choice('plan', '推薦方案（兩案都可提報，後續結果依選擇延續）', [
            option('outsource', '代工500箱＋主廠100箱，提報追加4,200元'),
            option('wait', '全由主廠做，提報追加1,200元並協調A改期'),
            option('holdstock', '使用隔離料，維持原交期')
          ], ['outsource', 'wait'], '只能提出具品質前提的方案。隔離料不可用來補缺口。'),
          choice('owner', '誰先負責取得補料書面到貨資訊？', [
            option('purchase', '採購'), option('sales', '業務'), option('self', '生管自行填入承諾日期')
          ], 'purchase', '採購取得供應資訊，生管整合排程與缺口。'),
          choice('deadline', '供應商尚未回覆，選擇下一次追蹤／升級時間', [
            option('1030', '今天10:30追採購，11:00仍未確認就向主管升級'),
            option('tomorrow', '明天下班前再追'), option('none', '等供應商主動回覆')
          ], '1030', '代工保留期限為今天12:00，必須提前留出主管決策與送料時間。')
        ],
        hint: ['把隔離、預留與可自由分配分開。費用包含加急、代工與運輸。',
          'A缺100 kg。代工方案費用為1,200＋500×4＋1,000＝4,200元，等待方案仍需1,200元加急。'],
        lesson: '已形成有前提的方案。主管核准及書面回覆會在下一日的收件資料中提供。'
      },
      {
        title: '星期二｜到貨後仍要追品保', time: '2026-11-10 09:00',
        brief: route + '。昨天的分工已取得回覆。請核對到貨單與品保狀態，再決定現在能否投入。',
        tables: [
          evidenceTable('AP-01｜主管週一11:15', ['核准方案', '費用上限', '附件'], [
            [outsourced ? '代工500＋主廠100' : '主廠週二100＋週三500', plannedCost,
              outsourced ? 'CF-01代工500箱確認；TR-01送料500kg簽收' : 'REV-A1客戶接受A剩餘500箱改週四14:00，原承諾仍記錄']]),
          evidenceTable('GR-100｜倉管週二08:40', ['物料', '到貨kg', '品質狀態', '品保回覆'], [
            ['補料', 100, '待驗', 'QA-100預計10:30前提供結果，目前未簽發']]),
          evidenceTable('SLOT-02｜主廠', ['資料', '內容'], [
            ['投產窗口', '11:00至17:00，足以完成本案400箱'], ['最晚確認放行', '10:30；若未取得結果立即升級主管及工廠']])
        ],
        fields: [
          number('received', '已實際到貨量（kg）', 100, 'GR-100確認收到100 kg。'),
          number('usable', '現在這筆補料可投入量（kg）', 0, '09:00仍是待驗，尚未取得QA-100放行文件。'),
          qaAction(),
          choice('deadline', '下一次品質追蹤時點', [option('1030', '今天10:30'), option('1700', '今天17:00')], '1030', '必須在11:00投產前確認，不能等到下班。'),
          number('approvedCost', '昨天獲核准的追加預算（元）', plannedCost, '核對AP-01，使用自己選擇方案的預算。')
        ],
        hint: ['到貨單證明數量，放行文件證明是否允許投入。', '09:00收到100 kg，但可投入0 kg；最晚10:30追品保。'],
        lesson: '品質判定仍由品保負責。下一日將提供實際放行與生產結果，請沿用已核准方案。'
      },
      {
        title: '星期三｜出貨與簽收逐筆核對', time: '2026-11-11 14:30',
        brief: route + '。QA-100實際於星期二10:20簽發放行，主廠按時完成400箱。請從單據辨認未結事項。',
        tables: [
          evidenceTable('PROD-03｜工廠/品保', ['生產與放行', '結果'], [
            ['B', '300箱完成並於週三09:00放行'],
            ['A', outsourced ? '代工500＋主廠100箱完成；週三09:00均已放行' : '週二100箱已放行；週三500箱完工、待週四品保判定']]),
          evidenceTable('SHIP-A1 / POD-A1｜物流與客戶', ['訂單', '本次出貨箱數', '本次簽收箱數'], [
            ['A', shipped, received], ['B', 300, 300]]),
          evidenceTable('NEXT-03｜當日聯繫', ['狀態', '回覆要求'], [[
            outsourced ? '客戶A記錄短收25箱，物流原因尚待確認' : 'A尚有500箱等待週四品保與運輸',
            '今天15:00回覆業務，16:00仍無下一步證據則升級主管']])
        ],
        fields: [
          number('shipped', 'A 今天已出貨箱數', shipped, '核對SHIP-A1，使用本案選擇後的實際出貨量。'),
          number('received', 'A 今天已簽收箱數', received, '以POD-A1為準，不能用出貨量代替。'),
          number('unfulfilled', 'A 距離訂單600箱尚未簽收的箱數', 600 - received, '訂單600減去目前實際簽收。'),
          choice('owner', '應優先跟進的角色組合', [
            option('logistics', '物流與業務追短收，生管整合進度'),
            option('qa', '品保確認後續批次，物流與業務銜接交貨'),
            option('close', '已出貨就直接結案')
          ], outsourced ? 'logistics' : 'qa', '按本輪資料處理短收或後續批次，不能直接結案。'),
          choice('deadline', '今天如何追蹤？', [option('today', '15:00回覆、16:00無證據升級'), option('nextweek', '下週一再確認')], 'today', '當日承諾與未結事項需要當日追蹤。')
        ],
        hint: ['核對出貨、簽收與尚待交付三個不同數量。', outsourced ? 'A已出600、簽收575，剩25箱待追。' : 'A已出100、簽收100，仍有500箱未簽收。'],
        lesson: '當日紀錄仍保留原承諾。補交完成後才能依證據處理未結事項。'
      },
      {
        title: '星期四｜以回單確認補交與延誤', time: '2026-11-12 14:30',
        brief: '請核對新的簽收與核准資料，完成A訂單的交付核對。原承諾仍為星期三17:00。',
        tables: [
          evidenceTable('POD-A2｜客戶簽收', ['本次補簽收箱數', '簽收時間', '來源'], [
            [late, outsourced ? '星期四10:00' : '星期四14:00', outsourced ? '物流找回昨日漏卸25箱，依核准安排補送' : '剩餘500箱週四09:00品保放行後交貨']]),
          evidenceTable('AP-02 / BILL-04｜主管與物流', ['追加項目', '核准金額'], [
            [outsourced ? '短收補送運費，已核准' : '無新增費用', outsourced ? 600 : 0]]),
          evidenceTable('TRACE-04｜追溯核對', ['文件', '確認內容'], [
            ['QA-A / QA-B', '本案已交貨批次均有品保放行依據'],
            ['POD-A1＋POD-A2', 'A所有交貨批次均對應出貨單，無重複計算']])
        ],
        fields: [
          number('totalReceived', 'A 累計已簽收（箱）', 600, '把POD-A1與POD-A2相加，每張回單只計一次。'),
          number('lateQty', '依原承諾日計算，延後簽收（箱）', late, '保留原承諾日，協調改期不會消除原承諾差異。'),
          number('lateHours', '最後一批比原承諾晚幾小時？', outsourced ? 17 : 21, '星期三17:00至星期四10:00為17小時，至14:00為21小時。'),
          choice('proof', '結案依據', [
            option('pod', '兩張簽收回單＋對應放行/出貨文件核對完成'),
            option('phone', '工廠電話說已寄出'), option('erp', '自行把ERP狀態改完成')
          ], 'pod', '交付結案依據必須能核對到批次、放行、出貨與客戶簽收。')
        ],
        hint: ['先加總簽收，再以原承諾計算延後數量與時間。', '主管需要同時看到訂單已交完，以及哪些數量晚於原承諾。'],
        lesson: '交付數量核對完成。延誤原因、費用與改善措施仍需納入第五日檢討。'
      },
      {
        title: '星期五｜交出費用與改善報告', time: '2026-11-13 09:00',
        brief: '沿用這一週選擇、核准與收貨結果。成本僅使用題目已提供的追加費用，基礎製造成本不在本案計算範圍。',
        tables: [
          evidenceTable('COST-05｜費用彙整', ['費用來源', '金額元'], [
            ['AP-01已核准方案', plannedCost], ['AP-02補送', finalCost - plannedCost]]),
          evidenceTable('REVIEW-05｜週檢討', ['已確認事實', '內容'], [
            ['A依原承諾延後量', late + '箱'], ['根因線索', outsourced ? '物流裝卸清單與客戶收貨數量未逐批核對，漏卸25箱' : '原廠星期二可用產能不足，改期已取得客戶同意'],
            ['文字判斷覆核', '請向教練說明方案取捨、原因與預防措施']])
        ],
        fields: [
          number('cost', '實際已核准追加費用合計（元）', finalCost, '依AP-01及AP-02加總，勿把預算當作所有實際費用。'),
          number('onTimeA', 'A 依原承諾準時簽收（箱）', 600 - late, '600減去延後簽收量。'),
          choice('prevention', '對應本案事實的改善措施', [
            option('loading', '增加出車裝卸清單與客戶逐批點收核對'),
            option('capacity', '接單前確認有限產能，及早提報備援或改期'),
            option('rewrite', '把原承諾日改掉，讓報表全部準時')
          ], outsourced ? 'loading' : 'capacity', '改善措施須對應已確認原因，原承諾資料須保留。')
        ],
        hint: ['取回你第一日方案，確認第四日是否新增費用。', outsourced ? '4,200＋600＝4,800元；A準時575箱。' : '追加1,200元；A原承諾內簽收100箱。'],
        lesson: '五日客觀核對完成。匯出交班表，請教練覆核你的自由說明、溝通品質與方案取捨。'
      }
    ];
    return stages[index];
  }

  function rawStages() {
    return [
      {
        title: '原料供應｜依客規選批與分配', time: '2026-11-09 09:00',
        brief: '訂單R-450需450 kg果泥，預計11/11交貨。題目客規要求交貨時剩餘效期至少60天、冷凍保存、已放行且規格M1。先篩選合格批次，再採先到期先出。日期均是教學設定。',
        tables: [
          evidenceTable('LOTS-R1', ['批號', '帳面kg', '已預留kg', '品質', '效期', '規格/保存'], [
            ['R-A', 200, 0, '隔離', '2027-03-01', 'M1/冷凍'],
            ['R-B', 250, 0, '放行', '2026-12-01', 'M1/冷凍'],
            ['R-C', 500, 100, '放行', '2027-03-01', 'M1/冷凍'],
            ['R-D', 300, 0, '放行', '2027-05-01', 'M1/冷凍']])
        ],
        fields: [
          number('usable', '符合本單全部條件且未預留的量（kg）', 700, 'R-C有400、R-D有300。R-A隔離，R-B不滿60天。'),
          choice('first', '合格批次中優先領哪批？', [option('R-A', 'R-A'), option('R-B', 'R-B'), option('R-C', 'R-C'), option('R-D', 'R-D')], 'R-C', '先排除不合格及短效期批次，再從合格批次依效期選用。'),
          number('cQty', '分配R-C（kg）', 400, 'R-C的100 kg已預留，最多可分配400 kg。'),
          number('dQty', '分配R-D（kg）', 50, '450－400＝50 kg。')
        ],
        hint: ['先看品質與客戶剩餘效期，再扣預留。', 'R-C400＋R-D50滿足450 kg；符合條件總量700 kg。'],
        lesson: '批次分配需同時符合品質、規格、效期與預留限制。'
      },
      {
        title: '原料供應｜到貨短少與單位換算', time: '2026-11-10 09:00',
        brief: '另有補庫存採購PO-R1，和R-450已分配批次分開核對。倉管收到桶數與採購單不同，請建立差異紀錄。',
        tables: [
          evidenceTable('PO-R1', ['採購桶數', '每桶淨重kg', '約定總kg'], [[10, 20, 200]]),
          evidenceTable('GR-R1', ['實收桶數', '實測每桶淨重kg', '品質狀態'], [[9, 20, '待驗；COA尚未提供']])
        ],
        fields: [
          number('received', '實收量（kg）', 180, '9桶×20 kg＝180 kg。'),
          number('shortage', '採購短少（kg）', 20, '200－180＝20 kg。'),
          number('usable', '這筆實收到貨現在可用（kg）', 0, '待驗且文件未齊，不能直接列入可用。'),
          choice('owner', '短少與品質缺件如何分工？', [
            option('split', '倉管核對實收、採購追短少/文件、品保判定可用'),
            option('adjust', '生管把帳改200kg'), option('release', '倉管收到就算放行')
          ], 'split', '數量差異與品質狀態需由對應角色查證並留下紀錄。')
        ],
        hint: ['桶與公斤先換成同單位。', '實收180、短少20、目前可用0 kg。'],
        lesson: '到貨量、採購差異與品質狀態分開記錄，避免用錯帳面量。'
      },
      {
        title: '原料供應｜追出貨與短收', time: '2026-11-11 15:00',
        brief: 'R-450已依第一步分配出貨，兩批都有有效放行紀錄。請核對客戶簽收。PO-R1補庫存差異另案處理。',
        tables: [
          evidenceTable('SHIP-R1', ['訂單', 'R-C出貨kg', 'R-D出貨kg', '總kg'], [['R-450', 400, 50, 450]]),
          evidenceTable('POD-R1', ['訂單', '實際簽收kg', '備註'], [['R-450', 430, '冷鏈紀錄合格；少收20kg，物流待查']])
        ],
        fields: [
          number('shortReceived', '尚未簽收（kg）', 20, '出貨450－簽收430＝20 kg。'),
          choice('close', 'R-450目前可否交付結案？', [option('no', '保持未結，追物流及客戶補收證據'), option('yes', '出貨450kg即可結案')], 'no', '尚無20 kg的有效簽收證據。'),
          choice('document', '目前可作為已收430kg依據的單據', [option('POD-R1', 'POD-R1'), option('SHIP-R1', 'SHIP-R1'), option('PO-R1', 'PO-R1')], 'POD-R1', '客戶簽收證明已收量；出貨單和採購單用途不同。')
        ],
        hint: ['找出能證明客戶收到多少的文件。', 'POD-R1證明430 kg，尚有20 kg待追。'],
        lesson: '保持訂單交付未結，向物流追查並要求可核對的補收證據。'
      },
      {
        title: '原料供應｜證據齊備後結案', time: '2026-11-12 10:00',
        brief: '物流已找回R-D漏卸20 kg並在合格冷鏈條件下補交。請避免同一筆回單重複計入。',
        tables: [
          evidenceTable('POD-R2', ['批號', '補簽收kg', '品質/冷鏈'], [['R-D', 20, 'QA-R2確認合格']]),
          evidenceTable('OPEN-R1', ['事件', '狀態'], [['PO-R1補庫存短少20kg', '採購仍追蹤，尚未結案']])
        ],
        fields: [
          number('total', 'R-450累計簽收（kg）', 450, 'POD-R1的430＋POD-R2的20＝450 kg。'),
          choice('status', '正確的結案範圍', [
            option('delivery', 'R-450交付結案，PO-R1採購差異繼續追蹤'),
            option('all', '所有採購和交貨事件都結案')
          ], 'delivery', '不同事件有不同結案依據，補交回單不能解除採購短少。')
        ],
        hint: ['逐張回單加總，分清訂單與採購事件。', '交付450 kg已齊；採購PO-R1仍缺20 kg。'],
        lesson: '原料供應的客觀核對完成，請匯出紀錄供教練覆核。'
      }
    ];
  }

  function oemStages() {
    return [
      {
        title: 'OEM｜核對客戶與包材版次', time: '2026-11-09 09:00',
        brief: 'OEM-M訂單600箱，每箱12瓶。產品芒果飲、客戶甲、標籤核准版次V3。標籤庫存均已完成印刷品檢。',
        tables: [
          evidenceTable('LABEL-01', ['料號', '產品', '客戶', '版次', '庫存張數'], [
            ['L-OR3', '柳橙飲', '甲', 'V3', 8000], ['L-M2', '芒果飲', '甲', 'V2', 8000], ['L-M3', '芒果飲', '甲', 'V3', 7200]])
        ],
        fields: [
          choice('label', '本單可用的標籤料號', [option('L-OR3', 'L-OR3'), option('L-M2', 'L-M2'), option('L-M3', 'L-M3')], 'L-M3', '產品、客戶和核准版次必須全部一致。'),
          number('needed', '600箱需要標籤（張）', 7200, '600×12＝7,200張。'),
          choice('revision', '工廠只拿到V2稿時如何處理？', [
            option('confirm', '暫停該版包材使用，取得V3核准稿並確認工廠接收'),
            option('use', '內容相近，先用V2'), option('mix', 'V2、V3混用')
          ], 'confirm', '圖稿核准與現場接收要能對到同一版次。')
        ],
        hint: ['數量足夠仍須核對產品、客戶、版次。', '選L-M3；每箱12瓶，共7,200張。'],
        lesson: '標籤須逐產品、客戶與版次識別，不能把同類包材視為可互換。'
      },
      {
        title: 'OEM｜核對累計良品與實際耗料', time: '2026-11-10 16:00',
        brief: '本案每箱成品含原料淨重1 kg。620 kg送料已收訖；不良及餘料使用同一公斤單位。工廠回報是累計值。請先排除重複單號。',
        tables: [
          evidenceTable('REPORT-01', ['回報單號', '時間', '累計良品箱數'], [['RPT-1', '10:00', 300], ['RPT-2', '15:00', 570], ['RPT-2', '15:00重寄', 570]]),
          evidenceTable('SUB-01｜委外耗料', ['項目', 'kg'], [
            ['送料', 620], ['良品所含原料', 570], ['已確認不良損耗', 30], ['廠內未投入餘料', 15], ['退回已簽收', 5]])
        ],
        fields: [
          number('good', '截至15:00累計良品（箱）', 570, 'RPT-2重寄不再累加，且300與570都是累計值。'),
          number('increment', '10:00至15:00新增良品（箱）', 270, '570－300＝270箱。'),
          number('balance', '送料減去已說明去向後的未解釋差額（kg）', 0, '620－570－30－15－5＝0 kg。'),
          number('yield', '本案投入良率（%，良品／良品加不良）', 95, '570÷（570＋30）×100＝95%。餘料與退料未投入，不計分母。')
        ],
        hint: ['先去除RPT-2重複回報，再用累計差額。', '新增270箱，對帳差額0 kg，良率95%。標準BOM與實際耗料應分別記錄。'],
        lesson: '委外對帳需保留不良、餘料與退料，不能只用良品乘標準BOM當作全部實耗。'
      },
      {
        title: 'OEM｜訂單、良品、出貨、簽收分開', time: '2026-11-11 15:00',
        brief: '品保依QA-M1核准此批570箱。客戶書面接受先交560箱，餘量交期尚待確認。本案允許按核准批次分批出貨。',
        tables: [
          evidenceTable('ERP-M1｜單據鏈', ['文件', '數量箱', '意義'], [
            ['SO-M', 600, '訂單需求'], ['FG-M / QA-M1', 570, '良品且本批已放行'],
            ['SHIP-M1', 560, '已出貨'], ['POD-M1', 550, '已簽收']])
        ],
        fields: [
          number('unmade', '尚未形成良品（箱）', 30, '訂單600－良品570＝30。'),
          number('unshipped', '已放行但未出貨（箱）', 10, '570－560＝10。'),
          number('shortReceived', '已出貨但尚未簽收（箱）', 10, '560－550＝10。'),
          choice('action', '下一步', [
            option('track', '物流追10箱短收，生管追30箱未完工及10箱未出貨'),
            option('close', '良品570已放行，整張訂單結案')
          ], 'track', '三種差額需要分別追蹤，不能互相抵銷。')
        ],
        hint: ['600、570、560、550各自代表不同階段。', '未形成良品30、未出貨10、短收10箱。'],
        lesson: '部分批次放行與分批交貨須有案例中的授權，訂單仍有未履行量。'
      },
      {
        title: 'OEM｜部分異常結案與訂單餘量', time: '2026-11-12 10:00',
        brief: '物流補送10箱並取得回單。工廠尚未補做30箱，倉庫10箱仍待業務確認出貨安排。',
        tables: [evidenceTable('POD-M2', ['補簽收箱數', '對應出貨單'], [[10, 'SHIP-M1漏卸部分，非新增出貨']])],
        fields: [
          number('received', '累計簽收（箱）', 560, '550＋10＝560，這10箱屬原560箱出貨。'),
          number('remaining', '整張訂單尚未交付（箱）', 40, '600－560＝40，含30箱未完工與10箱未出貨。'),
          choice('close', '目前可關閉的事項', [
            option('short', 'SHIP-M1短收事件可結案，SO-M訂單保持未結'),
            option('order', 'SO-M整張訂單結案'), option('none', '忽略新回單，所有狀態照舊')
          ], 'short', '證據只解除對應事件，訂單餘量仍需追蹤。')
        ],
        hint: ['補簽收不能再加到出貨量。', '累計簽收560箱，訂單仍有40箱未交。'],
        lesson: 'OEM文件與數量核對完成，請把未結事項帶入交班紀錄。'
      }
    ];
  }

  function odmStages() {
    return [
      {
        title: 'ODM｜配方與BOM版次不一致', time: '2026-11-09 09:00',
        brief: '客戶乙訂製新飲品1,000箱。生管收到研發、業務與工廠三份交接文件。',
        tables: [
          evidenceTable('DEV-01', ['文件', '版次', '狀態'], [
            ['客戶核准樣品配方FORM', 'F2', '客戶與研發已核准'],
            ['BOM', 'F1', '舊版'],
            ['工廠技轉接收單', 'F1', '已接收舊版']])
        ],
        fields: [
          choice('block', '目前阻擋量產的問題', [
            option('version', '核准配方F2與BOM/工廠F1不一致'),
            option('none', '工廠已簽收即可生產')
          ], 'version', '需以同一核准版次完成BOM與技轉資料銜接。'),
          choice('owner', '版次內容由誰確認？', [
            option('rd', '研發確認內容與版次，品保核對相關文件，生管追交接'),
            option('pm', '生管自行把F1文字改為F2')
          ], 'rd', '生管協調追蹤，配方與品質文件由相應權責角色確認。'),
          choice('next', '送往工廠的下一份證據', [
            option('f2', '核准BOM-F2及對應技轉文件，取得工廠接收確認'),
            option('phone', '口頭告訴工廠照新版做')
          ], 'f2', '要能核對文件內容、版次與接收紀錄。')
        ],
        hint: ['確認已核准版本是否一路傳到現場。', 'FORM-F2與BOM-F1不一致，需研發/品保確認並完成F2交接。'],
        lesson: '量產前需完成版本一致性與現場接收確認。'
      },
      {
        title: 'ODM｜試產完成仍有包材缺件', time: '2026-11-10 11:00',
        brief: '研發已提供BOM-F2，工廠簽收F2技轉文件，試產合格。本案試產200箱為驗證批，未核准轉作本訂單可交付良品，不計入後續交貨數量。請繼續核對包材。',
        tables: [
          evidenceTable('PILOT-02', ['文件', '結果'], [['試產200箱（驗證批）', '品保與製程確認合格；未核准列入本單交付'], ['FORM / BOM / TECH', '均為F2，核准及接收齊備']]),
          evidenceTable('PACK-02', ['項目', '版本'], [['客戶核准標籤稿', 'L2'], ['工廠現場標籤', 'L1']])
        ],
        fields: [
          choice('label', '現在能否使用工廠L1標籤量產出貨？', [
            option('hold', '管制L1，待L2核准包材與現場接收核對完成'),
            option('use', '試產合格，所以L1可以用')
          ], 'hold', '試產合格不能取代包材版次核對。'),
          choice('proof', '解除這項包材阻擋需取得什麼？', [
            option('pack', 'L2核准稿、包材驗收與工廠接收/換版紀錄'),
            option('sample', '重複提供試產200箱報告')
          ], 'pack', '結案證據需直接對應包材版次問題。')
        ],
        hint: ['製程試產與包材版本是不同確認項。', 'L1不能代替核准L2；需L2驗收與現場換版證據。'],
        lesson: '包材版次問題需用對應證據解除。'
      },
      {
        title: 'ODM｜依核准範圍交付第一批', time: '2026-11-12 14:00',
        brief: 'L2包材已驗收並完成工廠換版確認。首批量產與交貨核准範圍為800箱，客戶書面同意先收800箱，剩餘200箱交期尚待確認。',
        tables: [
          evidenceTable('MP-03', ['文件', '數量箱', '狀態'], [
            ['量產核准', 800, '核准此批數量'], ['良品/QA-D1', 800, '本批已放行'],
            ['SHIP-D1', 800, '已出貨'], ['POD-D1', 800, '已簽收']]),
          evidenceTable('SO-D1', ['訂單總量', '剩餘部分'], [[1000, '200箱尚未取得量產及交期確認']])
        ],
        fields: [
          number('received', '可確認完成簽收（箱）', 800, 'POD-D1已簽收800箱。'),
          number('remaining', '仍需追蹤（箱）', 200, '1,000－800＝200箱。'),
          choice('next', '剩餘200箱應如何處理？', [
            option('confirm', '追量產核准與產能，由業務確認客戶交期後安排'),
            option('copy', '複製首批核准自行增產200箱'),
            option('close', '首批已簽收，整單結案')
          ], 'confirm', '首批800箱的授權不能直接擴大到剩餘200箱。')
        ],
        hint: ['核准範圍、出貨與整張訂單需求要分開。', '首批800箱已交付，200箱保持未結並追核准與交期。'],
        lesson: 'ODM首批交接核對完成，剩餘200箱列入交班。自由說明仍待教練覆核。'
      }
    ];
  }

  function validate(caseId, index, progress, values) {
    const current = stage(caseId, index, progress);
    const errors = [];
    for (const field of current.fields) {
      const value = String(values[field.name] ?? '').trim();
      const accepted = field.type === 'number'
        ? value !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value) - field.answer) < 0.00001
        : (Array.isArray(field.answer) ? field.answer : [field.answer]).includes(value);
      if (!accepted) errors.push({ field: field.name, message: field.label + ' — ' + field.explanation });
    }
    return errors;
  }

  function cleanValues(values, fields) {
    const result = {};
    for (const name of [...fields.map(field => field.name), 'note']) {
      result[name] = typeof values?.[name] === 'string' ? values[name].slice(0, 4000) : '';
    }
    return result;
  }

  function progressFrom(raw, definition) {
    const progress = { step: 0, answers: [], drafts: {}, hint: 0, hintUsed: {}, feedback: null };
    if (!raw || typeof raw !== 'object') return progress;
    const saved = Array.isArray(raw.answers) ? raw.answers : [];
    for (let index = 0; index < Math.min(saved.length, definition.count); index++) {
      const current = stage(definition.id, index, progress);
      const values = cleanValues(saved[index]?.values, current.fields);
      if (validate(definition.id, index, progress, values).length) break;
      progress.answers.push({ values, reasonReview: 'pending' });
    }
    progress.step = Number.isInteger(raw.step)
      ? Math.max(0, Math.min(raw.step, progress.answers.length, definition.count)) : progress.answers.length;
    for (let index = 0; index <= Math.min(progress.answers.length, definition.count - 1); index++) {
      const fields = stage(definition.id, index, progress).fields;
      const draft = raw.drafts?.[index] || progress.answers[index]?.values || {};
      progress.drafts[index] = cleanValues(draft, fields);
      progress.hintUsed[index] = Number.isInteger(raw.hintUsed?.[index])
        ? Math.max(0, Math.min(2, raw.hintUsed[index])) : 0;
    }
    progress.hint = Number.isInteger(raw.hint) ? Math.max(0, Math.min(2, raw.hint)) : 0;
    if (raw.feedback && Array.isArray(raw.feedback.messages)) {
      progress.feedback = {
        good: raw.feedback.good === true,
        messages: raw.feedback.messages.filter(item => typeof item === 'string').map(item => item.slice(0, 1000)).slice(0, 10)
      };
    }
    return progress;
  }

  function state(s) {
    const raw = s.practice43?.schema === 1 ? s.practice43 : {};
    const result = { schema: 1, active: CASES.some(item => item.id === raw.active) ? raw.active : 'desk', cases: {} };
    for (const definition of CASES) result.cases[definition.id] = progressFrom(raw.cases?.[definition.id], definition);
    return result;
  }

  function update(s, fn) {
    const next = copy(s);
    next.practice43 = state(s);
    fn(next.practice43);
    return next;
  }

  function submitValues(s, values) {
    return update(s, practice => {
      const id = practice.active;
      const progress = practice.cases[id];
      const definition = CASES.find(item => item.id === id);
      if (progress.step >= definition.count) return;
      const current = stage(id, progress.step, progress);
      const draft = cleanValues(values, current.fields);
      const errors = validate(id, progress.step, progress, draft);
      progress.drafts[progress.step] = draft;
      progress.answers = progress.answers.slice(0, progress.step);
      if (!errors.length) progress.answers.push({ values: draft, reasonReview: 'pending' });
      progress.feedback = {
        good: !errors.length,
        messages: errors.length ? errors.map(error => error.message) :
          [current.lesson, '本步選項與數字已核對。自由說明尚未評閱，請教練覆核後再評估實務能力。']
      };
    });
  }

  function advance(s) {
    return update(s, practice => {
      const progress = practice.cases[practice.active];
      const definition = CASES.find(item => item.id === practice.active);
      if (progress.step < definition.count && progress.answers[progress.step]) {
        progress.step++;
        progress.hint = 0;
        progress.feedback = null;
      } else if (progress.step < definition.count) {
        progress.feedback = { good: false, messages: ['請先完成本步客觀核對，再前往下一日／下一步。'] };
      }
    });
  }

  function tableHtml(table) {
    return '<section class="p43-document"><h3>' + escape(table.id) + '</h3><div class="tablewrap"><table><thead><tr>' +
      table.columns.map(column => '<th scope="col">' + escape(column) + '</th>').join('') +
      '</tr></thead><tbody>' + table.rows.map(row => '<tr>' +
        row.map(cell => '<td>' + escape(cell) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section>';
  }

  function fieldHtml(field, draft) {
    const value = draft[field.name] || '';
    const id = 'p43-field-' + field.name;
    const control = field.type === 'number'
      ? '<input class="field" id="' + id + '" name="' + field.name +
        '" type="number" inputmode="decimal" min="0" step="any" value="' + escape(value) + '">'
      : '<select class="select" id="' + id + '" name="' + field.name +
        '"><option value="">請選擇</option>' + field.options.map(([key, label]) =>
          '<option value="' + escape(key) + '"' + (value === key ? ' selected' : '') + '>' +
          escape(label) + '</option>').join('') + '</select>';
    return '<label class="fieldlabel" for="' + id + '">' + escape(field.label) + control + '</label>';
  }

  function reportRows(s) {
    const practice = state(s);
    const rows = [['案件', '案例時間', '步驟', '欄位', '學員填答', '核對狀態', '提示層數']];
    for (const definition of CASES) {
      const progress = practice.cases[definition.id];
      progress.answers.forEach((answer, index) => {
        const current = stage(definition.id, index, progress);
        for (const field of current.fields) {
          const raw = answer.values[field.name];
          const label = field.type === 'choice' ? field.options.find(item => item[0] === raw)?.[1] || raw : raw;
          rows.push([definition.title, current.time, current.title, field.label, label,
            '客觀項目核對完成', progress.hintUsed[index] || 0]);
        }
        rows.push([definition.title, current.time, current.title, '交班／決策說明',
          answer.values.note || '尚未填寫', '待教練覆核', progress.hintUsed[index] || 0]);
      });
      if (progress.step < definition.count && !progress.answers[progress.step]) {
        const draft = progress.drafts[progress.step];
        if (draft && Object.values(draft).some(Boolean)) {
          const current = stage(definition.id, progress.step, progress);
          for (const field of current.fields) rows.push([definition.title, current.time, current.title,
            field.label, draft[field.name] || '', '草稿，尚未核對', progress.hintUsed[progress.step] || 0]);
          rows.push([definition.title, current.time, current.title, '交班／決策說明',
            draft.note || '', '草稿，待教練覆核', progress.hintUsed[progress.step] || 0]);
        }
      }
    }
    return rows;
  }

  function sourceRows(s) {
    const practice = state(s);
    const definition = CASES.find(item => item.id === practice.active);
    const progress = practice.cases[definition.id];
    const rows = [['案件', '案例時間', '文件', '資料列', '欄位', '值']];
    for (let index = 0; index <= Math.min(progress.step, definition.count - 1); index++) {
      const current = stage(definition.id, index, progress);
      rows.push([definition.title, current.time, '案例前提', '', '說明', current.brief]);
      for (const table of current.tables) {
        table.rows.forEach((row, rowIndex) => row.forEach((value, columnIndex) =>
          rows.push([definition.title, current.time, table.id, rowIndex + 1, table.columns[columnIndex], value])));
      }
    }
    return rows;
  }

  function render(s) {
    const practice = state(s);
    const definition = CASES.find(item => item.id === practice.active);
    const progress = practice.cases[definition.id];
    const nav = '<div class="p43-cases" role="group" aria-label="實戰案件">' + CASES.map(item =>
      '<button type="button" class="btn ' + (item.id === definition.id ? 'primary' : '') +
      '" data-p43-case="' + item.id + '" aria-pressed="' + (item.id === definition.id) + '">' +
      escape(item.title) + '<small>' + escape(item.subtitle) + '</small></button>').join('') + '</div>';
    const header = '<section class="panel p43-hero"><span class="ac-eyebrow">V4.3 · 到職前實戰</span>' +
      '<h2>拿到資料，交出自己的判斷與交班紀錄</h2>' +
      '<p>四組虛構案件，練習資料核對、權責、時限與結案證據。五日案例會延續你選擇的方案。先查看單據，再填寫答案；原始資料與交班表可下載至Excel。</p>' +
      '<p class="tiny">案例使用固定教學時間與明示規則。客觀題核對和文字覆核分開記錄，正式天心操作需依任職公司的版本與授權流程學習。</p>' + nav +
      '<div class="line topspace"><button class="btn" data-p43="sources">下載本案已收到的原始資料 CSV</button>' +
      '<button class="btn" data-p43="report">匯出我的交班與核對表 CSV</button></div></section>';
    const steps = '<nav class="p43-steps" aria-label="案件進度">' + Array.from({ length: definition.count }, (_, index) =>
      '<button class="btn small ' + (index === progress.step ? 'primary' : '') + '" data-p43-edit="' + index +
      '"' + (index > progress.answers.length ? ' disabled' : '') + '>' +
      (progress.answers[index] ? '✓ ' : '') + escape(stage(definition.id, index, progress).title) + '</button>'
    ).join('') + '</nav>';
    const rubric = '<section class="panel"><h3>教練覆核時要看什麼</h3><p>請檢查交班說明是否引用有效文件、區分已知與待確認事項、找對權責人、訂出回覆期限與備案，以及保留原承諾與實際結果。自由文字未經自動語意評分。</p>' +
      '<button class="btn" data-nav="journey">回到基礎跟班實作</button></section>';
    if (progress.step >= definition.count) {
      return '<div class="p43">' + header + steps +
        '<section id="p43-stage" tabindex="-1" class="panel p43-result"><h2>' + escape(definition.title) + '客觀核對完成</h2>' +
        '<p>本案共完成 ' + definition.count + ' 步。你的數字、選項與文件核對已留下紀錄，交班文字仍待教練覆核。</p>' +
        '<p>案件內尚未解除的訂單餘量或採購差異，仍依最後一步保留為未結事項。</p>' +
        '<button class="btn primary" data-p43="report">匯出給教練覆核</button></section>' + rubric + resetButton() + '</div>';
    }
    const current = stage(definition.id, progress.step, progress);
    const draft = progress.drafts[progress.step] || {};
    const feedback = progress.feedback;
    return '<div class="p43">' + header + steps +
      '<section id="p43-stage" tabindex="-1" class="panel"><div class="line"><span class="pill info">' + escape(current.time) +
      '</span><span>第 ' + (progress.step + 1) + '／' + definition.count + ' 步</span></div><h2>' +
      escape(current.title) + '</h2><p>' + escape(current.brief) + '</p>' +
      current.tables.map(tableHtml).join('') + '</section>' +
      '<section class="panel"><h2>填寫核對與處置紀錄</h2><form id="practice43Form" novalidate>' +
      '<div class="p43-fields">' + current.fields.map(field => fieldHtml(field, draft)).join('') + '</div>' +
      '<label class="fieldlabel" for="p43-note">給主管／接班人的說明（保存後待教練覆核）' +
      '<textarea class="field" id="p43-note" name="note" rows="4" maxlength="4000" placeholder="引用單號和數量，說明已確認與待確認事項、找誰、何時再追，以及需要核准的事。">' +
      escape(draft.note || '') + '</textarea></label><div class="line topspace">' +
      '<button class="btn primary" type="submit">核對本步數字與處置</button>' +
      '<button class="btn" type="button" data-p43="hint">我需要提示</button></div></form>' +
      (progress.hint ? '<div class="note topspace"><b>提示 ' + progress.hint + '／2</b><p>' +
        escape(current.hint[progress.hint - 1]) + '</p></div>' : '') +
      '<div id="p43-feedback" class="p43-feedback ' + (feedback?.good ? 'good' : '') + '" role="status" aria-live="polite">' +
      (feedback ? feedback.messages.map(message => '<p>' + escape(message) + '</p>').join('') : '') + '</div>' +
      '<button id="p43-next" class="btn primary" type="button" data-p43="next"' +
      (progress.answers[progress.step] ? '' : ' disabled') + '>' +
      (progress.step + 1 === definition.count ? '查看本案核對結果' : '保存交班並前往下一步') +
      '</button></section>' + rubric + resetButton() + '</div>';
  }

  function resetButton() {
    return '<div class="line"><button class="btn danger" data-p43="reset">重新練習目前案件</button>' +
      '<small>可先匯出紀錄，重新練習會清除本案填答。</small></div>';
  }

  function focusStage() {
    if (typeof document === 'undefined') return;
    const section = document.getElementById('p43-stage');
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function click(event, s, context) {
    const button = event.target.closest('button');
    if (!button) return false;
    const caseId = button.dataset.p43Case;
    if (caseId && CASES.some(item => item.id === caseId)) {
      context.setState(update(s, practice => { practice.active = caseId; }));
      focusStage();
      return true;
    }
    if (button.dataset.p43Edit !== undefined) {
      const index = Number(button.dataset.p43Edit);
      const practice = state(s);
      const progress = practice.cases[practice.active];
      if (!Number.isInteger(index) || index < 0 || index > progress.answers.length ||
          index >= CASES.find(item => item.id === practice.active).count) return true;
      if (index === progress.step) return true;
      if (index < progress.answers.length && typeof confirm === 'function' &&
          !confirm('修改此步將重新核對本步及後續步驟。後續填答會保留在已匯出的報表中，請先確認需要的紀錄已匯出。')) return true;
      context.setState(update(s, value => {
        const record = value.cases[value.active];
        record.answers = record.answers.slice(0, index);
        for (const key of Object.keys(record.drafts)) if (Number(key) > index) delete record.drafts[key];
        for (const key of Object.keys(record.hintUsed)) if (Number(key) > index) delete record.hintUsed[key];
        record.step = index;
        record.hint = 0;
        record.feedback = null;
      }));
      return true;
    }
    const action = button.dataset.p43;
    if (!action) return false;
    if (action === 'sources') context.exportCsv('food_academy_source_data.csv', sourceRows(s));
    else if (action === 'report') context.exportCsv('food_academy_handover.csv', reportRows(s));
    else if (action === 'next') { context.setState(advance(s)); focusStage(); }
    else if (action === 'hint') context.setState(update(s, practice => {
      const record = practice.cases[practice.active];
      record.hint = Math.min(2, record.hint + 1);
      record.hintUsed[record.step] = Math.max(record.hintUsed[record.step] || 0, record.hint);
    }));
    else if (action === 'reset') {
      if (typeof confirm !== 'function' || confirm('確定重新練習目前案件？將清除本案填答與草稿。')) {
        context.setState(update(s, practice => {
          practice.cases[practice.active] = progressFrom(null, CASES.find(item => item.id === practice.active));
        }));
      }
    }
    return true;
  }

  function submit(event, s, context) {
    if (event.target.id !== 'practice43Form') return false;
    event.preventDefault();
    context.setState(submitValues(s, Object.fromEntries(new FormData(event.target))));
    if (typeof document !== 'undefined') {
      document.getElementById('p43-feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    return true;
  }

  function input(event, s, context) {
    const form = event.target.closest('#practice43Form');
    if (!form) return false;
    const practice = state(s);
    const progress = practice.cases[practice.active];
    const current = stage(practice.active, progress.step, progress);
    if (!current) return true;
    const name = event.target.name;
    if (!['note', ...current.fields.map(field => field.name)].includes(name)) return true;
    context.persistState(update(s, value => {
      const record = value.cases[value.active];
      record.drafts[record.step] ||= {};
      record.drafts[record.step][name] = String(event.target.value).slice(0, 4000);
      record.answers = record.answers.slice(0, record.step);
      record.feedback = null;
    }));
    if (typeof document !== 'undefined') {
      const feedback = document.getElementById('p43-feedback');
      if (feedback) feedback.textContent = '草稿已修改，請重新核對本步。';
      document.getElementById('p43-next')?.setAttribute('disabled', '');
    }
    return true;
  }

  return { CASES, state, stage, validate, submitValues, advance, render, click, submit, input, reportRows, sourceRows };
});
