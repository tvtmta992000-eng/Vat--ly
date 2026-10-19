// Phân tích lực – 30 tình huống kinh điển, chia 6 nhóm.
// Mỗi tình huống: tham số (thanh trượt), tính toán, hình vẽ với vectơ lực theo tỉ lệ, số liệu và ghi chú.
// Hệ toạ độ vẽ logic 720×400 (không phụ thuộc kích thước thật của canvas).
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="forces"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var canvas = root.querySelector('canvas');
  var view = VL.setupCanvas(canvas);
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var G = 9.8;
  var DEG = Math.PI / 180;
  var EPS = 1e-9;

  var groupSel = root.querySelector('[data-role="group"]');
  var caseSel = root.querySelector('[data-role="case"]');
  var paramBox = root.querySelector('[data-role="params"]');
  var readoutBox = root.querySelector('[data-role="readout"]');
  var noteBox = root.querySelector('[data-role="note"]');
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');
  var prevBtn = root.querySelector('[data-action="prev"]');
  var nextBtn = root.querySelector('[data-action="next"]');

  // ---------------------------------------------------------------- Màu & tiện ích vẽ
  var C = {
    P: '#dc2626', // trọng lực
    N: '#2563eb', // phản lực
    ms: '#ea580c', // ma sát
    T: '#7c3aed', // lực căng
    F: '#16a34a', // lực kéo / đẩy
    dh: '#0d9488', // lực đàn hồi
    A: '#0891b2', // lực đẩy Ác-si-mét
    qt: '#64748b', // lực quán tính
    c: '#a16207', // lực cản
    net: '#1e1b4b', // hợp lực
    v: '#475569', // vận tốc / gia tốc
  };
  var KIND_NAME = {
    P: 'Trọng lực',
    N: 'Phản lực',
    ms: 'Ma sát',
    T: 'Lực căng',
    F: 'Lực kéo/đẩy',
    dh: 'Lực đàn hồi',
    A: 'Lực đẩy Ác-si-mét',
    qt: 'Lực quán tính',
    c: 'Lực cản',
    net: 'Hợp lực',
    v: 'Vận tốc/gia tốc',
  };
  var INK = '#1e1b4b';
  var MUTED = '#5b6478';
  var LINE = '#334155';
  var FILL = '#e6e9f4';
  var BODY = '#e2e8f0';
  var BODY2 = '#cbd5e1';
  var BODY_EDGE = '#475569';
  var WATER = 'rgba(56, 189, 248, 0.22)';
  var WATER_EDGE = '#0284c7';
  var DANGER = '#b91c1c';
  var OK = '#15803d';

  var used = {};

  function fmt(v, d) {
    return VL.fmt(v, d);
  }
  function fN(v) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    return fmt(v, a >= 100 ? 0 : a >= 10 ? 1 : 2) + ' N';
  }
  function fAcc(v) {
    return fmt(v, 2) + ' m/s²';
  }
  function fDeg(rad) {
    return fmt(rad / DEG, 1) + '°';
  }
  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }
  function font(size, weight) {
    return (weight || 600) + ' ' + size + 'px "Be Vietnam Pro", system-ui, sans-serif';
  }

  function txt(s, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = font(o.size || 13, o.weight || 600);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.halo) {
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(248, 250, 255, 0.92)';
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || INK;
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  function tag(s, x, y, color, size) {
    txt(s, x, y, { color: color, size: size || 14, weight: 700, align: 'center', base: 'middle', halo: true });
  }

  // Mũi tên lực: gốc (x, y), vectơ (dx, dy) theo pixel.
  function arrow(x, y, dx, dy, kind, text, o) {
    o = o || {};
    var len = Math.hypot(dx, dy);
    if (!(len >= 1.5)) return;
    used[kind] = true;
    var col = C[kind];
    var ux = dx / len;
    var uy = dy / len;
    var head = Math.min(o.head || 11, len * 0.6);
    var tx = x + dx;
    var ty = y + dy;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = o.width || 3;
    ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx - ux * head * 0.8, ty - uy * head * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - ux * head - uy * head * 0.5, ty - uy * head + ux * head * 0.5);
    ctx.lineTo(tx - ux * head + uy * head * 0.5, ty - uy * head - ux * head * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (text) {
      var size = o.size || 14;
      ctx.save();
      ctx.font = font(size, 700);
      var tw = ctx.measureText(text).width;
      ctx.restore();
      var off = 8 + Math.abs(ux) * tw / 2 + Math.abs(uy) * size * 0.55;
      tag(text, tx + ux * off + (o.lx || 0), ty + uy * off + (o.ly || 0), col, size);
    }
  }

  function line(x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color || LINE;
    ctx.lineWidth = width || 2;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function poly(pts, fill, stroke, width) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width || 2;
      ctx.stroke();
    }
  }

  // Mặt sàn (gạch chéo phía dưới), trần (phía trên), tường (phía phải/trái).
  function hatch(x1, y1, x2, y2, side) {
    line(x1, y1, x2, y2, LINE, 2.5);
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    var horizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    var n = Math.floor((horizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1)) / 12);
    for (var i = 0; i <= n; i++) {
      var t = n ? i / n : 0;
      var x = x1 + (x2 - x1) * t;
      var y = y1 + (y2 - y1) * t;
      if (side === 'down') { ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 8); }
      else if (side === 'up') { ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 8); }
      else if (side === 'right') { ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 8); }
      else { ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 8); }
    }
    ctx.stroke();
    ctx.restore();
  }
  function ground(x1, x2, y) {
    hatch(x1, y, x2, y, 'down');
  }
  function ceiling(x1, x2, y) {
    hatch(x1, y, x2, y, 'up');
  }

  // Hình hộp tâm (cx, cy), quay góc ang (rad, chiều kim đồng hồ trên màn hình).
  function box(cx, cy, w, h, ang, text, fill) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang || 0);
    ctx.fillStyle = fill || BODY;
    ctx.strokeStyle = BODY_EDGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-w / 2, -h / 2, w, h);
    ctx.fill();
    ctx.stroke();
    if (text) {
      // Nhãn ở góc trên bên trái để không bị các mũi tên xuất phát từ tâm che.
      ctx.fillStyle = INK;
      ctx.font = font(11, 700);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(text, -w / 2 + 4, -h / 2 + 4);
    }
    ctx.restore();
  }

  function circle(x, y, r, fill, stroke, width) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width || 2;
      ctx.stroke();
    }
  }

  function pulley(x, y, r) {
    circle(x, y, r, '#f1f5f9', LINE, 2.5);
    circle(x, y, 3.5, LINE);
  }

  function dot(x, y, r, color) {
    circle(x, y, r || 4, color || LINE);
  }

  // Lò xo dạng răng cưa giữa hai điểm.
  function spring(x1, y1, x2, y2, coils, amp, color) {
    var len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return;
    var ux = (x2 - x1) / len;
    var uy = (y2 - y1) / len;
    var lead = Math.min(10, len * 0.15);
    var n = coils * 2;
    var seg = (len - 2 * lead) / n;
    ctx.save();
    ctx.strokeStyle = color || '#0f766e';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
    for (var i = 0; i < n; i++) {
      var d = lead + seg * (i + 0.5);
      var s = i % 2 === 0 ? amp : -amp;
      ctx.lineTo(x1 + ux * d - uy * s, y1 + uy * d + ux * s);
    }
    ctx.lineTo(x2 - ux * lead, y2 - uy * lead);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function arc(cx, cy, r, a0, a1, text, color, anticlockwise) {
    ctx.save();
    ctx.strokeStyle = color || '#4338ca';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1, !!anticlockwise);
    ctx.stroke();
    ctx.restore();
    if (text) {
      var am = (a0 + a1) / 2;
      txt(text, cx + Math.cos(am) * (r + 14), cy + Math.sin(am) * (r + 14), {
        color: color || '#4338ca', size: 13, weight: 700, align: 'center', base: 'middle', halo: true,
      });
    }
  }

  // Đường kích thước có nhãn.
  function dim(x1, y1, x2, y2, text, color) {
    var col = color || MUTED;
    line(x1, y1, x2, y2, col, 1.2, [4, 3]);
    var len = Math.hypot(x2 - x1, y2 - y1) || 1;
    var nx = -(y2 - y1) / len;
    var ny = (x2 - x1) / len;
    line(x1 - nx * 5, y1 - ny * 5, x1 + nx * 5, y1 + ny * 5, col, 1.2);
    line(x2 - nx * 5, y2 - ny * 5, x2 + nx * 5, y2 + ny * 5, col, 1.2);
    if (text) txt(text, (x1 + x2) / 2, (y1 + y2) / 2, { color: col, size: 12, weight: 700, align: 'center', base: 'middle', halo: true });
  }

  // Mũi tên gia tốc nằm ngang, luôn nằm bên phải điểm x0 (không chui vào hình).
  function accelArrow(x0, y, a) {
    if (!a) return;
    var al = clamp(Math.abs(a) * 9, 18, 80);
    if (a > 0) arrow(x0, y, al, 0, 'v', 'a', { width: 2.5, head: 9 });
    else arrow(x0 + al, y, -al, 0, 'v', 'a', { width: 2.5, head: 9 });
  }

  function scaleFor(maxF, ref, px) {
    return px / Math.max(maxF, ref, EPS);
  }

  function heading(c) {
    txt(c.num + '  ' + c.title, 16, 26, { size: 16, weight: 700, color: INK });
  }
  function status(s, color) {
    txt(s, 16, 48, { size: 13.5, weight: 600, color: color || MUTED });
  }

  function legend() {
    var keys = Object.keys(used);
    if (!keys.length) return;
    ctx.save();
    ctx.font = font(12, 600);
    var x = 16;
    var y = H - 12;
    keys.forEach(function (k) {
      var name = KIND_NAME[k];
      var w = 22 + ctx.measureText(name).width + 14;
      if (x + w > W - 8) return;
      ctx.strokeStyle = C[k];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + 16, y - 4);
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.fillText(name, x + 21, y);
      x += w;
    });
    ctx.restore();
  }

  // Mặt phẳng nghiêng cao dần về bên trái, chân dốc ở bên phải.
  function inclineLeft(alpha, footX, footY, maxLen, maxHeight) {
    var fx = footX || 600;
    var fy = footY || 330;
    var Lpx = alpha > 0.01 ? Math.min(maxLen || 500, (maxHeight || 250) / Math.sin(alpha)) : maxLen || 500;
    var ca = Math.cos(alpha);
    var sa = Math.sin(alpha);
    var tx = fx - Lpx * ca;
    var ty = fy - Lpx * sa;
    poly([[fx, fy], [tx, ty], [tx, fy]], FILL, null);
    line(tx, ty, fx, fy, LINE, 3);
    line(tx, ty, tx, fy, LINE, 1.5);
    ground(Math.min(tx, 40) , 690, fy);
    if (alpha > 0.005) arc(fx, fy, 52, Math.PI, Math.PI + alpha, null);
    if (alpha > 0.005) txt('α', fx - 70, fy - 8, { color: '#4338ca', size: 13, weight: 700, align: 'center', base: 'middle' });
    return {
      u: { x: -ca, y: -sa }, // hướng lên dốc
      n: { x: sa, y: -ca }, // pháp tuyến ra ngoài mặt dốc
      at: function (f) {
        return { x: fx - Lpx * ca * f, y: fy - Lpx * sa * f };
      },
      Lpx: Lpx,
    };
  }

  // ---------------------------------------------------------------- Định nghĩa tham số
  function prm(name, label, min, max, step, value, unit, digits, extra) {
    var p = { name: name, label: label, min: min, max: max, step: step, value: value, unit: unit || '', digits: digits || 0 };
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }
  function fmtParam(p, v) {
    var u = p.unit;
    var sep = u === '°' || u === '%' || u === '' ? '' : ' ';
    return fmt(v, p.digits) + sep + u;
  }
  var GROUPS = [
    'Ma sát & tiếp xúc',
    'Dây & ròng rọc',
    'Chuyển động tròn',
    'Hệ quy chiếu có gia tốc',
    'Cân bằng & momen',
    'Lò xo, lực đẩy Ác-si-mét & lực cản',
  ];

  // Các tham số dùng chung
  function pMass(name, label, def, max) {
    return prm(name || 'm', label || 'Khối lượng $m$', 0.1, max || 20, 0.1, def, 'kg', 1, { hardMin: 0.01, hardMax: 1000 });
  }
  function pMu(def, label) {
    return prm('mu', label || 'Hệ số ma sát $\\mu$', 0, 1.5, 0.01, def, '', 2, { hardMax: 5 });
  }

  // ---------------------------------------------------------------- 30 tình huống
  var CASES = [];
  function add(c) {
    CASES.push(c);
  }

  // ============ NHÓM 1. Ma sát & tiếp xúc ============
  add({
    id: 'nghieng-dung-yen', group: 0,
    title: 'Vật nằm yên trên mặt nghiêng nhám',
    params: [
      pMass('m', null, 2),
      prm('alpha', 'Góc nghiêng $\\alpha$', 0, 85, 1, 25, '°', 0),
      pMu(0.5, 'Hệ số ma sát $\\mu$ (coi $\\mu_n = \\mu_t$)'),
    ],
    readouts: [['state', 'Trạng thái', 1], ['N', 'Phản lực $N = mg\\cos\\alpha$'], ['Fms', 'Lực ma sát $F_{ms}$'], ['Fmax', 'Ma sát nghỉ cực đại $\\mu N$'], ['a', 'Gia tốc $a$'], ['ac', 'Góc tới hạn $\\alpha_0 = \\arctan\\mu$']],
    note: 'Vật đứng yên khi thành phần $P\\sin\\alpha$ không vượt quá ma sát nghỉ cực đại: $mg\\sin\\alpha \\le \\mu mg\\cos\\alpha \\Leftrightarrow \\tan\\alpha \\le \\mu$. Khi đó ma sát nghỉ $F_{ms} = mg\\sin\\alpha$ (chưa chắc bằng $\\mu N$). Nếu trượt: $a = g(\\sin\\alpha - \\mu\\cos\\alpha)$.',
    compute: function (p) {
      var a = p.alpha * DEG;
      var P = p.m * G;
      var N = P * Math.cos(a);
      var S = P * Math.sin(a);
      var Fmax = p.mu * N;
      var rest = S <= Fmax + 1e-9;
      return { a: a, P: P, N: N, S: S, Fmax: Fmax, rest: rest, Fms: rest ? S : Fmax, acc: rest ? 0 : (S - Fmax) / p.m };
    },
    out: function (p, r) {
      return {
        state: r.rest ? (r.S > 0.97 * r.Fmax && r.S > 0 ? 'Đứng yên – sắp trượt' : 'Đứng yên') : 'Trượt xuống dốc',
        N: fN(r.N), Fms: fN(r.Fms) + (r.rest ? ' (nghỉ)' : ' (trượt)'), Fmax: fN(r.Fmax), a: fAcc(r.acc),
        ac: fDeg(Math.atan(p.mu)),
      };
    },
    draw: function (p, r) {
      status(r.rest ? 'Đứng yên: ma sát nghỉ cân bằng P·sinα' : 'Vật trượt xuống với a = ' + fAcc(r.acc), r.rest ? OK : DANGER);
      var I = inclineLeft(r.a);
      drawBlockOnIncline(I, 0.42, 96, 62, p.m, r, true);
    },
  });

  // Vẽ vật trên dốc (dùng cho 1.1 và 1.5). r: P, N, S, Fms (dương = hướng lên dốc), F (lực kéo lên dốc).
  function drawBlockOnIncline(I, f, w, h, m, r, comps) {
    var Q = I.at(f);
    var c = { x: Q.x + I.n.x * h / 2, y: Q.y + I.n.y * h / 2 };
    box(c.x, c.y, w, h, r.a, fmt(m, 1) + ' kg');
    var k = scaleFor(Math.max(r.P, r.F || 0), 20, 120);
    if (comps) {
      arrow(c.x, c.y, -I.u.x * r.S * k, -I.u.y * r.S * k, 'P', 'P·sinα', { dash: true, width: 2, size: 12, head: 8 });
      arrow(c.x, c.y, -I.n.x * r.N * k, -I.n.y * r.N * k, 'P', 'P·cosα', { dash: true, width: 2, size: 12, head: 8, lx: 30 });
    }
    arrow(c.x, c.y, 0, r.P * k, 'P', 'P');
    arrow(c.x, c.y, I.n.x * r.N * k, I.n.y * r.N * k, 'N', 'N');
    if (r.F) arrow(c.x, c.y, I.u.x * r.F * k, I.u.y * r.F * k, 'F', 'F', { ly: -10 });
    var fms = r.FmsUp != null ? r.FmsUp : r.Fms;
    if (Math.abs(fms) > EPS) {
      var dir = fms > 0 ? 1 : -1;
      var e = { x: Q.x + I.u.x * dir * w / 2 + I.n.x * 4, y: Q.y + I.u.y * dir * w / 2 + I.n.y * 4 };
      arrow(e.x, e.y, I.u.x * fms * k, I.u.y * fms * k, 'ms', 'Fms', { ly: -12 });
    }
  }

  add({
    id: 'keo-xien-len', group: 0,
    title: 'Kéo xiên lên trên sàn nhám',
    params: [
      pMass('m', null, 5, 50),
      prm('F', 'Lực kéo $F$', 0, 200, 1, 30, 'N', 0, { hardMax: 5000 }),
      prm('th', 'Góc kéo so với phương ngang $\\theta$', 0, 90, 1, 30, '°', 0),
      pMu(0.3),
    ],
    readouts: [['state', 'Trạng thái', 1], ['N', 'Phản lực $N = mg - F\\sin\\theta$'], ['Fms', 'Lực ma sát'], ['a', 'Gia tốc'], ['Fmin', 'Lực tối thiểu để vật trượt (góc này)'], ['opt', 'Góc kéo tối ưu $\\theta^* = \\arctan\\mu$']],
    note: 'Thành phần $F\\sin\\theta$ nâng vật lên nên $N = mg - F\\sin\\theta$ giảm, ma sát $\\mu N$ giảm. Vật trượt khi $F\\cos\\theta > \\mu(mg - F\\sin\\theta)$; khi đó $a = \\dfrac{F\\cos\\theta - \\mu(mg - F\\sin\\theta)}{m}$. Nếu $F\\sin\\theta > mg$ thì $N = 0$: vật rời mặt sàn.',
    compute: function (p) {
      var th = p.th * DEG;
      var P = p.m * G;
      var Fx = p.F * Math.cos(th);
      var Fy = p.F * Math.sin(th);
      var N = P - Fy;
      var r = { th: th, P: P, Fx: Fx, Fy: Fy, F: p.F };
      r.Fmin = p.mu * P / (Math.cos(th) + p.mu * Math.sin(th));
      if (N <= 0) {
        r.N = 0; r.lift = true; r.Fms = 0; r.ax = Fx / p.m; r.ay = (Fy - P) / p.m; r.rest = false;
        return r;
      }
      r.N = N;
      var Fmax = p.mu * N;
      r.rest = Fx <= Fmax + 1e-9;
      r.Fms = r.rest ? Fx : Fmax;
      r.ax = r.rest ? 0 : (Fx - Fmax) / p.m;
      return r;
    },
    out: function (p, r) {
      return {
        state: r.lift ? 'Vật rời mặt sàn (N = 0)' : r.rest ? 'Đứng yên' : 'Trượt theo phương ngang',
        N: fN(r.N), Fms: fN(r.Fms) + (r.lift ? '' : r.rest ? ' (nghỉ)' : ' (trượt)'),
        a: r.lift ? fAcc(Math.hypot(r.ax, r.ay)) : fAcc(r.ax),
        Fmin: r.Fmin * Math.sin(r.th) >= r.P - 1e-9 ? 'Bị nhấc lên trước khi trượt' : fN(r.Fmin), opt: fmt(Math.atan(p.mu) / DEG, 1) + '°',
      };
    },
    draw: function (p, r) {
      status(r.lift ? 'F·sinθ > mg: vật bị nhấc lên, rời mặt sàn' : r.rest ? 'Đứng yên: F·cosθ ≤ μN' : 'Vật trượt, a = ' + fAcc(r.ax), r.lift ? DANGER : r.rest ? OK : '#b45309');
      var gy = 280;
      ground(40, 690, gy);
      var lift = r.lift ? 14 : 0;
      var cx = 300;
      var cy = gy - 40 - lift;
      box(cx, cy, 120, 80, 0, fmt(p.m, 1) + ' kg');
      var k = scaleFor(Math.max(r.P, r.F), 20, 110);
      arrow(cx, cy, 0, r.P * k, 'P', 'P');
      arrow(cx, cy, 0, -r.N * k, 'N', 'N', { lx: -14 });
      arrow(cx, cy, r.F * Math.cos(r.th) * k, -r.F * Math.sin(r.th) * k, 'F', 'F');
      if (r.F > 0 && r.th > 0.02 && r.th < 1.55) {
        arrow(cx, cy, r.Fx * k, 0, 'F', 'F·cosθ', { dash: true, width: 2, size: 12, head: 8, ly: 14 });
        arrow(cx, cy, 0, -r.Fy * k, 'F', 'F·sinθ', { dash: true, width: 2, size: 12, head: 8, lx: 34 });
        arc(cx, cy, 44, -r.th, 0, 'θ');
      }
      if (r.Fms > EPS) arrow(cx - 60, gy - 4 - lift, -r.Fms * k, 0, 'ms', 'Fms', { ly: -12 });
    },
  });

  add({
    id: 'day-xien-xuong', group: 0,
    title: 'Đẩy xiên xuống trên sàn nhám',
    params: [
      pMass('m', null, 5, 50),
      prm('F', 'Lực đẩy $F$', 0, 300, 1, 40, 'N', 0, { hardMax: 10000 }),
      prm('th', 'Góc đẩy dưới phương ngang $\\theta$', 0, 89, 1, 30, '°', 0),
      pMu(0.3),
    ],
    readouts: [['state', 'Trạng thái', 1], ['N', 'Phản lực $N = mg + F\\sin\\theta$'], ['Fms', 'Lực ma sát'], ['a', 'Gia tốc'], ['Fmin', 'Lực tối thiểu để vật trượt'], ['lock', 'Góc tự hãm $\\theta_h = \\arctan(1/\\mu)$']],
    note: 'Đẩy xiên xuống làm tăng áp lực: $N = mg + F\\sin\\theta$. Vật trượt khi $F(\\cos\\theta - \\mu\\sin\\theta) > \\mu mg$. Nếu $\\tan\\theta \\ge 1/\\mu$ thì vế trái không bao giờ dương: đẩy mạnh đến đâu vật cũng không trượt (hiện tượng tự hãm).',
    compute: function (p) {
      var th = p.th * DEG;
      var P = p.m * G;
      var Fx = p.F * Math.cos(th);
      var Fy = p.F * Math.sin(th);
      var N = P + Fy;
      var Fmax = p.mu * N;
      var rest = Fx <= Fmax + 1e-9;
      var den = Math.cos(th) - p.mu * Math.sin(th);
      return { th: th, P: P, F: p.F, Fx: Fx, Fy: Fy, N: N, rest: rest, Fms: rest ? Fx : Fmax, ax: rest ? 0 : (Fx - Fmax) / p.m, Fmin: den > EPS ? p.mu * P / den : Infinity, locked: den <= EPS };
    },
    out: function (p, r) {
      return {
        state: r.rest ? (r.locked ? 'Đứng yên (tự hãm)' : 'Đứng yên') : 'Trượt theo phương ngang',
        N: fN(r.N), Fms: fN(r.Fms) + (r.rest ? ' (nghỉ)' : ' (trượt)'), a: fAcc(r.ax),
        Fmin: r.locked ? 'Không tồn tại' : fN(r.Fmin),
        lock: p.mu > 0 ? fmt(Math.atan(1 / p.mu) / DEG, 1) + '°' : '90° (không ma sát)',
      };
    },
    draw: function (p, r) {
      status(r.locked ? 'θ ≥ góc tự hãm: không thể đẩy vật trượt' : r.rest ? 'Đứng yên: F·cosθ ≤ μ(mg + F·sinθ)' : 'Vật trượt, a = ' + fAcc(r.ax), r.locked ? DANGER : r.rest ? OK : '#b45309');
      var gy = 280;
      ground(40, 690, gy);
      var cx = 400;
      var cy = gy - 40;
      box(cx, cy, 120, 80, 0, fmt(p.m, 1) + ' kg');
      var k = scaleFor(Math.max(r.N, r.F), 20, 105);
      arrow(cx + 14, cy, 0, r.P * k, 'P', 'P', { lx: 6 });
      arrow(cx, cy, 0, -r.N * k, 'N', 'N');
      // Lực đẩy: mũi tên chạm góc trên bên trái của vật.
      var ux = Math.cos(r.th);
      var uy = Math.sin(r.th);
      var L = r.F * k;
      var tipX = cx - 60;
      var tipY = cy - 40 + Math.min(40, 30 * uy);
      if (L > 1.5) {
        arrow(tipX - ux * L, tipY - uy * L, ux * L, uy * L, 'F', null);
        tag('F', tipX - ux * L - 10, tipY - uy * L - 10, C.F);
        if (r.th > 0.02) {
          line(tipX - ux * L, tipY - uy * L, tipX - ux * L + 60, tipY - uy * L, MUTED, 1, [3, 3]);
          arc(tipX - ux * L, tipY - uy * L, 36, 0, r.th, 'θ');
        }
      }
      if (r.Fms > EPS) arrow(cx - 60, gy - 4, -r.Fms * k, 0, 'ms', 'Fms', { ly: 14 });
    },
  });

  add({
    id: 'ep-vao-tuong', group: 0,
    title: 'Ép vật vào tường nhám',
    params: [
      pMass('m', null, 2, 20),
      prm('F', 'Lực ép vuông góc tường $F$', 0, 500, 1, 60, 'N', 0, { hardMax: 20000 }),
      pMu(0.4),
    ],
    readouts: [['state', 'Trạng thái', 1], ['N', 'Phản lực tường $N = F$'], ['Fms', 'Lực ma sát'], ['Fmax', 'Ma sát nghỉ cực đại $\\mu F$'], ['a', 'Gia tốc'], ['Fmin', 'Lực ép tối thiểu $F_{min} = mg/\\mu$']],
    note: 'Theo phương ngang: $N = F$. Theo phương thẳng đứng, ma sát nghỉ hướng lên giữ vật: $F_{ms} = mg$, điều kiện $mg \\le \\mu F \\Rightarrow F \\ge \\dfrac{mg}{\\mu}$. Ép mạnh hơn không làm ma sát nghỉ tăng thêm – nó vẫn bằng $mg$. Nếu thiếu lực ép: $a = g - \\dfrac{\\mu F}{m}$.',
    compute: function (p) {
      var P = p.m * G;
      var N = p.F;
      var Fmax = p.mu * N;
      var rest = P <= Fmax + 1e-9;
      return { P: P, N: N, F: p.F, Fmax: Fmax, rest: rest, Fms: rest ? P : Fmax, acc: rest ? 0 : (P - Fmax) / p.m, Fmin: p.mu > 0 ? P / p.mu : Infinity };
    },
    out: function (p, r) {
      return {
        state: r.rest ? 'Đứng yên' : 'Trượt xuống dọc tường',
        N: fN(r.N), Fms: fN(r.Fms) + (r.rest ? ' (nghỉ)' : ' (trượt)'), Fmax: fN(r.Fmax), a: fAcc(r.acc),
        Fmin: isFinite(r.Fmin) ? fN(r.Fmin) : 'Không giữ được (μ = 0)',
      };
    },
    draw: function (p, r) {
      status(r.rest ? 'Đứng yên: ma sát nghỉ bằng trọng lượng' : 'Vật trượt xuống, a = ' + fAcc(r.acc), r.rest ? OK : DANGER);
      var wx = 470;
      hatch(wx, 64, wx, 370, 'right');
      ground(40, wx, 370);
      var cx = wx - 50;
      var cy = 215;
      box(cx, cy, 100, 100, 0, fmt(p.m, 1) + ' kg');
      var k = scaleFor(Math.max(r.P, r.N), 20, 125);
      arrow(cx - 50 - r.F * k, cy - 22, r.F * k, 0, 'F', null);
      if (r.F * k > 1.5) tag('F', cx - 62 - r.F * k, cy - 22, C.F);
      arrow(cx, cy + 22, -r.N * k, 0, 'N', 'N');
      arrow(cx + 10, cy, 0, r.P * k, 'P', 'P');
      if (r.Fms > EPS) arrow(wx - 6, cy, 0, -r.Fms * k, 'ms', 'Fms', { lx: -22 });
    },
  });

  add({
    id: 'nghieng-sap-truot', group: 0,
    title: 'Vật sắp trượt trên mặt nghiêng (ma sát nghỉ cực đại)',
    params: [
      pMass('m', null, 2),
      prm('alpha', 'Góc nghiêng $\\alpha$', 0, 85, 1, 35, '°', 0),
      pMu(0.3),
      prm('F', 'Lực kéo song song mặt dốc, hướng lên $F$', 0, 100, 0.5, 8, 'N', 1, { hardMax: 5000 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['range', 'Khoảng $F$ giữ vật đứng yên', 1], ['Fms', 'Lực ma sát (chiều)', 1], ['Fmax', 'Ma sát nghỉ cực đại $\\mu mg\\cos\\alpha$'], ['a', 'Gia tốc'], ['ac', 'Góc tới hạn khi $F=0$: $\\alpha_0$']],
    note: 'Ma sát nghỉ tự điều chỉnh, $|F_{ms}| \\le \\mu N$. Vật đứng yên khi $mg(\\sin\\alpha - \\mu\\cos\\alpha) \\le F \\le mg(\\sin\\alpha + \\mu\\cos\\alpha)$. Ở biên dưới vật sắp trượt xuống (ma sát hướng lên, đạt cực đại); ở biên trên vật sắp trượt lên (ma sát hướng xuống, đạt cực đại).',
    compute: function (p) {
      var a = p.alpha * DEG;
      var P = p.m * G;
      var N = P * Math.cos(a);
      var S = P * Math.sin(a);
      var Fmax = p.mu * N;
      var D = p.F - S; // xu hướng dọc dốc (dương = lên)
      var r = { a: a, P: P, N: N, S: S, Fmax: Fmax, F: p.F, lo: Math.max(0, S - Fmax), hi: S + Fmax };
      if (Math.abs(D) <= Fmax + 1e-9) {
        r.rest = true; r.FmsUp = -D; r.acc = 0;
      } else {
        var dir = D > 0 ? 1 : -1;
        r.rest = false; r.dir = dir; r.FmsUp = -dir * Fmax; r.acc = (Math.abs(D) - Fmax) / p.m;
      }
      r.Fms = Math.abs(r.FmsUp);
      r.ratio = Fmax > EPS ? r.FmsUp / Fmax : 0;
      return r;
    },
    out: function (p, r) {
      var st;
      if (!r.rest) st = r.dir > 0 ? 'Trượt lên dốc' : 'Trượt xuống dốc';
      else if (r.Fmax > EPS && r.ratio >= 0.97) st = 'Đứng yên – sắp trượt xuống';
      else if (r.Fmax > EPS && r.ratio <= -0.97) st = 'Đứng yên – sắp trượt lên';
      else st = 'Đứng yên';
      return {
        state: st, range: fN(r.lo) + ' → ' + fN(r.hi),
        Fms: r.Fms < 1e-6 ? '0 N' : fN(r.Fms) + (r.FmsUp > 0 ? ', hướng lên dốc' : ', hướng xuống dốc'),
        Fmax: fN(r.Fmax), a: fAcc(r.acc), ac: fDeg(Math.atan(p.mu)),
      };
    },
    draw: function (p, r) {
      status(r.rest ? 'Đứng yên – ma sát nghỉ dùng ' + fmt(Math.abs(r.ratio) * 100, 0) + '% giá trị cực đại' : 'Ma sát nghỉ không đủ: vật trượt, a = ' + fAcc(r.acc), r.rest ? OK : DANGER);
      var I = inclineLeft(r.a, 620, 330, 470, 230);
      drawBlockOnIncline(I, 0.42, 90, 58, p.m, r, true);
      // Thước đo tỉ số Fms / Fms,max
      var x0 = 450;
      var x1 = 690;
      var y = 80;
      txt('Fms / μN (dương: hướng lên dốc)', x0, y - 12, { size: 12, color: MUTED });
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x0, y, x1 - x0, 12);
      var xm = (x0 + x1) / 2;
      line(xm, y - 3, xm, y + 15, LINE, 1.5);
      var xr = xm + clamp(r.ratio, -1, 1) * (x1 - x0) / 2;
      ctx.fillStyle = C.ms;
      ctx.fillRect(Math.min(xm, xr), y + 2, Math.abs(xr - xm), 8);
      txt('sắp trượt lên', x0, y + 28, { size: 11, color: MUTED });
      txt('sắp trượt xuống', x1, y + 28, { size: 11, color: MUTED, align: 'right' });
      txt('−1', x0, y + 42, { size: 11, color: MUTED });
      txt('+1', x1, y + 42, { size: 11, color: MUTED, align: 'right' });
    },
  });

  // ============ NHÓM 2. Dây & ròng rọc ============
  add({
    id: 'hai-vat-noi-day', group: 1, anim: true,
    title: 'Hai vật nối dây kéo trên sàn',
    params: [
      pMass('m1', 'Khối lượng vật 1 (được kéo) $m_1$', 3),
      pMass('m2', 'Khối lượng vật 2 $m_2$', 2),
      prm('F', 'Lực kéo $F$', 0, 200, 1, 30, 'N', 0, { hardMax: 5000 }),
      pMu(0.2, 'Hệ số ma sát (cả hai vật) $\\mu$'),
    ],
    readouts: [['state', 'Trạng thái', 1], ['a', 'Gia tốc $a$'], ['T', 'Lực căng dây $T$'], ['f', 'Ma sát $F_{ms1}$; $F_{ms2}$', 1]],
    note: 'Cả hệ: $a = \\dfrac{F - \\mu(m_1+m_2)g}{m_1+m_2}$. Riêng vật 2: $T - \\mu m_2 g = m_2 a \\Rightarrow T = \\dfrac{m_2}{m_1+m_2}F$ (không phụ thuộc $\\mu$). Nếu $F \\le \\mu(m_1+m_2)g$ hệ đứng yên; khi đó ma sát nghỉ phân bố không xác định duy nhất – ở đây giả sử vật 1 dùng hết ma sát nghỉ trước.',
    compute: function (p) {
      var M = p.m1 + p.m2;
      var Ftot = p.mu * M * G;
      var r = { P1: p.m1 * G, P2: p.m2 * G, F: p.F };
      if (p.F <= Ftot + 1e-9) {
        r.rest = true; r.acc = 0;
        r.T = Math.max(0, p.F - p.mu * p.m1 * G);
        r.f1 = p.F - r.T; r.f2 = r.T;
      } else {
        r.rest = false; r.acc = (p.F - Ftot) / M;
        r.T = p.F * p.m2 / M;
        r.f1 = p.mu * p.m1 * G; r.f2 = p.mu * p.m2 * G;
      }
      return r;
    },
    out: function (p, r) {
      return { state: r.rest ? 'Hệ đứng yên' : 'Hệ chuyển động nhanh dần', a: fAcc(r.acc), T: fN(r.T), f: fN(r.f1) + '; ' + fN(r.f2) };
    },
    init: function () { return { x: 0, v: 0, t: 0 }; },
    step: function (st, p, r, dt) {
      if (r.rest) return false;
      st.v += r.acc * dt;
      st.x += st.v * dt;
      st.t += dt;
      if (st.x >= 3.2) { st.x = 3.2; return false; }
      return true;
    },
    draw: function (p, r, st) {
      status(r.rest ? 'F ≤ μ(m₁+m₂)g: hệ đứng yên' : 'a = ' + fAcc(r.acc) + '   v = ' + fmt(st.v, 2) + ' m/s   t = ' + fmt(st.t, 2) + ' s', r.rest ? OK : MUTED);
      var gy = 300;
      ground(30, 690, gy);
      var off = st.x * 80;
      var w2 = 74;
      var w1 = 84;
      var x2 = 70 + w2 / 2 + off;
      var x1 = x2 + w2 / 2 + 150 + w1 / 2;
      var h2 = 56;
      var h1 = 64;
      box(x2, gy - h2 / 2, w2, h2, 0, 'm₂', BODY2);
      box(x1, gy - h1 / 2, w1, h1, 0, 'm₁');
      var ry = gy - 28;
      line(x2 + w2 / 2, ry, x1 - w1 / 2, ry, '#6b7280', 2);
      var k = scaleFor(Math.max(r.P1, r.P2, r.F), 20, 70);
      arrow(x2, gy - h2 / 2, 0, r.P2 * k, 'P', 'P₂', { lx: 14 });
      arrow(x2, gy - h2 / 2, 0, -r.P2 * k, 'N', 'N₂');
      arrow(x1, gy - h1 / 2, 0, r.P1 * k, 'P', 'P₁', { lx: 14 });
      arrow(x1, gy - h1 / 2, 0, -r.P1 * k, 'N', 'N₁');
      arrow(x2 + w2 / 2, ry, r.T * k, 0, 'T', 'T', { ly: -14 });
      arrow(x1 - w1 / 2, ry, -r.T * k, 0, 'T', 'T', { ly: -14 });
      arrow(x1 + w1 / 2, ry, r.F * k, 0, 'F', 'F');
      if (r.f1 > EPS) arrow(x1 - w1 / 2, gy - 4, -r.f1 * k, 0, 'ms', 'Fms1', { ly: 16 });
      if (r.f2 > EPS) arrow(x2 - w2 / 2, gy - 4, -r.f2 * k, 0, 'ms', 'Fms2', { ly: 16 });
      if (!r.rest) arrow(x1 + w1 / 2 + 8, gy - h1 - 30, 50, 0, 'v', 'a', { width: 2, head: 8 });
    },
  });

  add({
    id: 'ban-va-vat-treo', group: 1, anim: true,
    title: 'Vật trên bàn nối vật treo qua ròng rọc',
    params: [
      pMass('m1', 'Vật trên bàn $m_1$', 3),
      pMass('m2', 'Vật treo $m_2$', 1),
      pMu(0.2, 'Hệ số ma sát bàn $\\mu$'),
    ],
    readouts: [['state', 'Trạng thái', 1], ['a', 'Gia tốc $a$'], ['T', 'Lực căng $T$'], ['Fms', 'Ma sát trên vật 1']],
    note: 'Hệ chuyển động khi $m_2 g > \\mu m_1 g$: $a = \\dfrac{m_2 - \\mu m_1}{m_1 + m_2}g$, $T = m_2(g - a) = \\dfrac{m_1 m_2 (1+\\mu)}{m_1+m_2}g$. Ngược lại hệ đứng yên, $T = m_2 g$ và ma sát nghỉ trên vật 1 bằng $m_2 g$.',
    compute: function (p) {
      var r = { P1: p.m1 * G, P2: p.m2 * G };
      if (p.m2 <= p.mu * p.m1 + 1e-9) {
        r.rest = true; r.acc = 0; r.T = r.P2; r.Fms = r.P2;
      } else {
        r.rest = false; r.acc = (p.m2 - p.mu * p.m1) * G / (p.m1 + p.m2);
        r.T = p.m2 * (G - r.acc); r.Fms = p.mu * r.P1;
      }
      return r;
    },
    out: function (p, r) {
      return { state: r.rest ? 'Hệ đứng yên (ma sát nghỉ giữ)' : 'Vật 2 đi xuống nhanh dần', a: fAcc(r.acc), T: fN(r.T), Fms: fN(r.Fms) + (r.rest ? ' (nghỉ)' : ' (trượt)') };
    },
    init: function () { return { x: 0, v: 0, t: 0 }; },
    step: function (st, p, r, dt) {
      if (r.rest) return false;
      st.v += r.acc * dt; st.x += st.v * dt; st.t += dt;
      if (st.x >= 1.0) { st.x = 1.0; return false; }
      return true;
    },
    draw: function (p, r, st) {
      status(r.rest ? 'm₂ ≤ μm₁: hệ đứng yên' : 'a = ' + fAcc(r.acc) + '   v = ' + fmt(st.v, 2) + ' m/s   t = ' + fmt(st.t, 2) + ' s', r.rest ? OK : MUTED);
      var ty = 170;
      var px = 540;
      var pr = 16;
      // mặt bàn và chân bàn
      ctx.fillStyle = FILL;
      ctx.fillRect(40, ty, px - 40, 14);
      line(40, ty, px, ty, LINE, 3);
      line(70, ty + 14, 70, 370, LINE, 4);
      line(px - 30, ty + 14, px - 30, 370, LINE, 4);
      ground(30, 690, 370);
      line(px, ty, px + 4, ty + pr, LINE, 3);
      pulley(px + 4, ty + pr - 6, pr);
      var pcx = px + 4;
      var pcy = ty + pr - 6;
      var off = st.x * 110;
      var w1 = 90;
      var h1 = 60;
      var x1 = 150 + off;
      box(x1, ty - h1 / 2, w1, h1, 0, 'm₁');
      var ry = pcy - pr;
      line(x1 + w1 / 2, ry, pcx, ry, '#6b7280', 2);
      var hx = pcx + pr;
      var my = 222 + off;
      line(hx, pcy, hx, my - 22, '#6b7280', 2);
      box(hx, my, 44, 44, 0, 'm₂', BODY2);
      var k = scaleFor(Math.max(r.P1, r.P2), 20, 70);
      arrow(x1, ty - h1 / 2, 0, r.P1 * k, 'P', 'P₁', { lx: 16 });
      arrow(x1, ty - h1 / 2, 0, -r.P1 * k, 'N', 'N');
      arrow(x1 + w1 / 2, ry, r.T * k, 0, 'T', 'T', { ly: -14 });
      if (r.Fms > EPS) arrow(x1 - w1 / 2, ty - 4, -r.Fms * k, 0, 'ms', 'Fms', { ly: -12 });
      arrow(hx, my - 22, 0, -r.T * k, 'T', 'T', { lx: 16 });
      arrow(hx, my, 0, r.P2 * k, 'P', 'P₂', { lx: 18 });
    },
  });

  add({
    id: 'may-atwood', group: 1, anim: true,
    title: 'Máy Atwood',
    params: [pMass('m1', 'Khối lượng bên trái $m_1$', 2, 10), pMass('m2', 'Khối lượng bên phải $m_2$', 3, 10)],
    readouts: [['state', 'Trạng thái', 1], ['a', 'Gia tốc $a$'], ['T', 'Lực căng $T$'], ['R', 'Lực treo trục ròng rọc $2T$']],
    note: 'Dây và ròng rọc lí tưởng: $a = \\dfrac{|m_2 - m_1|}{m_1 + m_2}g$, $T = \\dfrac{2m_1 m_2}{m_1 + m_2}g$. Lực căng luôn nằm giữa $m_1g$ và $m_2g$. Khi $m_1 = m_2$: $a = 0$, hệ đứng yên (hoặc chuyển động đều nếu đang chuyển động).',
    compute: function (p) {
      var M = p.m1 + p.m2;
      var acc = (p.m2 - p.m1) * G / M; // dương: m2 đi xuống
      return { P1: p.m1 * G, P2: p.m2 * G, acc: acc, T: 2 * p.m1 * p.m2 * G / M, equal: Math.abs(p.m2 - p.m1) < 1e-9 };
    },
    out: function (p, r) {
      return {
        state: r.equal ? 'Cân bằng (a = 0)' : r.acc > 0 ? 'm₂ đi xuống, m₁ đi lên' : 'm₁ đi xuống, m₂ đi lên',
        a: fAcc(Math.abs(r.acc)), T: fN(r.T), R: fN(2 * r.T),
      };
    },
    init: function () { return { y: 0, v: 0, t: 0 }; },
    step: function (st, p, r, dt) {
      if (r.equal) return false;
      st.v += r.acc * dt; st.y += st.v * dt; st.t += dt;
      if (Math.abs(st.y) >= 0.7) { st.y = clamp(st.y, -0.7, 0.7); return false; }
      return true;
    },
    draw: function (p, r, st) {
      status(r.equal ? 'm₁ = m₂: hai vật đứng yên' : 'a = ' + fAcc(Math.abs(r.acc)) + '   v = ' + fmt(Math.abs(st.v), 2) + ' m/s   t = ' + fmt(st.t, 2) + ' s', r.equal ? OK : MUTED);
      var cx = 360;
      var cy = 100;
      var R = 60;
      ceiling(280, 440, 64);
      line(cx, 64, cx, cy, LINE, 3);
      pulley(cx, cy, R);
      var off = st.y * 90;
      var y1 = 250 - off;
      var y2 = 250 + off;
      var s1 = 40 + 8 * Math.sqrt(p.m1);
      var s2 = 40 + 8 * Math.sqrt(p.m2);
      line(cx - R, cy, cx - R, y1 - s1 / 2, '#6b7280', 2);
      line(cx + R, cy, cx + R, y2 - s2 / 2, '#6b7280', 2);
      box(cx - R, y1, s1, s1, 0, 'm₁');
      box(cx + R, y2, s2, s2, 0, 'm₂', BODY2);
      ground(240, 480, 378);
      var k = scaleFor(Math.max(r.P1, r.P2), 20, 62);
      arrow(cx - R, y1 - s1 / 2, 0, -r.T * k, 'T', 'T', { lx: -14 });
      arrow(cx - R, y1, 0, r.P1 * k, 'P', 'P₁', { lx: -18 });
      arrow(cx + R, y2 - s2 / 2, 0, -r.T * k, 'T', 'T', { lx: 14 });
      arrow(cx + R, y2, 0, r.P2 * k, 'P', 'P₂', { lx: 18 });
    },
  });

  add({
    id: 'nghieng-va-vat-treo', group: 1, anim: true,
    title: 'Vật trên mặt nghiêng nối vật treo',
    params: [
      pMass('m1', 'Vật trên dốc $m_1$', 2),
      pMass('m2', 'Vật treo $m_2$', 1.5),
      prm('alpha', 'Góc nghiêng $\\alpha$', 0, 80, 1, 30, '°', 0),
      pMu(0.2),
    ],
    readouts: [['state', 'Trạng thái', 1], ['a', 'Gia tốc $a$'], ['T', 'Lực căng $T$'], ['Fms', 'Ma sát trên vật 1', 1]],
    note: 'Xét xu hướng $D = m_2 g - m_1 g\\sin\\alpha$. Nếu $|D| \\le \\mu m_1 g\\cos\\alpha$ hệ đứng yên, $T = m_2 g$. Nếu $D > 0$: $m_2$ đi xuống, $a = \\dfrac{D - \\mu m_1 g\\cos\\alpha}{m_1 + m_2}$, $T = m_2(g-a)$. Nếu $D < 0$: $m_1$ trượt xuống, $a = \\dfrac{|D| - \\mu m_1 g\\cos\\alpha}{m_1 + m_2}$, $T = m_2(g+a)$.',
    compute: function (p) {
      var a = p.alpha * DEG;
      var P1 = p.m1 * G;
      var P2 = p.m2 * G;
      var N = P1 * Math.cos(a);
      var S = P1 * Math.sin(a);
      var D = P2 - S;
      var Fmax = p.mu * N;
      var r = { a: a, P1: P1, P2: P2, N: N, S: S };
      if (Math.abs(D) <= Fmax + 1e-9) {
        r.rest = true; r.acc = 0; r.T = P2; r.FmsUp = -D; r.dir = 0;
      } else {
        r.rest = false; r.dir = D > 0 ? 1 : -1;
        r.acc = (Math.abs(D) - Fmax) / (p.m1 + p.m2);
        r.T = r.dir > 0 ? p.m2 * (G - r.acc) : p.m2 * (G + r.acc);
        r.FmsUp = -r.dir * Fmax;
      }
      return r;
    },
    out: function (p, r) {
      return {
        state: r.rest ? 'Hệ đứng yên' : r.dir > 0 ? 'm₂ đi xuống, m₁ lên dốc' : 'm₁ trượt xuống, m₂ đi lên',
        a: fAcc(r.acc), T: fN(r.T),
        Fms: Math.abs(r.FmsUp) < 1e-6 ? '0 N' : fN(Math.abs(r.FmsUp)) + (r.FmsUp > 0 ? ', lên dốc' : ', xuống dốc'),
      };
    },
    init: function () { return { s: 0, v: 0, t: 0 }; },
    step: function (st, p, r, dt) {
      if (r.rest) return false;
      st.v += r.dir * r.acc * dt; st.s += st.v * dt; st.t += dt;
      var lo = st.sMin != null ? st.sMin : -0.9;
      var hi = st.sMax != null ? st.sMax : 0.9;
      if (st.s <= lo || st.s >= hi) { st.s = clamp(st.s, lo, hi); return false; }
      return true;
    },
    draw: function (p, r, st) {
      status(r.rest ? 'Hệ đứng yên: |m₂g − m₁g·sinα| ≤ μm₁g·cosα' : 'a = ' + fAcc(r.acc) + '   v = ' + fmt(Math.abs(st.v), 2) + ' m/s   t = ' + fmt(st.t, 2) + ' s', r.rest ? OK : MUTED);
      var ca = Math.cos(r.a);
      var sa = Math.sin(r.a);
      var fx = 60;
      var Lpx = r.a > 0.01 ? Math.min(470, 240 / sa) : 470;
      var Hpx = Lpx * sa;
      // Dốc thấp thì kê lên bệ để vật treo có chỗ đi xuống.
      var fy = 340 - Math.max(0, 200 - Hpx);
      var ax = fx + Lpx * ca;
      var ay = fy - Hpx;
      if (fy < 340) {
        ctx.fillStyle = '#d6dae8';
        ctx.fillRect(fx - 10, fy, ax - fx + 10, 340 - fy);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(fx - 10, fy, ax - fx + 10, 340 - fy);
      }
      poly([[fx, fy], [ax, ay], [ax, fy]], FILL, null);
      line(fx, fy, ax, ay, LINE, 3);
      line(ax, ay, ax, fy, LINE, 2);
      ground(30, 690, 340);
      if (r.a > 0.005) arc(fx, fy, 50, -r.a, 0, 'α');
      var pr = 14;
      var pcx = ax;
      var pcy = ay;
      var u = { x: ca, y: -sa };
      var n = { x: -sa, y: -ca };
      // Giới hạn hành trình: vật 1 trong khoảng 12–88% mặt dốc, vật 2 giữa ròng rọc và mặt đất.
      var d = 0.35 * Lpx;
      var my0 = pcy + 30 + (300 - pcy - 30) * 0.45;
      st.sMin = Math.max(-1.086, (pcy + 30 - my0) / d);
      st.sMax = Math.min(1.086, (300 - my0) / d);
      var f = 0.5 + st.s * 0.35;
      var Q = { x: fx + u.x * Lpx * f, y: fy + u.y * Lpx * f };
      var w = 80;
      var h = 52;
      var c = { x: Q.x + n.x * h / 2, y: Q.y + n.y * h / 2 };
      box(c.x, c.y, w, h, -r.a, 'm₁');
      // dây song song mặt dốc, cách mặt dốc đúng bán kính ròng rọc
      var front = { x: Q.x + u.x * w / 2 + n.x * pr, y: Q.y + u.y * w / 2 + n.y * pr };
      var tang = { x: pcx + n.x * pr, y: pcy + n.y * pr };
      line(front.x, front.y, tang.x, tang.y, '#6b7280', 2);
      pulley(pcx, pcy, pr);
      var hx = pcx + pr;
      var my = my0 + st.s * d;
      line(hx, pcy, hx, my - 20, '#6b7280', 2);
      box(hx, my, 40, 40, 0, 'm₂', BODY2);
      var k = scaleFor(Math.max(r.P1, r.P2), 20, 65);
      arrow(c.x, c.y, 0, r.P1 * k, 'P', 'P₁');
      arrow(c.x, c.y, n.x * r.N * k, n.y * r.N * k, 'N', 'N');
      arrow(front.x, front.y, u.x * r.T * k, u.y * r.T * k, 'T', 'T', { ly: -12 });
      if (Math.abs(r.FmsUp) > EPS) {
        var sg = r.FmsUp > 0 ? 1 : -1;
        var e = { x: Q.x + u.x * sg * w / 2 + n.x * 4, y: Q.y + u.y * sg * w / 2 + n.y * 4 };
        arrow(e.x, e.y, u.x * r.FmsUp * k, u.y * r.FmsUp * k, 'ms', 'Fms', { ly: 12 });
      }
      arrow(hx, my - 20, 0, -r.T * k, 'T', 'T', { lx: 14 });
      arrow(hx, my, 0, r.P2 * k, 'P', 'P₂', { lx: 18 });
    },
  });

  add({
    id: 'rong-roc-dong', group: 1, anim: true,
    title: 'Ròng rọc động',
    params: [pMass('m1', 'Vật treo ở ròng rọc động $m_1$', 4, 20), pMass('m2', 'Đối trọng ở đầu dây tự do $m_2$', 2.5, 20)],
    readouts: [['state', 'Trạng thái', 1], ['a1', 'Gia tốc $m_1$ (lên +)'], ['a2', 'Gia tốc $m_2$ (xuống +)'], ['T', 'Lực căng $T$'], ['eq', 'Đối trọng để cân bằng $m_1/2$']],
    note: 'Ròng rọc động được hai nhánh dây đỡ: $2T - m_1 g = m_1 a_1$. Đầu tự do: $m_2 g - T = m_2 a_2$ với $a_2 = 2a_1$ (thiệt 2 lần về đường đi). Suy ra $a_2 = \\dfrac{2(2m_2 - m_1)}{4m_2 + m_1}g$. Cân bằng khi $m_2 = m_1/2$: lợi 2 lần về lực.',
    compute: function (p) {
      var a2 = 2 * (2 * p.m2 - p.m1) * G / (4 * p.m2 + p.m1);
      return { P1: p.m1 * G, P2: p.m2 * G, a2: a2, a1: a2 / 2, T: p.m2 * (G - a2), equal: Math.abs(2 * p.m2 - p.m1) < 1e-9 };
    },
    out: function (p, r) {
      return {
        state: r.equal ? 'Cân bằng' : r.a2 > 0 ? 'm₂ đi xuống, m₁ đi lên' : 'm₁ đi xuống, m₂ đi lên',
        a1: fAcc(r.a1), a2: fAcc(r.a2), T: fN(r.T), eq: fmt(p.m1 / 2, 2) + ' kg',
      };
    },
    init: function () { return { y: 0, v: 0, t: 0 }; },
    step: function (st, p, r, dt) {
      if (r.equal) return false;
      st.v += r.a1 * dt; st.y += st.v * dt; st.t += dt; // y: độ dịch lên của m1
      if (st.y >= 0.3 || st.y <= -0.2) { st.y = clamp(st.y, -0.2, 0.3); return false; }
      return true;
    },
    draw: function (p, r, st) {
      status(r.equal ? 'm₂ = m₁/2: hệ cân bằng' : 'a₁ = ' + fAcc(r.a1) + '   a₂ = ' + fAcc(r.a2) + '   t = ' + fmt(st.t, 2) + ' s', r.equal ? OK : MUTED);
      ceiling(170, 520, 64);
      var R = 30;
      var fxp = 400;
      var fyp = 110;
      line(fxp, 64, fxp, fyp, LINE, 3);
      pulley(fxp, fyp, R);
      var mx = fxp - 2 * R;
      var my = 220 - st.y * 160;
      // dây: điểm neo trần -> nhánh trái ròng rọc động -> vòng dưới -> nhánh phải -> ròng rọc cố định -> m2
      line(mx - R, 64, mx - R, my, '#6b7280', 2);
      line(mx + R, my, mx + R, fyp, '#6b7280', 2);
      var y2 = 210 + st.y * 320;
      line(fxp + R, fyp, fxp + R, y2 - 20, '#6b7280', 2);
      pulley(mx, my, R);
      line(mx, my, mx, my + 34, LINE, 2.5);
      var s1 = 60;
      box(mx, my + 34 + s1 / 2, s1, s1, 0, 'm₁');
      box(fxp + R, y2, 40, 40, 0, 'm₂', BODY2);
      var k = scaleFor(Math.max(r.P1, r.P2), 20, 62);
      arrow(mx - R, my, 0, -r.T * k, 'T', 'T', { lx: -14 });
      arrow(mx + R, my, 0, -r.T * k, 'T', 'T', { lx: 14 });
      arrow(mx, my + 34 + s1 / 2, 0, r.P1 * k, 'P', 'P₁', { lx: 18 });
      arrow(fxp + R, y2 - 20, 0, -r.T * k, 'T', 'T', { lx: 14 });
      arrow(fxp + R, y2, 0, r.P2 * k, 'P', 'P₂', { lx: 18 });
      txt('m₁ gồm cả khối lượng ròng rọc động', 470, 360, { size: 12, color: MUTED });
    },
  });

  // ============ NHÓM 3. Chuyển động tròn ============
  // Hình nhìn từ trên xuống của khúc cua tròn (bên trái canvas).
  function topView(st, drift, ok, label) {
    var cx = 175;
    var cy = 225;
    var R = 120;
    circle(cx, cy, R + 22, '#e2e8f0');
    circle(cx, cy, R - 22, '#f8faff');
    ctx.save();
    ctx.setLineDash([8, 8]);
    circle(cx, cy, R, null, '#94a3b8', 1.5);
    ctx.restore();
    dot(cx, cy, 4, MUTED);
    txt('tâm cua', cx, cy + 18, { size: 11, color: MUTED, align: 'center' });
    var rr = R + (drift || 0);
    var x = cx + rr * Math.cos(st.phi);
    var y = cy - rr * Math.sin(st.phi);
    var tx = -Math.sin(st.phi);
    var ty = -Math.cos(st.phi);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(ty, tx));
    ctx.fillStyle = ok ? '#4338ca' : DANGER;
    ctx.fillRect(-16, -9, 32, 18);
    ctx.fillStyle = '#e0e7ff';
    ctx.fillRect(4, -7, 7, 14);
    ctx.restore();
    arrow(x, y, tx * 46, ty * 46, 'v', 'v', { width: 2, head: 8 });
    return { x: x, y: y, ix: (cx - x) / rr, iy: (cy - y) / rr };
  }

  add({
    id: 'cua-duong-bang', group: 2, anim: true, keep: true,
    title: 'Xe vào cua trên đường bằng',
    params: [
      prm('m', 'Khối lượng xe $m$', 500, 3000, 50, 1200, 'kg', 0, { hardMin: 50, hardMax: 50000 }),
      prm('v', 'Tốc độ $v$', 0, 40, 0.5, 15, 'm/s', 1, { hardMax: 120 }),
      prm('R', 'Bán kính cua $r$', 10, 200, 1, 50, 'm', 0, { hardMin: 1, hardMax: 2000 }),
      pMu(0.6, 'Hệ số ma sát nghỉ lốp – đường $\\mu$'),
    ],
    readouts: [['state', 'Trạng thái', 1], ['Fht', 'Lực hướng tâm cần $mv^2/r$'], ['Fmax', 'Ma sát nghỉ cực đại $\\mu mg$'], ['vmax', 'Tốc độ tối đa $\\sqrt{\\mu g r}$', 1]],
    note: 'Trên đường bằng, chỉ có ma sát nghỉ (ngang, hướng vào tâm) đóng vai trò lực hướng tâm: $F_{ms} = \\dfrac{mv^2}{r} \\le \\mu mg \\Rightarrow v \\le \\sqrt{\\mu g r}$ (không phụ thuộc khối lượng). Vượt quá, xe bị văng ra ngoài.',
    compute: function (p) {
      var P = p.m * G;
      var Fht = p.m * p.v * p.v / p.R;
      var Fmax = p.mu * P;
      var ok = Fht <= Fmax + 1e-9;
      return { P: P, N: P, Fht: Fht, Fmax: Fmax, ok: ok, Fms: ok ? Fht : Fmax, vmax: Math.sqrt(p.mu * G * p.R) };
    },
    out: function (p, r) {
      return {
        state: r.ok ? 'Vào cua an toàn' : 'Ma sát không đủ – xe văng ra ngoài',
        Fht: fN(r.Fht), Fmax: fN(r.Fmax), vmax: fmt(r.vmax, 1) + ' m/s (' + fmt(r.vmax * 3.6, 0) + ' km/h)',
      };
    },
    init: function () { return { phi: Math.PI / 2, drift: 0, t: 0, out: false }; },
    step: function (st, p, r, dt) {
      st.phi += clamp(p.v / p.R, 0, 3) * dt;
      st.t += dt;
      if (!r.ok) {
        st.drift += Math.min(60, (r.Fht - r.Fmax) / p.m * 8) * dt;
        if (st.drift > 40) { st.out = true; return false; }
      }
      return true;
    },
    draw: function (p, r, st) {
      status(r.ok ? 'Ma sát nghỉ đủ làm lực hướng tâm (v = ' + fmt(p.v * 3.6, 0) + ' km/h)' : st.out ? 'Xe đã văng khỏi khúc cua!' : 'v > √(μgr): xe sẽ trượt ra ngoài', r.ok ? OK : DANGER);
      txt('Nhìn từ trên xuống', 16, 70, { size: 12, color: MUTED });
      var tv = topView(st, st.drift, r.ok);
      var k = scaleFor(Math.max(r.P, r.Fms), 1000, 95);
      arrow(tv.x, tv.y, tv.ix * r.Fms * k * 0.6, tv.iy * r.Fms * k * 0.6, 'ms', 'Fms');
      // Nhìn từ phía sau
      txt('Nhìn từ phía sau (tâm cua ở bên trái)', 395, 80, { size: 12, color: MUTED });
      var gy = 295;
      ground(390, 700, gy);
      var cx = 560;
      drawCarRear(cx, gy, 0, r.ok ? '#4338ca' : DANGER);
      var cgy = gy - 50;
      arrow(cx, cgy, 0, r.P * k, 'P', 'P', { lx: 14 });
      arrow(cx, cgy, 0, -r.N * k, 'N', 'N', { lx: 14 });
      arrow(cx, gy - 4, -r.Fms * k, 0, 'ms', 'Fms', { ly: -12 });
      if (!r.ok) arrow(cx, gy + 22, -Math.min(r.Fht * k, 160), 0, 'net', r.Fht * k > 160 ? 'cần mv²/r (rút gọn)' : 'cần mv²/r', { dash: true, width: 2, size: 12 });
    },
  });

  // Xe nhìn từ phía sau, đáy tại (cx, by), nghiêng góc ang.
  function drawCarRear(cx, by, ang, color) {
    ctx.save();
    ctx.translate(cx, by);
    ctx.rotate(ang);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-62, -22, 22, 22);
    ctx.fillRect(40, -22, 22, 22);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.rect(-70, -70, 140, 50);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-50, -70);
    ctx.lineTo(-38, -104);
    ctx.lineTo(38, -104);
    ctx.lineTo(50, -70);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e0e7ff';
    ctx.fillRect(-32, -98, 64, 22);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(-64, -60, 16, 9);
    ctx.fillRect(48, -60, 16, 9);
    ctx.restore();
  }

  add({
    id: 'duong-nghieng', group: 2, anim: true, keep: true,
    title: 'Xe vào cua trên đường nghiêng không ma sát',
    params: [
      prm('alpha', 'Góc nghiêng mặt đường $\\alpha$', 0, 45, 0.5, 15, '°', 1, { hardMax: 80 }),
      prm('R', 'Bán kính cua $r$', 10, 300, 1, 80, 'm', 0, { hardMin: 1, hardMax: 3000 }),
      prm('v', 'Tốc độ $v$', 0, 50, 0.5, 14.5, 'm/s', 1, { hardMax: 150 }),
      prm('m', 'Khối lượng xe $m$', 500, 3000, 50, 1200, 'kg', 0, { hardMin: 50, hardMax: 50000 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['v0', 'Tốc độ thiết kế $v_0 = \\sqrt{gr\\tan\\alpha}$', 1], ['N', 'Phản lực $N$'], ['need', 'Cần $mv^2/r$ / có $mg\\tan\\alpha$', 1]],
    note: 'Không ma sát, hợp lực của $\\vec P$ và $\\vec N$ nằm ngang, hướng vào tâm: $N\\cos\\alpha = mg$, $N\\sin\\alpha = \\dfrac{mv^2}{r} \\Rightarrow \\tan\\alpha = \\dfrac{v_0^2}{gr}$. Khi $v \\ne v_0$, $N = mg\\cos\\alpha + \\dfrac{mv^2}{r}\\sin\\alpha$ và xe trượt lên ($v > v_0$) hoặc xuống ($v < v_0$) dốc.',
    compute: function (p) {
      var a = p.alpha * DEG;
      var P = p.m * G;
      var need = p.m * p.v * p.v / p.R;
      var have = P * Math.tan(a);
      var N = P * Math.cos(a) + need * Math.sin(a);
      var v0 = Math.sqrt(G * p.R * Math.tan(a));
      var along = (p.v * p.v / p.R) * Math.cos(a) - G * Math.sin(a); // >0: trượt lên/ra ngoài
      var ok = Math.abs(p.v - v0) <= Math.max(0.02 * v0, 0.05);
      return { a: a, P: P, need: need, have: have, N: N, v0: v0, along: along, ok: ok };
    },
    out: function (p, r) {
      return {
        state: r.ok ? 'Đúng tốc độ thiết kế – không cần ma sát' : r.along > 0 ? 'Quá nhanh: xe trượt lên phía ngoài' : 'Quá chậm: xe trượt xuống phía trong',
        v0: fmt(r.v0, 1) + ' m/s (' + fmt(r.v0 * 3.6, 0) + ' km/h)', N: fN(r.N), need: fN(r.need) + ' / ' + fN(r.have),
      };
    },
    init: function () { return { phi: Math.PI / 2, drift: 0, t: 0, out: false }; },
    step: function (st, p, r, dt) {
      st.phi += clamp(p.v / p.R, 0, 3) * dt;
      st.t += dt;
      if (!r.ok) {
        st.drift += clamp(r.along * 8, -40, 40) * dt;
        if (Math.abs(st.drift) > 30) { st.out = true; return false; }
      }
      return true;
    },
    draw: function (p, r, st) {
      status(r.ok ? 'v = v₀: P + N là lực hướng tâm' : st.out ? (r.along > 0 ? 'Xe đã trượt ra mép ngoài đường!' : 'Xe đã trượt vào mép trong!') : r.along > 0 ? 'v > v₀: thiếu lực hướng tâm, xe trượt ra ngoài' : 'v < v₀: thừa lực hướng tâm, xe trượt vào trong', r.ok ? OK : DANGER);
      txt('Nhìn từ trên xuống', 16, 70, { size: 12, color: MUTED });
      var tv = topView(st, st.drift, r.ok);
      var k = scaleFor(Math.max(r.P, r.N), 1000, 100);
      var netx = -r.N * Math.sin(r.a);
      var nety = r.N * Math.cos(r.a) - r.P;
      arrow(tv.x, tv.y, tv.ix * Math.abs(netx) * k * 0.7, tv.iy * Math.abs(netx) * k * 0.7, 'net', 'P+N', { size: 12 });
      txt('Nhìn từ phía sau (tâm cua ở bên trái)', 395, 80, { size: 12, color: MUTED });
      var ca = Math.cos(r.a);
      var sa = Math.sin(r.a);
      var mx = 545;
      var my = 285;
      var half = 150;
      var x1 = mx - half * ca;
      var y1 = my + half * sa;
      var x2 = mx + half * ca;
      var y2 = my - half * sa;
      poly([[x1, y1], [x2, y2], [x2, 360], [x1, 360]], FILL, null);
      line(x1, y1, x2, y2, LINE, 3);
      ground(390, 700, 360);
      if (r.a > 0.005) {
        line(x1, y1, x1 + 80, y1, MUTED, 1, [3, 3]);
        arc(x1, y1, 50, -r.a, 0, 'α');
      }
      drawCarRear(mx, my, -r.a, r.ok ? '#4338ca' : DANGER);
      var n = { x: -sa, y: -ca };
      var cg = { x: mx + n.x * 50, y: my + n.y * 50 };
      arrow(cg.x, cg.y, 0, r.P * k, 'P', 'P', { lx: 14 });
      arrow(cg.x, cg.y, n.x * r.N * k, n.y * r.N * k, 'N', 'N');
      arrow(cg.x, cg.y, netx * k, nety * k, 'net', 'P+N', { dash: true, width: 2, size: 12, ly: 14 });
    },
  });

  add({
    id: 'con-lac-non', group: 2, anim: true, keep: true,
    title: 'Con lắc nón',
    params: [
      prm('L', 'Chiều dài dây $\\ell$', 0.2, 3, 0.05, 1, 'm', 2, { hardMin: 0.05, hardMax: 20 }),
      prm('th', 'Góc lệch so với phương thẳng đứng $\\alpha$', 1, 85, 1, 35, '°', 0),
      pMass('m', 'Khối lượng quả nặng $m$', 0.5, 5),
    ],
    readouts: [['T', 'Lực căng $T = mg/\\cos\\alpha$'], ['Fht', 'Lực hướng tâm $mg\\tan\\alpha$'], ['w', 'Tốc độ góc $\\omega$'], ['Tp', 'Chu kì quay'], ['v', 'Tốc độ dài $v$'], ['r', 'Bán kính quỹ đạo $\\ell\\sin\\alpha$']],
    note: 'Quả nặng quay đều trên đường tròn nằm ngang bán kính $r = \\ell\\sin\\alpha$. Hợp lực $\\vec T + \\vec P$ nằm ngang, hướng vào tâm: $T\\cos\\alpha = mg$, $T\\sin\\alpha = m\\omega^2 r \\Rightarrow \\omega = \\sqrt{\\dfrac{g}{\\ell\\cos\\alpha}}$, chu kì $2\\pi\\sqrt{\\dfrac{\\ell\\cos\\alpha}{g}}$.',
    compute: function (p) {
      var th = p.th * DEG;
      var P = p.m * G;
      var T = P / Math.cos(th);
      var w = Math.sqrt(G / (p.L * Math.cos(th)));
      var r = p.L * Math.sin(th);
      return { th: th, P: P, T: T, Fht: P * Math.tan(th), w: w, Tp: 2 * Math.PI / w, r: r, v: w * r };
    },
    out: function (p, r) {
      return { T: fN(r.T), Fht: fN(r.Fht), w: fmt(r.w, 2) + ' rad/s', Tp: fmt(r.Tp, 2) + ' s', v: fmt(r.v, 2) + ' m/s', r: fmt(r.r, 2) + ' m' };
    },
    init: function () { return { phi: 0, t: 0 }; },
    step: function (st, p, r, dt) {
      st.phi += r.w * dt; st.t += dt;
      return true;
    },
    draw: function (p, r, st) {
      status('ω = ' + fmt(r.w, 2) + ' rad/s,  chu kì ' + fmt(r.Tp, 2) + ' s');
      var px = 330;
      var py = 78;
      ceiling(270, 390, py);
      var Lpx = 230;
      var cy = py + Lpx * Math.cos(r.th);
      var rx = Lpx * Math.sin(r.th);
      var ry = rx * 0.28;
      line(px, py, px, cy + 30, '#94a3b8', 1, [4, 4]);
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      dot(px, cy, 3.5, MUTED);
      var bx = px + rx * Math.cos(st.phi);
      var by = cy + ry * Math.sin(st.phi);
      line(px, py, bx, by, '#6b7280', 2);
      var rb = 13 + 4 * Math.sqrt(p.m);
      circle(bx, by, rb, '#fbbf24', '#92400e', 2);
      if (Math.abs(by - cy) < 0.5 && bx > px) arc(px, py, 48, Math.PI / 2 - r.th, Math.PI / 2, 'α');
      // Vectơ 3D chiếu lên mặt phẳng hình: dây có chiều dài Lpx, bán kính quỹ đạo rx.
      var k = scaleFor(Math.max(r.P, r.T), 2, 110);
      arrow(bx, by, 0, r.P * k, 'P', 'P', { lx: 14 });
      arrow(bx, by, (px - bx) / Lpx * r.T * k, (py - by) / Lpx * r.T * k, 'T', 'T', { lx: 14 });
      if (rx > 1) arrow(bx, by, (px - bx) / rx * r.Fht * k, (cy - by) / rx * r.Fht * k, 'net', 'Fht', { dash: true, width: 2, size: 12, ly: 14 });
      txt('Hình phối cảnh: mũi tên là hình chiếu của vectơ lực', 16, 368, { size: 11, color: MUTED });
    },
  });

  add({
    id: 'diem-thap-nhat', group: 2,
    title: 'Điểm thấp nhất của vòng tròn đứng (vật treo dây)',
    params: [
      pMass('m', 'Khối lượng vật $m$', 0.5, 5),
      prm('L', 'Chiều dài dây $\\ell$', 0.2, 3, 0.05, 1, 'm', 2, { hardMin: 0.05, hardMax: 20 }),
      prm('v', 'Tốc độ tại điểm thấp nhất $v$', 0, 15, 0.1, 4, 'm/s', 1, { hardMax: 100 }),
      prm('Tmax', 'Lực căng tối đa dây chịu được', 5, 200, 1, 40, 'N', 0, { hardMax: 10000 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['T', 'Lực căng $T = mg + mv^2/\\ell$'], ['Fht', 'Lực hướng tâm $mv^2/\\ell$'], ['ratio', 'Tỉ số $T/P$'], ['vmin', 'Tốc độ tối thiểu ở đáy để quay hết vòng $\\sqrt{5g\\ell}$', 1]],
    note: 'Tại điểm thấp nhất, $\\vec T$ hướng lên (vào tâm) và $\\vec P$ hướng xuống: $T - mg = \\dfrac{mv^2}{\\ell}$. Lực căng ở đáy luôn lớn hơn trọng lượng – đây là chỗ dây dễ đứt nhất. Muốn vật đi hết vòng tròn (dây không chùng ở đỉnh) cần $v_{đáy} \\ge \\sqrt{5g\\ell}$.',
    compute: function (p) {
      var P = p.m * G;
      var Fht = p.m * p.v * p.v / p.L;
      var T = P + Fht;
      return { P: P, Fht: Fht, T: T, broken: T > p.Tmax, vmin: Math.sqrt(5 * G * p.L) };
    },
    out: function (p, r) {
      return {
        state: r.broken ? 'Dây đứt (T > Tmax)' : p.v >= r.vmin ? 'Đủ nhanh để quay hết vòng' : 'Dao động / không lên tới đỉnh',
        T: fN(r.T), Fht: fN(r.Fht), ratio: fmt(r.T / r.P, 2), vmin: fmt(r.vmin, 2) + ' m/s',
      };
    },
    draw: function (p, r) {
      status(r.broken ? 'T = ' + fN(r.T) + ' vượt sức chịu của dây: dây đứt!' : 'T − P = mv²/ℓ hướng lên, vào tâm', r.broken ? DANGER : OK);
      var cx = 330;
      var cy = 100;
      var R = 170;
      ceiling(290, 370, cy - 30);
      line(cx, cy - 30, cx, cy, LINE, 2);
      dot(cx, cy, 4);
      ctx.save();
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.restore();
      var bx = cx;
      var by = cy + R;
      if (r.broken) {
        line(cx, cy, cx, cy + R * 0.45, '#6b7280', 2);
        line(cx + 6, cy + R * 0.58, cx + 2, by - 16, '#6b7280', 2);
      } else {
        line(cx, cy, bx, by, '#6b7280', 2);
      }
      dim(cx - 30, cy, cx - 30, by, 'ℓ');
      circle(bx, by, 16, '#fbbf24', '#92400e', 2);
      var k = scaleFor(Math.max(r.P, r.T), 2, 120);
      arrow(bx, by, 0, r.P * k, 'P', 'P', { lx: 14 });
      if (!r.broken) arrow(bx, by, 0, -r.T * k, 'T', 'T', { lx: 14 });
      arrow(bx + 18, by, 70, 0, 'v', 'v', { width: 2, head: 8 });
      if (!r.broken && r.Fht > EPS) arrow(bx + 120, by + 10, 0, -r.Fht * k, 'net', 'Fht = T − P', { dash: true, width: 2, size: 12, lx: 40 });
    },
  });

  // Vòng xoáy (loop-the-loop): đường ray dốc thẳng + đoạn bằng + vòng tròn bán kính r.
  function loopGeom(p) {
    var r = p.r;
    var h = p.h;
    var Lh = Math.max(h, 2 * r) * 1.0 + 0.2;
    var flat1 = r + 0.25;
    var X = Lh + flat1;
    var flat2 = r + 0.6;
    var s1 = Math.hypot(Lh, h);
    var s3 = 2 * Math.PI * r;
    var sc = Math.min(250 / Math.max(h, 2.5 * r, 0.1), 650 / (X + flat2));
    return { r: r, h: h, Lh: Lh, X: X, flat1: flat1, flat2: flat2, s1: s1, s3: s3, total: s1 + flat1 + s3 + flat2, sc: sc, x0: 40, gy: 352 };
  }
  // Vị trí theo độ dài cung s: {x, y (m, hướng lên), tx, ty (tiếp tuyến theo chiều s tăng), nx, ny (pháp tuyến hướng vào phía ray đỡ), phi}
  function loopPos(g, s) {
    if (s <= g.s1) {
      var f = s / g.s1;
      var ux = g.Lh / g.s1;
      var uy = -g.h / g.s1;
      return { x: g.Lh * f, y: g.h * (1 - f), tx: ux, ty: uy, nx: -uy, ny: ux, seg: 0 };
    }
    s -= g.s1;
    if (s <= g.flat1) return { x: g.Lh + s, y: 0, tx: 1, ty: 0, nx: 0, ny: 1, seg: 1 };
    s -= g.flat1;
    if (s <= g.s3) {
      var phi = s / g.r;
      return { x: g.X + g.r * Math.sin(phi), y: g.r - g.r * Math.cos(phi), tx: Math.cos(phi), ty: Math.sin(phi), nx: -Math.sin(phi), ny: Math.cos(phi), seg: 2, phi: phi };
    }
    s -= g.s3;
    return { x: g.X + s, y: 0, tx: 1, ty: 0, nx: 0, ny: 1, seg: 3 };
  }

  add({
    id: 'vong-xoay', group: 2, anim: true,
    title: 'Vòng xoáy (vòng tròn đứng trên đường ray)',
    params: [
      prm('r', 'Bán kính vòng $r$', 0.2, 2, 0.05, 0.6, 'm', 2, { hardMin: 0.05, hardMax: 10 }),
      prm('h', 'Độ cao thả vật $h$', 0.1, 6, 0.05, 1.7, 'm', 2, { hardMin: 0.01, hardMax: 30 }),
      pMass('m', 'Khối lượng vật $m$', 0.5, 5),
    ],
    readouts: [['state', 'Kết quả', 1], ['hmin', 'Độ cao tối thiểu $h_{min} = 5r/2$'], ['vtop', 'Tốc độ tại đỉnh vòng'], ['Ntop', 'Phản lực tại đỉnh $N$']],
    note: 'Bỏ qua ma sát. Bảo toàn cơ năng: $v_{đỉnh}^2 = 2g(h - 2r)$. Tại đỉnh: $N + mg = \\dfrac{mv^2}{r} \\Rightarrow N = mg\\left(\\dfrac{2h}{r} - 5\\right)$. Vật không rời ray cần $N \\ge 0 \\Leftrightarrow h \\ge \\dfrac{5r}{2}$. Nếu $r < h < 5r/2$ vật rời ray ở độ cao $r + \\dfrac{2(h-r)}{3}$ rồi rơi tự do; nếu $h \\le r$ vật trượt lên rồi trượt ngược lại.',
    compute: function (p) {
      var P = p.m * G;
      var hmin = 2.5 * p.r;
      var r = { P: P, hmin: hmin };
      if (p.h >= hmin - 1e-9) {
        r.kind = 'ok';
        r.vtop = Math.sqrt(2 * G * (p.h - 2 * p.r));
        r.Ntop = p.m * r.vtop * r.vtop / p.r - P;
      } else if (p.h > p.r) {
        r.kind = 'detach';
        r.cosd = -2 * (p.h - p.r) / (3 * p.r);
        r.yd = p.r * (1 - r.cosd);
      } else {
        r.kind = 'back';
      }
      return r;
    },
    out: function (p, r) {
      return {
        state: r.kind === 'ok' ? 'Vật đi hết vòng' : r.kind === 'detach' ? 'Rời ray ở độ cao ' + fmt(r.yd, 2) + ' m' : 'Trượt lên rồi trượt ngược lại',
        hmin: fmt(r.hmin, 2) + ' m', vtop: r.kind === 'ok' ? fmt(r.vtop, 2) + ' m/s' : 'Không tới đỉnh',
        Ntop: r.kind === 'ok' ? fN(r.Ntop) : '—',
      };
    },
    init: function (p) { return { s: 0.0005, dir: 1, t: 0, fly: null, done: false }; },
    timeScale: 0.4,
    step: function (st, p, r, dt) {
      var g = loopGeom(p);
      var n = Math.ceil(dt / 0.002);
      var h = dt / n;
      for (var i = 0; i < n; i++) {
        if (st.fly) {
          st.fly.vy -= G * h;
          st.fly.x += st.fly.vx * h;
          st.fly.y += st.fly.vy * h;
          st.t += h;
          var d = Math.hypot(st.fly.x - g.X, st.fly.y - g.r);
          if ((st.t - st.fly.t0 > 0.05 && d >= g.r) || st.fly.y <= 0) return false;
          continue;
        }
        var pos = loopPos(g, st.s);
        var v = Math.sqrt(Math.max(0, 2 * G * (p.h - pos.y)));
        if (pos.seg === 2) {
          var N = p.m * v * v / p.r + p.m * G * Math.cos(pos.phi);
          if (N < 0) {
            st.fly = { x: pos.x, y: pos.y, vx: st.dir * v * pos.tx, vy: st.dir * v * pos.ty, t0: st.t };
            continue;
          }
        }
        var ns = st.s + st.dir * Math.max(v, 0.02) * h;
        var np = loopPos(g, clamp(ns, 0, g.total));
        if (np.y > p.h || ns < 0) { st.dir = -st.dir; continue; }
        st.s = ns;
        st.t += h;
        if (st.s >= g.total) { st.s = g.total; return false; }
      }
      return true;
    },
    draw: function (p, r, st) {
      var g = loopGeom(p);
      var sx = function (x) { return g.x0 + x * g.sc; };
      var sy = function (y) { return g.gy - y * g.sc; };
      status(r.kind === 'ok' ? 'h ≥ 5r/2: vật đi hết vòng, tại đỉnh N = ' + fN(r.Ntop) : r.kind === 'detach' ? 'h < 5r/2: vật rời ray trước khi tới đỉnh' : 'h ≤ r: vật không vượt quá nửa dưới vòng', r.kind === 'ok' ? OK : DANGER);
      ground(30, 700, g.gy + 6);
      // đường ray
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(g.h));
      ctx.lineTo(sx(g.Lh), sy(0));
      ctx.lineTo(sx(g.X + g.flat2), sy(0));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx(g.X), sy(g.r), g.r * g.sc, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      dim(sx(0) - 14, sy(0), sx(0) - 14, sy(g.h), 'h');
      line(sx(g.X), sy(g.r), sx(g.X) + g.r * g.sc * 0.7, sy(g.r) - g.r * g.sc * 0.7, MUTED, 1, [3, 3]);
      txt('r', sx(g.X) + g.r * g.sc * 0.38 + 6, sy(g.r) - g.r * g.sc * 0.38, { size: 12, color: MUTED, weight: 700 });
      // mức h_min
      line(sx(g.Lh * 0.2), sy(r.hmin), sx(g.X + g.r), sy(r.hmin), '#a5b4fc', 1, [6, 4]);
      txt('hmin = 5r/2', sx(g.X + g.r) + 4, sy(r.hmin) + 4, { size: 11, color: '#4338ca' });
      var br = clamp(0.09 * g.r * g.sc, 7, 13);
      var k = 45 / r.P;
      var cap = function (F) { return Math.min(F * k, 150); };
      if (!st.started) {
        // Trạng thái tĩnh: vật ở đỉnh dốc, "bóng mờ" chỉ lực tại điểm then chốt
        var top = loopPos(g, 0);
        circle(sx(top.x), sy(top.y) - br, br, '#fbbf24', '#92400e', 2);
        if (r.kind === 'ok') {
          var X = sx(g.X);
          var Y = sy(2 * g.r) + br;
          circle(X, Y, br, 'rgba(251,191,36,0.55)', '#92400e', 1.5);
          arrow(X - 6, Y, 0, cap(r.P), 'P', 'P', { lx: -14 });
          arrow(X + 6, Y, 0, cap(Math.max(0, r.Ntop)), 'N', 'N', { lx: 14 });
          txt('Lực tại đỉnh vòng', X + 20, Y - 22, { size: 12, color: MUTED });
        } else if (r.kind === 'detach') {
          var sinD = Math.sqrt(Math.max(0, 1 - r.cosd * r.cosd));
          var dx = sx(g.X - g.r * sinD);
          var dy = sy(r.yd);
          var cx = sx(g.X);
          var cy = sy(g.r);
          var ix = (cx - dx);
          var iy = (cy - dy);
          var il = Math.hypot(ix, iy) || 1;
          var bxp = dx + ix / il * br;
          var byp = dy + iy / il * br;
          circle(bxp, byp, br, 'rgba(251,191,36,0.55)', '#92400e', 1.5);
          arrow(bxp, byp, 0, cap(r.P), 'P', 'P', { lx: -14 });
          txt('Điểm rời ray: N = 0', bxp - 150, byp - 14, { size: 12, color: DANGER, halo: true });
        }
        return;
      }
      var X0;
      var Y0;
      if (st.fly) {
        X0 = sx(st.fly.x);
        Y0 = sy(st.fly.y);
        circle(X0, Y0, br, '#fbbf24', '#92400e', 2);
        arrow(X0, Y0, 0, cap(r.P), 'P', 'P', { lx: 14 });
        txt('Vật đã rời ray – rơi tự do', 16, 70, { size: 12.5, color: DANGER });
        return;
      }
      var pos = loopPos(g, st.s);
      var v = Math.sqrt(Math.max(0, 2 * G * (p.h - pos.y)));
      var N = pos.seg === 2 ? p.m * v * v / p.r + p.m * G * Math.cos(pos.phi) : pos.seg === 0 ? p.m * G * g.Lh / g.s1 : p.m * G;
      N = Math.max(0, N);
      // tâm vật lệch khỏi ray theo pháp tuyến (về phía bên trong đường cong / phía trên mặt)
      var cxp = sx(pos.x) + pos.nx * br;
      var cyp = sy(pos.y) - pos.ny * br;
      circle(cxp, cyp, br, '#fbbf24', '#92400e', 2);
      arrow(cxp, cyp, 0, cap(r.P), 'P', 'P', { lx: 14 });
      arrow(cxp, cyp, pos.nx * cap(N), -pos.ny * cap(N), 'N', 'N');
      txt('v = ' + fmt(v, 2) + ' m/s   N = ' + fN(N) + '   (chậm 2,5×)', 16, 70, { size: 12.5, color: MUTED });
    },
  });

  // ============ NHÓM 4. Hệ quy chiếu có gia tốc ============
  function person(cx, feetY, color) {
    ctx.save();
    ctx.fillStyle = color || '#94a3b8';
    ctx.strokeStyle = BODY_EDGE;
    ctx.lineWidth = 2;
    circle(cx, feetY - 118, 15, '#fde68a', BODY_EDGE, 2);
    ctx.beginPath();
    ctx.rect(cx - 20, feetY - 100, 40, 56);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 17, feetY - 44, 14, 44);
    ctx.fillRect(cx + 3, feetY - 44, 14, 44);
    ctx.restore();
  }
  function scale(cx, y, reading) {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 62, y, 124, 16);
    ctx.strokeStyle = BODY_EDGE;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 62, y, 124, 16);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 60, y + 2, 44, 12);
    txt(reading, cx - 38, y + 8.5, { size: 9, color: '#86efac', weight: 700, align: 'center', base: 'middle' });
  }

  add({
    id: 'thang-may-len', group: 3,
    title: 'Người đứng trên cân trong thang máy có gia tốc',
    params: [
      prm('m', 'Khối lượng người $m$', 20, 150, 1, 60, 'kg', 0, { hardMin: 1, hardMax: 500 }),
      prm('a', 'Gia tốc thang máy $a$ (hướng lên +)', -9.8, 10, 0.1, 2, 'm/s²', 1, { hardMin: -30, hardMax: 30 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['N', 'Số chỉ của cân $N = m(g+a)$'], ['kg', 'Cân hiển thị (chia cho g)'], ['P', 'Trọng lượng thật $P = mg$']],
    note: 'Định luật II Newton cho người (chiều dương hướng lên): $N - mg = ma \\Rightarrow N = m(g + a)$. Thang đi lên nhanh dần hoặc đi xuống chậm dần ($a > 0$): cân chỉ nhiều hơn (tăng trọng lượng biểu kiến). Nếu $a < 0$: cân chỉ ít hơn. Trong hệ quy chiếu thang máy, có thêm lực quán tính $-m\\vec a$.',
    compute: function (p) {
      var P = p.m * G;
      var N = p.m * (G + p.a);
      return { P: P, N: Math.max(0, N), ceil: N < -1e-9, Fqt: p.m * Math.abs(p.a), a: p.a };
    },
    out: function (p, r) {
      var st = r.ceil ? 'Người bị ép lên trần (N = 0 với sàn)' : Math.abs(r.N) < 1e-6 ? 'Không trọng lượng' : p.a > 0 ? 'Tăng trọng lượng biểu kiến' : p.a < 0 ? 'Giảm trọng lượng biểu kiến' : 'Như khi đứng yên';
      return { state: st, N: fN(r.N), kg: fmt(r.N / G, 1) + ' kg', P: fN(r.P) };
    },
    draw: function (p, r) {
      status(p.a > 0 ? 'a hướng lên: đi lên nhanh dần hoặc đi xuống chậm dần' : p.a < 0 ? 'a hướng xuống: đi lên chậm dần hoặc đi xuống nhanh dần' : 'a = 0: đứng yên hoặc chuyển động thẳng đều', MUTED);
      drawElevator(p.a, false);
      var cx = 330;
      var feet = 330;
      scale(cx, feet, fmt(r.N / G, 1) + ' kg');
      person(cx, feet);
      var k = scaleFor(Math.max(r.P, r.N), 300, 100);
      var cy = feet - 72;
      arrow(cx - 6, cy, 0, r.P * k, 'P', 'P', { lx: -16 });
      arrow(cx + 6, feet, 0, -r.N * k, 'N', 'N', { lx: 16 });
      if (Math.abs(p.a) > 1e-6) arrow(cx + 60, cy, 0, (p.a > 0 ? 1 : -1) * r.Fqt * k, 'qt', 'Fqt', { dash: true, width: 2, size: 12, lx: 18 });
    },
  });

  // Cabin thang máy, mũi tên gia tốc bên phải.
  function drawElevator(a, cut) {
    line(200, 60, 200, 380, '#cbd5e1', 2);
    line(460, 60, 460, 380, '#cbd5e1', 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(215, 110, 230, 240);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.strokeRect(215, 110, 230, 240);
    if (!cut) line(330, 60, 330, 110, '#6b7280', 2.5);
    else {
      line(330, 60, 330, 72, '#6b7280', 2.5);
      line(326, 96, 330, 110, '#6b7280', 2.5);
      txt('dây cáp đứt', 340, 88, { size: 11, color: DANGER });
    }
    if (Math.abs(a) > 1e-6) {
      var L = clamp(Math.abs(a) * 9, 34, 110) * (a > 0 ? -1 : 1);
      arrow(500, 230, 0, L, 'v', null, { width: 2.5, head: 9 });
      txt('a = ' + fmt(Math.abs(a), 1) + ' m/s²', 512, 230 + L / 2 + 4, { size: 12, weight: 700, color: C.v });
    }
  }

  add({
    id: 'thang-may-roi', group: 3,
    title: 'Thang máy rơi tự do – mất trọng lượng',
    params: [
      prm('a', 'Gia tốc thang máy hướng xuống $a$', 0, 9.8, 0.1, 9.8, 'm/s²', 1),
      prm('m', 'Khối lượng người $m$', 20, 150, 1, 60, 'kg', 0, { hardMin: 1, hardMax: 500 }),
      pMass('m2', 'Vật treo lò xo $m_2$', 1, 5),
      prm('k', 'Độ cứng lò xo $k$', 10, 500, 5, 100, 'N/m', 0, { hardMin: 1, hardMax: 10000 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['N', 'Số chỉ cân $m(g-a)$'], ['Fdh', 'Lực đàn hồi $m_2(g-a)$'], ['x', 'Độ giãn lò xo (khi đứng yên: $m_2g/k$)', 1]],
    note: 'Thang máy có gia tốc $a$ hướng xuống: $N = m(g - a)$. Khi dây cáp đứt, $a = g$: cân chỉ $0$, lò xo không giãn, mọi vật "lơ lửng" – trạng thái mất trọng lượng. Trọng lực $P = mg$ vẫn tác dụng nguyên vẹn; chỉ có các lực đỡ (phản lực, lực đàn hồi) biến mất.',
    compute: function (p) {
      var ge = G - p.a;
      return { P: p.m * G, P2: p.m2 * G, N: p.m * ge, Fdh: p.m2 * ge, x: p.m2 * ge / p.k, x0: p.m2 * G / p.k, free: Math.abs(ge) < 1e-6 };
    },
    out: function (p, r) {
      return {
        state: r.free ? 'Mất trọng lượng hoàn toàn' : 'Giảm trọng lượng biểu kiến',
        N: fN(r.N), Fdh: fN(r.Fdh), x: fmt(r.x * 100, 1) + ' cm (' + fmt(r.x0 * 100, 1) + ' cm)',
      };
    },
    draw: function (p, r) {
      status(r.free ? 'a = g: cân chỉ 0, lò xo không giãn' : 'a < g: các lực đỡ giảm theo tỉ lệ (g − a)/g', r.free ? DANGER : MUTED);
      drawElevator(-p.a, r.free);
      var cx = 285;
      var feet = 330;
      scale(cx, feet, fmt(r.N / G, 1) + ' kg');
      person(cx, feet);
      var k = scaleFor(r.P, 300, 90);
      arrow(cx - 6, feet - 72, 0, r.P * k, 'P', 'P', { lx: -16 });
      arrow(cx + 6, feet, 0, -r.N * k, 'N', 'N', { lx: 16 });
      // lò xo treo vật
      var sx = 400;
      var top = 112;
      var len = 50 + clamp(r.x * 300, 0, 110);
      spring(sx, top, sx, top + len, 7, 7);
      box(sx, top + len + 16, 32, 32, 0, 'm₂', BODY2);
      var k2 = scaleFor(r.P2, 5, 60);
      arrow(sx, top + len + 16, 0, r.P2 * k2, 'P', 'P₂', { lx: 18 });
      arrow(sx, top + len, 0, -r.Fdh * k2, 'dh', 'Fđh', { lx: 22 });
    },
  });

  add({
    id: 'con-lac-trong-xe', group: 3,
    title: 'Con lắc treo trong xe đang tăng tốc',
    params: [
      prm('a', 'Gia tốc của xe $a$ (sang phải +)', -10, 10, 0.1, 3, 'm/s²', 1, { hardMin: -50, hardMax: 50 }),
      pMass('m', 'Khối lượng quả nặng $m$', 0.5, 5),
    ],
    readouts: [['th', 'Góc lệch dây $\\theta = \\arctan(a/g)$'], ['T', 'Lực căng $T = m\\sqrt{g^2 + a^2}$'], ['Fqt', 'Lực quán tính $ma$'], ['dir', 'Hướng lệch', 1]],
    note: 'Trong hệ quy chiếu gắn với xe, quả nặng đứng yên dưới tác dụng của $\\vec P$, $\\vec T$ và lực quán tính $\\vec F_{qt} = -m\\vec a$: $\\tan\\theta = \\dfrac{ma}{mg} = \\dfrac{a}{g}$. Dây lệch về phía ngược chiều gia tốc. Đây chính là một "gia tốc kế" đơn giản.',
    compute: function (p) {
      var th = Math.atan(p.a / G);
      return { th: th, P: p.m * G, T: p.m * Math.hypot(G, p.a), Fqt: p.m * p.a };
    },
    out: function (p, r) {
      return { th: fDeg(Math.abs(r.th)), T: fN(r.T), Fqt: fN(Math.abs(r.Fqt)), dir: p.a > 0 ? 'Lệch về phía sau (trái)' : p.a < 0 ? 'Lệch về phía trước (phải)' : 'Thẳng đứng' };
    },
    draw: function (p, r) {
      status(p.a === 0 ? 'a = 0: dây thẳng đứng' : 'Xe tăng tốc sang ' + (p.a > 0 ? 'phải' : 'trái') + ' → dây lệch ' + fDeg(Math.abs(r.th)) + ' về phía ngược lại', MUTED);
      var gy = 360;
      ground(30, 700, gy);
      // thân xe
      ctx.fillStyle = '#eef2ff';
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(130, 330);
      ctx.lineTo(130, 120);
      ctx.lineTo(520, 120);
      ctx.lineTo(600, 210);
      ctx.lineTo(600, 330);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      circle(200, 335, 24, '#1f2937');
      circle(530, 335, 24, '#1f2937');
      circle(200, 335, 9, '#9ca3af');
      circle(530, 335, 9, '#9ca3af');
      var px = 340;
      var py = 120;
      var L = 150;
      var bx = px - L * Math.sin(r.th);
      var by = py + L * Math.cos(r.th);
      line(px, py, px, py + L + 20, '#94a3b8', 1, [4, 4]);
      line(px, py, bx, by, '#6b7280', 2);
      if (Math.abs(r.th) > 0.01) arc(px, py, 30, Math.PI / 2, Math.PI / 2 + r.th, 'θ', null, r.th < 0);
      circle(bx, by, 14, '#fbbf24', '#92400e', 2);
      var k = scaleFor(Math.max(r.P, r.T), 2, 80);
      arrow(bx, by, 0, r.P * k, 'P', 'P', { lx: 14 });
      arrow(bx, by, (px - bx) / L * r.T * k, (py - by) / L * r.T * k, 'T', 'T', { lx: p.a >= 0 ? -16 : 16 });
      arrow(bx, by, -r.Fqt * k, 0, 'qt', 'Fqt', { dash: true, width: 2, size: 12, ly: -12 });
      if (p.a !== 0) arrow(380, 92, (p.a > 0 ? 1 : -1) * clamp(Math.abs(p.a) * 9, 18, 100), 0, 'v', 'a', { width: 2.5, head: 9 });
    },
  });

  // Tính mặt nước trong bể dài L, cao Hh, mực ban đầu h0, độ dốc s = a/g (cao về phía sau – bên trái).
  function waterSurface(L, Hh, h0, s) {
    function zAt(zm, x) { return zm + s * (L / 2 - x); }
    function vol(zm) {
      var n = 200;
      var v = 0;
      for (var i = 0; i < n; i++) {
        var x = (i + 0.5) * L / n;
        v += Math.max(0, zAt(zm, x)) * L / n;
      }
      return v;
    }
    var target = h0 * L;
    var lo = -Math.abs(s) * L - Hh;
    var hi = Hh + Math.abs(s) * L + h0;
    for (var it = 0; it < 60; it++) {
      var mid = (lo + hi) / 2;
      if (vol(mid) < target) lo = mid; else hi = mid;
    }
    var zm = (lo + hi) / 2;
    var spill = false;
    var zl = zAt(zm, 0);
    var zr = zAt(zm, L);
    if (Math.max(zl, zr) > Hh) {
      spill = true;
      zm -= Math.max(zl, zr) - Hh;
    }
    return { z: function (x) { return clamp(zAt(zm, x), 0, Hh); }, spill: spill, dry: Math.min(zAt(zm, 0), zAt(zm, L)) < 0, zl: clamp(zAt(zm, 0), 0, Hh), zr: clamp(zAt(zm, L), 0, Hh), vol: vol(zm) };
  }

  add({
    id: 'mat-nuoc-nghieng', group: 3,
    title: 'Mặt nước trong bể đang tăng tốc',
    params: [
      prm('a', 'Gia tốc của xe $a$ (sang phải +)', -10, 10, 0.1, 3, 'm/s²', 1, { hardMin: -50, hardMax: 50 }),
      prm('L', 'Chiều dài bể $L$', 0.3, 3, 0.05, 1.5, 'm', 2),
      prm('h0', 'Mực nước ban đầu $h_0$ (bể cao 1 m)', 0.05, 0.95, 0.01, 0.5, 'm', 2),
    ],
    readouts: [['phi', 'Góc nghiêng mặt nước $\\tan\\varphi = a/g$'], ['dh', 'Chênh lệch mực nước hai đầu'], ['ends', 'Mực nước đầu sau / trước', 1], ['state', 'Trạng thái', 1]],
    note: 'Trong hệ quy chiếu gắn với bể, mỗi phần tử nước chịu trọng lực $m\\vec g$ và lực quán tính $-m\\vec a$; "trọng lực hiệu dụng" $\\vec g\' = \\vec g - \\vec a$. Mặt thoáng luôn vuông góc với $\\vec g\'$ nên nghiêng góc $\\varphi$ với $\\tan\\varphi = \\dfrac{a}{g}$, nước dồn về phía sau. Chênh lệch mực: $\\Delta h = L\\tan\\varphi$ (khi chưa tràn, chưa lộ đáy).',
    compute: function (p) {
      var s = p.a / G;
      var ws = waterSurface(p.L, 1, p.h0, s);
      return { s: s, phi: Math.atan(Math.abs(s)), ws: ws };
    },
    out: function (p, r) {
      var w = r.ws;
      var back = p.a >= 0 ? w.zl : w.zr;
      var front = p.a >= 0 ? w.zr : w.zl;
      return {
        phi: fDeg(r.phi), dh: fmt(Math.abs(w.zl - w.zr) * 100, 1) + ' cm',
        ends: fmt(back * 100, 1) + ' cm / ' + fmt(front * 100, 1) + ' cm',
        state: w.spill ? 'Nước tràn ra phía sau' : w.dry ? 'Lộ đáy bể phía trước' : 'Bình thường',
      };
    },
    draw: function (p, r) {
      var w = r.ws;
      status(w.spill ? 'Mặt nước chạm miệng bể: nước tràn ra' : 'Mặt nước vuông góc với g\' = g − a', w.spill ? DANGER : MUTED);
      var gy = 365;
      ground(30, 700, gy);
      var sc = Math.min(440 / p.L, 210);
      var Wp = p.L * sc;
      var Hp = 1 * sc;
      var x0 = 340 - Wp / 2;
      var yb = 320;
      // xe chở bể
      ctx.fillStyle = '#c7d2fe';
      ctx.fillRect(x0 - 20, yb, Wp + 40, 18);
      circle(x0 + 20, yb + 25, 18, '#1f2937');
      circle(x0 + Wp - 20, yb + 25, 18, '#1f2937');
      // nước
      var pts = [[x0, yb]];
      for (var i = 0; i <= 60; i++) {
        var x = p.L * i / 60;
        pts.push([x0 + x * sc, yb - w.z(x) * sc]);
      }
      pts.push([x0 + Wp, yb]);
      poly(pts, WATER, null);
      ctx.save();
      ctx.strokeStyle = WATER_EDGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var j = 1; j < pts.length - 1; j++) {
        if (j === 1) ctx.moveTo(pts[j][0], pts[j][1]); else ctx.lineTo(pts[j][0], pts[j][1]);
      }
      ctx.stroke();
      ctx.restore();
      // thành bể
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, yb - Hp);
      ctx.lineTo(x0, yb);
      ctx.lineTo(x0 + Wp, yb);
      ctx.lineTo(x0 + Wp, yb - Hp);
      ctx.stroke();
      // mực ban đầu
      line(x0, yb - p.h0 * sc, x0 + Wp, yb - p.h0 * sc, '#94a3b8', 1, [5, 4]);
      txt('h₀', x0 + Wp + 6, yb - p.h0 * sc + 4, { size: 11, color: MUTED });
      accelArrow(x0 + Wp + 24, yb - Hp / 2 - 30, p.a);
      // phần tử nước trên mặt thoáng (ở giữa)
      var xm = p.L / 2;
      var zs = w.z(xm);
      if (zs > 0.02 && zs < 0.999) {
        var ex = x0 + xm * sc;
        var ey = yb - zs * sc + 12;
        circle(ex, ey, 5, WATER_EDGE);
        var m = 1;
        var k = 70 / G;
        arrow(ex, ey, 0, m * G * k, 'P', 'P', { lx: 12 });
        arrow(ex, ey, -m * p.a * k, 0, 'qt', 'Fqt', { dash: true, width: 2, size: 12, ly: 12 });
        arrow(ex, ey, m * p.a * k, -m * G * k, 'A', 'Fp', { size: 12 });
        txt('Fp: hợp lực áp suất của nước xung quanh', 16, 70, { size: 12, color: MUTED });
      }
      if (r.phi > 0.005) {
        var xa = x0 + Wp * 0.74;
        var za = w.z((xa - x0) / sc);
        if (za > 0.01 && za < 0.99) {
          var ya = yb - za * sc;
          line(xa, ya, xa + 70, ya, '#94a3b8', 1, [3, 3]);
          if (p.a > 0) arc(xa, ya, 46, 0, r.phi, 'φ');
          else arc(xa, ya, 46, -r.phi, 0, 'φ');
        }
      }
    },
  });

  add({
    id: 'bot-khi', group: 3, anim: true,
    title: 'Bọt khí trong chất lỏng đang tăng tốc',
    params: [
      prm('a', 'Gia tốc của bình $a$ (sang phải +)', -10, 10, 0.1, 5, 'm/s²', 1, { hardMin: -50, hardMax: 50 }),
      prm('V', 'Thể tích bọt khí $V$', 0.1, 10, 0.1, 2, 'cm³', 1, { hardMin: 0.01, hardMax: 1000 }),
      prm('rho', 'Khối lượng riêng chất lỏng $\\rho$', 600, 1500, 10, 1000, 'kg/m³', 0, { hardMin: 100, hardMax: 13600 }),
    ],
    readouts: [['beta', 'Góc lệch của $\\vec F_A$ so với phương đứng'], ['FA', 'Lực đẩy $F_A = \\rho V\\sqrt{g^2+a^2}$'], ['comp', 'Thành phần ngang / đứng', 1], ['dir', 'Bọt khí chạy về', 1]],
    note: 'Bình kín đầy chất lỏng tăng tốc với $\\vec a$: áp suất tăng dần về phía sau và xuống dưới, $\\nabla p = \\rho(\\vec g - \\vec a)$. Lực đẩy Ác-si-mét $\\vec F_A = -V\\nabla p$ hướng lên và về phía trước, $\\tan\\beta = a/g$. Bọt khí (khối lượng rất nhỏ) vì thế chạy về phía trước – ngược với con lắc hay hành khách bị "ngả" ra sau.',
    compute: function (p) {
      var V = p.V * 1e-6;
      var FA = p.rho * V * Math.hypot(G, p.a);
      return { beta: Math.atan(p.a / G), FA: FA, Fx: p.rho * V * p.a, Fy: p.rho * V * G };
    },
    out: function (p, r) {
      return {
        beta: fDeg(Math.abs(r.beta)), FA: fmt(r.FA * 1000, 2) + ' mN',
        comp: fmt(Math.abs(r.Fx) * 1000, 2) + ' / ' + fmt(r.Fy * 1000, 2) + ' mN',
        dir: p.a > 0 ? 'Phía trước (phải) và lên trên' : p.a < 0 ? 'Phía trước (trái) và lên trên' : 'Thẳng lên trên',
      };
    },
    init: function () { return { x: 0, y: 0, t: 0 }; },
    step: function (st, p, r, dt) {
      // Bọt khí trôi theo hướng F_A (tốc độ không đổi do lực cản nhớt); chạm thành thì trượt theo thành.
      var sp = 90;
      var ux = Math.sin(r.beta);
      var uy = Math.cos(r.beta);
      var maxX = 200;
      var maxY = 170;
      st.t += dt;
      st.x = clamp(st.x + ux * sp * dt, -maxX, maxX);
      st.y = Math.min(st.y + uy * sp * dt, maxY);
      return !(st.y >= maxY && (Math.abs(st.x) >= maxX || Math.abs(ux) < 1e-6));
    },
    draw: function (p, r, st) {
      status('FA ngược chiều g\' = g − a: lệch về phía trước ' + fDeg(Math.abs(r.beta)), MUTED);
      var gy = 365;
      ground(30, 700, gy);
      var x0 = 120;
      var x1 = 560;
      var yt = 110;
      var yb = 320;
      ctx.fillStyle = '#c7d2fe';
      ctx.fillRect(x0 - 20, yb, x1 - x0 + 40, 18);
      circle(x0 + 30, yb + 25, 18, '#1f2937');
      circle(x1 - 30, yb + 25, 18, '#1f2937');
      ctx.fillStyle = WATER;
      ctx.fillRect(x0, yt, x1 - x0, yb - yt);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3;
      ctx.strokeRect(x0, yt, x1 - x0, yb - yt);
      txt('Bình kín chứa đầy chất lỏng', x0 + 8, yt + 18, { size: 12, color: '#0369a1' });
      accelArrow(x1 + 30, 200, p.a);
      var bx0 = (x0 + x1) / 2;
      var by0 = yb - 20;
      var bx = bx0 + st.x;
      var by = by0 - st.y;
      line(bx0, by0, bx0 + Math.sin(r.beta) * 170, by0 - Math.cos(r.beta) * 170, '#94a3b8', 1, [4, 4]);
      var br = 6 + 3 * Math.cbrt(p.V);
      circle(bx, by, br, 'rgba(255,255,255,0.9)', '#0369a1', 2);
      // Thang đo cố định theo ρ, V: độ dài mũi tên chỉ đổi theo gia tốc a.
      var k = 110 / (p.rho * p.V * 1e-6 * Math.hypot(G, 10));
      arrow(bx, by, r.Fx * k, -r.Fy * k, 'A', 'FA');
      arrow(bx, by, r.Fx * k, 0, 'A', 'FA ngang', { dash: true, width: 2, size: 11, ly: 12 });
      if (Math.abs(r.beta) > 0.01) arc(bx, by, 36, -Math.PI / 2, -Math.PI / 2 + r.beta, 'β', null, r.beta < 0);
      line(bx, by, bx, by - 50, '#94a3b8', 1, [3, 3]);
    },
  });

  // ============ NHÓM 5. Cân bằng & momen ============
  add({
    id: 'momen-luc-xien', group: 4,
    title: 'Momen của lực xiên M = rF·sinθ',
    params: [
      prm('F', 'Độ lớn lực $F$', 0, 200, 1, 80, 'N', 0, { hardMax: 10000 }),
      prm('r', 'Khoảng cách từ trục tới điểm đặt $r$', 0.05, 1, 0.01, 0.3, 'm', 2, { hardMin: 0.01, hardMax: 10 }),
      prm('th', 'Góc giữa lực và cờ lê $\\theta$', 0, 180, 1, 60, '°', 0),
    ],
    readouts: [['M', 'Momen lực $M = rF\\sin\\theta$'], ['d', 'Cánh tay đòn $d = r\\sin\\theta$'], ['Fp', 'Thành phần vuông góc $F\\sin\\theta$'], ['Fs', 'Thành phần dọc cờ lê $F\\cos\\theta$']],
    note: 'Momen lực đặc trưng cho tác dụng làm quay: $M = F\\,d$ với $d$ là khoảng cách từ trục quay tới giá của lực. Với lực xiên góc $\\theta$: $d = r\\sin\\theta$ nên $M = rF\\sin\\theta$. Chỉ thành phần vuông góc $F\\sin\\theta$ làm quay; thành phần dọc cờ lê $F\\cos\\theta$ bị trục giữ lại. Lực lớn nhất khi $\\theta = 90°$.',
    compute: function (p) {
      var th = p.th * DEG;
      return { th: th, M: p.r * p.F * Math.sin(th), d: p.r * Math.sin(th), Fp: p.F * Math.sin(th), Fs: p.F * Math.cos(th) };
    },
    out: function (p, r) {
      return { M: fmt(r.M, 2) + ' N·m', d: fmt(r.d, 3) + ' m', Fp: fN(r.Fp), Fs: fN(r.Fs) };
    },
    draw: function (p, r) {
      status('M = ' + fmt(r.M, 2) + ' N·m' + (r.M > 1e-9 ? ' – làm quay ngược chiều kim đồng hồ' : ' – lực đi qua trục, không làm quay'), r.M > 1e-9 ? OK : DANGER);
      var ox = 150;
      var oy = 270;
      var Rpx = 60 + 360 * Math.min(p.r, 1);
      // cờ lê
      ctx.save();
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = BODY_EDGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(ox, oy - 9, Rpx + 14, 18);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var an = i * Math.PI / 3 + Math.PI / 6;
        var hx = ox + 26 * Math.cos(an);
        var hy = oy + 26 * Math.sin(an);
        if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      dot(ox, oy, 5, INK);
      txt('O (trục)', ox - 32, oy + 4, { size: 12, color: MUTED, align: 'right' });
      var ex = ox + Rpx;
      var ey = oy;
      dim(ox, oy + 44, ex, oy + 44, 'r = ' + fmt(p.r, 2) + ' m');
      var ux = Math.cos(r.th);
      var uy = -Math.sin(r.th);
      // giá của lực và cánh tay đòn
      line(ex - ux * 230, ey - uy * 230, ex + ux * 200, ey + uy * 200, '#86efac', 1.2, [6, 5]);
      var t = (ox - ex) * ux + (oy - ey) * uy;
      var fx = ex + ux * t;
      var fy = ey + uy * t;
      if (r.d > 1e-4) {
        line(ox, oy, fx, fy, '#4338ca', 2, [4, 3]);
        txt('d', (ox + fx) / 2 - 14, (oy + fy) / 2 - 4, { size: 14, weight: 700, color: '#4338ca', halo: true });
      }
      var k = scaleFor(p.F, 100, 150);
      if (r.th > 0.02 && r.th < Math.PI - 0.02) {
        arrow(ex, ey, 0, -r.Fp * k, 'F', 'F·sinθ', { dash: true, width: 2, size: 12, head: 8, lx: 34 });
        if (Math.abs(r.Fs) > 0.5) arrow(ex, ey, r.Fs * k, 0, 'F', 'F·cosθ', { dash: true, width: 2, size: 12, head: 8, ly: 14 });
      }
      arrow(ex, ey, ux * p.F * k, uy * p.F * k, 'F', 'F');
      if (r.th > 0.02) arc(ex, ey, 34, 0, -r.th, 'θ', null, true);
      if (r.M > 1e-6) {
        ctx.save();
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox, oy, 52, -0.2, -1.4, true);
        ctx.stroke();
        ctx.restore();
        var ax = ox + 52 * Math.cos(-1.4);
        var ay = oy + 52 * Math.sin(-1.4);
        poly([[ax - 7, ay - 2], [ax + 4, ay - 8], [ax + 3, ay + 5]], '#4338ca');
      }
    },
  });

  add({
    id: 'don-bay', group: 4,
    title: 'Đòn bẩy hai cánh tay khác nhau',
    params: [
      pMass('m1', 'Khối lượng bên trái $m_1$', 10, 50),
      prm('l1', 'Cánh tay đòn trái $\\ell_1$', 0.1, 3, 0.05, 1, 'm', 2, { hardMax: 20 }),
      pMass('m2', 'Khối lượng bên phải $m_2$', 5, 50),
      prm('l2', 'Cánh tay đòn phải $\\ell_2$', 0.1, 3, 0.05, 2, 'm', 2, { hardMax: 20 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['M1', 'Momen trái $P_1\\ell_1$'], ['M2', 'Momen phải $P_2\\ell_2$'], ['need', 'Khối lượng phải để cân bằng'], ['N', 'Lực điểm tựa (khi cân bằng)']],
    note: 'Quy tắc momen (đòn nhẹ): đòn bẩy cân bằng khi $P_1\\ell_1 = P_2\\ell_2$. Bên nào có momen lớn hơn thì đòn quay về bên đó. Khi cân bằng, điểm tựa đỡ $N = P_1 + P_2$. Cánh tay đòn dài giúp "lợi về lực".',
    compute: function (p) {
      var P1 = p.m1 * G;
      var P2 = p.m2 * G;
      var M1 = P1 * p.l1;
      var M2 = P2 * p.l2;
      var bal = Math.abs(M1 - M2) <= 0.005 * Math.max(M1, M2, EPS);
      return { P1: P1, P2: P2, M1: M1, M2: M2, bal: bal, tilt: bal ? 0 : M1 > M2 ? -1 : 1 };
    },
    out: function (p, r) {
      return { state: r.bal ? 'Cân bằng' : r.tilt < 0 ? 'Quay về bên trái' : 'Quay về bên phải', M1: fmt(r.M1, 1) + ' N·m', M2: fmt(r.M2, 1) + ' N·m', need: fmt(p.m1 * p.l1 / p.l2, 2) + ' kg', N: fN(r.P1 + r.P2) };
    },
    draw: function (p, r) {
      status(r.bal ? 'P₁ℓ₁ = P₂ℓ₂: đòn bẩy cân bằng' : 'Momen ' + (r.tilt < 0 ? 'trái' : 'phải') + ' lớn hơn: đòn quay', r.bal ? OK : '#b45309');
      var fx = 360;
      var fy = 230;
      ground(60, 660, 280);
      poly([[fx, fy], [fx - 34, 280], [fx + 34, 280]], '#cbd5e1', BODY_EDGE);
      var sc = 280 / Math.max(p.l1, p.l2);
      var ang = r.tilt * 8 * DEG;
      var ca = Math.cos(ang);
      var sa = Math.sin(ang);
      function pt(d) { return { x: fx + d * ca, y: fy + d * sa }; }
      var A = pt(-p.l1 * sc);
      var B = pt(p.l2 * sc);
      ctx.save();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
      ctx.restore();
      var s1 = 30 + 6 * Math.sqrt(p.m1);
      var s2 = 30 + 6 * Math.sqrt(p.m2);
      var c1 = { x: A.x + sa * (s1 / 2 + 4), y: A.y - ca * (s1 / 2 + 4) };
      var c2 = { x: B.x + sa * (s2 / 2 + 4), y: B.y - ca * (s2 / 2 + 4) };
      box(c1.x, c1.y, s1, s1, ang, 'm₁');
      box(c2.x, c2.y, s2, s2, ang, 'm₂', BODY2);
      var k = scaleFor(Math.max(r.P1, r.P2, r.P1 + r.P2), 50, 120);
      arrow(c1.x, c1.y, 0, r.P1 * k, 'P', 'P₁', { lx: -18 });
      arrow(c2.x, c2.y, 0, r.P2 * k, 'P', 'P₂', { lx: 18 });
      if (r.bal) arrow(fx, fy, 0, -(r.P1 + r.P2) * k, 'N', 'N', { lx: 14 });
      dim(fx - p.l1 * sc * ca, fy + 90, fx, fy + 90, 'ℓ₁ = ' + fmt(p.l1, 2) + ' m');
      dim(fx, fy + 90, fx + p.l2 * sc * ca, fy + 90, 'ℓ₂ = ' + fmt(p.l2, 2) + ' m');
    },
  });

  add({
    id: 'dam-tua-hai-dau', group: 4,
    title: 'Dầm tựa hai đầu chịu tải',
    params: [
      prm('L', 'Chiều dài dầm $L$', 1, 10, 0.1, 4, 'm', 1, { hardMax: 100 }),
      prm('M', 'Khối lượng dầm $M$', 0, 100, 1, 20, 'kg', 0, { hardMax: 10000 }),
      prm('m', 'Khối lượng vật đặt trên dầm $m$', 0, 200, 1, 60, 'kg', 0, { hardMax: 10000 }),
      prm('x', 'Vị trí vật, tính từ A: $x/L$', 0, 100, 1, 30, '%', 0),
    ],
    readouts: [['RA', 'Phản lực gối A'], ['RB', 'Phản lực gối B'], ['sum', 'Tổng $R_A + R_B = (M+m)g$'], ['x', 'Khoảng cách $x$']],
    note: 'Cân bằng lực: $R_A + R_B = (M + m)g$. Cân bằng momen quanh A: $R_B L = Mg\\dfrac{L}{2} + mgx$. Suy ra $R_B = \\dfrac{Mg}{2} + mg\\dfrac{x}{L}$, $R_A = \\dfrac{Mg}{2} + mg\\left(1 - \\dfrac{x}{L}\\right)$: gối nào gần vật hơn thì chịu lực lớn hơn.',
    compute: function (p) {
      var f = p.x / 100;
      var Pd = p.M * G;
      var Pv = p.m * G;
      return { f: f, Pd: Pd, Pv: Pv, RA: Pd / 2 + Pv * (1 - f), RB: Pd / 2 + Pv * f };
    },
    out: function (p, r) {
      return { RA: fN(r.RA), RB: fN(r.RB), sum: fN(r.RA + r.RB), x: fmt(r.f * p.L, 2) + ' m' };
    },
    draw: function (p, r) {
      status('Gối gần vật hơn chịu lực lớn hơn', MUTED);
      var ax = 120;
      var bx = 600;
      var by = 210;
      ground(60, 660, 260);
      poly([[ax, by + 10], [ax - 26, 260], [ax + 26, 260]], '#cbd5e1', BODY_EDGE);
      poly([[bx, by + 10], [bx - 26, 260], [bx + 26, 260]], '#cbd5e1', BODY_EDGE);
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(ax - 12, by - 10, bx - ax + 24, 20);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(ax - 12, by - 10, bx - ax + 24, 20);
      txt('A', ax - 36, 254, { size: 14, weight: 700 });
      txt('B', bx + 28, 254, { size: 14, weight: 700 });
      var lx = ax + r.f * (bx - ax);
      var s = 26 + 4 * Math.sqrt(p.m);
      if (p.m > 0) box(lx, by - 10 - s / 2, s, s, 0, fmt(p.m, 0) + ' kg', BODY2);
      var k = scaleFor(Math.max(r.RA, r.RB, r.Pv, r.Pd), 100, 105);
      arrow(ax, by + 10, 0, -r.RA * k, 'N', 'RA', { lx: -22 });
      arrow(bx, by + 10, 0, -r.RB * k, 'N', 'RB', { lx: 22 });
      arrow((ax + bx) / 2, by, 0, r.Pd * k, 'P', 'P dầm', { lx: 30 });
      if (p.m > 0) arrow(lx, by - 10 - s / 2, 0, r.Pv * k, 'P', 'P', { lx: -14, ly: 4 });
      dim(ax, 338, lx, 338, 'x');
      dim(ax, 362, bx, 362, 'L = ' + fmt(p.L, 1) + ' m');
    },
  });

  add({
    id: 'thang-tua-tuong', group: 4,
    title: 'Thang tựa tường nhẵn, sàn nhám',
    params: [
      prm('th', 'Góc giữa thang và sàn $\\theta$', 20, 85, 1, 60, '°', 0, { hardMin: 5, hardMax: 89 }),
      pMu(0.35, 'Hệ số ma sát nghỉ với sàn $\\mu$'),
      prm('M', 'Khối lượng người leo (thang 15 kg)', 0, 120, 1, 60, 'kg', 0, { hardMax: 300 }),
      prm('d', 'Vị trí người dọc thang (0 = chân, 100 = đỉnh)', 0, 100, 1, 50, '%', 0),
    ],
    readouts: [['state', 'Trạng thái', 1], ['Nw', 'Phản lực tường $N_2$'], ['Nf', 'Phản lực sàn $N_1$'], ['f', 'Ma sát nghỉ cần $F_{ms} = N_2$'], ['mumin', '$\\mu$ tối thiểu (thang không người: $\\frac{1}{2\\tan\\theta}$)', 1], ['dmax', 'Người leo được tới', 1]],
    note: 'Tường nhẵn nên chỉ có $N_2$ nằm ngang. Cân bằng lực: $N_1 = (m+M)g$, $F_{ms} = N_2$. Momen quanh chân thang: $N_2 L\\sin\\theta = mg\\dfrac{L}{2}\\cos\\theta + Mg\\,s\\cos\\theta$. Thang không người: $\\mu_{min} = \\dfrac{1}{2\\tan\\theta}$. Người leo càng cao, ma sát cần càng lớn – thang dễ trượt.',
    compute: function (p) {
      var th = p.th * DEG;
      var m = 15;
      var f = p.d / 100;
      var Nw = (m / 2 + p.M * f) * G / Math.tan(th);
      var Nf = (m + p.M) * G;
      var mumin = Nw / Nf;
      var ok = p.mu >= mumin - 1e-9;
      var dmax = p.M > 0 ? (p.mu * (m + p.M) * Math.tan(th) - m / 2) / p.M : null;
      return { th: th, m: m, f: f, Nw: Nw, Nf: Nf, Pl: m * G, Pn: p.M * G, mumin: mumin, mu0: 1 / (2 * Math.tan(th)), ok: ok, fr: ok ? Nw : p.mu * Nf, dmax: dmax };
    },
    out: function (p, r) {
      var dm;
      if (p.M <= 0) dm = '—';
      else if (r.dmax >= 1) dm = 'Tận đỉnh thang';
      else if (r.dmax < 0) dm = 'Thang trượt ngay cả khi chưa leo';
      else dm = fmt(r.dmax * 100, 0) + '% chiều dài';
      return {
        state: r.ok ? 'Thang đứng yên' : 'Thang trượt!',
        Nw: fN(r.Nw), Nf: fN(r.Nf), f: fN(r.Nw) + (r.ok ? '' : ' > μN₁'),
        mumin: fmt(r.mumin, 3) + ' (' + fmt(r.mu0, 3) + ')', dmax: dm,
      };
    },
    draw: function (p, r) {
      status(r.ok ? 'μ ≥ μmin = ' + fmt(r.mumin, 3) + ': thang đứng yên' : 'μ < μmin = ' + fmt(r.mumin, 3) + ': chân thang trượt ra!', r.ok ? OK : DANGER);
      var wx = 560;
      var gy = 345;
      hatch(wx, 60, wx, gy, 'right');
      ground(40, wx, gy);
      var Lpx = 270;
      var ca = Math.cos(r.th);
      var sa = Math.sin(r.th);
      var foot = { x: wx - Lpx * ca, y: gy };
      var top = { x: wx, y: gy - Lpx * sa };
      var nx = -sa * 7;
      var ny = -ca * 7;
      line(foot.x + nx, foot.y + ny, top.x + nx, top.y + ny, '#92400e', 4);
      line(foot.x - nx, foot.y - ny, top.x - nx, top.y - ny, '#92400e', 4);
      for (var i = 1; i < 9; i++) {
        var t = i / 9;
        var x = foot.x + (top.x - foot.x) * t;
        var y = foot.y + (top.y - foot.y) * t;
        line(x + nx, y + ny, x - nx, y - ny, '#92400e', 2);
      }
      arc(foot.x, foot.y, 26, -r.th, 0, 'θ');
      var k = scaleFor(Math.max(r.Nf, r.Nw), 200, 105);
      var mid = { x: (foot.x + top.x) / 2, y: (foot.y + top.y) / 2 };
      arrow(mid.x, mid.y, 0, r.Pl * k, 'P', 'P thang', { lx: 30, ly: -2 });
      if (p.M > 0) {
        var pp = { x: foot.x + (top.x - foot.x) * r.f, y: foot.y + (top.y - foot.y) * r.f };
        ctx.save();
        ctx.globalAlpha = 0.85;
        circle(pp.x - 20, pp.y - 52, 10, '#fde68a', BODY_EDGE, 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(pp.x - 30, pp.y - 42, 20, 36);
        ctx.restore();
        arrow(pp.x - 20, pp.y - 24, 0, r.Pn * k, 'P', 'Pn', { lx: -14 });
      }
      arrow(foot.x, foot.y, 0, -r.Nf * k, 'N', 'N₁', { lx: -18 });
      arrow(top.x, top.y, -r.Nw * k, 0, 'N', 'N₂', { ly: -14 });
      arrow(foot.x, foot.y - 3, r.fr * k, 0, 'ms', 'Fms', { ly: 16 });
      if (!r.ok) arrow(foot.x - 10, gy + 24, -60, 0, 'v', 'trượt', { width: 2, head: 8, size: 12 });
    },
  });

  add({
    id: 'hop-do-hay-truot', group: 4,
    title: 'Khối hộp bị đẩy ở đỉnh – đổ hay trượt?',
    params: [
      prm('F', 'Lực đẩy ngang ở mép trên $F$', 0, 300, 1, 40, 'N', 0, { hardMax: 10000 }),
      pMu(0.4),
      prm('b', 'Bề rộng đáy hộp $b$', 0.1, 2, 0.05, 0.5, 'm', 2, { hardMax: 10 }),
      prm('h', 'Chiều cao hộp $h$', 0.1, 3, 0.05, 1, 'm', 2, { hardMax: 10 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['Ftip', 'Lực làm lật $F_{lật} = \\dfrac{Wb}{2h}$'], ['Fsl', 'Lực làm trượt $F_{trượt} = \\mu W$'], ['first', 'Khi tăng dần F, hộp sẽ', 1], ['e', 'Điểm đặt $N$ lệch khỏi tâm đáy']],
    note: 'Hộp 20 kg ($W = mg$). Momen quanh mép trước của đáy: hộp lật khi $Fh > W\\dfrac{b}{2} \\Rightarrow F_{lật} = \\dfrac{Wb}{2h}$. Hộp trượt khi $F > \\mu W$. Tăng dần $F$, điều nào đạt trước sẽ xảy ra: lật nếu $\\mu > \\dfrac{b}{2h}$, trượt nếu ngược lại. Khi đứng yên, điểm đặt $\\vec N$ dịch về phía trước một đoạn $e = Fh/W$.',
    compute: function (p) {
      var m = 20;
      var Wt = m * G;
      var Ftip = Wt * p.b / (2 * p.h);
      var Fsl = p.mu * Wt;
      var r = { m: m, W: Wt, Ftip: Ftip, Fsl: Fsl, F: p.F };
      if (p.F <= Math.min(Ftip, Fsl) + 1e-9) {
        r.kind = 'rest'; r.e = p.F * p.h / Wt; r.fr = p.F;
      } else if (Ftip < Fsl) {
        r.kind = 'tip'; r.e = p.b / 2; r.fr = p.F;
      } else {
        r.fr = Fsl;
        r.e = (p.F + Fsl) * p.h / (2 * Wt);
        r.kind = r.e > p.b / 2 ? 'both' : 'slide';
        r.e = Math.min(r.e, p.b / 2);
        r.acc = (p.F - Fsl) / m;
      }
      return r;
    },
    out: function (p, r) {
      var names = { rest: 'Đứng yên', tip: 'Bị lật (đổ)', slide: 'Trượt, không lật', both: 'Vừa trượt vừa lật' };
      return {
        state: names[r.kind] + (r.kind === 'slide' ? ', a = ' + fAcc(r.acc) : ''),
        Ftip: fN(r.Ftip), Fsl: fN(r.Fsl),
        first: Math.abs(r.Ftip - r.Fsl) < 1e-6 ? 'Vừa trượt vừa lật' : r.Ftip < r.Fsl ? 'Lật trước' : 'Trượt trước',
        e: fmt(r.e * 100, 1) + ' cm',
      };
    },
    draw: function (p, r) {
      var names = { rest: 'Đứng yên: F nhỏ hơn cả F lật và F trượt', tip: 'F > F lật: hộp bị lật quanh mép trước', slide: 'F > F trượt: hộp trượt trên sàn', both: 'F rất lớn: hộp vừa trượt vừa lật' };
      status(names[r.kind], r.kind === 'rest' ? OK : DANGER);
      var gy = 300;
      ground(40, 690, gy);
      var sc = Math.min(210 / p.h, 300 / p.b);
      var w = p.b * sc;
      var h = p.h * sc;
      var cx = 330;
      var tilt = r.kind === 'tip' || r.kind === 'both' ? 10 * DEG : 0;
      var px = cx + w / 2;
      ctx.save();
      ctx.translate(px, gy);
      ctx.rotate(tilt);
      box(-w / 2, -h / 2, w, h, 0, '20 kg');
      ctx.restore();
      function tr(x, y) {
        var dx = x - px;
        var dy = y - gy;
        return { x: px + dx * Math.cos(tilt) - dy * Math.sin(tilt), y: gy + dx * Math.sin(tilt) + dy * Math.cos(tilt) };
      }
      var cg = tr(cx, gy - h / 2);
      var tl = tr(cx - w / 2, gy - h);
      var k = scaleFor(Math.max(r.W, p.F), 100, 90);
      arrow(cg.x, cg.y, 0, r.W * k, 'P', 'W');
      var nP = tr(cx + r.e * sc, gy);
      arrow(nP.x, nP.y, 0, -r.W * k, 'N', 'N', { lx: 14 });
      arrow(tl.x - p.F * k, tl.y, p.F * k, 0, 'F', null);
      if (p.F * k > 1.5) tag('F', tl.x - p.F * k - 12, tl.y, C.F);
      var fb = tr(cx, gy - 3);
      if (r.fr > EPS) arrow(fb.x, fb.y, -r.fr * k, 0, 'ms', 'Fms', { ly: -14 });
      if (tilt === 0) {
        dim(cx - w / 2, gy + 22, cx + w / 2, gy + 22, 'b');
        dim(cx + w / 2 + 22, gy, cx + w / 2 + 22, gy - h, 'h');
      }
      dot(px, gy, 4, DANGER);
      txt('mép trước', px + 8, gy - 6, { size: 11, color: MUTED });
    },
  });

  // ============ NHÓM 6. Lò xo, Ác-si-mét & lực cản ============
  add({
    id: 'lo-xo-noi-tiep', group: 5,
    title: 'Hai lò xo ghép nối tiếp',
    params: [
      prm('k1', 'Độ cứng lò xo 1 $k_1$', 10, 1000, 10, 100, 'N/m', 0, { hardMin: 1, hardMax: 100000 }),
      prm('k2', 'Độ cứng lò xo 2 $k_2$', 10, 1000, 10, 200, 'N/m', 0, { hardMin: 1, hardMax: 100000 }),
      pMass('m', 'Khối lượng vật $m$', 1, 10),
    ],
    readouts: [['k', 'Độ cứng tương đương $k = \\frac{k_1k_2}{k_1+k_2}$'], ['F', 'Lực đàn hồi mỗi lò xo'], ['x12', 'Độ giãn $x_1$; $x_2$', 1], ['x', 'Tổng độ giãn $x = mg/k$']],
    note: 'Nối tiếp: hai lò xo chịu cùng một lực $F = mg$, độ giãn cộng lại $x = x_1 + x_2 = \\dfrac{F}{k_1} + \\dfrac{F}{k_2}$. Do đó $\\dfrac{1}{k} = \\dfrac{1}{k_1} + \\dfrac{1}{k_2}$ – hệ "mềm" hơn từng lò xo.',
    compute: function (p) {
      var F = p.m * G;
      var k = p.k1 * p.k2 / (p.k1 + p.k2);
      return { F: F, k: k, x1: F / p.k1, x2: F / p.k2, x: F / k };
    },
    out: function (p, r) {
      return { k: fmt(r.k, 1) + ' N/m', F: fN(r.F), x12: fmt(r.x1 * 100, 1) + ' cm; ' + fmt(r.x2 * 100, 1) + ' cm', x: fmt(r.x * 100, 1) + ' cm' };
    },
    draw: function (p, r) {
      status('Cùng lực F = mg, độ giãn cộng lại', MUTED);
      var top = 72;
      ceiling(180, 420, top);
      var nat = 50;
      var pxm = 130 / Math.max(r.x, 0.26);
      var l1 = nat + r.x1 * pxm;
      var l2 = nat + r.x2 * pxm;
      var x = 300;
      // chiều dài tự nhiên để so sánh
      line(200, top, 200, top + 2 * nat, '#94a3b8', 1, [4, 4]);
      txt('dài tự nhiên', 130, top + 2 * nat + 16, { size: 11, color: MUTED });
      dim(230, top + 2 * nat, 230, top + l1 + l2, 'x');
      spring(x, top, x, top + l1, 8, 9, '#0f766e');
      dot(x, top + l1, 5);
      spring(x, top + l1, x, top + l1 + l2, 8, 9, '#14b8a6');
      txt('k₁', x + 16, top + l1 / 2, { size: 13, weight: 700, color: '#0f766e' });
      txt('k₂', x + 16, top + l1 + l2 / 2, { size: 13, weight: 700, color: '#14b8a6' });
      var s = 50;
      var by = top + l1 + l2 + s / 2;
      box(x, by, s, s, 0, fmt(p.m, 1) + ' kg');
      var k = scaleFor(r.F, 10, 70);
      arrow(x, by, 0, r.F * k, 'P', 'P', { lx: -14 });
      arrow(x + 17, by - s / 2, 0, -r.F * k, 'dh', 'Fđh', { lx: 22 });
      // lò xo tương đương
      var x2 = 540;
      ceiling(490, 590, top);
      var le = nat * 2 + r.x * pxm;
      spring(x2, top, x2, top + le, 12, 9, '#0d9488');
      box(x2, top + le + s / 2, s, s, 0, fmt(p.m, 1) + ' kg');
      txt('k = ' + fmt(r.k, 1), x2 + 16, top + le / 2, { size: 13, weight: 700, color: '#0d9488' });
      txt('(lò xo tương đương)', x2 + 16, top + le / 2 + 16, { size: 11, color: MUTED });
    },
  });

  add({
    id: 'lo-xo-song-song', group: 5,
    title: 'Hai lò xo ghép song song',
    params: [
      prm('k1', 'Độ cứng lò xo 1 $k_1$', 10, 1000, 10, 100, 'N/m', 0, { hardMin: 1, hardMax: 100000 }),
      prm('k2', 'Độ cứng lò xo 2 $k_2$', 10, 1000, 10, 200, 'N/m', 0, { hardMin: 1, hardMax: 100000 }),
      pMass('m', 'Khối lượng vật $m$', 3, 20),
    ],
    readouts: [['k', 'Độ cứng tương đương $k = k_1 + k_2$'], ['x', 'Độ giãn chung $x = mg/k$'], ['F12', 'Lực đàn hồi $F_1$; $F_2$', 1], ['pos', 'Điểm treo vật cách lò xo 1', 1]],
    note: 'Song song (thanh ngang luôn nằm ngang): hai lò xo cùng độ giãn $x$, lực cộng lại $F_1 + F_2 = (k_1 + k_2)x = mg$, nên $k = k_1 + k_2$ – hệ "cứng" hơn. Để thanh không nghiêng, vật phải treo ở điểm chia khoảng cách theo tỉ lệ $d_1 : d_2 = k_2 : k_1$ (cân bằng momen).',
    compute: function (p) {
      var k = p.k1 + p.k2;
      var x = p.m * G / k;
      return { k: k, x: x, F1: p.k1 * x, F2: p.k2 * x, P: p.m * G, f: p.k2 / k };
    },
    out: function (p, r) {
      return { k: fmt(r.k, 0) + ' N/m', x: fmt(r.x * 100, 1) + ' cm', F12: fN(r.F1) + '; ' + fN(r.F2), pos: fmt(r.f * 100, 0) + '% khoảng cách hai lò xo' };
    },
    draw: function (p, r) {
      status('Cùng độ giãn, lực đàn hồi cộng lại', MUTED);
      var top = 72;
      ceiling(170, 560, top);
      var nat = 80;
      var pxm = Math.min(300, 120 / Math.max(r.x, 0.4));
      var L = nat + r.x * pxm;
      var xa = 230;
      var xb = 500;
      line(140, top + nat, 600, top + nat, '#94a3b8', 1, [4, 4]);
      txt('vị trí ban đầu', 600, top + nat - 6, { size: 11, color: MUTED, align: 'right' });
      spring(xa, top, xa, top + L, 8, 9, '#0f766e');
      spring(xb, top, xb, top + L, 8, 9, '#14b8a6');
      txt('k₁', xa - 30, top + L / 2, { size: 13, weight: 700, color: '#0f766e' });
      txt('k₂', xb + 18, top + L / 2, { size: 13, weight: 700, color: '#14b8a6' });
      ctx.fillStyle = '#78350f';
      ctx.fillRect(xa - 10, top + L, xb - xa + 20, 8);
      var lx = xa + r.f * (xb - xa);
      line(lx, top + L + 8, lx, top + L + 40, '#6b7280', 2);
      var s = 50;
      var by = top + L + 40 + s / 2;
      box(lx, by, s, s, 0, fmt(p.m, 1) + ' kg');
      var k = scaleFor(r.P, 10, 100);
      arrow(xa + 26, top + L, 0, -r.F1 * k, 'dh', 'F₁', { lx: 14 });
      arrow(xb - 26, top + L, 0, -r.F2 * k, 'dh', 'F₂', { lx: -14 });
      arrow(lx, by, 0, r.P * k, 'P', 'P', { lx: 14 });
      dim(xa, top + L + 24, lx, top + L + 24, 'd₁');
      dim(lx, top + L + 24, xb, top + L + 24, 'd₂');
    },
  });

  add({
    id: 'vat-noi', group: 5,
    title: 'Vật nổi – vật chìm (lực đẩy Ác-si-mét)',
    params: [
      prm('rv', 'Khối lượng riêng của vật $\\rho_v$', 100, 3000, 10, 600, 'kg/m³', 0, { hardMin: 1, hardMax: 22000 }),
      prm('rl', 'Khối lượng riêng chất lỏng $\\rho_l$', 600, 2000, 10, 1000, 'kg/m³', 0, { hardMin: 100, hardMax: 13600 }),
      prm('a', 'Cạnh khối lập phương $a$', 0.05, 1, 0.01, 0.3, 'm', 2, { hardMin: 0.01, hardMax: 5 }),
    ],
    readouts: [['state', 'Trạng thái', 1], ['frac', 'Tỉ lệ thể tích chìm $V_c/V$'], ['P', 'Trọng lượng $P = \\rho_v Vg$'], ['FA', 'Lực đẩy $F_A = \\rho_l V_c g$'], ['N', 'Phản lực đáy bình']],
    note: 'Vật nổi cân bằng khi $F_A = P$: $\\rho_l V_c g = \\rho_v V g \\Rightarrow \\dfrac{V_c}{V} = \\dfrac{\\rho_v}{\\rho_l}$. Nếu $\\rho_v > \\rho_l$ vật chìm xuống đáy, đáy đỡ thêm $N = (\\rho_v - \\rho_l)Vg$. Nếu $\\rho_v = \\rho_l$ vật lơ lửng.',
    compute: function (p) {
      var V = p.a * p.a * p.a;
      var P = p.rv * V * G;
      var r = { V: V, P: P };
      if (Math.abs(p.rv - p.rl) <= 0.002 * p.rl) {
        r.kind = 'mid'; r.frac = 1; r.FA = p.rl * V * G; r.N = 0;
      } else if (p.rv < p.rl) {
        r.kind = 'float'; r.frac = p.rv / p.rl; r.FA = P; r.N = 0;
      } else {
        r.kind = 'sink'; r.frac = 1; r.FA = p.rl * V * G; r.N = P - r.FA;
      }
      return r;
    },
    out: function (p, r) {
      return { state: r.kind === 'float' ? 'Nổi' : r.kind === 'mid' ? 'Lơ lửng' : 'Chìm xuống đáy', frac: fmt(r.frac * 100, 1) + '%', P: fN(r.P), FA: fN(r.FA), N: fN(r.N) };
    },
    draw: function (p, r) {
      status(r.kind === 'float' ? 'ρ vật < ρ lỏng: vật nổi, chìm ' + fmt(r.frac * 100, 0) + '% thể tích' : r.kind === 'mid' ? 'ρ vật = ρ lỏng: vật lơ lửng' : 'ρ vật > ρ lỏng: vật chìm xuống đáy', MUTED);
      var x0 = 170;
      var x1 = 550;
      var yt = 80;
      var yb = 330;
      var ys = 150;
      ctx.fillStyle = WATER;
      ctx.fillRect(x0, ys, x1 - x0, yb - ys);
      line(x0, ys, x1, ys, WATER_EDGE, 2);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, yt);
      ctx.lineTo(x0, yb);
      ctx.lineTo(x1, yb);
      ctx.lineTo(x1, yt);
      ctx.stroke();
      txt('ρ lỏng = ' + fmt(p.rl, 0) + ' kg/m³', x1 - 8, yb - 12, { size: 12, color: '#0369a1', align: 'right' });
      var s = 96;
      var cx = 360;
      var topY;
      if (r.kind === 'float') topY = ys - (1 - r.frac) * s;
      else if (r.kind === 'mid') topY = (ys + yb) / 2 - s / 2;
      else topY = yb - s;
      var cy = topY + s / 2;
      box(cx, cy, s, s, 0, null, 'rgba(180, 83, 9, 0.35)');
      txt('ρ vật = ' + fmt(p.rv, 0), cx - s / 2 + 4, topY + 14, { size: 11, weight: 700 });
      var subTop = Math.max(topY, ys);
      var cb = (subTop + topY + s) / 2;
      var k = scaleFor(Math.max(r.P, r.FA), 1, 72);
      arrow(cx - 18, cy, 0, r.P * k, 'P', 'P', { lx: -14 });
      arrow(cx + 18, cb, 0, -r.FA * k, 'A', 'FA', { lx: 18 });
      if (r.N > EPS) arrow(cx + 40, yb, 0, -r.N * k, 'N', 'N', { lx: 14 });
      if (r.kind === 'float') dim(cx + s / 2 + 18, ys, cx + s / 2 + 18, topY + s, 'Vc');
    },
  });

  add({
    id: 'van-toc-gioi-han', group: 5, anim: true,
    title: 'Vận tốc giới hạn khi rơi trong chất lỏng (lực cản F = bv)',
    params: [
      pMass('m', 'Khối lượng vật $m$', 0.5, 5),
      prm('V', 'Thể tích vật $V$', 1, 2000, 1, 100, 'cm³', 0, { hardMin: 0.1, hardMax: 100000 }),
      prm('rho', 'Khối lượng riêng chất lỏng $\\rho$', 0, 2000, 10, 1000, 'kg/m³', 0, { hardMax: 13600 }),
      prm('b', 'Hệ số cản $b$', 0.05, 10, 0.05, 0.5, 'kg/s', 2, { hardMin: 0.001, hardMax: 1000 }),
    ],
    readouts: [['vt', 'Vận tốc giới hạn $v_t = \\frac{mg - F_A}{b}$', 1], ['tau', 'Hằng số thời gian $\\tau = m/b$'], ['v', 'Vận tốc hiện tại $v(t)$'], ['acc', 'Gia tốc hiện tại'], ['FA', 'Lực đẩy $F_A = \\rho Vg$']],
    note: 'Định luật II: $mg - F_A - bv = m\\dfrac{dv}{dt}$. Lực cản tăng dần theo $v$ cho đến khi cân bằng $mg - F_A$: vật đạt vận tốc giới hạn $v_t = \\dfrac{mg - F_A}{b}$ và rơi đều. Nghiệm: $v(t) = v_t\\left(1 - e^{-t/\\tau}\\right)$, $\\tau = m/b$ (bỏ qua khối lượng chất lỏng kèm theo).',
    compute: function (p) {
      var P = p.m * G;
      var FA = p.rho * p.V * 1e-6 * G;
      var vt = (P - FA) / p.b;
      return { P: P, FA: FA, vt: vt, tau: p.m / p.b };
    },
    out: function (p, r, st) {
      var v = st ? vAt(r, st.t) : 0;
      var dir = Math.abs(r.vt) < 1e-9 ? 'lơ lửng' : r.vt > 0 ? 'hướng xuống' : 'hướng lên – vật nổi lên';
      return { vt: fmt(Math.abs(r.vt), 3) + ' m/s (' + dir + ')', tau: fmt(r.tau, 3) + ' s', v: fmt(Math.abs(v), 3) + ' m/s', acc: fAcc(Math.abs((r.vt - v) / r.tau)), FA: fN(r.FA) };
    },
    init: function () { return { t: 0, y: 0 }; },
    step: function (st, p, r, dt) {
      st.t += dt;
      return st.t < Math.max(6 * r.tau, 0.5) && st.t < 60;
    },
    timeScale: 1,
    draw: function (p, r, st) {
      var v = vAt(r, st.t);
      status('Lực cản tăng dần tới khi P = FA + Fc', MUTED);
      // cột chất lỏng (camera bám theo vật)
      var x0 = 90;
      var x1 = 230;
      var yt = 70;
      var yb = 370;
      ctx.fillStyle = p.rho > 0 ? WATER : '#f8faff';
      ctx.fillRect(x0, yt, x1 - x0, yb - yt);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x0, yt, x1 - x0, yb - yt);
      var pxm = 120 / Math.max(Math.abs(r.vt), 0.2);
      var y = r.vt * (st.t - r.tau * (1 - Math.exp(-st.t / r.tau)));
      var off = ((y * pxm) % 40 + 40) % 40;
      for (var yy = yt - off + 40; yy < yb; yy += 40) {
        if (yy > yt) line(x0, yy, x0 + 12, yy, '#94a3b8', 1.5);
      }
      var cx = (x0 + x1) / 2;
      var cy = 210;
      var br = 16;
      circle(cx, cy, br, '#fbbf24', '#92400e', 2);
      var Fc = p.b * v;
      var k = scaleFor(Math.max(r.P, r.FA), 1, 100);
      arrow(cx, cy, 0, r.P * k, 'P', 'P', { lx: -14 });
      arrow(cx - 14, cy, 0, -r.FA * k, 'A', 'FA', { lx: -18 });
      arrow(cx + 14, cy, 0, -Fc * k, 'c', 'Fc', { lx: 16 });
      // đồ thị v(t)
      var gx0 = 320;
      var gx1 = 690;
      var gy0 = 330;
      var gy1 = 90;
      var Tm = Math.max(5 * r.tau, 0.5);
      var vm = Math.max(Math.abs(r.vt), 1e-6) * 1.2;
      line(gx0, gy0, gx1, gy0, LINE, 1.5);
      line(gx0, gy0 + 6, gx0, gy1 - 10, LINE, 1.5);
      txt('t (s)', gx1 - 30, gy0 + 20, { size: 12, color: MUTED });
      txt('|v| (m/s)', gx0 + 6, gy1 - 14, { size: 12, color: MUTED });
      var yv = gy0 - Math.abs(r.vt) / vm * (gy0 - gy1);
      line(gx0, yv, gx1, yv, C.c, 1.2, [6, 4]);
      txt('vt = ' + fmt(Math.abs(r.vt), 2), gx1 - 4, yv - 6, { size: 12, color: C.c, align: 'right' });
      txt(fmt(Tm, 2), gx1, gy0 + 34, { size: 11, color: MUTED, align: 'right' });
      txt('τ', gx0 + r.tau / Tm * (gx1 - gx0) - 3, gy0 + 18, { size: 12, color: MUTED });
      line(gx0 + r.tau / Tm * (gx1 - gx0), gy0, gx0 + r.tau / Tm * (gx1 - gx0), gy0 - 6, MUTED, 1.5);
      ctx.save();
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= 100; i++) {
        var t = Tm * i / 100;
        var X = gx0 + (gx1 - gx0) * i / 100;
        var Y = gy0 - Math.abs(vAt(r, t)) / vm * (gy0 - gy1);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.restore();
      var tc = Math.min(st.t, Tm);
      circle(gx0 + tc / Tm * (gx1 - gx0), gy0 - Math.abs(vAt(r, tc)) / vm * (gy0 - gy1), 5, DANGER);
      txt('t = ' + fmt(st.t, 2) + ' s,  v = ' + fmt(Math.abs(v), 3) + ' m/s', gx1, 66, { size: 12.5, color: INK, align: 'right' });
    },
  });
  function vAt(r, t) {
    return r.vt * (1 - Math.exp(-t / r.tau));
  }

  add({
    id: 'lo-xo-trong-chat-long', group: 5,
    title: 'Vật treo lò xo nhúng trong chất lỏng',
    params: [
      pMass('m', 'Khối lượng vật $m$', 2, 10),
      prm('V', 'Thể tích vật $V$', 10, 5000, 10, 500, 'cm³', 0, { hardMin: 1, hardMax: 100000 }),
      prm('rho', 'Khối lượng riêng chất lỏng $\\rho$', 0, 2000, 10, 1000, 'kg/m³', 0, { hardMax: 13600 }),
      prm('k', 'Độ cứng lò xo $k$', 10, 1000, 10, 100, 'N/m', 0, { hardMin: 1, hardMax: 100000 }),
    ],
    readouts: [['FA', 'Lực đẩy $F_A = \\rho Vg$'], ['xa', 'Độ giãn trong không khí $mg/k$'], ['xl', 'Độ giãn trong chất lỏng', 1], ['Fdh', 'Lực đàn hồi trong chất lỏng']],
    note: 'Vật nhúng hoàn toàn và cân bằng: $F_{đh} + F_A = mg \\Rightarrow kx = mg - \\rho Vg$, nên $x = \\dfrac{mg - F_A}{k}$ – nhỏ hơn khi treo trong không khí. Đo độ giãn trong hai trường hợp, ta suy ra được $F_A$ (cân thủy tĩnh). Nếu $F_A > mg$ thì lò xo phải nén để giữ vật chìm.',
    compute: function (p) {
      var P = p.m * G;
      var FA = p.rho * p.V * 1e-6 * G;
      return { P: P, FA: FA, xa: P / p.k, xl: (P - FA) / p.k, Fdh: P - FA };
    },
    out: function (p, r) {
      return {
        FA: fN(r.FA), xa: fmt(r.xa * 100, 1) + ' cm',
        xl: (r.xl >= 0 ? fmt(r.xl * 100, 1) + ' cm (giãn)' : fmt(-r.xl * 100, 1) + ' cm (bị nén)'), Fdh: fN(Math.abs(r.Fdh)) + (r.Fdh >= 0 ? ', hướng lên' : ', hướng xuống'),
      };
    },
    draw: function (p, r) {
      status(r.Fdh >= 0 ? 'Trong chất lỏng lò xo giãn ít hơn: FA "đỡ" bớt một phần' : 'FA > P: lò xo bị nén, đẩy vật xuống để giữ vật chìm', r.Fdh >= 0 ? MUTED : DANGER);
      var top = 72;
      var nat = 90;
      var pxm = 150 / Math.max(Math.abs(r.xa), Math.abs(r.xl), 0.4);
      var s = 44;
      function hang(x, xm, label) {
        ceiling(x - 50, x + 50, top);
        var L = nat + clamp(xm * pxm, -40, 150);
        spring(x, top, x, top + L, 9, 9);
        box(x, top + L + s / 2, s, s, 0, label, 'rgba(100, 116, 139, 0.45)');
        return top + L;
      }
      txt('Trong không khí', 250, 96, { size: 12, color: MUTED });
      var y1 = hang(190, r.xa, 'm');
      var k = scaleFor(Math.max(r.P, r.FA), 5, 75);
      arrow(184, y1 + s / 2, 0, r.P * k, 'P', 'P', { lx: -14 });
      arrow(226, y1, 0, -r.P * k, 'dh', 'Fđh', { lx: 22 });
      // bình chất lỏng
      var bx0 = 400;
      var bx1 = 640;
      var ys = 110;
      ctx.fillStyle = p.rho > 0 ? WATER : 'transparent';
      ctx.fillRect(bx0, ys, bx1 - bx0, 375 - ys);
      line(bx0, ys, bx1, ys, WATER_EDGE, 2);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx0, ys - 30);
      ctx.lineTo(bx0, 375);
      ctx.lineTo(bx1, 375);
      ctx.lineTo(bx1, ys - 30);
      ctx.stroke();
      txt('Trong chất lỏng', bx0 + 8, ys + 20, { size: 12, color: '#0369a1' });
      var y2 = hang(520, r.xl, 'm');
      var cyb = y2 + s / 2;
      arrow(512, cyb, 0, r.P * k, 'P', 'P', { lx: -14 });
      arrow(530, cyb, 0, -r.FA * k, 'A', 'FA', { lx: -16 });
      arrow(556, y2, 0, -r.Fdh * k, 'dh', 'Fđh', { lx: 24 });
    },
  });

  // ---------------------------------------------------------------- Đánh số
  var counters = [0, 0, 0, 0, 0, 0];
  CASES.forEach(function (c) {
    counters[c.group] += 1;
    c.num = c.group + 1 + '.' + counters[c.group];
  });

  // ---------------------------------------------------------------- Trạng thái & giao diện
  var cur = null;
  var st = null;
  var running = false;
  var last = null;
  var snapshot = '';
  var inputs = {};
  var outputs = {};
  var readouts = {};

  function values() {
    var p = {};
    cur.params.forEach(function (d) {
      var v = parseFloat(inputs[d.name].value);
      p[d.name] = isFinite(v) ? v : d.value;
    });
    // Bảo vệ chia cho 0: đại lượng có giới hạn dưới dương thì luôn dương.
    cur.params.forEach(function (d) {
      if (d.min > 0) p[d.name] = Math.max(p[d.name], Math.min(d.min, d.hardMin != null && d.hardMin > 0 ? d.hardMin : d.min, 1e-4));
    });
    return p;
  }

  function key(p) {
    return cur.params.map(function (d) { return p[d.name]; }).join('|');
  }

  function buildCaseOptions(group) {
    caseSel.innerHTML = '';
    CASES.forEach(function (c, i) {
      if (c.group !== group) return;
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.num + ' ' + c.title;
      caseSel.appendChild(o);
    });
  }

  function select(id, fromHash) {
    var c = CASES.filter(function (x) { return x.id === id; })[0] || CASES[0];
    setRunning(false);
    cur = c;
    if (String(groupSel.value) !== String(c.group)) {
      groupSel.value = String(c.group);
    }
    buildCaseOptions(c.group);
    caseSel.value = c.id;
    // Thanh trượt
    paramBox.innerHTML = '';
    inputs = {};
    outputs = {};
    c.params.forEach(function (d) {
      var lab = document.createElement('label');
      lab.className = 'slider';
      var span = document.createElement('span');
      span.textContent = d.label;
      var out = document.createElement('output');
      out.setAttribute('data-for', d.name);
      var inp = document.createElement('input');
      inp.type = 'range';
      inp.name = d.name;
      inp.min = d.min;
      inp.max = d.max;
      inp.step = d.step;
      inp.value = d.value;
      if (d.hardMin != null) inp.setAttribute('data-hard-min', d.hardMin);
      if (d.hardMax != null) inp.setAttribute('data-hard-max', d.hardMax);
      lab.appendChild(span);
      lab.appendChild(document.createTextNode(' '));
      lab.appendChild(out);
      lab.appendChild(inp);
      paramBox.appendChild(lab);
      inputs[d.name] = inp;
      outputs[d.name] = out;
    });
    // Số liệu
    readoutBox.innerHTML = '';
    readouts = {};
    c.readouts.forEach(function (rd) {
      var div = document.createElement('div');
      var dt = document.createElement('dt');
      dt.textContent = rd[1];
      var dd = document.createElement('dd');
      if (rd[2]) dd.className = 'readout-text';
      dd.textContent = '—';
      div.appendChild(dt);
      div.appendChild(dd);
      readoutBox.appendChild(div);
      readouts[rd[0]] = dd;
    });
    noteBox.textContent = c.note;
    toggleBtn.style.display = c.anim ? '' : 'none';
    toggleBtn.hidden = !c.anim;
    var p = values();
    st = c.init ? c.init(p) : {};
    snapshot = key(p);
    VL.renderMath(paramBox);
    VL.renderMath(readoutBox);
    VL.renderMath(noteBox);
    if (!fromHash) {
      try { history.replaceState(null, '', '#' + c.id); } catch (e) { /* bỏ qua */ }
    }
    update();
    root.dispatchEvent(new CustomEvent('sim:controls-changed', { bubbles: true }));
  }

  function update() {
    if (!cur) return;
    var p = values();
    cur.params.forEach(function (d) {
      outputs[d.name].textContent = fmtParam(d, p[d.name]);
    });
    var r = cur.compute(p);
    var o = cur.out(p, r, st);
    for (var k in o) if (readouts[k]) readouts[k].textContent = o[k];
    draw(p, r);
  }

  function draw(p, r) {
    used = {};
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f8faff';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    try {
      cur.draw(p, r, st);
    } finally {
      ctx.restore();
    }
    heading(cur);
    legend();
  }

  function onParam() {
    if (!cur) return;
    var p = values();
    var kk = key(p);
    if (kk !== snapshot) {
      snapshot = kk;
      if (cur.anim && !cur.keep) {
        setRunning(false);
        st = cur.init(p);
      } else if (cur.keep) {
        st.drift = 0;
        st.out = false;
        st.done = false;
      }
    }
    update();
  }

  function stepFor(seconds) {
    var p = values();
    var r = cur.compute(p);
    st.started = true;
    var cont = cur.step(st, p, r, seconds);
    return cont;
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    var cont = stepFor(dt * (cur.timeScale || 1));
    update();
    if (cont === false) {
      st.done = true;
      setRunning(false);
      return;
    }
    requestAnimationFrame(frame);
  }

  function setRunning(v) {
    if (v && cur && cur.anim && VL.reduceMotion) {
      // Không chạy hoạt hình liên tục: mỗi lần bấm tiến 0,5 s.
      if (st.done) st = cur.init(values());
      var n = 25;
      var cont = true;
      for (var i = 0; i < n && cont !== false; i++) cont = stepFor(0.02 * (cur.timeScale || 1));
      if (cont === false) st.done = true;
      update();
      return;
    }
    running = !!v && !!cur && !!cur.anim;
    if (toggleBtn) {
      var span = toggleBtn.querySelector('span');
      var use = toggleBtn.querySelector('use');
      if (span) span.textContent = running ? 'Tạm dừng' : VL.reduceMotion ? 'Bước +0,5 s' : 'Chạy';
      if (use) use.setAttribute('href', running ? '#i-pause' : '#i-play');
    }
    if (running) {
      if (st.done) {
        st = cur.init(values());
      }
      last = null;
      requestAnimationFrame(frame);
    }
  }

  // ---------------------------------------------------------------- Sự kiện
  function isParamRange(t) {
    return t && t.matches && t.matches('input[type="range"]') && paramBox.contains(t);
  }
  root.addEventListener('input', function (e) {
    if (isParamRange(e.target)) onParam();
  });
  root.addEventListener('change', function (e) {
    if (isParamRange(e.target)) onParam();
  });
  groupSel.addEventListener('change', function () {
    var g = parseInt(groupSel.value, 10) || 0;
    var first = CASES.filter(function (c) { return c.group === g; })[0];
    select(first.id);
  });
  caseSel.addEventListener('change', function () {
    select(caseSel.value);
  });
  function shift(d) {
    var i = CASES.indexOf(cur);
    select(CASES[(i + d + CASES.length) % CASES.length].id);
  }
  if (prevBtn) prevBtn.addEventListener('click', function () { shift(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { shift(1); });
  if (toggleBtn) toggleBtn.addEventListener('click', function () { setRunning(!running); });
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      setRunning(false);
      cur.params.forEach(function (d) {
        var inp = inputs[d.name];
        // Trả lại giới hạn gốc nếu ô nhập số đã nới rộng
        inp.min = d.min;
        inp.max = d.max;
        inp.value = d.value;
      });
      var p = values();
      snapshot = key(p);
      st = cur.init ? cur.init(p) : {};
      update();
      paramBox.querySelectorAll('input[type="range"]').forEach(function (inp) {
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }
  window.addEventListener('hashchange', function () {
    var id = location.hash.slice(1);
    if (id && cur && id !== cur.id && CASES.some(function (c) { return c.id === id; })) select(id, true);
  });

  var initial = location.hash.slice(1);
  select(CASES.some(function (c) { return c.id === initial; }) ? initial : CASES[0].id, true);
})();
