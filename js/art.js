/* 數光群島｜美術：小島地標、建築、角色、船
   一般不需要修改這個檔案 */
(function () {
  const A = {};
  const f1 = n => Math.round(n * 10) / 10;

  /* ===== 島嶼配色 ===== */
  A.palette = {
    coconut:  { grass: '#8fd47c', earth: '#d9a16a', sand: '#f6e2ad' },
    gear:     { grass: '#a9cfa0', earth: '#b8957a', sand: '#efdcb4' },
    dessert:  { grass: '#f7c6d3', earth: '#c98c6c', sand: '#fbe8c6' },
    scale:    { grass: '#c9e08e', earth: '#d2a46e', sand: '#f6e2ad' },
    harbor:   { grass: '#9edbc6', earth: '#c49a72', sand: '#f3dfb0' },
    hive:     { grass: '#d8e588', earth: '#d4a35f', sand: '#f8e6a8' },
    windmill: { grass: '#9fdd8c', earth: '#cf9d6c', sand: '#f6e2ad' },
    mirror:   { grass: '#93d4b6', earth: '#b99876', sand: '#eedfb8' },
    crystal:  { grass: '#cbbcee', earth: '#a58aa8', sand: '#ece0f2' },
    volcano:  { grass: '#bfae98', earth: '#8b6c58', sand: '#e6d3b6' },
    final:    { grass: '#a9e0a0', earth: '#cfa06c', sand: '#f8e6b0' }
  };

  /* ===== 立體島嶼 ===== */
  A.island = function (uid, cx, cy, rx, ry, seed, theme, depth) {
    const pal = A.palette[theme] || A.palette.coconut;
    const fac = D.blobFactors(seed, 11, 0.11);
    depth = depth || Math.round(ry * 0.42);
    const sand = D.blobPath(cx, cy, rx, ry, fac);
    const grass = D.blobPath(cx - rx * 0.02, cy - 5, rx * 0.84, ry * 0.78, fac);
    const foam = D.blobPath(cx, cy + depth * 0.75, rx * 1.07, ry * 1.1, fac);
    let s = `<ellipse cx="${cx + 8}" cy="${cy + depth + 10}" rx="${rx * 1.08}" ry="${ry * 0.95}" fill="rgba(23,92,120,.18)"/>`;
    s += `<path d="${foam}" fill="#ffffff" opacity=".45" class="foam"/>`;
    s += D.extrude(uid + 's', sand, depth, pal.earth, pal.sand, D.shade(pal.earth, -0.18));
    s += D.extrude(uid + 'g', grass, 6, D.shade(pal.grass, -0.22), pal.grass);
    return s;
  };

  /* ===== 各島地標（x,y 為地面中心，k 為縮放） ===== */
  A.landmark = function (theme, x, y, k, seed) {
    const g = (inner) => `<g transform="translate(${f1(x)},${f1(y)}) scale(${k})">${inner}</g>`;
    switch (theme) {
      case 'coconut':
        return g(D.palm(-40, 4, 1.1) + D.palm(18, -18, 0.95, true) + D.palm(46, 10, 0.85) +
          `<ellipse cx="-6" cy="16" rx="16" ry="6" fill="#f0c36a"/><circle cx="-10" cy="12" r="5" fill="#8a5a33"/><circle cx="-2" cy="13" r="5" fill="#7a4e2c"/>`);
      case 'gear':
        return g(`<ellipse cx="0" cy="8" rx="44" ry="12" fill="rgba(0,0,0,.12)"/>` +
          D.box(0, 6, 26, 18, 16, '#8b8f99') +
          D.gear(-6, -42, 34, 10, '#c9a14a', 'spin') + D.gear(36, -18, 20, 8, '#9aa3b2', 'spin-rev') + D.gear(-40, -12, 14, 7, '#d97b4a', 'spin'));
      case 'dessert':
        return g(`<ellipse cx="0" cy="6" rx="46" ry="14" fill="rgba(0,0,0,.12)"/>` +
          D.cyl(0, 4, 40, 22, '#f6b9c8') + D.cyl(0, -18, 40, 4, '#fff3e8') +
          D.cyl(0, -22, 28, 20, '#fde3a7') + D.cyl(0, -42, 28, 4, '#fff3e8') +
          D.cyl(0, -46, 17, 16, '#f6b9c8') +
          `<circle cx="0" cy="-68" r="7" fill="#e5384f"/><path d="M0,-74 Q4,-84 10,-86" stroke="#4d8a3a" stroke-width="2" fill="none"/>` +
          `<circle cx="-26" cy="-22" r="3" fill="#e5384f"/><circle cx="24" cy="-24" r="3" fill="#5cc178"/><circle cx="-8" cy="-2" r="3" fill="#5a86e0"/>`);
      case 'scale':
        return g(`<ellipse cx="0" cy="8" rx="50" ry="13" fill="rgba(0,0,0,.12)"/>` +
          D.box(0, 6, 22, 22, 10, '#a77b52') + `<rect x="-3" y="-60" width="6" height="58" fill="#8a6141"/>` +
          `<g class="tilt"><rect x="-46" y="-64" width="92" height="5" rx="2" fill="#c9a14a"/>` +
          `<line x1="-40" y1="-60" x2="-40" y2="-34" stroke="#8a6141" stroke-width="1.5"/><line x1="40" y1="-60" x2="40" y2="-34" stroke="#8a6141" stroke-width="1.5"/>` +
          `<path d="M-56,-34 L-24,-34 Q-28,-24 -40,-24 Q-52,-24 -56,-34Z" fill="#e2b75a"/><path d="M24,-34 L56,-34 Q52,-24 40,-24 Q28,-24 24,-34Z" fill="#e2b75a"/>` +
          `<rect x="-47" y="-44" width="12" height="10" rx="2" fill="#ef6a5b"/><circle cx="40" cy="-39" r="5" fill="#5a86e0"/><circle cx="48" cy="-38" r="4" fill="#5cc178"/></g>` +
          `<circle cx="0" cy="-66" r="5" fill="#c9a14a"/>`);
      case 'harbor':
        return g(`<ellipse cx="0" cy="8" rx="50" ry="13" fill="rgba(0,0,0,.12)"/>` +
          D.box(-10, 6, 40, 40, 34, '#f2efe6') + D.pyramidRoof(-10, 6, 40, 40, 34, 18, '#3fa5b8') +
          `<rect x="-22" y="-12" width="10" height="14" rx="2" fill="#6b4a35"/>` +
          `<rect x="24" y="-74" width="4" height="78" fill="#5b6472"/><path d="M28,-74 L52,-66 L28,-58Z" fill="#f2b233" class="wave-flag"/>` +
          `<g transform="translate(-36,-40)"><circle r="9" fill="none" stroke="#3d4a5c" stroke-width="2.5"/><path d="M0,-9 L0,9 M-7,4 Q0,13 7,4" stroke="#3d4a5c" stroke-width="2.5" fill="none"/></g>`);
      case 'hive': {
        let s = `<ellipse cx="0" cy="8" rx="52" ry="14" fill="rgba(0,0,0,.12)"/>`;
        const cells = [[-30, -2, 26], [0, -14, 44], [30, -2, 32], [-14, 12, 18], [16, 14, 22]];
        cells.forEach(([cx, cy, h]) => { s += D.prism(cx, cy, D.ring(16, 6, Math.PI / 6), h, '#f2c13a', { top: '#f9d77a', stroke: '#c98f1e', sw: 1 }); });
        s += `<g class="bee"><ellipse cx="34" cy="-60" rx="6" ry="4" fill="#f2c13a"/><path d="M32,-63 L32,-57 M36,-63 L36,-57" stroke="#3a2a1e" stroke-width="1.6"/><ellipse cx="33" cy="-66" rx="4" ry="3" fill="#fff" opacity=".8"/></g>`;
        return g(s);
      }
      case 'windmill':
        return g(`<ellipse cx="0" cy="8" rx="40" ry="12" fill="rgba(0,0,0,.12)"/>` +
          D.prism(0, 4, D.ring(20, 8, Math.PI / 8), 70, '#f4ecdc') + D.pyramidRoof(0, -66, 26, 26, 0, 18, '#d9634f', 2) +
          `<rect x="-6" y="-10" width="12" height="16" rx="5" fill="#8a5a3a"/>` +
          `<g transform="translate(6,-68)"><g class="spin-slow">` +
          [0, 90, 180, 270].map(a => `<g transform="rotate(${a})"><rect x="-3" y="-54" width="6" height="54" fill="#8a6141"/><rect x="3" y="-52" width="14" height="40" fill="#fffaf0" stroke="#c9b8a0" stroke-width="1"/></g>`).join('') +
          `<circle r="5" fill="#5b4636"/></g></g>`);
      case 'mirror':
        return g(`<ellipse cx="0" cy="0" rx="62" ry="24" fill="#6fc3df"/><ellipse cx="0" cy="-2" rx="56" ry="20" fill="#8fd6ea"/>` +
          `<path d="M-30,-6 Q-20,-9 -10,-6 M6,4 Q18,1 30,4" stroke="#fff" stroke-width="2" fill="none" opacity=".8" class="shimmer"/>` +
          `<g transform="translate(-58,-6)"><path d="M0,0 Q-2,-20 2,-30 M5,0 Q6,-16 10,-24 M-4,0 Q-8,-14 -6,-22" stroke="#4d8a3a" stroke-width="2" fill="none"/><ellipse cx="2" cy="-30" rx="2.5" ry="6" fill="#8a5a33"/></g>` +
          `<g transform="translate(14,-8)"><path d="M-10,0 Q0,-6 10,0 Q0,4 -10,0Z" fill="#fff"/><circle cx="8" cy="-4" r="3" fill="#fff"/><path d="M10,-4 L14,-3 L10,-2Z" fill="#f2a33a"/></g>`);
      case 'crystal': {
        let s = `<ellipse cx="0" cy="8" rx="50" ry="13" fill="rgba(0,0,0,.12)"/>`;
        const cr = [[-26, 2, 40, '#9b72d9'], [4, -8, 62, '#6fc8e6'], [30, 4, 34, '#e07bc4'], [-6, 12, 24, '#7fd6c1']];
        cr.forEach(([cx, cy, h, col]) => {
          s += D.prism(cx, cy, D.ring(10, 6, Math.PI / 6), h, col, { noTop: true });
          s += `<polygon points="${cx - 10},${cy - h} ${cx},${cy - h - 16} ${cx + 10},${cy - h} ${cx},${cy - h + 5}" fill="${D.shade(col, 0.3)}"/>`;
        });
        s += `<circle cx="10" cy="-70" r="3" fill="#fff" class="twinkle"/><circle cx="-30" cy="-46" r="2" fill="#fff" class="twinkle d2"/>`;
        return g(s);
      }
      case 'volcano':
        return g(`<ellipse cx="0" cy="8" rx="64" ry="16" fill="rgba(0,0,0,.14)"/>` +
          `<path d="M-64,6 L-18,-62 L18,-62 L64,6 Q0,22 -64,6Z" fill="#7a5d4c"/><path d="M0,-62 L18,-62 L64,6 Q36,16 6,18Z" fill="#634a3c"/>` +
          `<ellipse cx="0" cy="-62" rx="18" ry="6" fill="#ff7a3c"/><path d="M-6,-60 Q-10,-40 -16,-30 Q-8,-34 -2,-44Z" fill="#ff9a3c"/>` +
          `<g class="smoke"><circle cx="0" cy="-78" r="9" fill="#d9d4cf"/><circle cx="10" cy="-92" r="11" fill="#e6e2de"/><circle cx="-4" cy="-106" r="8" fill="#efecea"/></g>`);
      default:
        return '';
    }
  };

  /* ===== 島上建築 ===== */
  // 回傳 { svg, door:[dx,dy] }（door 為門口相對位置）
  A.building = function (type, x, y, done) {
    const G = inner => `<g transform="translate(${f1(x)},${f1(y)})">${inner}</g>`;
    const shadow = (rx, ry) => `<ellipse cx="0" cy="4" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,.14)"/>`;
    let s = '';
    switch (type) {
      case 'book':
        s = shadow(64, 30) + D.box(0, 0, 70, 62, 52, '#c9c2f0', { top: '#d9d4f6' }) +
          `<path d="M-30,-70 A32,24 0 0 1 32,-70 Z" fill="#3f4f8f"/><path d="M-30,-70 A32,24 0 0 1 0,-94 L0,-70Z" fill="#53639f"/>` +
          `<ellipse cx="1" cy="-70" rx="31" ry="7" fill="#2f3d72"/>` +
          `<rect x="6" y="-104" width="24" height="9" rx="3" fill="#c9a14a" transform="rotate(-28 6 -100)"/>` +
          `<circle cx="-8" cy="-88" r="2" fill="#ffe46b"/><circle cx="12" cy="-84" r="1.6" fill="#fff"/>` +
          `<path d="M-38,-2 L-38,-30 Q-28,-38 -18,-30 L-18,8Z" fill="#6b4a35"/>` +
          `<rect x="14" y="-36" width="14" height="14" rx="2" fill="#fff8d6" transform="skewY(-30)"/>`;
        return { svg: G(s), door: [-28, 18], npc: [-80, 30], h: 110 };
      case 'dojo':
        s = shadow(66, 30) + D.box(0, 0, 76, 60, 42, '#d9a46c', { top: '#e8b780' }) + D.gableRoof(0, 0, 76, 60, 42, 30, '#4fae6a', 8) +
          `<path d="M-36,-2 L-36,-28 L-20,-20 L-20,8Z" fill="#6b4a35"/>` +
          `<rect x="20" y="-30" width="12" height="12" rx="2" fill="#fff8d6" transform="skewY(-30)"/>` +
          `<g transform="translate(52,24)"><rect x="-2" y="-34" width="4" height="34" fill="#8a6141"/><rect x="-12" y="-28" width="24" height="5" rx="2" fill="#8a6141"/><circle cx="0" cy="-38" r="7" fill="#d9a46c"/><rect x="-7" y="-26" width="14" height="16" rx="4" fill="#e2c08f"/></g>`;
        return { svg: G(s), door: [-30, 20], npc: [-84, 30], h: 96 };
      case 'arena': {
        s = shadow(80, 38) + D.box(0, 0, 104, 104, 16, '#6d7a8c', { top: '#e86a5b' });
        const I = (u, v, z) => D.iso(0, 0, u, v, z);
        const posts = [[-46, -46], [46, -46], [46, 46], [-46, 46]].map(([u, v]) => I(u, v, 16));
        const rope = (a, b, z) => `<line x1="${f1(a[0])}" y1="${f1(a[1] - z)}" x2="${f1(b[0])}" y2="${f1(b[1] - z)}" stroke="#fff" stroke-width="2"/>`;
        s += rope(posts[0], posts[1], 22) + rope(posts[0], posts[3], 22) + rope(posts[0], posts[1], 34) + rope(posts[0], posts[3], 34);
        posts.forEach(([px, py], i) => { s += `<rect x="${f1(px - 3)}" y="${f1(py - 40)}" width="6" height="40" rx="2" fill="${i % 2 ? '#3f6fd9' : '#e2574c'}"/>`; });
        s += rope(posts[3], posts[2], 22) + rope(posts[1], posts[2], 22) + rope(posts[3], posts[2], 34) + rope(posts[1], posts[2], 34);
        s += `<g class="wave-flag"><path d="M${f1(posts[1][0])},${f1(posts[1][1] - 40)} l0,-22 l18,6 l-18,6z" fill="#f2b233"/></g>`;
        s += `<text x="0" y="-12" text-anchor="middle" font-size="18" font-weight="700" fill="#fff" opacity=".9" transform="scale(1,.6) translate(0,-12)">VS</text>`;
        return { svg: G(s), door: [-46, 36], npc: [-96, 20], h: 70 };
      }
      case 'chest': {
        s = shadow(50, 24) + D.box(0, 0, 54, 54, 74, '#e9e2d2', { top: '#f3eee2' }) +
          D.box(0, -74, 62, 62, 8, '#c9a14a') + D.pyramidRoof(0, -82, 62, 62, 0, 30, '#e2b23a', 0) +
          `<path d="M-26,-4 L-26,-30 Q-18,-38 -10,-30 L-10,4Z" fill="#6b4a35"/>` +
          `<rect x="10" y="-50" width="10" height="14" rx="2" fill="#fff8d6" transform="skewY(-30)"/>`;
        // 寶箱
        s += `<g transform="translate(34,26)">${D.box(0, 0, 22, 16, 12, '#b9773e')}<path d="M-16,-12 Q-3,-24 10,-14 L10,-10 L-16,-10Z" fill="#c9883f"/><rect x="-6" y="-10" width="6" height="6" fill="#ffd34d"/></g>`;
        // 星星
        const star = (r) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? r * 0.45 : r; p += `${f1(Math.cos(a) * R)},${f1(Math.sin(a) * R)} `; } return p; };
        s += `<g transform="translate(0,-128)" class="${done ? 'star-lit' : ''}">${done ? '<circle r="20" fill="#fff3a6" opacity=".6" class="glow"/>' : ''}<polygon points="${star(13)}" fill="${done ? '#ffd34d' : '#b9b3a6'}" stroke="${done ? '#e0a417' : '#8f8a80'}" stroke-width="1.5"/></g>`;
        return { svg: G(s), door: [-20, 22], npc: [-74, 34], h: 150 };
      }
      case 'supply':
        s = shadow(56, 26) + D.box(0, 0, 60, 50, 30, '#f4ecdc') + D.gableRoof(0, 0, 60, 50, 30, 22, '#e86a5b', 6) +
          `<path d="M-30,-2 L-30,-20 L-16,-14 L-16,6Z" fill="#6b4a35"/>` +
          `<g transform="translate(40,18)">${D.box(0, 0, 18, 18, 14, '#b9773e')}${D.box(10, 8, 14, 14, 10, '#c98a4b')}</g>`;
        return { svg: G(s), door: [-24, 18], npc: [-76, 28], h: 80 };
    }
    return { svg: '', door: [0, 20], npc: [-60, 20], h: 60 };
  };

  /* ===== 角色 =====
     look：{ skin, hair, hairColor, outfit, hat, glasses, beard, badge, headband, cap, ribbon, coat }
     wear：已穿戴的配件 id 陣列 */
  A.character = function (look, wear) {
    look = look || {}; wear = wear || [];
    const skin = look.skin || '#f6d3b3', hc = look.hairColor || '#3a2a20', oc = look.outfit || '#5a86e0';
    const has = id => wear.indexOf(id) >= 0;
    let s = `<ellipse cx="0" cy="0" rx="13" ry="4.5" fill="rgba(0,0,0,.2)"/>`;
    s += `<g class="body-bob">`;
    if (has('cape')) s += `<path d="M-11,-30 Q-18,-8 -15,-6 L15,-6 Q18,-8 11,-30Z" fill="#c9384a"/>`;
    if (has('backpack')) s += `<rect x="-14" y="-30" width="28" height="20" rx="6" fill="#8a5a33"/><rect x="-14" y="-22" width="28" height="4" fill="#6b4428"/>`;
    // 後髮
    if (look.hair === 'long') s += `<path d="M-14,-44 Q-17,-22 -10,-22 L10,-22 Q17,-22 14,-44Z" fill="${hc}"/>`;
    if (look.hair === 'ponytail') s += `<path d="M10,-46 Q24,-40 18,-24 Q16,-34 9,-38Z" fill="${hc}"/>`;
    // 腿
    s += `<rect x="-7" y="-11" width="5.5" height="11" rx="2.5" fill="#3d4456"/><rect x="1.5" y="-11" width="5.5" height="11" rx="2.5" fill="#3d4456"/>`;
    // 身體
    s += `<path d="M-11,-28 Q-12,-10 -10,-9 L10,-9 Q12,-10 11,-28 Q0,-32 -11,-28Z" fill="${oc}"/>`;
    if (look.coat) s += `<path d="M-11,-28 Q-12,-10 -10,-9 L-2,-9 L-2,-29Z M11,-28 Q12,-10 10,-9 L2,-9 L2,-29Z" fill="#ffffff"/>`;
    if (look.badge) s += `<rect x="-8" y="-24" width="16" height="9" rx="3" fill="#ffffff" opacity=".92"/><text x="0" y="-17" text-anchor="middle" font-size="7.5" font-weight="700" fill="${D.shade(oc, -0.45)}" font-family="Arial,sans-serif">${look.badge}</text>`;
    if (has('scarf')) s += `<path d="M-10,-29 Q0,-25 10,-29 L10,-25 Q0,-21 -10,-25Z" fill="#e5384f"/><rect x="4" y="-26" width="5" height="10" rx="2" fill="#c92a40"/>`;
    // 手
    s += `<circle cx="-12.5" cy="-17" r="3.6" fill="${skin}"/><circle cx="12.5" cy="-17" r="3.6" fill="${skin}"/>`;
    // 頭
    s += `<circle cx="0" cy="-41" r="13" fill="${skin}"/>`;
    // 臉
    s += `<ellipse cx="-4.5" cy="-40" rx="1.7" ry="2.2" fill="#2b2220"/><ellipse cx="4.5" cy="-40" rx="1.7" ry="2.2" fill="#2b2220"/>` +
      `<circle cx="-8" cy="-35.5" r="2.4" fill="#ff9aa2" opacity=".55"/><circle cx="8" cy="-35.5" r="2.4" fill="#ff9aa2" opacity=".55"/>` +
      `<path d="M-2.4,-34.5 Q0,-32.3 2.4,-34.5" stroke="#8a4a3a" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    if (look.beard) s += `<path d="M-9,-36 Q-10,-24 0,-22 Q10,-24 9,-36 Q5,-31 0,-31 Q-5,-31 -9,-36Z" fill="#f2f2f2"/><path d="M-4,-33.5 Q0,-31.5 4,-33.5" stroke="#8a4a3a" stroke-width="1.2" fill="none"/>`;
    // 前髮
    switch (look.hair) {
      case 'spiky': s += `<path d="M-13.5,-41 L-15,-52 L-9,-49 L-7,-58 L-2,-51 L2,-59 L5,-51 L10,-57 L10,-49 L15,-51 L13.5,-41 Q6,-47 -13.5,-41Z" fill="${hc}"/>`; break;
      case 'bob': s += `<path d="M-14,-34 Q-17,-56 0,-56 Q17,-56 14,-34 L11,-34 Q11,-44 4,-47 Q-6,-44 -11,-44 L-11,-34Z" fill="${hc}"/>`; break;
      case 'long': s += `<path d="M-14,-40 Q-15,-56 0,-56 Q15,-56 14,-40 Q6,-49 -2,-47 Q-8,-46 -14,-40Z" fill="${hc}"/>`; break;
      case 'buns': s += `<circle cx="-11" cy="-53" r="6" fill="${hc}"/><circle cx="11" cy="-53" r="6" fill="${hc}"/><path d="M-13.5,-41 Q-15,-56 0,-56 Q15,-56 13.5,-41 Q6,-48 -13.5,-41Z" fill="${hc}"/>`; break;
      case 'ponytail': s += `<path d="M-13.5,-40 Q-15,-56 0,-56 Q15,-56 13.5,-41 Q2,-50 -13.5,-40Z" fill="${hc}"/>`; break;
      case 'bald': s += `<path d="M-13,-44 Q-15,-36 -12,-34 Q-11,-40 -10,-44Z M13,-44 Q15,-36 12,-34 Q11,-40 10,-44Z" fill="${hc}"/>`; break;
      default: s += `<path d="M-13.5,-40 Q-15,-56 0,-56 Q15,-56 13.5,-40 Q8,-47 2,-46 Q-6,-49 -13.5,-40Z" fill="${hc}"/>`;
    }
    if (look.ribbon) s += `<g transform="translate(10,-52)"><path d="M0,0 L-7,-5 L-7,5Z M0,0 L7,-5 L7,5Z" fill="${look.ribbon}"/><circle r="2" fill="${D.shade(look.ribbon, -0.2)}"/></g>`;
    if (look.headband) s += `<path d="M-13.5,-47 Q0,-52 13.5,-47 L13.5,-43 Q0,-48 -13.5,-43Z" fill="#e5384f"/><path d="M13,-46 L20,-50 L19,-42Z" fill="#e5384f"/>`;
    if (look.cap) s += `<path d="M-13.5,-45 Q-13,-58 0,-58 Q13,-58 13.5,-45Z" fill="${look.cap}"/><path d="M-2,-46 Q12,-48 20,-44 Q12,-42 -2,-44Z" fill="${D.shade(look.cap, -0.2)}"/>`;
    // 帽子（學生造型）
    switch (look.hat) {
      case 'sailor': s += `<ellipse cx="0" cy="-51" rx="15" ry="4" fill="#ffffff" stroke="#c9d3df" stroke-width="1"/><path d="M-10,-51 Q-10,-62 0,-62 Q10,-62 10,-51Z" fill="#ffffff" stroke="#c9d3df" stroke-width="1"/><rect x="-10" y="-54" width="20" height="3" fill="#2f4f8f"/>`; break;
      case 'captain': s += `<path d="M-14,-49 Q-14,-62 0,-62 Q14,-62 14,-49Z" fill="#2f3f6a"/><path d="M-14,-50 Q0,-45 14,-50 L14,-47 Q0,-42 -14,-47Z" fill="#1f2a48"/><circle cx="0" cy="-55" r="2.6" fill="#ffd34d"/>`; break;
      case 'explorer': s += `<ellipse cx="0" cy="-50" rx="19" ry="5" fill="#c9a46c"/><path d="M-11,-50 Q-11,-63 0,-63 Q11,-63 11,-50Z" fill="#d9b67e"/><rect x="-11" y="-54" width="22" height="3" fill="#8a6141"/>`; break;
      case 'chef': s += `<g stroke="#cfd6de" stroke-width="1.2"><circle cx="-7" cy="-62" r="6" fill="#ffffff"/><circle cx="7" cy="-62" r="6" fill="#ffffff"/><circle cx="0" cy="-66" r="7" fill="#ffffff"/><rect x="-10" y="-60" width="20" height="10" rx="2" fill="#ffffff"/></g>`; break;
      case 'scientist': s += `<rect x="-14" y="-50" width="28" height="3" fill="#3d4456"/><circle cx="-5" cy="-50" r="4.5" fill="#9fe0f0" stroke="#3d4456" stroke-width="2"/><circle cx="5" cy="-50" r="4.5" fill="#9fe0f0" stroke="#3d4456" stroke-width="2"/>`; break;
      case 'wizard': s += `<ellipse cx="0" cy="-50" rx="17" ry="4.5" fill="#6a4bb5"/><path d="M-11,-51 L4,-80 L11,-51Z" fill="#7b5ccf"/><circle cx="2" cy="-62" r="2.4" fill="#ffd34d"/>`; break;
      case 'astronaut': s += `<circle cx="0" cy="-41" r="17" fill="#bfe8ff" fill-opacity=".3" stroke="#dfe6ee" stroke-width="4"/><path d="M-10,-50 Q-6,-55 0,-56" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="-3" y="-62" width="6" height="5" fill="#ffffff"/><circle cx="0" cy="-64" r="2.4" fill="#ef6a5b"/>`; break;
      case 'fisher': s += `<path d="M-16,-48 Q0,-44 16,-48 L12,-52 Q0,-49 -12,-52Z" fill="#6f7f3f"/><path d="M-11,-51 Q-11,-61 0,-61 Q11,-61 11,-51Z" fill="#87994e"/>`; break;
      case 'painter': s += `<ellipse cx="-2" cy="-54" rx="15" ry="5.5" fill="#e5384f" transform="rotate(-10 -2 -54)"/><circle cx="-2" cy="-60" r="2" fill="#c92a40"/>`; break;
    }
    if (look.glasses || has('glasses')) s += `<g fill="none" stroke="#3d3a3a" stroke-width="1.4"><circle cx="-4.6" cy="-40" r="3.6"/><circle cx="4.6" cy="-40" r="3.6"/><path d="M-1,-40 L1,-40"/></g>`;
    if (has('starpin')) s += `<polygon points="-10,-50 -8.8,-47.4 -6,-47 -8,-45 -7.6,-42.2 -10,-43.6 -12.4,-42.2 -12,-45 -14,-47 -11.2,-47.4" fill="#ffd34d" stroke="#e0a417" stroke-width=".8"/>`;
    if (has('crown')) s += `<path d="M-9,-60 L-9,-70 L-4.5,-65 L0,-72 L4.5,-65 L9,-70 L9,-60Z" fill="#ffd34d" stroke="#e0a417" stroke-width="1"/><circle cx="0" cy="-64" r="1.6" fill="#e5384f"/>`;
    s += `</g>`;
    return s;
  };

  // 學生造型 → look
  A.avatarLook = function (av) {
    const look = { skin: av.skin, hairColor: av.hair, outfit: av.color, hair: av.hairStyle || 'short', hat: av.style };
    if (av.style === 'scientist') look.coat = true;
    if (av.style === 'astronaut') look.outfit = '#eef2f7';
    return look;
  };

  /* ===== 船 ===== */
  A.boat = function (opt) {
    opt = opt || {};
    const hull = opt.hull === 'hull-gold' ? '#e2b23a' : (opt.hullColor || '#c9784a');
    const sailFill = opt.sailColor || '#ffffff';
    let pattern = '';
    if (opt.sail === 'sail-star') pattern = `<polygon points="10,-46 12,-41 17,-41 13,-38 15,-33 10,-36 5,-33 7,-38 3,-41 8,-41" fill="#ffd34d"/>`;
    if (opt.sail === 'sail-rainbow') pattern = `<path d="M3,-30 L3,-34 L22,-30Z" fill="#ef6a5b"/><path d="M3,-35 L3,-40 L20,-36Z" fill="#f2a33a"/><path d="M3,-41 L3,-46 L17,-42Z" fill="#f5d04c"/><path d="M3,-47 L3,-52 L14,-48Z" fill="#5cc178"/><path d="M3,-53 L3,-58 L10,-54Z" fill="#5a86e0"/>`;
    let s = `<ellipse cx="0" cy="6" rx="34" ry="8" fill="rgba(23,92,120,.25)"/>`;
    s += `<g class="boat-rock">`;
    s += `<path d="M2,-62 L2,-24" stroke="#6b4a35" stroke-width="3"/>`;
    s += `<path d="M3,-60 L3,-26 L26,-26 Q20,-44 3,-60Z" fill="${sailFill}" stroke="#d8d2c4" stroke-width="1"/>${pattern}`;
    if (opt.flag) s += `<path d="M2,-62 L2,-72 L14,-68 L2,-64Z" fill="#e5384f" class="wave-flag"/>`;
    if (opt.rider) s += `<g transform="translate(-12,-8) scale(.62)">${opt.rider}</g>`;
    s += `<path d="M-30,-12 L30,-12 Q26,4 0,6 Q-24,4 -30,-12Z" fill="${hull}"/><path d="M-30,-12 L30,-12 L28,-8 L-28,-8Z" fill="${D.shade(hull, 0.25)}"/>`;
    s += `<circle cx="-14" cy="-4" r="2.3" fill="#fff8e0"/><circle cx="0" cy="-3" r="2.3" fill="#fff8e0"/><circle cx="14" cy="-4" r="2.3" fill="#fff8e0"/>`;
    s += `</g>`;
    return s;
  };

  /* ===== 鸚鵡小數 ===== */
  A.parrot = function () {
    return `<g class="parrot-body"><ellipse cx="0" cy="0" rx="10" ry="12" fill="#46b86a"/><circle cx="2" cy="-12" r="8" fill="#5cc97c"/>` +
      `<path d="M8,-13 Q15,-11 10,-6 Q9,-10 7,-10Z" fill="#f2a33a"/><circle cx="4" cy="-14" r="2" fill="#fff"/><circle cx="4.6" cy="-14" r="1.1" fill="#222"/>` +
      `<path d="M-6,8 L-12,20 L-2,12Z" fill="#3a9bd6"/><path d="M-2,10 L-4,22 L3,12Z" fill="#e5384f"/>` +
      `<g class="wing"><path d="M-4,-4 Q-22,-14 -20,6 Q-12,4 -4,4Z" fill="#3a9b52"/></g></g>`;
  };

  window.A = A;
})();
