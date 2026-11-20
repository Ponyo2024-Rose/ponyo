/* =========================================================
   數光群島｜設定檔
   ---------------------------------------------------------
   這個檔案是整個網站「唯一需要修改」的地方：
   島名、建築、遊戲連結、NPC 台詞、班級人數、試算表網址……
   修改後存檔、重新整理網頁就會生效。

   小提醒：
   ・文字要放在引號 '' 裡面
   ・每一項後面記得加逗號 ,
   ・改壞了不用怕，把備份貼回來就好
   ========================================================= */

window.SHUGUANG = {

  /* ---------- 基本設定 ---------- */
  siteTitle: '數光群島',
  siteSubtitle: '五年級上學期・數學冒險',
  classSize: 30,                 // 班級人數（登入畫面會出現 1～30 號）

  // Google 試算表的 Apps Script 網址（設定教學第 3 步會拿到）
  // 還沒設定時留空 '' 即可，進度仍會存在學生的裝置上
  sheetUrl: '',

  // 是否讓學生自己按「我完成了」
  // （Padlet Arcade 等外部遊戲無法自動回報，所以建議保持 true）
  allowManualComplete: true,

  /* ---------- 建築種類 ----------
     每座島預設有前四種；第五種「補給站」需要時再加到島的 buildings 裡 */
  buildingTypes: {
    book:   { name: '觀星書屋', role: '概念學習', tag: '隨堂練習', npc: 'plusx' },
    dojo:   { name: '練功小屋', role: '基礎練習', tag: '學習扶助', npc: 'boy' },
    arena:  { name: '挑戰擂台', role: '進階題',   tag: '課後練習', npc: 'pk' },
    chest:  { name: '寶箱塔',   role: '單元闖關', tag: '過關得星光', npc: 'guai', star: true },
    supply: { name: '補給站',   role: '錯題複習', tag: '加強練習', npc: 'boy' }
  },
  defaultBuildings: ['book', 'dojo', 'arena', 'chest'],

  /* ---------- 島嶼 ----------
     theme 決定島的造型（請勿更改拼字）：
       coconut 椰子樹｜gear 齒輪｜dessert 蛋糕｜scale 天秤｜harbor 港口
       hive 蜂巢｜windmill 風車｜mirror 湖泊｜crystal 晶石｜volcano 火山

     games 填入每棟建築的遊戲網址：
       ・自己網站裡的遊戲：'games/檔名.html'
       ・外部網址：'https://...'
       ・無法嵌入的遊戲（開新分頁）：{ url: 'https://...', newTab: true }
       ・留空 ''：顯示「遊戲準備中」

     notes 是三位老師與小乖在這座島會多說的一句話（可留空） */
  islands: [
    {
      id: 'i1', name: '椰影灣', unit: '第一單元', theme: 'coconut',
      games: {
        book:  'games/demo-game.html',
        dojo:  'games/demo-game.html',
        arena: 'games/demo-game.html',
        chest: 'games/demo-game.html'
      },
      notes: {
        plusx: '椰影灣是旅程的起點，先把觀念讀懂，後面就輕鬆多了！',
        boy:   '第一次練習不用急，一題一題來。',
        pk:    '擂台的題目會比練功小屋難一點，準備好再上台！',
        guai:  '寶箱塔過關，就能點亮椰影灣的燈塔喔！'
      },
      qa: [
        // 這座島專屬的問答（學生問到關鍵字時，NPC 會用這裡的答案回答）
        // { q: '這座島要學什麼？', a: '請老師在這裡寫上單元重點。', k: ['學什麼', '重點'] }
      ]
    },
    { id: 'i2',  name: '齒輪島',   unit: '第二單元',     theme: 'gear',     games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] },
    { id: 'i3',  name: '甜點港',   unit: '第三單元',     theme: 'dessert',  games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] },
    { id: 'i4',  name: '天秤市集', unit: '第四單元',     theme: 'scale',    games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] },
    { id: 'mid', name: '半程星港', unit: '期中評量複習', theme: 'harbor',   games: { book: '', dojo: '', arena: '', chest: '' },
      notes: { plusx: '半程星港是期中複習站，前面四座島的觀念都會出現喔！', guai: '期中複習過關，也能拿到一顆星光！' }, qa: [] },
    { id: 'i5',  name: '蜂巢谷',   unit: '第五單元',     theme: 'hive',     games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] },
    { id: 'i6',  name: '風車原',   unit: '第六單元',     theme: 'windmill', games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] },
    { id: 'i7',  name: '鏡湖島',   unit: '第七單元',     theme: 'mirror',   games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] },
    { id: 'i8',  name: '晶石礦山', unit: '第八單元',     theme: 'crystal',  games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] },
    { id: 'i9',  name: '雲頂火山', unit: '第九單元',     theme: 'volcano',  games: { book: '', dojo: '', arena: '', chest: '' }, notes: {}, qa: [] }
    // 想要某座島只有 3 棟或 5 棟建築，加一行 buildings，例如：
    // buildings: ['book', 'dojo', 'arena', 'supply', 'chest'],
  ],

  finalIsland: { name: '星光燈塔' },

  /* ---------- NPC ----------
     look 是外觀：
       hair 髮型：short 短髮｜spiky 刺刺頭｜long 長髮｜bob 鮑伯頭｜buns 雙丸子｜ponytail 馬尾｜bald 光頭
       hairColor 髮色、outfit 衣服顏色、glasses 是否戴眼鏡、badge 胸前的字
     lines 是打招呼的台詞（隨機出現一句）
     qa 是預設問答：q 問題、a 回答、k 關鍵字（學生打字問問題時用來比對） */
  npcs: {
    grandpa: {
      name: '光爺爺', role: '燈塔守護者',
      look: { hair: 'bald', hairColor: '#f2f2f2', outfit: '#3d6fa8', beard: true, glasses: true, skin: '#f1c9a5', hat: 'captain' },
      lines: [
        '孩子，數光群島的燈塔一盞一盞熄滅了……只有解開數學謎題，光才會回來。',
        '每點亮一座島的燈塔，迷霧就會散去一些。'
      ],
      qa: [
        { q: '群島發生了什麼事？', a: '很久以前，十座島的燈塔都亮著。後來海上起了「混亂迷霧」，數字全都亂了套，燈塔也一盞盞熄滅。只要在每座島的寶箱塔過關，那座島的燈塔就會重新亮起來！', k: ['發生', '故事', '迷霧', '為什麼'] },
        { q: '集滿星光會怎樣？', a: '集滿十顆星光，就能點亮我這座「星光燈塔」，整片群島都會恢復光明！到時候我有一份大禮要送你。', k: ['集滿', '全部', '最後', '獎勵'] }
      ]
    },
    bonu: {
      name: '波妞', role: '航海嚮導',
      look: { hair: 'bob', hairColor: '#4a2c22', outfit: '#3fb6c9', skin: '#f6d3b3', ribbon: '#ff7a8a' },
      lines: ['嗨！我是波妞，我在海上幫大家帶路～', '要出航了嗎？我陪你一起！'],
      qa: [
        { q: '我下一站要去哪裡？', a: '@next', k: ['下一站', '去哪', '接下來', '下一個'] },
        { q: '要先玩哪一棟建築？', a: '建議照這個順序：先到觀星書屋看懂概念，再去練功小屋練習，接著上挑戰擂台，最後到寶箱塔闖關拿星光！', k: ['先玩', '順序', '哪一棟', '哪裡開始'] }
      ]
    },
    parrot: {
      name: '小數', role: '鸚鵡信差',
      lines: ['嘎！我是小數！不會操作就問我，有問題我幫你送信給老師！', '嘎嘎～有什麼問題想問老師嗎？'],
      qa: [
        { q: '要怎麼開船？', a: '點一下海面，船就會開過去；用鍵盤的方向鍵也可以喔！點小島，船會自動開到碼頭靠岸。', k: ['開船', '移動', '怎麼走', '操作', '方向'] },
        { q: '怎麼進入建築？', a: '上島之後，點一下建築，你的角色就會走過去，走到門口就會打開遊戲。', k: ['進入', '建築', '房子', '遊戲'] },
        { q: '怎麼換造型？', a: '點右上角的「收集冊」，就可以換造型和配件。每拿到一顆星光，小乖會送你一個新配件！', k: ['造型', '換衣服', '配件', '收集冊'] },
        { q: '我的進度會不見嗎？', a: '進度會記在這台裝置上；老師設定好試算表後，也會同步給老師。換裝置時，選同一個座號就能找回進度。', k: ['進度', '不見', '存檔', '記錄'] }
      ]
    },
    plusx: {
      name: '+x老師', role: '概念小辭典',
      look: { hair: 'short', hairColor: '#2b2b33', outfit: '#6b7fe0', glasses: true, skin: '#f3cfae', badge: '+x' },
      lines: ['歡迎來到觀星書屋！觀念懂了，題目就不可怕。', '看不懂的地方，可以問我喔！'],
      qa: [
        { q: '觀星書屋要做什麼？', a: '觀星書屋是用來「看懂觀念」的地方。玩完裡面的隨堂練習，你就會知道這個單元在學什麼。', k: ['書屋', '做什麼', '觀念', '概念'] },
        { q: '觀念看不懂怎麼辦？', a: '先慢慢再看一次，把關鍵字圈起來。如果還是不懂，打字問我，我會請小數把問題送給老師！', k: ['看不懂', '不懂', '不會', '聽不懂'] }
      ]
    },
    boy: {
      name: 'Boy老師', role: '學習扶助教練',
      look: { hair: 'spiky', hairColor: '#3a2a1e', outfit: '#3fae6a', skin: '#efc39c', badge: 'B' },
      lines: ['來練功小屋練基本功吧！錯了也沒關係，多練幾次就會了。', '卡住了嗎？我們一起想辦法！'],
      qa: [
        { q: '我卡關了怎麼辦？', a: '先深呼吸！把題目再讀一次，找出「已知」和「要求的」是什麼。還是卡住的話，可以回觀星書屋複習觀念，或打字問我。', k: ['卡關', '卡住', '過不了', '好難'] },
        { q: '錯很多題怎麼辦？', a: '錯題是最好的老師！把錯的題目記下來，再練一次。練功小屋可以一直重玩，沒有次數限制。', k: ['錯', '錯很多', '失敗', '答錯'] }
      ]
    },
    pk: {
      name: 'P.K.老師', role: '擂台裁判',
      look: { hair: 'short', hairColor: '#1f1f24', outfit: '#e2574c', skin: '#f0c7a4', badge: 'PK', headband: true },
      lines: ['挑戰者，準備好上擂台了嗎？', '擂台的題目比較難，但我相信你做得到！'],
      qa: [
        { q: '挑戰擂台怎麼玩？', a: '擂台是進階題，可以當作課後練習。題目會需要多想一步，建議練功小屋玩熟了再來挑戰！', k: ['擂台', '怎麼玩', '挑戰', '進階'] },
        { q: '挑戰失敗怎麼辦？', a: '失敗不扣分！看看哪一步想錯了，再上台一次。真正的高手都是輸過很多次的。', k: ['失敗', '輸', '沒過', '不會'] }
      ]
    },
    guai: {
      name: '小乖', role: '寶箱塔守門員',
      look: { hair: 'ponytail', hairColor: '#5a3622', outfit: '#f2b233', skin: '#f6d3b3', cap: '#e86a3a' },
      lines: ['我是小乖，寶箱塔的守門員！闖關成功就能拿到星光喔！', '每拿到一顆星光，我就送你一個新配件！'],
      qa: [
        { q: '星光要怎麼拿？', a: '在每座島的寶箱塔闖關成功，就能拿到那座島的星光，燈塔也會亮起來！', k: ['星光', '怎麼拿', '星星'] },
        { q: '配件要怎麼換？', a: '點右上角的「收集冊」，裡面有你解鎖的所有配件，點一下就能穿上或換下。', k: ['配件', '換', '收集冊', '造型'] }
      ]
    }
  },

  // 所有 NPC 都聽得懂的共通問答
  commonQA: [
    { q: '這個網站怎麼玩？', a: '開船到各座小島，進入島上的建築玩遊戲。在寶箱塔過關就能拿到星光，集滿十顆星光就能點亮最後的星光燈塔！', k: ['怎麼玩', '玩法', '規則'] }
  ],

  /* ---------- 學生造型 ---------- */
  avatarStyles: [
    { id: 'sailor',    name: '航海士' },
    { id: 'explorer',  name: '探險家' },
    { id: 'chef',      name: '小廚師' },
    { id: 'scientist', name: '科學家' },
    { id: 'wizard',    name: '魔法師' },
    { id: 'astronaut', name: '太空人' },
    { id: 'fisher',    name: '漁夫' },
    { id: 'painter',   name: '畫家' }
  ],
  avatarColors: ['#ef6a5b', '#f2a33a', '#f5d04c', '#5cc178', '#3fb6c9', '#5a86e0', '#9b72d9', '#ec7fb4'],
  hairColors:   ['#2b2220', '#6b4128', '#c98a4b', '#e9cf8a'],
  skinColors:   ['#f8dcc2', '#efc39c', '#c99470'],

  /* ---------- 集星光換配件 ----------
     stars：需要幾顆星光才解鎖；slot：sail 船帆、hull 船身、其他為穿戴 */
  rewards: [
    { stars: 1,  id: 'sail-star',    name: '星星船帆', slot: 'sail' },
    { stars: 2,  id: 'scarf',        name: '紅色圍巾', slot: 'wear' },
    { stars: 3,  id: 'flag',         name: '船頭小旗', slot: 'boat' },
    { stars: 4,  id: 'cape',         name: '冒險披風', slot: 'wear' },
    { stars: 5,  id: 'sail-rainbow', name: '彩虹船帆', slot: 'sail' },
    { stars: 6,  id: 'glasses',      name: '圓框眼鏡', slot: 'wear' },
    { stars: 7,  id: 'backpack',     name: '探險背包', slot: 'wear' },
    { stars: 8,  id: 'hull-gold',    name: '黃金船身', slot: 'hull' },
    { stars: 9,  id: 'starpin',      name: '星光髮夾', slot: 'wear' },
    { stars: 10, id: 'crown',        name: '群島王冠', slot: 'wear' }
  ]
};
