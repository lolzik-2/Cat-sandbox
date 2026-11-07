(() => {
  'use strict';

  // ---------- Языки ----------
  const I18N = {
    ru: {
      title: 'Кот-песочница',
      subtitle: 'Дом, улица и соседи',
      play: 'Играть',
      settings: 'Настройки',
      language: 'Язык',
      back: 'Назад',
      langName: 'Русский',
      menu: 'Меню',
      paint: 'Писать',
      act: 'Действие',
      attack: 'Атака',
      help: 'Ходи джойстиком слева · Атака · Действие · Писать (ПК: WASD, Пробел, E, G)',
      map_street: 'Улица',
      map_home: 'Твой дом',
      map_murka: 'Дом Мурки',
      map_bur: 'Дом Бурого',
      cat_ginger: 'Рыжий',
      cat_black: 'Чёрный Барсик',
      cat_snow: 'Снежок',
      cat_grey: 'Серый',
      cat_murka: 'Мурка',
      cat_bur: 'Бурый',
      you: 'Ты',
      item_vase: 'Ваза',
      item_plate: 'Тарелка',
      item_cup: 'Кружка',
      item_bin: 'Урна',
      broke: '{label} разбит(а)! +{n}',
      catDown: '{name} убежал побитый! +20',
      catHiss: '{name} шипит!',
      scratch: '{name} царапает тебя! −{n}',
      downMsg: 'Тебя побили… Ты очнулся дома. −10 очков',
      slept: 'Ты выспался в кровати. Здоровье полное!',
      scratched: 'Поточил когти о диван. +3',
      fish: 'Пахнет рыбой. Кто-то оставил ужин…',
      nothing: 'Тут не с чем взаимодействовать. Иди к кровати или дивану.',
      wrote: 'Ты написал: «{text}»',
      tags: ['MEOW', 'КОТ ТУТ', 'ЛАПКА', 'ХОЗЯИН ДОМА', 'мяу!', 'ТУТ БЫЛ Я', 'ЛУНА'],
    },
    en: {
      title: 'Cat Sandbox',
      subtitle: 'Home, street and neighbours',
      play: 'Play',
      settings: 'Settings',
      language: 'Language',
      back: 'Back',
      langName: 'English',
      menu: 'Menu',
      paint: 'Paint',
      act: 'Action',
      attack: 'Attack',
      help: 'Move with the joystick on the left · Attack · Action · Paint (PC: WASD, Space, E, G)',
      map_street: 'Street',
      map_home: 'Your home',
      map_murka: "Murka's house",
      map_bur: "Brown's house",
      cat_ginger: 'Ginger',
      cat_black: 'Black Barsik',
      cat_snow: 'Snowball',
      cat_grey: 'Grey',
      cat_murka: 'Murka',
      cat_bur: 'Brown',
      you: 'You',
      item_vase: 'Vase',
      item_plate: 'Plate',
      item_cup: 'Mug',
      item_bin: 'Bin',
      broke: '{label} broken! +{n}',
      catDown: '{name} ran off beaten! +20',
      catHiss: '{name} hisses!',
      scratch: '{name} scratches you! −{n}',
      downMsg: 'You got beaten up… You woke up at home. −10 points',
      slept: 'You slept in the bed. Health restored!',
      scratched: 'Scratched the sofa. +3',
      fish: 'Smells like fish. Someone left dinner…',
      nothing: 'Nothing to interact with here. Try the bed or the sofa.',
      wrote: 'You wrote: «{text}»',
      tags: ['MEOW', 'CAT HERE', 'PAW', 'HOUSE OWNER', 'mrrr!', 'I WAS HERE', 'LUNA'],
    },
  };

  let lang = 'ru';
  try {
    const saved = localStorage.getItem('catLang');
    if (saved === 'ru' || saved === 'en') lang = saved;
  } catch (e) { /* хранилище недоступно — оставляем язык по умолчанию */ }

  function t(key, vars) {
    let s = (I18N[lang][key] ?? I18N.en[key] ?? key);
    if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
    return s;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.getElementById('bLang').textContent = I18N[lang].langName;
  }

  // ---------- Настройки игры ----------
  const TS = 32;                                   // размер тайла в мировых пикселях
  const S = TS;
  const SOLID = new Set(['#', 'x', 'f', 'T', 'S', 'B', 'K']);
  const ITEM_INFO = {
    vase:  { score: 10, labelKey: 'item_vase',  color: '#3f7fd1' },
    plate: { score: 5,  labelKey: 'item_plate', color: '#f4f4f4' },
    cup:   { score: 3,  labelKey: 'item_cup',   color: '#fafafa' },
    bin:   { score: 8,  labelKey: 'item_bin',   color: '#7d848e' },
  };
  const SPRAY = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585', '#ffffff'];

  // ---------- Карты ----------
  // kind: out = улица, in = интерьер
  // Символы: # стена, x куст, f забор, g трава, r дорога, s тротуар,
  //          . пол, R ковёр, T стол, S диван, B кровать, K кухня, D дверь
  const MAP_DEFS = {
    street: {
      nameKey: 'map_street', kind: 'out',
      rows: [
        'xxxxxxxxxxxxxxxxxxxxxxxx',
        'xggggggggggggggggggggggx',
        'xg#####gg#####gg#####ggx',
        'xg#####gg#####gg#####ggx',
        'xg#####gg#####gg#####ggx',
        'xg##D##gg##D##gg##D##ggx',
        'xssssssssssssssssssssssx',
        'xrrrrrrrrrrrrrrrrrrrrrrx',
        'xrrrrrrrrrrrrrrrrrrrrrrx',
        'xssssssssssssssssssssssx',
        'xggggffffggggggggggggggx',
        'xggxgggggggggggggggxggg',
        'xgggggggggggggggggggggx',
        'xggggggxggggggggggggggx',
      ],
      doors: {
        '4,5':  { to: 'home',  x: 5, y: 7 },
        '11,5': { to: 'murka', x: 5, y: 7 },
        '18,5': { to: 'bur',   x: 5, y: 7 },
      },
      items: [
        { kind: 'bin', tx: 14, ty: 6 },
        { kind: 'bin', tx: 21, ty: 6 },
        { kind: 'vase', tx: 9, ty: 9 },
      ],
      cats: [
        { nameKey: 'cat_ginger', color: '#e8943a', stripes: true, aggressive: true, tx: 8, ty: 8 },
        { nameKey: 'cat_black', color: '#2b2b33', aggressive: true, tx: 20, ty: 8 },
        { nameKey: 'cat_snow', color: '#f2f2f2', aggressive: false, tx: 14, ty: 11 },
        { nameKey: 'cat_grey', color: '#9a9aa6', stripes: true, aggressive: false, tx: 3, ty: 12 },
      ],
    },

    home: {
      nameKey: 'map_home', kind: 'in',
      rows: [
        '############',
        '#..........#',
        '#KKK.......#',
        '#..........#',
        '#.TT....SSS#',
        '#..........#',
        '#B.RRRRR...#',
        '#..........#',
        '#####D######',
      ],
      doors: { '5,8': { to: 'street', x: 4, y: 6 } },
      items: [
        { kind: 'vase', tx: 2, ty: 4 },
        { kind: 'cup', tx: 3, ty: 4 },
        { kind: 'plate', tx: 2, ty: 2 },
      ],
      cats: [],
    },

    murka: {
      nameKey: 'map_murka', kind: 'in',
      rows: [
        '############',
        '#..........#',
        '#..TTT.....#',
        '#..........#',
        '#SSS.......#',
        '#..........#',
        '#.....BB...#',
        '#..........#',
        '#####D######',
      ],
      doors: { '5,8': { to: 'street', x: 11, y: 6 } },
      items: [
        { kind: 'vase', tx: 4, ty: 2 },
        { kind: 'cup', tx: 5, ty: 2 },
        { kind: 'cup', tx: 9, ty: 6 },
      ],
      cats: [
        { nameKey: 'cat_murka', color: '#c9b5a0', stripes: true, aggressive: false, tx: 8, ty: 4 },
      ],
    },

    bur: {
      nameKey: 'map_bur', kind: 'in',
      rows: [
        '############',
        '#..........#',
        '#KK........#',
        '#..........#',
        '#.TTT......#',
        '#..........#',
        '#.......SSS#',
        '#..........#',
        '#####D######',
      ],
      doors: { '5,8': { to: 'street', x: 18, y: 6 } },
      items: [
        { kind: 'plate', tx: 1, ty: 2 },
        { kind: 'plate', tx: 2, ty: 2 },
        { kind: 'vase', tx: 3, ty: 4 },
        { kind: 'cup', tx: 5, ty: 5 },
      ],
      cats: [
        { nameKey: 'cat_bur', color: '#7a4a22', aggressive: true, big: true, tx: 8, ty: 4 },
      ],
    },
  };

  // ---------- Состояние мира ----------
  const worlds = {};
  let cur = null;
  let screen = 'menu';   // menu | settings | game

  function makeCat(c) {
    const x = c.tx * TS + TS / 2, y = c.ty * TS + TS / 2;
    const maxHp = c.big ? 100 : 60;
    return {
      nameKey: c.nameKey, color: c.color, stripes: !!c.stripes, aggressive: !!c.aggressive,
      big: !!c.big, maxHp, hp: maxHp,
      x, y, homeX: x, homeY: y,
      fx: 1, fy: 0, moving: false,
      wdx: 0, wdy: 0, wanderT: 0,
      cd: 0, hit: 0, atkT: 0, flee: 0,
      dead: false, respawn: 0,
    };
  }

  function getWorld(key) {
    if (worlds[key]) return worlds[key];
    const def = MAP_DEFS[key];
    const W = Math.max(...def.rows.map(r => r.length));
    const grid = def.rows.map(r => r.padEnd(W, 'x').split(''));
    const world = {
      key, def, W, H: grid.length, grid,
      items: def.items.map(i => ({
        kind: i.kind, cx: i.tx * TS + TS / 2, cy: i.ty * TS + TS / 2, broken: false,
      })),
      cats: def.cats.map(makeCat),
      marks: [],
    };
    worlds[key] = world;
    return world;
  }

  const player = {
    x: 0, y: 0, fx: 0, fy: 1, moving: false,
    hp: 100, maxHp: 100, score: 0,
    cd: 0, atkT: 0, hit: 0, regenT: 0,
    color: '#8e8ea0', stripes: true,
  };

  const particles = [];
  const keys = new Set();
  const pend = { atk: false, act: false, paint: false };
  const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hudMap = document.getElementById('hudMap');
  const hudHp = document.getElementById('hudHp');
  const hudScore = document.getElementById('hudScore');
  const msgEl = document.getElementById('msg');
  let dpr = 1;
  let msgTimer = 0;

  // ---------- Утилиты ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function showMsg(text) {
    msgEl.textContent = text;
    msgEl.classList.add('show');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => msgEl.classList.remove('show'), 2600);
  }

  function burst(x, y, color, n, speed = 90) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      const life = 0.5 + Math.random() * 0.4;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life, max: life, color, size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= cur.W || ty >= cur.H) return 'x';
    return cur.grid[ty][tx];
  }

  function blocked(x, y, h) {
    const x0 = Math.floor((x - h) / TS), x1 = Math.floor((x + h - 0.01) / TS);
    const y0 = Math.floor((y - h) / TS), y1 = Math.floor((y + h - 0.01) / TS);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (SOLID.has(tileAt(tx, ty))) return true;
      }
    }
    return false;
  }

  function move(e, dx, dy, h) {
    if (!blocked(e.x + dx, e.y, h)) e.x += dx;
    if (!blocked(e.x, e.y + dy, h)) e.y += dy;
  }

  // ---------- Загрузка мира ----------
  function loadWorld(key, tx, ty) {
    cur = getWorld(key);
    player.x = tx * TS + TS / 2;
    player.y = ty * TS + TS / 2;
    particles.length = 0;
    showMsg(t(cur.def.nameKey));
  }

  // ---------- Игрок ----------
  function hurtPlayer(n, nameKey) {
    player.hp -= n;
    player.hit = 0.25;
    player.regenT = 4;
    burst(player.x, player.y, '#ff5252', 5, 60);
    showMsg(t('scratch', { name: t(nameKey), n }));
  }

  function onPlayerDown() {
    player.score = Math.max(0, player.score - 10);
    player.hp = Math.round(player.maxHp * 0.5);
    loadWorld('home', 2, 6);
    showMsg(t('downMsg'));
  }

  function doAttack() {
    if (player.cd > 0) return;
    player.cd = 0.35;
    player.atkT = 0.25;
    const ax = player.x + player.fx * 20, ay = player.y + player.fy * 20;
    let did = false;

    for (const c of cur.cats) {
      if (c.dead || Math.hypot(ax - c.x, ay - c.y) > 24) continue;
      did = true;
      c.hp -= 20;
      c.hit = 0.2;
      burst(c.x, c.y, '#ffffff', 6, 70);
      if (!c.aggressive) c.flee = 3;
      move(c, player.fx * 12, player.fy * 12, 6);
      if (c.hp <= 0) {
        c.dead = true;
        c.respawn = 20;
        player.score += 20;
        burst(c.x, c.y, '#ffd166', 16, 120);
        showMsg(t('catDown', { name: t(c.nameKey) }));
      } else {
        showMsg(t('catHiss', { name: t(c.nameKey) }));
      }
    }

    for (const it of cur.items) {
      if (it.broken || Math.hypot(ax - it.cx, ay - it.cy) > 22) continue;
      it.broken = true;
      did = true;
      const info = ITEM_INFO[it.kind];
      player.score += info.score;
      burst(it.cx, it.cy, info.color, 12, 110);
      showMsg(t('broke', { label: t(info.labelKey), n: info.score }));
      break;
    }

    if (!did) burst(ax, ay, 'rgba(255,255,255,.7)', 2, 30);
  }

  function doInteract() {
    const tx = Math.floor(player.x / TS), ty = Math.floor(player.y / TS);
    const near = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) near.add(tileAt(tx + dx, ty + dy));
    }
    if (near.has('B')) {
      player.hp = player.maxHp;
      showMsg(t('slept'));
    } else if (near.has('S')) {
      player.score += 3;
      burst(player.x, player.y - 8, '#9fd3ff', 6, 50);
      showMsg(t('scratched'));
    } else if (near.has('K')) {
      showMsg(t('fish'));
    } else {
      showMsg(t('nothing'));
    }
  }

  function doPaint() {
    const px = player.x + player.fx * 22, py = player.y + player.fy * 22;
    const tag = Math.floor(Math.random() * I18N.ru.tags.length);
    const color = SPRAY[Math.floor(Math.random() * SPRAY.length)];
    cur.marks.push({ x: px, y: py, tag, color, rot: (Math.random() - 0.5) * 0.5 });
    if (cur.marks.length > 60) cur.marks.shift();
    showMsg(t('wrote', { text: I18N[lang].tags[tag] }));
  }

  // Возвращает true, если мир сменился (тогда кошки в этом кадре не двигаем)
  function updatePlayer(dt) {
    const k = (c) => keys.has(c);
    let ix = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0) + joy.x;
    let iy = (k('KeyS') || k('ArrowDown') ? 1 : 0) - (k('KeyW') || k('ArrowUp') ? 1 : 0) + joy.y;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    player.moving = mag > 0.1;
    if (player.moving) {
      const dm = Math.hypot(ix, iy) || 1;
      player.fx = ix / dm;
      player.fy = iy / dm;
      move(player, ix * 95 * dt, iy * 95 * dt, 7);
    }

    player.cd -= dt;
    player.atkT -= dt;
    player.hit -= dt;
    if (player.regenT > 0) player.regenT -= dt;
    else if (player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + dt * 3);

    if (pend.atk) { pend.atk = false; doAttack(); }
    if (pend.act) { pend.act = false; doInteract(); }
    if (pend.paint) { pend.paint = false; doPaint(); }

    const tx = Math.floor(player.x / TS), ty = Math.floor(player.y / TS);
    if (tileAt(tx, ty) === 'D') {
      const d = cur.def.doors[`${tx},${ty}`];
      if (d) {
        loadWorld(d.to, d.x, d.y);
        return true;
      }
    }
    return false;
  }

  // ---------- Кошки-NPC ----------
  function reviveCat(c) {
    c.dead = false;
    c.hp = c.maxHp;
    c.x = c.homeX;
    c.y = c.homeY;
  }

  function updateCats(dt) {
    for (const c of cur.cats) {
      if (c.dead) {
        c.respawn -= dt;
        if (c.respawn <= 0) reviveCat(c);
        continue;
      }
      c.cd -= dt;
      c.hit -= dt;
      c.atkT -= dt;
      c.flee -= dt;

      const dx = player.x - c.x, dy = player.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      let mx = 0, my = 0, sp = 0;

      if (c.aggressive && player.hp > 0 && d < 140) {
        mx = dx / d; my = dy / d;
        sp = c.big ? 60 : 70;
        if (d < 22 && c.cd <= 0) {
          c.cd = 1.1;
          c.atkT = 0.3;
          hurtPlayer(c.big ? 10 : 6, c.nameKey);
        }
      } else if (c.flee > 0) {
        mx = -dx / d; my = -dy / d;
        sp = 110;
      } else {
        // бродит вокруг своего дома
        c.wanderT -= dt;
        if (c.wanderT <= 0) {
          c.wanderT = 1 + Math.random() * 2.5;
          const a = Math.random() * Math.PI * 2;
          const s = Math.random() < 0.4 ? 0 : 1;
          c.wdx = Math.cos(a) * s;
          c.wdy = Math.sin(a) * s;
        }
        mx = c.wdx; my = c.wdy; sp = 25;
        const hd = Math.hypot(c.x - c.homeX, c.y - c.homeY) || 1;
        if (hd > 96) {
          mx = (c.homeX - c.x) / hd;
          my = (c.homeY - c.y) / hd;
          sp = 40;
        }
      }

      const vx = mx * sp * dt, vy = my * sp * dt;
      move(c, vx, vy, 6);
      c.moving = Math.abs(vx) + Math.abs(vy) > 0.01;
      if (c.moving) {
        const m = Math.hypot(mx, my) || 1;
        c.fx = mx / m; c.fy = my / m;
      } else if (c.aggressive && d < 140) {
        c.fx = dx / d; c.fy = dy / d;
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateHud() {
    hudMap.textContent = t(cur.def.nameKey);
    hudHp.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    hudScore.textContent = `${player.score}`;
  }

  function update(dt) {
    if (screen !== 'game') return;
    const changed = updatePlayer(dt);
    if (!changed) updateCats(dt);
    if (player.hp <= 0) onPlayerDown();
    updateParticles(dt);
    updateHud();
  }

  // ---------- Иконки (рисуем в коде, без эмодзи) ----------
  function drawIcon(c, kind) {
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#ffffff';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    switch (kind) {
      case 'paw':
        g.beginPath(); g.ellipse(32, 42, 15, 13, 0, 0, Math.PI * 2); g.fill();
        for (const [x, y] of [[13, 26], [25, 14], [39, 14], [51, 26]]) {
          g.beginPath(); g.ellipse(x, y, 6.5, 8, 0, 0, Math.PI * 2); g.fill();
        }
        break;
      case 'hand':
        g.lineWidth = 7;
        for (let i = 0; i < 4; i++) {
          const x = 20 + i * 8;
          g.beginPath(); g.moveTo(x, 32); g.lineTo(x, 16); g.stroke();
        }
        g.beginPath(); g.ellipse(33, 42, 17, 14, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(16, 40); g.lineTo(8, 30); g.stroke();
        break;
      case 'brush':
        g.lineWidth = 6;
        g.beginPath(); g.moveTo(50, 12); g.lineTo(28, 36); g.stroke();
        g.beginPath(); g.ellipse(24, 42, 7, 6, -0.8, 0, Math.PI * 2); g.fill();
        break;
      case 'heart':
        g.beginPath();
        g.moveTo(32, 54);
        g.bezierCurveTo(8, 38, 6, 22, 18, 16);
        g.bezierCurveTo(26, 12, 32, 20, 32, 24);
        g.bezierCurveTo(32, 20, 38, 12, 46, 16);
        g.bezierCurveTo(58, 22, 56, 38, 32, 54);
        g.fill();
        break;
      case 'star':
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 11 : 26;
          const a = -Math.PI / 2 + i * Math.PI / 5;
          const px = 32 + Math.cos(a) * r, py = 34 + Math.sin(a) * r;
          if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.closePath(); g.fill();
        break;
      case 'menu':
        g.lineWidth = 6;
        for (const y of [20, 32, 44]) { g.beginPath(); g.moveTo(14, y); g.lineTo(50, y); g.stroke(); }
        break;
    }
  }

  // ---------- Текстуры (рисуем процедурно, без картинок) ----------
  const rand = (n) => Math.random() * n;

  function speckle(g, color, n) {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) g.fillRect(rand(S), rand(S), 2, 2);
  }
  function fillAll(g, color) {
    g.fillStyle = color;
    g.fillRect(0, 0, S, S);
  }
  function grass(g) {
    fillAll(g, '#6aa84f');
    speckle(g, 'rgba(40,90,30,.35)', 30);
    speckle(g, 'rgba(170,230,120,.3)', 14);
  }
  function road(g) {
    fillAll(g, '#3d4150');
    speckle(g, '#4a4f5c', 40);
    speckle(g, '#2c303a', 25);
  }
  function sidewalk(g) {
    fillAll(g, '#cfc9bd');
    g.strokeStyle = '#a9a295';
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, S - 1, S - 1);
    speckle(g, 'rgba(0,0,0,.06)', 10);
  }
  function fence(g) {
    grass(g);
    g.fillStyle = '#a0703f';
    for (let i = 0; i < 4; i++) g.fillRect(i * 8 + 1, 0, 6, S);
    g.fillStyle = '#6e4a25';
    g.fillRect(0, 9, S, 3);
    g.fillRect(0, 20, S, 3);
  }
  function bush(g) {
    grass(g);
    const blobs = [[10, 10, 9, '#2f6b2f'], [22, 11, 8, '#3c8a3c'], [13, 22, 9, '#2a5f2a'], [23, 23, 7, '#367d36']];
    for (const [x, y, r, c] of blobs) {
      g.fillStyle = c;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.12)';
    g.beginPath(); g.arc(8, 8, 3, 0, Math.PI * 2); g.fill();
  }
  function brick(g) {
    fillAll(g, '#9b4d32');
    g.strokeStyle = 'rgba(230,205,180,.8)';
    g.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      const y = r * 8;
      g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(S, y + 0.5); g.stroke();
      const off = r % 2 ? 0 : 8;
      for (let x = off; x <= S; x += 16) {
        g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x + 0.5, y + 8); g.stroke();
      }
    }
    speckle(g, 'rgba(0,0,0,.12)', 20);
  }
  function wallpaper(g) {
    fillAll(g, '#e9dcc3');
    g.fillStyle = '#d3bf9b';
    for (let x = 0; x < S; x += 8) g.fillRect(x + 3, 0, 2, S);
    g.fillStyle = '#b9a27c';
    g.fillRect(0, 0, S, 4);
  }
  function wood(g) {
    fillAll(g, '#b07c4a');
    for (let y = 0; y < S; y += 8) {
      g.fillStyle = '#8c5f36';
      g.fillRect(0, y, S, 1);
      g.fillRect(((y / 8) % 2) ? 12 : 4, y, 1, 8);
    }
    speckle(g, 'rgba(60,30,10,.18)', 16);
  }
  function rug(g) {
    wood(g);
    g.fillStyle = '#a33b3b'; g.fillRect(1, 1, S - 2, S - 2);
    g.fillStyle = '#d9a441'; g.fillRect(4, 4, S - 8, S - 8);
    g.fillStyle = '#a33b3b'; g.fillRect(8, 8, S - 16, S - 16);
  }
  function table(g) {
    wood(g);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(4, 5, 26, 26);
    g.fillStyle = '#6b4120'; g.fillRect(2, 2, 26, 26);
    g.fillStyle = '#8a5a2e'; g.fillRect(5, 5, 20, 20);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(5, 5, 20, 3);
  }
  function sofa(g) {
    wood(g);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(3, 5, 28, 25);
    g.fillStyle = '#3f6f9e'; g.fillRect(2, 3, 28, 26);
    g.fillStyle = '#2d5378'; g.fillRect(2, 3, 28, 7);
    g.fillStyle = '#4f85b8'; g.fillRect(5, 12, 9, 15); g.fillRect(18, 12, 9, 15);
  }
  function bed(g) {
    wood(g);
    g.fillStyle = '#6b4226'; g.fillRect(1, 1, 30, 30);
    g.fillStyle = '#ffffff'; g.fillRect(4, 3, 24, 7);
    g.fillStyle = '#e0566a'; g.fillRect(3, 12, 26, 18);
    g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(3, 20, 26, 2);
  }
  function kitchen(g) {
    wood(g);
    g.fillStyle = '#b9c0c8'; g.fillRect(0, 0, S, S);
    g.fillStyle = '#9aa3ad'; g.fillRect(0, 0, S, 3);
    g.fillStyle = '#6f7882';
    g.beginPath(); g.arc(16, 18, 5, 0, Math.PI * 2); g.fill();
  }
  function door(g) {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(6, 3, 22, 28);
    g.fillStyle = '#6b3f1f'; g.fillRect(5, 2, 22, 28);
    g.fillStyle = '#82502a'; g.fillRect(8, 5, 16, 10); g.fillRect(8, 17, 16, 10);
    g.fillStyle = '#f2c14e';
    g.beginPath(); g.arc(22, 16, 2, 0, Math.PI * 2); g.fill();
  }

  function paintTile(g, kind, ch) {
    switch (ch) {
      case 'g': return grass(g);
      case 'r': return road(g);
      case 's': return sidewalk(g);
      case 'f': return fence(g);
      case 'x': return bush(g);
      case '#': return kind === 'out' ? brick(g) : wallpaper(g);
      case '.': return wood(g);
      case 'R': return rug(g);
      case 'T': return table(g);
      case 'S': return sofa(g);
      case 'B': return bed(g);
      case 'K': return kitchen(g);
      case 'D':
        if (kind === 'out') brick(g); else wallpaper(g);
        return door(g);
      default: return fillAll(g, '#000');
    }
  }

  const texCache = new Map();
  function getTex(kind, ch) {
    const key = kind + ch;
    let c = texCache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = TS;
      paintTile(c.getContext('2d'), kind, ch);
      texCache.set(key, c);
    }
    return c;
  }

  // ---------- Отрисовка мира ----------
  function drawItem(it) {
    ctx.save();
    ctx.translate(it.cx, it.cy);
    switch (it.kind) {
      case 'vase':
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.beginPath(); ctx.ellipse(1, 4, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3f7fd1';
        ctx.beginPath(); ctx.ellipse(0, 1, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2c5fa8'; ctx.fillRect(-2.5, -8, 5, 4);
        ctx.fillStyle = '#8fc1ff'; ctx.fillRect(-3, -2, 2, 5);
        break;
      case 'plate':
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.beginPath(); ctx.ellipse(1, 2, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f4f4f4';
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c4c4c4'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'cup':
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.fillRect(-4, -3, 10, 10);
        ctx.fillStyle = '#fafafa'; ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-3.5, -3.5, 7, 7);
        ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(6, 0, 3, -1.5, 1.5); ctx.stroke();
        break;
      case 'bin':
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.beginPath(); ctx.ellipse(1, 3, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7d848e';
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a6068';
        ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9aa1aa';
        ctx.beginPath(); ctx.arc(-2, -2, 1.5, 0, Math.PI * 2); ctx.fill();
        break;
    }
    ctx.restore();
  }

  function drawMarks(world) {
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const m of world.marks) {
      const text = I18N[lang].tags[m.tag];
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.strokeText(text, 0, 0);
      ctx.fillStyle = m.color;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  function drawCat(c, time, isPlayer) {
    const x = c.x, y = c.y;

    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(c.fy, c.fx));
    ctx.lineCap = 'round';
    const col = c.hit > 0 ? '#ff8a80' : c.color;
    const w = c.moving ? Math.sin(time * 16) : 0;

    // хвост
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.quadraticCurveTo(-15, Math.sin(time * 5) * 4, -19, -6 + Math.sin(time * 5) * 3);
    ctx.stroke();

    // лапы
    ctx.fillStyle = col;
    for (const [lx, ly, s] of [[-4, -6, 1], [-4, 6, -1], [4, -6, -1], [4, 6, 1]]) {
      ctx.beginPath(); ctx.ellipse(lx, ly + w * s * 1.5, 2.6, 2, 0, 0, Math.PI * 2); ctx.fill();
    }

    // тело
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    if (c.stripes) {
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const sx of [-4, -0.5, 3]) {
        ctx.moveTo(sx, -6); ctx.lineTo(sx - 2.5, -1.5);
        ctx.moveTo(sx, 6); ctx.lineTo(sx - 2.5, 1.5);
      }
      ctx.stroke();
    }

    // голова и уши
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(9, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -4); ctx.lineTo(7, -10); ctx.lineTo(10, -4.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(7, 10); ctx.lineTo(10, 4.5); ctx.closePath(); ctx.fill();

    // глаза и нос
    ctx.fillStyle = isPlayer ? '#2ecc71' : '#111';
    ctx.beginPath(); ctx.arc(12.5, -2.2, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12.5, 2.2, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fa3';
    ctx.beginPath(); ctx.arc(14.6, 0, 0.9, 0, Math.PI * 2); ctx.fill();

    // взмах лапой
    if (c.atkT > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(16, 0, 11, -0.9, 0.9); ctx.stroke();
    }
    ctx.restore();

    // имя и полоска здоровья
    const label = isPlayer ? t('you') : t(c.nameKey);
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,.7)';
    ctx.strokeText(label, x, y - 14);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x, y - 14);
    if (isPlayer || c.hp < c.maxHp) {
      const hp = isPlayer ? player.hp : c.hp;
      const mhp = isPlayer ? player.maxHp : c.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(x - 10, y - 13, 20, 3);
      ctx.fillStyle = isPlayer ? '#4caf50' : '#ef5350';
      ctx.fillRect(x - 10, y - 13, 20 * clamp(hp / mhp, 0, 1), 3);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function viewScale() {
    // сколько тайлов помещается по ширине/высоте экрана; ограничиваем масштаб
    const css = Math.min(2.6, Math.max(innerWidth / (12 * TS), innerHeight / (18 * TS)));
    return css * dpr;
  }

  function render(time) {
    const cw = canvas.width, ch = canvas.height;
    const scale = viewScale();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d1f24';
    ctx.fillRect(0, 0, cw, ch);

    const viewW = cw / scale, viewH = ch / scale;
    const mapW = cur.W * TS, mapH = cur.H * TS;
    const camX = mapW <= viewW ? (mapW - viewW) / 2 : clamp(player.x - viewW / 2, 0, mapW - viewW);
    const camY = mapH <= viewH ? (mapH - viewH) / 2 : clamp(player.y - viewH / 2, 0, mapH - viewH);
    ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);

    for (let ty = 0; ty < cur.H; ty++) {
      for (let tx = 0; tx < cur.W; tx++) {
        ctx.drawImage(getTex(cur.def.kind, cur.grid[ty][tx]), tx * TS, ty * TS);
      }
    }
    for (const it of cur.items) if (!it.broken) drawItem(it);
    drawMarks(cur);

    const list = cur.cats.filter(c => !c.dead);
    list.push(player);
    list.sort((a, b) => a.y - b.y);
    for (const e of list) drawCat(e, time, e === player);

    drawParticles();

    // джойстик — в экранных координатах
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (screen === 'game' && joy.id !== null) {
      ctx.strokeStyle = 'rgba(255,255,255,.4)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 55, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.arc(joy.ox + joy.x * 55, joy.oy + joy.y * 55, 22, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- Экраны ----------
  function setScreen(name) {
    screen = name;
    document.body.dataset.screen = name;
    document.getElementById('menu').classList.toggle('hidden', name !== 'menu');
    document.getElementById('settings').classList.toggle('hidden', name !== 'settings');
    if (name === 'game') {
      pend.atk = pend.act = pend.paint = false;
      keys.clear();
      joy.id = null; joy.x = 0; joy.y = 0;
      updateHud();
    }
  }

  function toggleLang() {
    lang = lang === 'ru' ? 'en' : 'ru';
    try { localStorage.setItem('catLang', lang); } catch (e) { /* без сохранения — ничего страшного */ }
    applyLang();
    if (screen === 'game') updateHud();
  }

  document.getElementById('bPlay').addEventListener('click', () => {
    setScreen('game');
    showMsg(t('help'));
  });
  document.getElementById('bToSettings').addEventListener('click', () => setScreen('settings'));
  document.getElementById('bBack').addEventListener('click', () => setScreen('menu'));
  document.getElementById('bLang').addEventListener('click', toggleLang);
  document.getElementById('bMenu').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    setScreen('menu');
  });

  // ---------- Ввод ----------
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (screen === 'game') setScreen('menu');
      else if (screen === 'settings') setScreen('menu');
      return;
    }
    if (screen !== 'game') return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (keys.has(e.code)) return;
    keys.add(e.code);
    if (e.code === 'Space') pend.atk = true;
    if (e.code === 'KeyE') pend.act = true;
    if (e.code === 'KeyG') pend.paint = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  function bindBtn(id, action) {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (screen === 'game') pend[action] = true;
    });
  }
  bindBtn('bAtk', 'atk');
  bindBtn('bAct', 'act');
  bindBtn('bPaint', 'paint');

  // Джойстик: касание в левой части экрана
  canvas.addEventListener('pointerdown', (e) => {
    if (screen !== 'game' || joy.id !== null || e.clientX > innerWidth * 0.55) return;
    joy.id = e.pointerId;
    joy.ox = e.clientX;
    joy.oy = e.clientY;
    joy.x = 0;
    joy.y = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joy.id) return;
    const dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
    const R = 55;
    const len = Math.hypot(dx, dy);
    const k = len > R ? R / len : 1;
    joy.x = (dx * k) / R;
    joy.y = (dy * k) / R;
    if (Math.hypot(joy.x, joy.y) < 0.12) { joy.x = 0; joy.y = 0; }
  });
  const endJoy = (e) => {
    if (e.pointerId !== joy.id) return;
    joy.id = null;
    joy.x = 0;
    joy.y = 0;
  };
  canvas.addEventListener('pointerup', endJoy);
  canvas.addEventListener('pointercancel', endJoy);

  // ---------- Запуск ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  document.querySelectorAll('canvas[data-icon]').forEach(c => drawIcon(c, c.dataset.icon));
  applyLang();
  loadWorld('home', 5, 6);
  setScreen('menu');

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render(now / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
