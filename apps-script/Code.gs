/* =========================================================
   數光群島｜Google 試算表後台（Apps Script）
   ---------------------------------------------------------
   使用方式：請照「設定教學」第 3 步操作。
   1. 在試算表選「擴充功能 → Apps Script」，把這整份程式貼上
   2. 先執行一次 setup（會自動建立三張工作表）
   3. 部署成「網頁應用程式」，存取權選「所有人」
   ========================================================= */

const CLASS_SIZE = 30;          // 班級人數（要跟網站的 classSize 一樣）
const TZ = 'Asia/Taipei';

const SHEET_SUMMARY = '全班進度';
const SHEET_LOG = '過關紀錄';
const SHEET_Q = '學生提問';

/** 第一次使用請執行這個函式 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sum = ss.getSheetByName(SHEET_SUMMARY) || ss.insertSheet(SHEET_SUMMARY);
  if (sum.getLastRow() === 0) {
    sum.getRange(1, 1, 2, 4).setValues([['座號', '姓名', '星光數', '完成關卡'], ['(key)', '', '', '']]);
    const rows = [];
    for (let n = 1; n <= CLASS_SIZE; n++) rows.push([n + ' 號', '', 0, '']);
    rows.push(['全班探險隊', '', 0, '']);
    sum.getRange(3, 1, rows.length, 4).setValues(rows);
    for (let r = 3; r < 3 + rows.length; r++) sum.getRange(r, 4).setFormula('=COUNTA(E' + r + ':' + r + ')');
    sum.setFrozenRows(2); sum.setFrozenColumns(4);
    sum.hideRows(2);
    sum.getRange('1:1').setFontWeight('bold').setBackground('#fff3dc');
  }

  let log = ss.getSheetByName(SHEET_LOG) || ss.insertSheet(SHEET_LOG);
  if (log.getLastRow() === 0) {
    log.appendRow(['時間', '座號', '姓名', '島嶼', '建築', '完成方式', '分數', '目前星光']);
    log.setFrozenRows(1); log.getRange('1:1').setFontWeight('bold').setBackground('#fff3dc');
  }

  let q = ss.getSheetByName(SHEET_Q) || ss.insertSheet(SHEET_Q);
  if (q.getLastRow() === 0) {
    q.appendRow(['編號', '時間', '座號', '姓名', '問誰', '在哪座島', '學生的問題', '老師回覆（填在這一欄）']);
    q.setFrozenRows(1); q.getRange('1:1').setFontWeight('bold').setBackground('#fff3dc');
    q.getRange('H1').setBackground('#ffe08a');
    q.setColumnWidth(7, 320); q.setColumnWidth(8, 320);
  }

  const first = ss.getSheetByName('工作表1') || ss.getSheetByName('Sheet1');
  if (first && ss.getSheets().length > 3 && first.getLastRow() === 0) ss.deleteSheet(first);
}

/** 網站送來的資料（過關、提問） */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'complete') recordComplete(data);
    else if (data.action === 'question') recordQuestion(data);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** 網站來查詢資料（進度、老師回信） */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'progress') return json({ done: getDone(p.seat), name: getName(p.seat) });
  if (p.action === 'replies') return json({ replies: getReplies(p.seat) });
  return json({ ok: true, message: '數光群島後台運作中' });
}

/* ---------------- 內部函式 ---------------- */
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function now() { return Utilities.formatDate(new Date(), TZ, 'yyyy/MM/dd HH:mm'); }
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(name)) setup();
  return ss.getSheetByName(name);
}
const FIRST = 5; // 第一個關卡欄位（E 欄）
function findSeat(sum, seat) {
  const last = sum.getLastRow();
  const seats = last >= 3 ? sum.getRange(3, 1, last - 2, 1).getValues().map(r => String(r[0])) : [];
  const i = seats.indexOf(String(seat));
  return i >= 0 ? i + 3 : -1;
}
function seatRow(sum, seat, name) {
  let r = findSeat(sum, seat);
  if (r < 0) {
    r = sum.getLastRow() + 1;
    sum.getRange(r, 1, 1, 3).setValues([[seat, '', 0]]);
    sum.getRange(r, 4).setFormula('=COUNTA(E' + r + ':' + r + ')');
  }
  if (name && String(sum.getRange(r, 2).getValue()) !== String(name)) sum.getRange(r, 2).setValue(name);
  return r;
}
function getName(seat) {
  const sum = sheet(SHEET_SUMMARY), r = findSeat(sum, seat);
  return r < 0 ? '' : String(sum.getRange(r, 2).getValue() || '');
}
function keyColumn(sum, data) {
  const id = (data.order || '9999') + '|' + data.key;
  const lastCol = Math.max(sum.getLastColumn(), FIRST - 1);
  const keys = lastCol >= FIRST ? sum.getRange(2, FIRST, 1, lastCol - FIRST + 1).getValues()[0].map(String) : [];
  const found = keys.indexOf(id);
  if (found >= 0) return found + FIRST;
  // 依島嶼順序插入新欄位
  let pos = keys.findIndex(k => k > id);
  let col;
  if (pos < 0) { col = lastCol + 1; }
  else { col = pos + FIRST; sum.insertColumnBefore(col); }
  sum.getRange(1, col).setValue(data.island + '｜' + data.buildingName + (data.star ? ' ★' : ''))
    .setFontWeight('bold').setBackground(data.star ? '#ffe08a' : '#fff3dc').setWrap(true);
  sum.getRange(2, col).setValue(id);
  sum.setColumnWidth(col, 96);
  return col;
}
function recordComplete(d) {
  const sum = sheet(SHEET_SUMMARY);
  const r = seatRow(sum, d.seat, d.name), c = keyColumn(sum, d);
  if (!sum.getRange(r, c).getValue()) sum.getRange(r, c).setValue('✓ ' + Utilities.formatDate(new Date(), TZ, 'M/d'));
  const cur = Number(sum.getRange(r, 3).getValue()) || 0;
  if (Number(d.stars) > cur) sum.getRange(r, 3).setValue(Number(d.stars));
  sheet(SHEET_LOG).appendRow([now(), d.seat, d.name || '', d.island, d.buildingName, d.how === 'auto' ? '自動過關' : '學生按完成', d.score || '', d.stars]);
}
function recordQuestion(d) {
  const q = sheet(SHEET_Q);
  const id = 'Q' + new Date().getTime();
  q.appendRow([id, now(), d.seat, d.name || '', d.npc, d.island, d.question, '']);
  if (d.name) seatRow(sheet(SHEET_SUMMARY), d.seat, d.name);
}
function getDone(seat) {
  const sum = sheet(SHEET_SUMMARY);
  const lastCol = sum.getLastColumn();
  if (lastCol < FIRST) return [];
  const r = findSeat(sum, seat);
  if (r < 0) return [];
  const keys = sum.getRange(2, FIRST, 1, lastCol - FIRST + 1).getValues()[0];
  const vals = sum.getRange(r, FIRST, 1, lastCol - FIRST + 1).getValues()[0];
  const out = [];
  keys.forEach((k, j) => { if (vals[j] && k) out.push(String(k).split('|')[1]); });
  return out;
}
function getReplies(seat) {
  const q = sheet(SHEET_Q);
  const last = q.getLastRow();
  if (last < 2) return [];
  return q.getRange(2, 1, last - 1, 8).getValues()
    .filter(r => String(r[2]) === String(seat) && String(r[7]).trim())
    .map(r => ({ id: String(r[0]), npc: r[4], island: r[5], question: r[6], reply: r[7] }));
}
