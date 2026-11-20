/* 數光群島｜主程式
   一般不需要修改這個檔案；內容請改 js/config.js */
(function () {
  'use strict';
  const C = window.SHUGUANG;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = s => document.querySelector(s);
  const svg = $('#world');
  const f1 = n => Math.round(n * 10) / 10;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BT = C.buildingTypes;

  /* ====================== 資料 ====================== */
  const islands = C.islands.map((isl, i) => Object.assign({}, isl, {
    idx: i, buildings: (isl.buildings || C.defaultBuildings).filter(t => BT[t]),
    games: isl.games || {}, notes: isl.notes || {}, qa: isl.qa || []
  }));
  const TOTAL = islands.length;

  /* ====================== 儲存 ====================== */
  const KEY = 'shuguang.v1';
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
  store.profiles = store.profiles || {}; store.queue = store.queue || [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { } };

  let seat = null, prof = null;
  function getProfile(s) {
    if (!store.profiles[s]) store.profiles[s] = { avatar: null, done: {}, equip: [], seen: [], intro: false };
    const p = store.profiles[s]; p.equip = p.equip || []; p.seen = p.seen || []; p.done = p.done || {};
    return p;
  }
  const seatName = s => s === 'class' ? '全班探險隊' : s + ' 號';
  const displayName = () => seat === 'class' ? '全班探險隊' : (seat + '號' + (prof && prof.name ? ' ' + prof.name : ''));
  const doneKey = (isl, t) => isl.id + '/' + t;
  const isDone = (isl, t) => !!(prof && prof.done[doneKey(isl, t)]);
  const starOf = isl => isl.buildings.some(t => BT[t].star && isDone(isl, t));
  const starCount = () => islands.filter(starOf).length;
  const unlocked = () => C.rewards.filter(r => starCount() >= r.stars);

  /* ====================== 試算表同步 ====================== */
  function post(payload) {
    payload.seat = seatName(seat); payload.name = (prof && prof.name) || ''; payload.time = new Date().toISOString();
    if (!C.sheetUrl) { store.queue.push(payload); save(); return; }
    fetch(C.sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .catch(() => { store.queue.push(payload); save(); });
  }
  function flushQueue() {
    if (!C.sheetUrl || !store.queue.length) return;
    const q = store.queue.splice(0); save();
    q.forEach(p => fetch(C.sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) })
      .catch(() => { store.queue.push(p); save(); }));
  }
  function getJSON(params) {
    if (!C.sheetUrl) return Promise.reject('no url');
    const qs = Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
    return fetch(C.sheetUrl + (C.sheetUrl.indexOf('?') >= 0 ? '&' : '?') + qs).then(r => r.json());
  }
  let replies = [];
  function syncFromSheet() {
    if (!C.sheetUrl || !seat) return;
    const s = seatName(seat);
    getJSON({ action: 'progress', seat: s }).then(d => {
      if (d && d.name && !prof.name) { prof.name = d.name; save(); refreshHud(); }
      if (d && d.done) { let changed = false; d.done.forEach(k => { if (!prof.done[k]) { prof.done[k] = Date.now(); changed = true; } }); if (changed) { save(); refresh(); } }
    }).catch(() => { });
    checkReplies();
  }
  function checkReplies() {
    if (!C.sheetUrl || !seat) return;
    getJSON({ action: 'replies', seat: seatName(seat) }).then(d => {
      replies = (d && d.replies) || [];
      updateParrotBubble();
    }).catch(() => { });
  }
  const unreadReplies = () => replies.filter(r => prof && prof.seen.indexOf(String(r.id)) < 0);

  /* ====================== 共用 UI ====================== */
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
  function hint(msg) { $('#hint').textContent = msg; $('#hint').style.display = msg ? '' : 'none'; }
  function refreshHud() {
    $('#starCount').textContent = starCount() + ' / ' + TOTAL;
    $('#seatLabel').textContent = seat ? displayName() : '登入';
  }
  const open = id => $(id).classList.add('on');
  const close = id => $(id).classList.remove('on');
  const anyOverlay = () => document.querySelector('.overlay.on') || $('#dialog').classList.contains('on');

  function svgEl(html, attrs) {
    const g = document.createElementNS(NS, 'g');
    if (attrs) Object.keys(attrs).forEach(k => g.setAttribute(k, attrs[k]));
    g.innerHTML = html; return g;
  }
  function nameTag(text, color) {
    const w = Math.max(40, [...text].length * 15 + 18);
    return `<g transform="translate(0,-4)"><rect x="${-w / 2}" y="-14" width="${w}" height="24" rx="12" fill="${color || '#fffaf0'}" stroke="#ead9b8" stroke-width="2"/><text x="0" y="3" text-anchor="middle" font-size="14" fill="#4a3a2c">${esc(text)}</text></g>`;
  }
  function svgPoint(e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* ====================== 角色外觀 ====================== */
  const wearIds = () => prof ? prof.equip.filter(id => { const r = C.rewards.find(x => x.id === id); return r && r.slot === 'wear' && starCount() >= r.stars; }) : [];
  const equipped = slot => prof ? prof.equip.find(id => { const r = C.rewards.find(x => x.id === id); return r && r.slot === slot && starCount() >= r.stars; }) : null;
  const playerLook = () => A.avatarLook(prof.avatar);
  const playerChar = () => A.character(playerLook(), wearIds());
  const playerBoat = () => A.boat({ sail: equipped('sail'), hull: equipped('hull'), flag: !!equipped('boat'), rider: playerChar() });
  const npcSvg = id => id === 'parrot' ? A.parrot() : A.character(C.npcs[id].look, []);

  /* ====================== 世界地圖配置 ====================== */
  // 島嶼由左到右、由上到下排列（每排 4 座，最後一排置中）
  const MAP = { nodes: [], docks: [] };
  function layoutMap() {
    const N = TOTAL + 1, per = 4, rows = Math.ceil(N / per);
    const top = 215, bottom = rows > 3 ? 820 : 775;
    const xs = [230, 610, 990, 1370];
    MAP.nodes = []; MAP.docks = [];
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / per), c = i % per;
      const inRow = Math.min(per, N - r * per);
      const x = xs[c] + (per - inRow) * 190;
      const y = rows === 1 ? 480 : top + (bottom - top) * r / (rows - 1);
      const isl = i < TOTAL ? islands[i] : null;
      const node = { i, row: r, x, y: y + (i % 2 ? 14 : -14), rx: 118, ry: 66, isl };
      if (isl && isl.x) node.x = isl.x; if (isl && isl.y) node.y = isl.y;
      if (!isl) { node.rx = 104; node.ry = 60; }
      node.lane = node.y + 128 - (i % 2 ? 14 : -14);
      MAP.nodes.push(node);
      MAP.docks[i] = [node.x, node.lane];
    }
  }

  /* ====================== 場景狀態 ====================== */
  const S = {
    scene: 'map', islandIdx: -1,
    boat: { x: 0, y: 0, path: [], dir: 1, onArrive: null },
    bonu: { x: 0, y: 0, dir: 1 },
    parrot: { x: 800, y: 300, t: 0, dir: 1 },
    player: { x: 0, y: 0, path: [], dir: 1, onArrive: null, walking: false },
    npcs: [], keys: {}, els: {}, sortables: [], obstacles: [], walk: null
  };

  /* ====================== 世界地圖 ====================== */
  function renderMap() {
    S.scene = 'map';
    svg.setAttribute('viewBox', '0 0 1600 1000');
    const rnd = D.rng(7);
    let s = `<rect x="-400" y="-300" width="2400" height="1600" fill="#8fd6e4" data-act="water"/>`;
    // 海面裝飾
    s += `<g class="waves" pointer-events="none">`;
    for (let i = 0; i < 46; i++) {
      const x = rnd() * 1600, y = rnd() * 1000, w = 14 + rnd() * 18;
      s += `<path d="M${f1(x)},${f1(y)} q${f1(w / 2)},-6 ${f1(w)},0" stroke="#ffffff" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>`;
    }
    s += `</g>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${f1(rnd() * 1600)}" cy="${f1(rnd() * 1000)}" rx="${f1(140 + rnd() * 120)}" ry="${f1(40 + rnd() * 30)}" fill="#a3dfea" opacity=".6" pointer-events="none"/>`;
    // 碼頭
    MAP.nodes.forEach(n => {
      const top = n.y + n.ry * 0.7, bot = n.lane - 14;
      s += `<g pointer-events="none"><rect x="${n.x - 9}" y="${top}" width="18" height="${bot - top}" fill="#b98a5c"/><rect x="${n.x - 9}" y="${top}" width="18" height="${bot - top}" fill="none" stroke="#8a6141" stroke-width="1.5" stroke-dasharray="0 8 10 0"/>` +
        `<rect x="${n.x - 13}" y="${bot - 2}" width="5" height="12" fill="#8a6141"/><rect x="${n.x + 8}" y="${bot - 2}" width="5" height="12" fill="#8a6141"/></g>`;
    });
    // 島嶼
    MAP.nodes.forEach(n => {
      if (n.isl) {
        const isl = n.isl, lit = starOf(isl);
        s += `<g data-act="island" data-idx="${n.i}">` + A.island('m' + n.i, n.x, n.y, n.rx, n.ry, 101 + n.i * 17, isl.theme) +
          A.landmark(isl.theme, n.x - 18, n.y - 4, 0.66, n.i) +
          D.lighthouse(n.x + n.rx * 0.62, n.y - n.ry * 0.12, 0.62, lit) + `</g>`;
      } else {
        const lit = starCount() >= TOTAL;
        s += `<g data-act="final">` + A.island('mf', n.x, n.y, n.rx, n.ry, 999, 'final') +
          D.tree(n.x - 70, n.y + 6, 0.9) + D.tree(n.x + 66, n.y + 12, 0.8, '#6cc77a') +
          D.lighthouse(n.x + 6, n.y + 2, 1.25, lit) + `</g>`;
      }
    });
    // 迷霧
    MAP.nodes.forEach(n => { if (n.isl) s += `<g pointer-events="none" class="fog ${starOf(n.isl) ? 'clear' : ''}" data-fog="${n.i}">${D.fog(n.x - 6, n.y - 34, n.rx * 2.1)}</g>`; });
    // 島名牌
    MAP.nodes.forEach(n => {
      const isl = n.isl;
      const title = isl ? `${n.i + 1}　${isl.name}` : `★　${C.finalIsland.name}`;
      const w = [...title].length * 17 + 30;
      const y = n.y + n.ry * 0.58;
      let dots = '';
      if (isl) {
        const k = isl.buildings.length;
        isl.buildings.forEach((t, j) => {
          const dx = (j - (k - 1) / 2) * 16, d = isDone(isl, t);
          dots += BT[t].star
            ? `<text x="${dx}" y="${y + 30}" text-anchor="middle" font-size="15" fill="${d ? '#f2b233' : '#cbbfa8'}">★</text>`
            : `<circle cx="${dx}" cy="${y + 25}" r="5" fill="${d ? '#5cc178' : '#e6dcc8'}" stroke="#fff" stroke-width="1.5"/>`;
        });
      } else dots = `<text x="0" y="${y + 30}" text-anchor="middle" font-size="14" fill="#7a6652">${starCount()} / ${TOTAL}</text>`;
      s += `<g data-act="${isl ? 'island' : 'final'}" data-idx="${n.i}" transform="translate(${n.x},0)">` +
        `<rect x="${-w / 2}" y="${y - 16}" width="${w}" height="30" rx="15" fill="#fffaf0" stroke="#e2c89a" stroke-width="2.5"/>` +
        `<text x="0" y="${y + 5}" text-anchor="middle" font-size="17" fill="#4a3a2c">${esc(title)}</text>` +
        (isl ? `<rect x="${-isl.buildings.length * 8 - 6}" y="${y + 16}" width="${isl.buildings.length * 16 + 12}" height="20" rx="10" fill="rgba(255,250,240,.85)"/>` : `<rect x="-30" y="${y + 16}" width="60" height="20" rx="10" fill="rgba(255,250,240,.85)"/>`) +
        dots + `</g>`;
    });
    // 光爺爺（終點）
    const fn = MAP.nodes[MAP.nodes.length - 1];
    s += `<g data-act="npc" data-npc="grandpa" transform="translate(${fn.x - 52},${fn.y + 4})"><g class="idle"><g transform="scale(1.15)">${npcSvg('grandpa')}</g></g><g transform="translate(0,-80)">${nameTag('光爺爺')}</g></g>`;
    // 動態角色層
    s += `<g id="mapEntities"></g>`;
    svg.innerHTML = s;

    const ent = $('#mapEntities');
    S.els.bonu = svgEl('', { 'data-act': 'npc', 'data-npc': 'bonu' });
    S.els.boat = svgEl('');
    S.els.parrot = svgEl('', { 'data-act': 'npc', 'data-npc': 'parrot' });
    ent.appendChild(S.els.bonu); ent.appendChild(S.els.boat); ent.appendChild(S.els.parrot);
    drawMapEntities();
    S.els.boat.style.pointerEvents = 'none';
    $('#crumb').classList.remove('on'); $('#backBtn').classList.remove('on');
    hint('點小島就會開船過去・也可以用方向鍵自由航行');
  }
  function drawMapEntities() {
    if (!prof || !prof.avatar) return;
    S.els.boat.innerHTML = `<g class="flip">${playerBoat()}</g><g transform="translate(0,-86)">${nameTag(displayName(), '#fff3c4')}</g>`;
    S.els.bonu.innerHTML = `<g class="flip">${A.boat({ sailColor: '#ffe0e6', hullColor: '#3fa5b8', rider: npcSvg('bonu') })}</g><g transform="translate(0,-84)">${nameTag('波妞')}</g>`;
    S.els.parrot.innerHTML = `<g class="flip"><g transform="scale(1.4)">${A.parrot()}</g></g><g transform="translate(0,-34)">${nameTag('小數')}</g><g class="mail" style="display:none"><g class="bubble-bob"><circle cx="22" cy="-50" r="13" fill="#ef7a5b"/><text x="22" y="-45" text-anchor="middle" font-size="15" fill="#fff">✉</text></g></g>`;
    updateParrotBubble();
    placeMapEntities();
  }
  function updateParrotBubble() {
    const m = S.els.parrot && S.els.parrot.querySelector('.mail');
    if (m) m.style.display = unreadReplies().length ? '' : 'none';
  }
  function placeMapEntities() {
    const b = S.boat, n = S.bonu, p = S.parrot;
    S.els.boat.setAttribute('transform', `translate(${f1(b.x)},${f1(b.y)})`);
    S.els.boat.querySelector('.flip') && S.els.boat.querySelector('.flip').setAttribute('transform', `scale(${b.dir},1)`);
    S.els.bonu.setAttribute('transform', `translate(${f1(n.x)},${f1(n.y)})`);
    S.els.bonu.querySelector('.flip') && S.els.bonu.querySelector('.flip').setAttribute('transform', `scale(${n.dir},1)`);
    S.els.parrot.setAttribute('transform', `translate(${f1(p.x)},${f1(p.y)})`);
    S.els.parrot.querySelector('.flip') && S.els.parrot.querySelector('.flip').setAttribute('transform', `scale(${p.dir},1)`);
  }
  function inIsland(x, y, pad) {
    pad = pad || 0;
    return MAP.nodes.some(n => {
      const dx = (x - n.x) / (n.rx + 14 + pad), dy = (y - (n.y + 18)) / (n.ry + 34 + pad);
      return dx * dx + dy * dy < 1;
    });
  }
  // 找一條不會穿過小島的海上航線（格子搜尋）
  const CELL = 20, GW = 80, GH = 50;
  let blockedGrid = null;
  function buildGrid() {
    blockedGrid = new Uint8Array(GW * GH);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
      blockedGrid[gy * GW + gx] = (inIsland(x, y, 8) || y < 60) ? 1 : 0;
    }
  }
  function clearLine(a, b) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(d / 8);
    for (let k = 1; k < n; k++) { const t = k / n; if (inIsland(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 4)) return false; }
    return true;
  }
  function findPath(from, to) {
    if (!blockedGrid) buildGrid();
    if (clearLine(from, to)) return [to];
    const cell = p => [Math.max(0, Math.min(GW - 1, Math.floor(p[0] / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(p[1] / CELL)))];
    const free = c => {
      if (!blockedGrid[c[1] * GW + c[0]]) return c;
      for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = c[0] + dx, y = c[1] + dy;
        if (x >= 0 && y >= 0 && x < GW && y < GH && !blockedGrid[y * GW + x]) return [x, y];
      }
      return c;
    };
    const s0 = free(cell(from)), g0 = free(cell(to));
    const prev = new Int32Array(GW * GH).fill(-1), seen = new Uint8Array(GW * GH);
    const q = [s0[1] * GW + s0[0]]; seen[q[0]] = 1;
    const goal = g0[1] * GW + g0[0];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let h = 0; h < q.length; h++) {
      const cur = q[h]; if (cur === goal) break;
      const cx = cur % GW, cy = (cur / GW) | 0;
      for (const [dx, dy] of dirs) {
        const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
        const id = y * GW + x; if (seen[id] || blockedGrid[id]) continue;
        if (dx && dy && (blockedGrid[cy * GW + x] || blockedGrid[y * GW + cx])) continue;
        seen[id] = 1; prev[id] = cur; q.push(id);
      }
    }
    if (!seen[goal]) return [to];
    const pts = [];
    for (let id = goal; id !== -1; id = prev[id]) pts.unshift([(id % GW) * CELL + CELL / 2, ((id / GW) | 0) * CELL + CELL / 2]);
    pts.push(to);
    // 拉直：能直線到達的點就跳過
    const out = []; let a = from, k = 0;
    while (k < pts.length) {
      let j = pts.length - 1;
      while (j > k && !clearLine(a, pts[j])) j--;
      out.push(pts[j]); a = pts[j]; k = j + 1;
    }
    return out;
  }
  function sailTo(i) {
    S.boat.path = findPath([S.boat.x, S.boat.y], MAP.docks[i]);
    S.boat.free = false;
    S.boat.onArrive = () => {
      if (i < TOTAL) enterIsland(i);
      else openDialog('grandpa');
    };
  }
  function nearDock() {
    for (let i = 0; i < MAP.nodes.length; i++) {
      const d = MAP.docks[i];
      if (Math.hypot(S.boat.x - d[0], S.boat.y - d[1]) < 60) return i;
    }
    return -1;
  }

  /* ====================== 島嶼場景 ====================== */
  const ISL = { cx: 800, cy: 520, rx: 610, ry: 300, depth: 64 };
  const SLOTS = {
    3: [[540, 450], [1060, 450], [800, 650]],
    4: [[510, 430], [1100, 430], [580, 660], [975, 675]],
    5: [[490, 440], [1110, 440], [590, 665], [1010, 665], [800, 530]]
  };
  function enterIsland(i) {
    transition(() => renderIsland(i));
  }
  function renderIsland(i) {
    S.scene = 'island'; S.islandIdx = i;
    svg.setAttribute('viewBox', '0 55 1600 1000');
    const isl = islands[i], pal = A.palette[isl.theme];
    const rnd = D.rng(300 + i * 13);
    let s = `<rect x="-400" y="-300" width="2400" height="1600" fill="#8fd6e4" data-act="water"/>`;
    s += `<g class="waves" pointer-events="none">`;
    for (let k = 0; k < 30; k++) { const x = rnd() * 1600, y = rnd() * 1000, w = 16 + rnd() * 18; s += `<path d="M${f1(x)},${f1(y)} q${f1(w / 2)},-6 ${f1(w)},0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>`; }
    s += `</g>`;
    // 碼頭 + 船
    s += `<g data-act="dock"><rect x="770" y="780" width="60" height="150" fill="#b98a5c"/><g stroke="#8a6141" stroke-width="2">` +
      [800, 830, 860, 890, 920].map(y => `<line x1="770" y1="${y}" x2="830" y2="${y}"/>`).join('') + `</g>` +
      `<rect x="764" y="900" width="8" height="34" fill="#8a6141"/><rect x="828" y="900" width="8" height="34" fill="#8a6141"/></g>`;
    s += `<g data-act="dock" transform="translate(900,930)">${A.boat({ sail: equipped('sail'), hull: equipped('hull'), flag: !!equipped('boat') })}</g>`;
    s += A.island('is' + i, ISL.cx, ISL.cy, ISL.rx, ISL.ry, 101 + i * 17, isl.theme, ISL.depth);
    s += `<g data-act="ground"><path d="${D.blobPath(ISL.cx - ISL.rx * 0.02, ISL.cy - 5, ISL.rx * 0.84, ISL.ry * 0.78, D.blobFactors(101 + i * 17, 11, 0.11))}" fill="transparent"/></g>`;
    // 小路（從碼頭到各建築）
    const slotsP = SLOTS[isl.buildings.length] || SLOTS[4];
    s += `<g pointer-events="none" fill="none" stroke="${D.shade(pal.sand, -0.04)}" stroke-width="34" stroke-linecap="round" opacity=".9"><path d="M800,800 L800,610"/>` +
      isl.buildings.map((t, k) => { const [x, y] = slotsP[k] || [800, 500]; return `<path d="M800,610 Q${(800 + x) / 2},${Math.max(y + 60, 600)} ${x},${y + 40}"/>`; }).join('') + `</g>`;
    // 花草
    for (let k = 0; k < 40; k++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      const x = ISL.cx + Math.cos(a) * r * 470, y = ISL.cy + Math.sin(a) * r * 210;
      s += `<g pointer-events="none">${D.flower(x, y, ['#ff9aa2', '#ffd34d', '#ffffff', '#b7a4f0'][k % 4])}</g>`;
    }
    s += `<g id="sortLayer"></g>`;
    svg.innerHTML = s;

    const layer = $('#sortLayer');
    S.sortables = []; S.obstacles = []; S.npcs = [];
    const add = (el, y, obj) => { layer.appendChild(el); const o = Object.assign({ el, y }, obj || {}); S.sortables.push(o); return o; };

    // 地標
    add(svgEl(A.landmark(isl.theme, 800, 330, 1.5, i), { 'pointer-events': 'none' }), 330);
    S.obstacles.push({ x: 800, y: 330, rx: 90, ry: 40 });
    // 樹
    const trees = [[300, 520], [1300, 520], [380, 380], [1220, 380], [420, 700], [1180, 700], [700, 300], [920, 290]];
    trees.forEach(([x, y], k) => {
      const art = isl.theme === 'coconut' ? D.palm(x, y, 0.9, k % 2) : isl.theme === 'volcano' || isl.theme === 'crystal' ? D.rock(x, y, 1.6, isl.theme === 'crystal' ? '#b7a4d6' : '#8f7a68') : D.tree(x, y, 1.3, k % 2 ? '#5fbf6b' : '#73c95c');
      add(svgEl(art, { 'pointer-events': 'none' }), y);
      S.obstacles.push({ x, y, rx: 22, ry: 12 });
    });
    // 建築
    const slots = SLOTS[isl.buildings.length] || SLOTS[4];
    isl.buildings.forEach((t, k) => {
      const [x, y] = slots[k] || [800, 500];
      const b = A.building(t, x, y, isDone(isl, t));
      const done = isDone(isl, t), bt = BT[t];
      const label = `<g transform="translate(${x},${y + 66})">` +
        `<rect x="-74" y="-18" width="148" height="44" rx="14" fill="#fffaf0" stroke="${done ? '#8fcf9f' : '#e2c89a'}" stroke-width="3"/>` +
        `<text x="0" y="1" text-anchor="middle" font-size="18" fill="#4a3a2c">${esc(bt.name)}</text>` +
        `<text x="0" y="19" text-anchor="middle" font-size="12.5" fill="#7a6652">${esc(bt.role)}・${esc(bt.tag)}</text>` +
        (done ? `<g transform="translate(66,-16)"><circle r="14" fill="#5cc178" stroke="#fff" stroke-width="3"/><path d="M-6,0 L-2,5 L7,-5" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>` : '') + `</g>`;
      const el = svgEl(b.svg + label, { 'data-act': 'building', 'data-type': t });
      const door = [x + b.door[0] * 0.6, y + 52];
      add(el, y, { building: t, door });
      S.obstacles.push({ x, y: y - 4, rx: 70, ry: 36 });
      // 這棟建築的 NPC
      if (bt.npc && C.npcs[bt.npc]) {
        const nx = x + b.npc[0], ny = y + b.npc[1] + 20;
        const npc = { id: bt.npc, homeX: nx, homeY: ny, x: nx, y: ny, tx: nx, ty: ny, wait: rnd() * 3, dir: 1, building: t };
        const nel = svgEl(`<g class="pose idle"><g class="flip"><g transform="scale(1.55)">${npcSvg(bt.npc)}</g></g></g><g transform="translate(0,-104)">${nameTag(C.npcs[bt.npc].name)}</g>`, { 'data-act': 'npc', 'data-npc': bt.npc });
        npc.sort = add(nel, ny, { npc });
        S.npcs.push(npc);
      }
    });
    // 玩家
    S.player.x = 800; S.player.y = 770; S.player.path = []; S.player.onArrive = null;
    const pel = svgEl(`<g class="pose idle"><g class="flip"><g transform="scale(1.6)">${playerChar()}</g></g></g><g transform="translate(0,-108)">${nameTag(displayName(), '#fff3c4')}</g>`, { 'pointer-events': 'none' });
    S.player.sort = add(pel, S.player.y, { player: true });
    S.els.player = pel;
    S.walk = { cx: 795, cy: 530, rx: 485, ry: 232 };
    placeIslandEntities(true);

    $('#crumb').innerHTML = `🏝️ ${esc(isl.name)}<span style="color:#7a6652;font-size:14px">｜${esc(isl.unit)}</span>`;
    $('#crumb').classList.add('on'); $('#backBtn').classList.add('on');
    hint('點建築進入遊戲・點老師可以問問題・走回碼頭就能回到海上');
  }
  function placeIslandEntities(force) {
    const p = S.player;
    S.els.player.setAttribute('transform', `translate(${f1(p.x)},${f1(p.y)})`);
    S.els.player.querySelector('.flip').setAttribute('transform', `scale(${p.dir},1)`);
    const pose = S.els.player.querySelector('.pose'); pose.setAttribute('class', 'pose ' + (p.walking ? 'walking' : 'idle'));
    p.sort.y = p.y;
    S.npcs.forEach(n => {
      n.sort.el.setAttribute('transform', `translate(${f1(n.x)},${f1(n.y)})`);
      n.sort.el.querySelector('.flip').setAttribute('transform', `scale(${n.dir},1)`);
      n.sort.el.querySelector('.pose').setAttribute('class', 'pose ' + (n.walking ? 'walking' : 'idle'));
      n.sort.y = n.y;
    });
    // 依前後排序（y 大的在前面）
    const sorted = S.sortables.slice().sort((a, b) => a.y - b.y);
    const layer = $('#sortLayer');
    let needs = force;
    if (!needs) { const ch = layer.children; for (let k = 0; k < sorted.length; k++) if (ch[k] !== sorted[k].el) { needs = true; break; } }
    if (needs) sorted.forEach(o => layer.appendChild(o.el));
  }
  function walkable(x, y) {
    const w = S.walk, dx = (x - w.cx) / w.rx, dy = (y - w.cy) / w.ry;
    if (dx * dx + dy * dy > 1 && !(Math.abs(x - 800) < 34 && y > 700 && y < 900)) return false;
    return !S.obstacles.some(o => { const ex = (x - o.x) / o.rx, ey = (y - o.y) / o.ry; return ex * ex + ey * ey < 1; });
  }
  function clampWalk(x, y) {
    const w = S.walk, dx = (x - w.cx) / w.rx, dy = (y - w.cy) / w.ry, d = Math.sqrt(dx * dx + dy * dy);
    if (d <= 0.97) return [x, y];
    return [w.cx + dx / d * 0.97 * w.rx, w.cy + dy / d * 0.97 * w.ry];
  }
  function walkTo(x, y, onArrive) { S.player.path = [[x, y]]; S.player.onArrive = onArrive || null; }

  /* ====================== 場景切換 ====================== */
  function transition(fn) {
    const st = $('#stage'); st.classList.add('fade');
    setTimeout(() => { fn(); st.classList.remove('fade'); }, 420);
  }
  function backToSea() {
    closeDialog();
    const i = S.islandIdx;
    transition(() => {
      renderMap();
      const d = MAP.docks[i];
      S.boat.x = d[0]; S.boat.y = d[1] + 20; S.boat.path = [];
      S.bonu.x = S.boat.x - 80; S.bonu.y = S.boat.y + 30;
      placeMapEntities();
    });
  }

  /* ====================== 點擊 ====================== */
  svg.addEventListener('click', e => {
    if (!prof || anyOverlay()) return;
    const t = e.target.closest('[data-act]');
    const act = t ? t.getAttribute('data-act') : 'water';
    const p = svgPoint(e);
    if (S.scene === 'map') {
      if (act === 'island') sailTo(+t.getAttribute('data-idx'));
      else if (act === 'final') sailTo(TOTAL);
      else if (act === 'npc') { const id = t.getAttribute('data-npc'); if (id === 'grandpa') sailTo(TOTAL); else openDialog(id); }
      else {
        if (inIsland(p.x, p.y)) return;
        S.boat.path = findPath([S.boat.x, S.boat.y], [p.x, p.y]); S.boat.onArrive = null; S.boat.free = false;
      }
    } else {
      if (act === 'building') {
        const type = t.getAttribute('data-type'), o = S.sortables.find(x => x.building === type);
        walkTo(o.door[0], o.door[1], () => openGame(S.islandIdx, type));
      } else if (act === 'npc') {
        const id = t.getAttribute('data-npc'), n = S.npcs.find(x => x.id === id);
        n.path = null; n.tx = n.x; n.ty = n.y; n.wait = 6;
        const side = S.player.x < n.x ? -1 : 1;
        walkTo(n.x + side * 58, n.y + 6, () => { n.dir = side; S.player.dir = -side; openDialog(id, { island: islands[S.islandIdx] }); });
      } else if (act === 'dock') {
        walkTo(800, 860, backToSea);
      } else {
        const [x, y] = clampWalk(p.x, p.y);
        walkTo(x, y);
      }
    }
  });
  $('#backBtn').addEventListener('click', () => { if (!anyOverlay()) backToSea(); });

  /* ====================== 鍵盤 ====================== */
  const KEYMAP = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', s: 'd', a: 'l', d: 'r', W: 'u', S: 'd', A: 'l', D: 'r' };
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Escape') { closeDialog(); ['#gameModal', '#bookModal', '#celebrate'].forEach(close); if (S.game) closeGame(); return; }
    if (!prof || anyOverlay()) return;
    if (KEYMAP[e.key]) { S.keys[KEYMAP[e.key]] = true; e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); interact(); }
  });
  window.addEventListener('keyup', e => { if (KEYMAP[e.key]) S.keys[KEYMAP[e.key]] = false; });
  // 螢幕方向鍵（平板用）
  document.querySelectorAll('#dpad [data-dir]').forEach(btn => {
    const dir = btn.getAttribute('data-dir');
    const on = e => { e.preventDefault(); if (anyOverlay()) return; S.keys[dir] = true; btn.classList.add('on'); try { btn.setPointerCapture(e.pointerId); } catch (x) { } };
    const off = () => { S.keys[dir] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, off));
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });
  $('#dpadOk').addEventListener('click', () => { if (prof && !anyOverlay()) interact(); });

  function interact() {
    if (S.scene === 'map') {
      const i = nearDock();
      if (i >= 0) { if (i < TOTAL) enterIsland(i); else openDialog('grandpa'); }
      else if (Math.hypot(S.bonu.x - S.boat.x, S.bonu.y - S.boat.y) < 140) openDialog('bonu');
    } else {
      const p = S.player;
      const b = S.sortables.find(o => o.building && Math.hypot(o.door[0] - p.x, o.door[1] - p.y) < 70);
      if (b) return openGame(S.islandIdx, b.building);
      const n = S.npcs.find(o => Math.hypot(o.x - p.x, o.y - p.y) < 100);
      if (n) return openDialog(n.id, { island: islands[S.islandIdx] });
      if (p.y > 740 && Math.abs(p.x - 800) < 80) backToSea();
    }
  }

  /* ====================== 主迴圈 ====================== */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    document.body.classList.toggle('busy', !!anyOverlay());
    document.body.classList.toggle('nologin', !(prof && prof.avatar));
    if (prof && prof.avatar) {
      if (S.scene === 'map') stepMap(dt, now); else stepIsland(dt, now);
    }
    requestAnimationFrame(loop);
  }
  function keyVec() {
    let x = 0, y = 0; const k = S.keys;
    if (k.l) x -= 1; if (k.r) x += 1; if (k.u) y -= 1; if (k.d) y += 1;
    const l = Math.hypot(x, y); return l ? [x / l, y / l] : null;
  }
  function stepMap(dt, now) {
    const b = S.boat, speed = 300;
    const kv = anyOverlay() ? null : keyVec();
    if (kv) {
      b.path = []; b.onArrive = null;
      const nx = b.x + kv[0] * speed * dt, ny = b.y + kv[1] * speed * dt;
      if (!inIsland(nx, ny) && nx > 20 && nx < 1580 && ny > 60 && ny < 985) { b.x = nx; b.y = ny; }
      if (kv[0]) b.dir = kv[0] > 0 ? 1 : -1;
    } else if (b.path.length) {
      const t = b.path[0], dx = t[0] - b.x, dy = t[1] - b.y, d = Math.hypot(dx, dy), st = speed * dt;
      if (Math.abs(dx) > 2) b.dir = dx > 0 ? 1 : -1;
      if (d <= st) { b.x = t[0]; b.y = t[1]; b.path.shift(); if (!b.path.length && b.onArrive) { const f = b.onArrive; b.onArrive = null; f(); } }
      else {
        const nx = b.x + dx / d * st, ny = b.y + dy / d * st;
        if (b.free && inIsland(nx, ny)) { b.path = []; b.free = false; }
        else { b.x = nx; b.y = ny; }
      }
    } else b.free = false;
    // 波妞跟在後面
    const n = S.bonu, tx = b.x - b.dir * 86, ty = b.y + 34;
    const ndx = tx - n.x, ndy = ty - n.y, nd = Math.hypot(ndx, ndy);
    if (nd > 4) { const m = Math.min(nd, (nd > 200 ? 420 : 240) * dt); n.x += ndx / nd * m; n.y += ndy / nd * m; if (Math.abs(ndx) > 6) n.dir = ndx > 0 ? 1 : -1; }
    // 小數：有信時飛到你旁邊，沒有就在天空繞圈
    const p = S.parrot; p.t += dt;
    let px, py;
    if (unreadReplies().length) { px = b.x + 60; py = b.y - 120 + Math.sin(p.t * 3) * 8; }
    else { px = 800 + Math.sin(p.t * 0.25) * 640; py = 470 + Math.sin(p.t * 0.5) * 300; }
    const pdx = px - p.x, pdy = py - p.y, pd = Math.hypot(pdx, pdy);
    if (pd > 1) { const m = Math.min(pd, 260 * dt); p.x += pdx / pd * m; p.y += pdy / pd * m; if (Math.abs(pdx) > 3) p.dir = pdx > 0 ? 1 : -1; }
    placeMapEntities();
    // 提示
    if (!anyOverlay()) {
      const i = nearDock();
      if (i >= 0 && !b.path.length) hint(i < TOTAL ? `已到達「${islands[i].name}」碼頭！按「確定」或點小島登島` : `已到達星光燈塔！按「確定」找光爺爺`);
      else if (!b.path.length && $('#hint').textContent.indexOf('已到達') === 0) hint('點小島就會開船過去・也可以用方向鍵自由航行');
    }
  }
  function stepIsland(dt) {
    const p = S.player, speed = 250;
    const kv = anyOverlay() ? null : keyVec();
    let moving = false;
    const tryMove = (vx, vy) => {
      const nx = p.x + vx, ny = p.y + vy;
      if (walkable(nx, ny)) { p.x = nx; p.y = ny; return true; }
      // 繞過障礙物
      const ang = Math.atan2(vy, vx), len = Math.hypot(vx, vy);
      for (const off of [0.6, -0.6, 1.2, -1.2]) {
        const ax = Math.cos(ang + off) * len, ay = Math.sin(ang + off) * len;
        if (walkable(p.x + ax, p.y + ay)) { p.x += ax; p.y += ay; return true; }
      }
      return false;
    };
    if (kv) {
      p.path = []; p.onArrive = null;
      moving = tryMove(kv[0] * speed * dt, kv[1] * speed * dt);
      if (kv[0]) p.dir = kv[0] > 0 ? 1 : -1;
    } else if (p.path.length) {
      const t = p.path[0], dx = t[0] - p.x, dy = t[1] - p.y, d = Math.hypot(dx, dy), st = speed * dt;
      if (Math.abs(dx) > 2) p.dir = dx > 0 ? 1 : -1;
      if (d <= st + 1) { p.x = t[0]; p.y = t[1]; p.path.shift(); if (!p.path.length && p.onArrive) { const f = p.onArrive; p.onArrive = null; f(); } }
      else {
        moving = tryMove(dx / d * st, dy / d * st);
        if (!moving) { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 0.6) { p.path = []; p.stuck = 0; if (p.onArrive && d < 140) { const f = p.onArrive; p.onArrive = null; f(); } else p.onArrive = null; } }
        else p.stuck = 0;
      }
    }
    p.walking = moving;
    // NPC 在建築附近散步
    S.npcs.forEach(n => {
      n.walking = false;
      if (anyOverlay() && S.talking === n.id) return;
      if (n.wait > 0) { n.wait -= dt; return; }
      const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
      if (d < 2) { n.wait = 1.5 + Math.random() * 3; const a = Math.random() * Math.PI * 2; n.tx = n.homeX + Math.cos(a) * 34; n.ty = n.homeY + Math.sin(a) * 14; return; }
      const st = 45 * dt; n.x += dx / d * Math.min(st, d); n.y += dy / d * Math.min(st, d); n.walking = true;
      if (Math.abs(dx) > 1) n.dir = dx > 0 ? 1 : -1;
    });
    placeIslandEntities();
  }

  /* ====================== 對話 ====================== */
  const dlg = { npc: null, ctx: null };
  function openDialog(id, ctx) {
    const npc = C.npcs[id]; if (!npc) return;
    dlg.npc = id; dlg.ctx = ctx || {}; dlg.direct = false; S.talking = id;
    S.keys = {};
    $('#dlgPortrait').innerHTML = id === 'parrot' ? `<g transform="translate(0,-30) scale(2.4)">${A.parrot()}</g>` : `<g transform="translate(0,6) scale(1.45)">${A.character(npc.look, [])}</g>`;
    $('#dlgName').textContent = npc.name; $('#dlgRole').textContent = npc.role;
    $('#dlgInput').value = '';
    $('#dialog').classList.add('on');
    showMain();
  }
  function closeDialog() { $('#dialog').classList.remove('on'); dlg.npc = null; S.talking = null; }
  $('#dlgClose').addEventListener('click', closeDialog);

  function say(text, opts) {
    $('#dlgText').textContent = text;
    const box = $('#dlgOpts'); box.innerHTML = '';
    (opts || []).forEach(o => {
      const b = document.createElement('button'); b.textContent = o.label; if (o.primary) b.className = 'primary';
      b.addEventListener('click', o.fn); box.appendChild(b);
    });
  }
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function nextAdvice() {
    const isl = islands.find(x => !starOf(x));
    if (!isl) return '你已經集滿所有星光了！快開船到星光燈塔找光爺爺吧！';
    const t = isl.buildings.find(b => !isDone(isl, b));
    return `下一站建議去「${isl.name}」（${isl.unit}）！` + (t ? `\n可以先從「${BT[t].name}」開始喔。` : '');
  }
  function dynamicLine(id, isl) {
    const sc = starCount();
    switch (id) {
      case 'grandpa': return sc >= TOTAL ? '你點亮了所有燈塔！數光群島又恢復光明了，謝謝你，小航海士！' : `目前已經點亮 ${sc} 座燈塔，還差 ${TOTAL - sc} 顆星光。`;
      case 'bonu': return nextAdvice();
      case 'parrot': { const u = unreadReplies().length; return u ? `嘎！老師回信了！有 ${u} 封信要給你！` : ''; }
      case 'guai': {
        if (!isl) return `你已經有 ${sc} 顆星光了！`;
        return starOf(isl) ? `「${isl.name}」的星光已經是你的了！要不要看看收集冊？` : `在寶箱塔闖關成功，就能拿到「${isl.name}」的星光！`;
      }
      default: {
        if (!isl) return '';
        const t = Object.keys(BT).find(k => BT[k].npc === id && isl.buildings.indexOf(k) >= 0);
        if (t && isDone(isl, t)) return `你已經完成${BT[t].name}了，好厲害！想再練一次也可以喔。`;
        return '';
      }
    }
  }
  function showMain() {
    const id = dlg.npc, npc = C.npcs[id], isl = dlg.ctx.island;
    let text = pick(npc.lines || ['你好！']);
    const note = isl && isl.notes && isl.notes[id];
    const dyn = dynamicLine(id, isl);
    if (note) text += '\n' + note;
    if (dyn) text += '\n' + dyn;
    const opts = [];
    if (id === 'parrot') {
      const u = unreadReplies().length;
      if (u) opts.push({ label: `📬 看老師的回信（${u}）`, primary: true, fn: showReplies });
      opts.push({ label: '✉ 我想問老師問題', fn: () => askTeacherPrompt() });
    }
    if (id === 'guai') opts.push({ label: '📖 打開收集冊', primary: true, fn: () => { closeDialog(); openBook(); } });
    const qa = (npc.qa || []).concat(isTeacher(id) && isl ? isl.qa : []);
    qa.forEach(q => opts.push({ label: q.q, fn: () => answer(q) }));
    opts.push({ label: '掰掰！', fn: closeDialog });
    say(text, opts);
  }
  const isTeacher = id => ['plusx', 'boy', 'pk'].indexOf(id) >= 0;
  function answer(q) {
    const text = q.a === '@next' ? nextAdvice() : q.a;
    say(text, [{ label: '我還有問題', fn: showMain }, { label: '謝謝！', fn: closeDialog, primary: true }]);
  }

  // 自由提問：關鍵字比對
  function bigrams(s) { s = s.replace(/[\s？?！!，,。.、]/g, ''); const out = new Set(); for (let i = 0; i < s.length - 1; i++) out.add(s.substr(i, 2)); return out; }
  function findAnswer(input, id, isl) {
    const pools = [[C.npcs[id].qa || [], 1.3], [isl ? isl.qa : [], 1.2], [C.commonQA || [], 1]];
    Object.keys(C.npcs).forEach(k => { if (k !== id) pools.push([C.npcs[k].qa || [], 0.8]); });
    const ib = bigrams(input);
    let best = null, bestScore = 0;
    pools.forEach(([list, w]) => list.forEach(q => {
      let kw = 0; (q.k || []).forEach(k => { if (input.indexOf(k) >= 0) kw++; });
      const qb = bigrams(q.q); let ov = 0; qb.forEach(b => { if (ib.has(b)) ov++; });
      const sim = qb.size ? ov / qb.size : 0;
      const score = (kw * 2 + sim * 3) * w;
      if ((kw > 0 || sim >= 0.5) && score > bestScore) { bestScore = score; best = q; }
    }));
    return best;
  }
  $('#dlgAsk').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#dlgInput').value.trim(); if (!v || !dlg.npc) return;
    $('#dlgInput').value = '';
    if (dlg.direct && dlg.npc === 'parrot') { dlg.direct = false; return sendQuestion(v); }
    const found = findAnswer(v, dlg.npc, dlg.ctx.island);
    if (found) answer(found);
    else say(`「${v}」\n這個問題有點難倒我了……要我請鸚鵡小數把問題送給老師嗎？`, [
      { label: '好，送給老師', primary: true, fn: () => sendQuestion(v) },
      { label: '不用了', fn: showMain }
    ]);
  });
  function askTeacherPrompt() {
    say('把你想問老師的問題打在下面的框框裡，按「問」，我就會幫你送信！', [{ label: '回上一頁', fn: showMain }]);
    $('#dlgInput').focus();
    dlg.direct = true;
  }
  function sendQuestion(q) {
    const isl = dlg.ctx.island || (S.scene === 'island' ? islands[S.islandIdx] : null);
    post({ action: 'question', npc: C.npcs[dlg.npc].name, island: isl ? isl.name : '海上', question: q });
    say(C.sheetUrl
      ? '嘎！小數已經把信送給老師了！老師回覆後，小數會帶著信飛來找你喔！'
      : '我先把問題記下來了！老師開通信箱後，小數就會幫你送出去。', [{ label: '好！', primary: true, fn: closeDialog }]);
    toast('✉ 問題已送出');
  }
  function showReplies() {
    const list = unreadReplies();
    if (!list.length) return showMain();
    const r = list[0];
    say(`你問${r.npc ? '「' + r.npc + '」' : ''}：「${r.question}」\n\n老師回覆：「${r.reply}」`, [
      { label: list.length > 1 ? '下一封信' : '收到了！', primary: true, fn: () => { prof.seen.push(String(r.id)); save(); updateParrotBubble(); list.length > 1 ? showReplies() : showMain(); } }
    ]);
  }

  /* ====================== 遊戲視窗 ====================== */
  function gameInfo(isl, t) {
    const g = isl.games[t];
    if (!g) return { url: '', newTab: false };
    if (typeof g === 'string') return { url: g, newTab: false };
    return { url: g.url || '', newTab: !!g.newTab };
  }
  function openGame(i, t) {
    const isl = islands[i], bt = BT[t], info = gameInfo(isl, t);
    S.game = { i, t };
    S.keys = {};
    $('#gameTitle').textContent = `${isl.name}・${bt.name}`;
    $('#gameTag').textContent = `${bt.role}｜${bt.tag}`;
    const body = $('#gameBody');
    if (!info.url) {
      body.innerHTML = `<div class="game-empty"><div style="font-size:60px">🛠️</div><div>這棟建築的遊戲還在準備中，<br>過幾天再來看看吧！</div></div>`;
    } else if (info.newTab) {
      body.innerHTML = `<div class="game-empty"><div style="font-size:60px">🎮</div><div>這個遊戲會在新分頁開啟。<br>玩完後回到這裡，按下「我完成了」。</div><a class="btn" href="${esc(info.url)}" target="_blank" rel="noopener" style="text-decoration:none">開始遊戲 ↗</a></div>`;
    } else {
      body.innerHTML = `<iframe src="${esc(info.url)}" allow="fullscreen; autoplay; clipboard-write; microphone" allowfullscreen title="${esc(bt.name)}"></iframe>`;
    }
    const nt = $('#gameNewTab'); nt.href = info.url || '#'; nt.style.display = info.url && !info.newTab ? '' : 'none';
    $('#gameDone').style.display = C.allowManualComplete && info.url ? '' : 'none';
    updateGameDone();
    open('#gameModal');
  }
  function updateGameDone() {
    if (!S.game) return;
    const isl = islands[S.game.i], d = isDone(isl, S.game.t);
    $('#gameDoneBadge').textContent = d ? '✓ 已經完成過了，可以再玩一次！' : '';
  }
  function closeGame() {
    close('#gameModal'); $('#gameBody').innerHTML = ''; S.game = null;
  }
  $('#gameClose').addEventListener('click', closeGame);
  $('#gameDone').addEventListener('click', () => { if (S.game) complete(S.game.i, S.game.t, 'manual'); });
  // 遊戲過關自動回報：遊戲裡執行 window.parent.postMessage({type:'shuguang-complete'}, '*')
  window.addEventListener('message', e => {
    if (!S.game) return;
    const fr = $('#gameBody iframe');
    if (!fr || e.source !== fr.contentWindow) return;
    const d = e.data;
    if (d === 'shuguang-complete' || (d && d.type === 'shuguang-complete')) complete(S.game.i, S.game.t, 'auto', d && d.score);
  });

  function complete(i, t, how, score) {
    const isl = islands[i], key = doneKey(isl, t);
    if (prof.done[key]) { toast('這一關已經完成過囉！'); return; }
    const before = starCount();
    prof.done[key] = Date.now(); save();
    const order = String(i).padStart(2, '0') + String(isl.buildings.indexOf(t)).padStart(2, '0');
    post({ action: 'complete', key: key, order: order, islandId: isl.id, island: isl.name, building: t, buildingName: BT[t].name, star: !!BT[t].star, stars: starCount(), how: how, score: score == null ? '' : score });
    updateGameDone(); refreshHud();
    const after = starCount();
    if (after > before) {
      setTimeout(() => {
        closeGame();
        const newRewards = C.rewards.filter(r => r.stars > before && r.stars <= after);
        $('#celTitle').textContent = `你點亮了「${isl.name}」的燈塔！`;
        $('#celText').textContent = after >= TOTAL
          ? `集滿 ${TOTAL} 顆星光了！\n快開船去星光燈塔找光爺爺！`
          : `獲得星光 ★ 目前 ${after} / ${TOTAL}\n迷霧散開了一些！`;
        $('#celReward').innerHTML = newRewards.length ? `<p style="font-size:17px">小乖送你：${newRewards.map(r => `<b>${esc(r.name)}</b>`).join('、')}</p>` : '';
        S.newRewards = newRewards;
        open('#celebrate');
      }, how === 'auto' ? 900 : 300);
    } else {
      toast('✓ 完成！蓋上印章');
    }
    if (S.scene === 'island') { const keep = { x: S.player.x, y: S.player.y }; renderIsland(i); S.player.x = keep.x; S.player.y = keep.y; placeIslandEntities(true); }
  }
  $('#celOk').addEventListener('click', () => {
    close('#celebrate');
    (S.newRewards || []).forEach(r => equip(r, true));
    S.newRewards = [];
    if (S.scene === 'island') { const keep = { x: S.player.x, y: S.player.y }; renderIsland(S.islandIdx); S.player.x = keep.x; S.player.y = keep.y; placeIslandEntities(true); }
  });

  /* ====================== 收集冊 ====================== */
  function equip(r, on) {
    prof.equip = prof.equip.filter(id => id !== r.id);
    if (on) {
      if (r.slot !== 'wear') prof.equip = prof.equip.filter(id => { const x = C.rewards.find(y => y.id === id); return !x || x.slot !== r.slot; });
      prof.equip.push(r.id);
    }
    save();
    if (S.scene === 'map') drawMapEntities();
  }
  function rewardPreview(r) {
    if (r.slot === 'wear') return `<svg viewBox="-40 -80 80 86"><g transform="scale(1.15)">${A.character(playerLook(), [r.id])}</g></svg>`;
    return `<svg viewBox="-44 -80 88 92">${A.boat({ sail: r.slot === 'sail' ? r.id : null, hull: r.slot === 'hull' ? r.id : null, flag: r.slot === 'boat' })}</svg>`;
  }
  function openBook() {
    const sc = starCount();
    $('#starSlots').innerHTML = islands.map(isl => `<div class="star-slot ${starOf(isl) ? 'lit' : ''}"><div class="s">★</div>${esc(isl.name)}</div>`).join('');
    const list = $('#rewardList'); list.innerHTML = '';
    C.rewards.forEach(r => {
      const ok = sc >= r.stars, on = prof.equip.indexOf(r.id) >= 0;
      const b = document.createElement('button');
      b.className = 'reward' + (ok ? '' : ' locked') + (on && ok ? ' on' : '');
      b.setAttribute('data-need', `需要 ${r.stars} 顆星光`);
      b.innerHTML = rewardPreview(r) + `${esc(r.name)}<small>${ok ? (on ? '穿戴中・點一下取下' : '點一下穿上') : '尚未解鎖'}</small>`;
      if (ok) b.addEventListener('click', () => { equip(r, !(prof.equip.indexOf(r.id) >= 0)); openBook(); });
      list.appendChild(b);
    });
    open('#bookModal');
  }
  $('#bookBtn').addEventListener('click', () => { if (prof && prof.avatar) openBook(); });
  $('#bookClose').addEventListener('click', () => { close('#bookModal'); if (S.scene === 'island') { const keep = { x: S.player.x, y: S.player.y }; renderIsland(S.islandIdx); S.player.x = keep.x; S.player.y = keep.y; placeIslandEntities(true); } });
  $('#changeLook').addEventListener('click', () => { close('#bookModal'); openCreator(); });

  /* ====================== 登入 ====================== */
  function openLogin() {
    const box = $('#seats'); box.innerHTML = '';
    for (let n = 1; n <= C.classSize; n++) {
      const b = document.createElement('button');
      const pr = store.profiles[n];
      b.className = 'seat' + (pr && pr.avatar ? ' has' : '');
      b.innerHTML = `${n}${pr && pr.name ? `<small>${esc(pr.name)}</small>` : ''}`;
      b.addEventListener('click', () => login(String(n)));
      box.appendChild(b);
    }
    open('#login');
  }
  $('#classMode').addEventListener('click', () => login('class'));
  $('#seatBtn').addEventListener('click', () => { if (!prof) return; closeDialog(); ['#gameModal', '#bookModal', '#celebrate'].forEach(close); if (S.game) closeGame(); open('#switchModal'); });
  $('#switchNo').addEventListener('click', () => close('#switchModal'));
  $('#switchYes').addEventListener('click', () => { close('#switchModal'); openLogin(); });
  function login(s) {
    seat = s; prof = getProfile(s); store.last = s; save();
    close('#login'); refreshHud();
    replies = [];
    if (!prof.avatar || (s !== 'class' && !prof.name)) openCreator();
    else startWorld();
    syncFromSheet(); flushQueue();
  }
  function startWorld() {
    renderMap();
    const d = MAP.docks[0];
    S.boat.x = d[0] - 120; S.boat.y = d[1]; S.boat.path = []; S.boat.dir = 1;
    S.bonu.x = S.boat.x - 90; S.bonu.y = S.boat.y + 34;
    placeMapEntities();
    if (!prof.intro) { prof.intro = true; save(); setTimeout(() => openDialog('grandpa'), 500); }
  }

  /* ====================== 造型 ====================== */
  let draft;
  const HAIRSTYLES = [['short', '短髮'], ['spiky', '刺刺頭'], ['bob', '鮑伯頭'], ['long', '長髮'], ['ponytail', '馬尾'], ['buns', '丸子頭']];
  function openCreator() {
    draft = Object.assign({ style: C.avatarStyles[0].id, color: C.avatarColors[5], hair: C.hairColors[0], skin: C.skinColors[0], hairStyle: 'short' }, prof.avatar || {});
    const showName = seat !== 'class';
    $('#nameRow').style.display = showName ? '' : 'none';
    $('#nameInput').value = prof.name || '';
    $('#nameErr').textContent = '';
    $('#creatorSeat').textContent = seat === 'class' ? '全班探險隊' : seat + ' 號';
    drawCreator(); open('#creator');
    if (showName && !prof.name) setTimeout(() => $('#nameInput').focus({ preventScroll: true }), 50);
  }
  function drawCreator() {
    $('#previewSvg').innerHTML = A.character(A.avatarLook(draft), wearIds());
    const so = $('#styleOpts'); so.innerHTML = '';
    C.avatarStyles.forEach(st => {
      const b = document.createElement('button'); b.className = 'style-tile' + (draft.style === st.id ? ' on' : '');
      b.innerHTML = `<svg viewBox="-24 -80 48 84">${A.character(A.avatarLook(Object.assign({}, draft, { style: st.id })), [])}</svg>${esc(st.name)}`;
      b.addEventListener('click', () => { draft.style = st.id; drawCreator(); }); so.appendChild(b);
    });
    const sw = (el, list, key) => {
      el.innerHTML = '';
      list.forEach(c => { const b = document.createElement('button'); b.className = 'swatch' + (draft[key] === c ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', c); b.addEventListener('click', () => { draft[key] = c; drawCreator(); }); el.appendChild(b); });
    };
    sw($('#colorOpts'), C.avatarColors, 'color'); sw($('#hairOpts'), C.hairColors, 'hair'); sw($('#skinOpts'), C.skinColors, 'skin');
    const hs = $('#hairStyleOpts'); hs.innerHTML = '';
    HAIRSTYLES.forEach(([id, nm]) => { const b = document.createElement('button'); b.className = 'chip' + (draft.hairStyle === id ? ' on' : ''); b.textContent = nm; b.addEventListener('click', () => { draft.hairStyle = id; drawCreator(); }); hs.appendChild(b); });
  }
  $('#nameInput').addEventListener('input', () => { $('#nameErr').textContent = ''; });
  $('#creatorDone').addEventListener('click', () => {
    if (seat !== 'class') {
      const nm = $('#nameInput').value.trim();
      if (!nm) { $('#nameErr').textContent = '請先輸入你的名字'; $('#nameInput').focus({ preventScroll: true }); $('#creator .card').scrollTop = 0; return; }
      prof.name = nm.slice(0, 8);
    }
    refreshHud();
    const first = !prof.avatar;
    prof.avatar = Object.assign({}, draft); save(); close('#creator');
    if (first || S.scene !== 'island') startWorld();
    else { const keep = { x: S.player.x, y: S.player.y }; renderIsland(S.islandIdx); S.player.x = keep.x; S.player.y = keep.y; placeIslandEntities(true); }
  });

  /* ====================== 開始 ====================== */
  function refresh() { refreshHud(); if (!prof || !prof.avatar) return; if (S.scene === 'map') { const b = { x: S.boat.x, y: S.boat.y }; renderMap(); S.boat.x = b.x; S.boat.y = b.y; placeMapEntities(); } }
  document.title = C.siteTitle + '｜' + C.siteSubtitle;
  $('#siteTitle').textContent = C.siteTitle; $('#siteSub').textContent = C.siteSubtitle;
  $('#loginTitle').textContent = C.siteTitle; $('#loginSub').textContent = C.siteSubtitle;
  layoutMap();
  // 先畫出地圖當作登入背景
  svg.innerHTML = '';
  (function bgMap() { const keepProf = prof; prof = { done: {}, equip: [], avatar: null }; renderMap(); prof = keepProf; })();
  hint('');
  refreshHud();
  openLogin();
  setInterval(checkReplies, 180000);
  requestAnimationFrame(loop);

  // 給測試用
  window.__shuguang = { S, islands, complete: (i, t) => complete(i, t, 'test'), login, enterIsland: i => renderIsland(i), store };
})();
