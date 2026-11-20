/* 數光群島｜繪圖工具（立體島嶼、建築、角色）
   一般不需要修改這個檔案 */
(function () {
  const D = {};
  const f1 = n => Math.round(n * 10) / 10;

  /* ---------- 顏色 ---------- */
  D.shade = function (hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  };

  /* ---------- 亂數 ---------- */
  D.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };

  /* ---------- 平滑不規則島形 ---------- */
  D.blobFactors = function (seed, n, jitter) {
    const r = D.rng(seed), out = [];
    for (let i = 0; i < n; i++) out.push(1 + (r() - 0.5) * 2 * jitter);
    return out;
  };
  D.blobPath = function (cx, cy, rx, ry, fac) {
    const n = fac.length, pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx * fac[i], cy + Math.sin(a) * ry * fac[i]]);
    }
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return d + 'Z';
  };

  /* 把一個形狀往下堆疊，做出厚度（立體感的關鍵） */
  D.extrude = function (id, d, depth, sideColor, topColor, bottomColor) {
    let s = `<defs><path id="${id}" d="${d}"/></defs>`;
    const step = 2;
    for (let k = depth; k > 0; k -= step) {
      const col = bottomColor && k > depth * 0.45 ? bottomColor : sideColor;
      s += `<use href="#${id}" y="${k}" fill="${col}"/>`;
    }
    s += `<use href="#${id}" fill="${topColor}"/>`;
    return s;
  };

  /* ---------- 等角立體多邊柱（盒子、圓柱、六角柱都用它） ----------
     pts：底面在螢幕上的點（已壓扁），h：高度 */
  D.prism = function (cx, cy, pts, h, color, opt) {
    opt = opt || {};
    const P = pts.map(p => [cx + p[0], cy + p[1]]);
    const n = P.length;
    let cxm = 0, cym = 0; P.forEach(p => { cxm += p[0]; cym += p[1]; }); cxm /= n; cym /= n;
    let s = '';
    const faces = [];
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n];
      const my = (a[1] + b[1]) / 2, mx = (a[0] + b[0]) / 2;
      if (my > cym - 0.01) {
        const sh = mx < cxm ? (opt.leftShade ?? -0.12) : (opt.rightShade ?? -0.26);
        faces.push({ my, poly: [a, b, [b[0], b[1] - h], [a[0], a[1] - h]], col: D.shade(color, sh) });
      }
    }
    faces.sort((x, y) => x.my - y.my);
    const stroke = opt.stroke ? ` stroke="${opt.stroke}" stroke-width="${opt.sw || 1}" stroke-linejoin="round"` : '';
    faces.forEach(f => { s += `<polygon points="${f.poly.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}" fill="${f.col}"${stroke}/>`; });
    if (!opt.noTop) s += `<polygon points="${P.map(p => f1(p[0]) + ',' + f1(p[1] - h)).join(' ')}" fill="${opt.top || D.shade(color, 0.12)}"${stroke}/>`;
    return s;
  };
  // 等角方塊的底面（寬 w、深 d）
  D.isoRect = function (w, d) {
    const c = 0.866, s = 0.5;
    const uv = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
    return uv.map(([u, v]) => [(u - v) * c, (u + v) * s]);
  };
  // 圓形 / 多邊形底面
  D.ring = function (r, n, rot) {
    const out = []; rot = rot || 0;
    for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; out.push([Math.cos(a) * r, Math.sin(a) * r * 0.5]); }
    return out;
  };
  D.box = function (cx, cy, w, d, h, color, opt) { return D.prism(cx, cy, D.isoRect(w, d), h, color, opt); };
  D.cyl = function (cx, cy, r, h, color, opt) { return D.prism(cx, cy, D.ring(r, 24), h, color, opt); };

  // 等角座標 → 螢幕
  D.iso = function (cx, cy, u, v, z) { return [cx + (u - v) * 0.866, cy + (u + v) * 0.5 - z]; };
  const pp = arr => arr.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');

  // 人字屋頂（屋脊沿 u 方向）
  D.gableRoof = function (cx, cy, w, d, h, rh, color, over) {
    over = over || 6;
    const W = w / 2 + over, Dd = d / 2 + over, I = (u, v, z) => D.iso(cx, cy, u, v, z);
    const back = [I(-W, -Dd, h), I(W, -Dd, h), I(W, 0, h + rh), I(-W, 0, h + rh)];
    const front = [I(-W, Dd, h), I(W, Dd, h), I(W, 0, h + rh), I(-W, 0, h + rh)];
    const gable = [I(w / 2, -d / 2, h), I(w / 2, d / 2, h), I(w / 2, 0, h + rh - 2)];
    return `<polygon points="${pp(back)}" fill="${D.shade(color, 0.1)}"/>` +
      `<polygon points="${pp(gable)}" fill="${D.shade(color, -0.35)}"/>` +
      `<polygon points="${pp(front)}" fill="${color}"/>`;
  };
  // 四角錐屋頂
  D.pyramidRoof = function (cx, cy, w, d, h, rh, color, over) {
    over = over || 5;
    const W = w / 2 + over, Dd = d / 2 + over, I = (u, v, z) => D.iso(cx, cy, u, v, z);
    const A = I(0, 0, h + rh), c = [I(-W, -Dd, h), I(W, -Dd, h), I(W, Dd, h), I(-W, Dd, h)];
    return `<polygon points="${pp([c[0], c[1], A])}" fill="${D.shade(color, 0.15)}"/>` +
      `<polygon points="${pp([c[3], c[0], A])}" fill="${D.shade(color, 0.05)}"/>` +
      `<polygon points="${pp([c[1], c[2], A])}" fill="${D.shade(color, -0.25)}"/>` +
      `<polygon points="${pp([c[2], c[3], A])}" fill="${color}"/>`;
  };

  /* ---------- 小道具 ---------- */
  D.tree = function (x, y, k, col) {
    col = col || '#5fbf6b';
    return `<g transform="translate(${f1(x)},${f1(y)}) scale(${k})">
      <ellipse cx="0" cy="0" rx="12" ry="5" fill="rgba(0,0,0,.12)"/>
      <rect x="-2.5" y="-16" width="5" height="16" rx="2" fill="#9a6a45"/>
      <circle cx="0" cy="-26" r="14" fill="${D.shade(col, -0.12)}"/>
      <circle cx="-4" cy="-30" r="10" fill="${col}"/>
      <circle cx="-7" cy="-33" r="3.5" fill="${D.shade(col, 0.3)}"/></g>`;
  };
  D.palm = function (x, y, k, flip) {
    const sx = flip ? -1 : 1;
    return `<g transform="translate(${f1(x)},${f1(y)}) scale(${k * sx},${k})">
      <ellipse cx="0" cy="0" rx="14" ry="5" fill="rgba(0,0,0,.12)"/>
      <path d="M-2,0 C2,-20 6,-38 14,-56" stroke="#b07b4f" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M-2,0 C2,-20 6,-38 14,-56" stroke="#c99668" stroke-width="7" stroke-dasharray="3 5" fill="none"/>
      <g transform="translate(14,-58)">
        <path d="M0,0 C-14,-12 -30,-6 -38,6 C-24,-2 -12,-2 0,0Z" fill="#3fa65a"/>
        <path d="M0,0 C14,-14 30,-10 38,2 C24,-4 12,-4 0,0Z" fill="#48b562"/>
        <path d="M0,0 C-6,-18 4,-30 14,-34 C6,-22 4,-12 0,0Z" fill="#5cc574"/>
        <path d="M0,0 C-10,4 -22,14 -24,26 C-14,14 -8,8 0,0Z" fill="#3a9b52"/>
        <path d="M0,0 C10,6 20,16 22,28 C12,16 6,8 0,0Z" fill="#43a95a"/>
        <circle cx="-3" cy="4" r="4" fill="#8a5a33"/><circle cx="3" cy="5" r="4" fill="#7a4e2c"/></g></g>`;
  };
  D.rock = function (x, y, k, col) {
    col = col || '#a9a39a';
    return `<g transform="translate(${f1(x)},${f1(y)}) scale(${k})"><path d="M-12,0 L-9,-9 L-1,-13 L8,-9 L12,0 Z" fill="${col}"/><path d="M-1,-13 L8,-9 L12,0 L2,0Z" fill="${D.shade(col, -0.2)}"/></g>`;
  };
  D.flower = function (x, y, col) {
    return `<g transform="translate(${f1(x)},${f1(y)})"><circle r="2.6" fill="${col}"/><circle r="1.1" fill="#fff6c8"/></g>`;
  };
  D.gear = function (x, y, r, teeth, col, cls) {
    let pts = '';
    const n = teeth * 2;
    for (let i = 0; i < n; i++) {
      const a1 = i / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2, R = i % 2 ? r * 0.8 : r;
      pts += `${f1(Math.cos(a1) * R)},${f1(Math.sin(a1) * R)} ${f1(Math.cos(a2) * R)},${f1(Math.sin(a2) * R)} `;
    }
    return `<g transform="translate(${f1(x)},${f1(y)})"><g class="${cls || ''}"><polygon points="${pts}" fill="${col}"/><circle r="${f1(r * 0.55)}" fill="${D.shade(col, 0.25)}"/><circle r="${f1(r * 0.22)}" fill="${D.shade(col, -0.35)}"/></g></g>`;
  };

  /* ---------- 燈塔 ---------- */
  D.lighthouse = function (x, y, k, lit) {
    const beam = lit ? `<g class="beam"><path d="M0,-66 L-120,-92 L-120,-40 Z" fill="#fff3a6" opacity=".45"/><path d="M0,-66 L120,-92 L120,-40 Z" fill="#fff3a6" opacity=".45"/></g>` : '';
    const lamp = lit ? '#ffe46b' : '#7d8794';
    return `<g transform="translate(${f1(x)},${f1(y)}) scale(${k})">
      ${beam}
      <ellipse cx="0" cy="0" rx="16" ry="6" fill="rgba(0,0,0,.15)"/>
      ${D.cyl(0, 0, 12, 22, '#ffffff')}
      ${D.cyl(0, -22, 10, 20, '#ef5f57')}
      ${D.cyl(0, -42, 9, 16, '#ffffff')}
      ${D.cyl(0, -58, 12, 3, '#3f4a5a')}
      <rect x="-7" y="-72" width="14" height="13" rx="3" fill="${lamp}"/>
      ${lit ? '<circle cx="0" cy="-66" r="16" fill="#fff3a6" opacity=".55" class="glow"/>' : ''}
      ${D.cyl(0, -72, 10, 2, '#3f4a5a')}
      <path d="M-9,-74 L0,-86 L9,-74Z" fill="#ef5f57"/></g>`;
  };

  /* ---------- 雲霧 ---------- */
  D.fog = function (x, y, w) {
    const r = w / 6;
    return `<g class="fog" transform="translate(${f1(x)},${f1(y)})">
      <g class="fog-drift" opacity=".62">
      <circle cx="${f1(-r * 2.2)}" cy="${f1(r * 0.2)}" r="${f1(r * 0.9)}" fill="#fff"/>
      <circle cx="${f1(-r * 0.9)}" cy="${f1(-r * 0.3)}" r="${f1(r * 1.15)}" fill="#fff"/>
      <circle cx="${f1(r * 0.6)}" cy="${f1(-r * 0.1)}" r="${f1(r * 1.0)}" fill="#fff"/>
      <circle cx="${f1(r * 2.1)}" cy="${f1(r * 0.4)}" r="${f1(r * 0.8)}" fill="#fff"/>
      <ellipse cx="0" cy="${f1(r * 0.7)}" rx="${f1(r * 3.1)}" ry="${f1(r * 0.55)}" fill="#fff"/></g></g>`;
  };

  window.D = D;
})();
