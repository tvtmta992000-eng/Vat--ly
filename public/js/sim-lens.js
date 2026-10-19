// Thấu kính mỏng: vẽ 3 tia đặc biệt và ảnh. 1/f = 1/d + 1/d', k = −d'/d (f < 0 với thấu kính phân kì).
// Trục ngang và dọc dùng hai tỉ lệ khác nhau (phép biến đổi affine giữ nguyên đường thẳng và giao điểm).
// Hai tỉ lệ được tính lại mỗi lần vẽ để vật, tiêu điểm và ảnh (nếu không quá xa) luôn nằm trong khung.
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="lens"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var canvas = root.querySelector('canvas');
  var view = VL.setupCanvas(canvas);
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var AXIS_Y = 210;
  var MARGIN_X = 24;
  var ROOM_UP = AXIS_Y - 48; // chỗ phía trên trục (px)
  var ROOM_DOWN = H - 34 - AXIS_Y; // chỗ phía dưới trục (px)
  var FAR = 4; // ảnh xa hơn 4 lần max(d, |f|) thì coi là ngoài khung
  var TALL = 5; // ảnh cao hơn 5 lần vật thì cắt bớt và ghi chú

  var inputs = {
    focal: root.querySelector('input[name="focal"]'),
    dist: root.querySelector('input[name="dist"]'),
    height: root.querySelector('input[name="height"]'),
  };
  var typeInputs = root.querySelectorAll('input[name="type"]');
  var outputs = {
    focal: root.querySelector('output[data-for="focal"]'),
    dist: root.querySelector('output[data-for="dist"]'),
    height: root.querySelector('output[data-for="height"]'),
  };
  var readout = {
    dimg: root.querySelector('[data-out="dimg"]'),
    mag: root.querySelector('[data-out="mag"]'),
    himg: root.querySelector('[data-out="himg"]'),
    nature: root.querySelector('[data-out="nature"]'),
  };
  var resetBtn = root.querySelector('[data-action="reset"]');
  var dragging = false;
  var L = null; // bố cục (tỉ lệ, vị trí thấu kính) của lần vẽ gần nhất; giữ nguyên khi đang kéo vật

  // Làm tròn tới khoảng 3 chữ số có nghĩa rồi chọn số chữ số thập phân tương ứng.
  function fmtAuto(v, sig) {
    sig = sig || 3;
    var r = isFinite(v) ? Number(v.toPrecision(sig)) : v;
    var a = Math.abs(r);
    var digits = a > 1e-9 && isFinite(a) ? Math.max(0, Math.min(6, sig - 1 - Math.floor(Math.log10(a)))) : 0;
    return VL.fmt(a > 1e-9 ? r : 0, digits);
  }

  function niceStep(span, count) {
    var raw = span / count;
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / pow;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
  }

  function params() {
    var checked = root.querySelector('input[name="type"]:checked');
    var converging = !checked || checked.value === 'converging';
    var F = parseFloat(inputs.focal.value);
    return { converging: converging, f: converging ? F : -F, d: parseFloat(inputs.dist.value), h: parseFloat(inputs.height.value) };
  }

  function solve(p) {
    if (Math.abs(p.d - p.f) < 1e-9 * Math.max(1, Math.abs(p.f))) return { infinite: true };
    var di = (p.d * p.f) / (p.d - p.f);
    var k = -di / p.d;
    return { infinite: false, di: di, k: k, hi: k * p.h };
  }

  // Ảnh đủ gần để đưa vào khung nhìn hay không.
  function imageInView(p, r) {
    return !r.infinite && Math.abs(r.di) <= FAR * Math.max(p.d, Math.abs(p.f));
  }

  // Chọn tỉ lệ ngang/dọc và vị trí thấu kính cho bộ thông số hiện tại.
  function layout(p, r) {
    var F = Math.abs(p.f);
    var base = Math.max(p.d, F);
    var left = Math.max(p.d, F);
    var right = F;
    if (imageInView(p, r)) {
      if (r.di > 0) right = Math.max(right, r.di);
      else left = Math.max(left, -r.di);
    }
    // Hiện cả 2F, 2F' khi chúng không làm hình quá nhỏ.
    if (2 * F <= 1.6 * base) {
      left = Math.max(left, 2 * F);
      right = Math.max(right, 2 * F);
    }
    left *= 1.12;
    right *= 1.12;
    left = Math.max(left, 0.3 * right);
    right = Math.max(right, 0.3 * left);
    var sx = (W - 2 * MARGIN_X) / (left + right);
    var up = p.h;
    var down = 0;
    if (imageInView(p, r)) {
      var hi = Math.min(Math.abs(r.hi), TALL * p.h);
      if (r.hi > 0) up = Math.max(up, hi);
      else down = hi;
    }
    var sy = Math.min((0.8 * ROOM_UP) / up, down > 0 ? (0.8 * ROOM_DOWN) / down : Infinity);
    return { sx: sx, sy: sy, lensX: MARGIN_X + left * sx };
  }

  // Toạ độ vật lí (cm, gốc tại quang tâm, trục x hướng sang phải) → pixel
  function px(x) {
    return L.lensX + x * L.sx;
  }
  function py(y) {
    return AXIS_Y - y * L.sy;
  }

  // Cắt đoạn thẳng (pixel) theo khung hình mở rộng (Liang–Barsky) để toạ độ vẽ luôn hữu hạn và gọn.
  function clipSegment(x0, y0, x1, y1) {
    var pad = 40;
    var t0 = 0;
    var t1 = 1;
    var dx = x1 - x0;
    var dy = y1 - y0;
    var checks = [[-dx, x0 + pad], [dx, W + pad - x0], [-dy, y0 + pad], [dy, H + pad - y0]];
    for (var i = 0; i < 4; i++) {
      var pp = checks[i][0];
      var q = checks[i][1];
      if (pp === 0) {
        if (q < 0) return null;
      } else {
        var t = q / pp;
        if (pp < 0) t0 = Math.max(t0, t);
        else t1 = Math.min(t1, t);
      }
    }
    if (t0 > t1 || !isFinite(t0) || !isFinite(t1)) return null;
    return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
  }

  function line(x0, y0, x1, y1) {
    var c = clipSegment(x0, y0, x1, y1);
    if (!c) return;
    ctx.beginPath();
    ctx.moveTo(c[0], c[1]);
    ctx.lineTo(c[2], c[3]);
    ctx.stroke();
  }

  function updateLabels() {
    var p = params();
    outputs.focal.textContent = fmtAuto(Math.abs(p.f)) + ' cm';
    outputs.dist.textContent = fmtAuto(p.d) + ' cm';
    outputs.height.textContent = fmtAuto(p.h) + ' cm';
    var r = solve(p);
    if (r.infinite) {
      readout.dimg.textContent = 'Ở vô cực';
      readout.mag.textContent = '—';
      readout.himg.textContent = '—';
      readout.nature.textContent = 'Vật đặt tại tiêu điểm: chùm tia ló song song, không cho ảnh.';
      return;
    }
    readout.dimg.textContent = fmtAuto(r.di) + ' cm';
    readout.mag.textContent = fmtAuto(r.k);
    readout.himg.textContent = fmtAuto(Math.abs(r.hi)) + ' cm';
    var real = r.di > 0;
    var size = Math.abs(r.k) > 1.005 ? 'lớn hơn vật' : Math.abs(r.k) < 0.995 ? 'nhỏ hơn vật' : 'bằng vật';
    readout.nature.textContent =
      (real ? 'Ảnh thật' : 'Ảnh ảo') + ', ' + (r.k < 0 ? 'ngược chiều' : 'cùng chiều') + ', ' + size + '.';
  }

  function arrowShape(x, y0, y1, color, dashed) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash(dashed ? [6, 5] : []);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    if (Math.abs(y1 - y0) < 2) return;
    var dir = y1 < y0 ? -1 : 1;
    var head = Math.min(11, Math.abs(y1 - y0));
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x - 7, y1 - dir * head);
    ctx.lineTo(x + 7, y1 - dir * head);
    ctx.closePath();
    ctx.fill();
  }

  // Tia ló: đi từ điểm tới thấu kính (0, yl) theo hướng (1, dy) tới mép khung; với ảnh ảo, vẽ thêm đường kéo dài nét đứt.
  function ray(from, yl, dy, color, virtualTo) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    line(px(from.x), py(from.y), px(0), py(yl));
    var reach = (W + 60 - px(0)) / L.sx; // cm theo phương ngang tới quá mép phải
    line(px(0), py(yl), px(reach), py(yl + dy * reach));
    if (virtualTo) {
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.6;
      line(px(0), py(yl), px(virtualTo.x), py(virtualTo.y));
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  // Thước tỉ lệ ở góc dưới bên phải (hai phương có tỉ lệ khác nhau).
  function drawScale() {
    var hcm = niceStep(90 / L.sx, 1);
    var vcm = niceStep(40 / L.sy, 1);
    var hpx = hcm * L.sx;
    var vpx = vcm * L.sy;
    var x1 = W - 16;
    var y1 = H - 12;
    ctx.font = '11px "Noto Sans", sans-serif';
    var hLabel = 'ngang ' + fmtAuto(hcm) + ' cm';
    var vLabel = 'dọc ' + fmtAuto(vcm) + ' cm';
    // Nền mờ để thước không lẫn với tia sáng
    var boxW = Math.max(hpx + ctx.measureText(hLabel).width + 14, ctx.measureText(vLabel).width + 14);
    ctx.fillStyle = 'rgba(248, 250, 255, 0.9)';
    ctx.fillRect(x1 - boxW, y1 - 26 - vpx, boxW + 12, vpx + 34);
    ctx.strokeStyle = '#5b6478';
    ctx.fillStyle = '#5b6478';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1 - hpx, y1 - 4);
    ctx.lineTo(x1 - hpx, y1);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y1 - 4);
    ctx.moveTo(x1 + 4, y1 - 18);
    ctx.lineTo(x1 + 4, y1 - 18 - vpx);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(hLabel, x1 - hpx - 6, y1 + 1);
    ctx.fillText(vLabel, x1 - 2, y1 - 20 - vpx / 2);
    ctx.textAlign = 'left';
  }

  function draw() {
    var p = params();
    var r = solve(p);
    if (!dragging || !L) L = layout(p, r);
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);
    var lensX = L.lensX;

    // Trục chính
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, AXIS_Y);
    ctx.lineTo(W, AXIS_Y);
    ctx.stroke();

    // Thấu kính
    ctx.strokeStyle = primary;
    ctx.fillStyle = primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lensX, 30);
    ctx.lineTo(lensX, H - 30);
    ctx.stroke();
    [30, H - 30].forEach(function (y, i) {
      var tip = i === 0 ? -1 : 1;
      var inward = p.converging ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(lensX - 10, y - tip * 10 * inward);
      ctx.lineTo(lensX, y);
      ctx.lineTo(lensX + 10, y - tip * 10 * inward);
      ctx.stroke();
    });

    // Tiêu điểm
    ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
    [
      { x: -p.f, label: 'F' },
      { x: p.f, label: "F'" },
      { x: -2 * p.f, label: '2F' },
      { x: 2 * p.f, label: "2F'" },
    ].forEach(function (pt) {
      var x = px(pt.x);
      if (x < 0 || x > W) return;
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(x, AXIS_Y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Tiêu điểm rất sát quang tâm (so với khung nhìn): bỏ nhãn để không chồng chữ.
      var gap = Math.abs(p.f) * L.sx;
      if (gap < 14 || (pt.label.charAt(0) === '2' && gap < 24)) return;
      ctx.fillText(pt.label, x - 6, AXIS_Y + 18);
    });
    ctx.fillText('O', lensX + 6, AXIS_Y + 18);

    // Vật AB
    var B = { x: -p.d, y: p.h };
    var bx = px(B.x);
    arrowShape(bx, AXIS_Y, Math.max(8, py(B.y)), accent, false);
    ctx.fillStyle = accent;
    ctx.fillText('B', bx - 14, Math.max(14, py(B.y) - 4));
    ctx.fillText('A', bx - 4, AXIS_Y + 18);

    // Ba tia đặc biệt
    var virtualImage = !r.infinite && r.di < 0 ? { x: r.di, y: r.hi } : null;
    // 1. Tia song song trục chính → ló qua (hoặc có đường kéo dài qua) F'
    ray(B, p.h, -p.h / p.f, '#0e7490', virtualImage);
    // 2. Tia qua quang tâm → truyền thẳng
    ray(B, 0, -p.h / p.d, '#7e22ce', virtualImage);
    // 3. Tia hướng tới F → ló song song trục chính (bỏ qua khi vật gần như ở tiêu điểm)
    if (Math.abs(p.d - p.f) > 1e-3 * Math.abs(p.f)) {
      var y3 = (p.h * p.f) / (p.f - p.d);
      ray(B, y3, 0, '#15803d', virtualImage);
    }

    // Ảnh A'B'
    ctx.font = '12px "Noto Sans", sans-serif';
    if (!r.infinite) {
      var ix = px(r.di);
      if (ix > 0 && ix < W) {
        var rawTop = py(r.hi);
        var top = Math.max(12, Math.min(H - 12, rawTop));
        arrowShape(ix, AXIS_Y, top, '#1e1b4b', r.di < 0);
        ctx.fillStyle = '#1e1b4b';
        ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
        ctx.fillText("B'", ix + 8, top + (r.hi > 0 ? 6 : 0));
        ctx.fillText("A'", ix - 4, AXIS_Y + (r.hi > 0 ? 18 : -8));
        if (rawTop !== top) {
          ctx.font = '12px "Noto Sans", sans-serif';
          ctx.fillText((r.hi > 0 ? '↑' : '↓') + " ảnh cao " + fmtAuto(Math.abs(r.hi)) + ' cm (vượt khung)', Math.min(ix + 8, W - 200), r.hi > 0 ? 30 : H - 18);
        }
      } else {
        // Ảnh ở rất xa: mũi tên chỉ hướng ở mép khung và ghi khoảng cách.
        var side = ix <= 0 ? -1 : 1;
        var ex = side < 0 ? 10 : W - 10;
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(ex + side * 6, AXIS_Y - 26);
        ctx.lineTo(ex - side * 6, AXIS_Y - 34);
        ctx.lineTo(ex - side * 6, AXIS_Y - 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5b6478';
        ctx.fillText("Ảnh nằm ngoài khung hình (d' = " + fmtAuto(r.di) + ' cm)', 20, H - 14);
      }
    } else {
      ctx.fillStyle = '#5b6478';
      ctx.fillText('Vật tại tiêu điểm: chùm tia ló song song, ảnh ở vô cực', 20, H - 14);
    }

    drawScale();
    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText('Nét liền: tia sáng thật · Nét đứt: đường kéo dài, ảnh ảo', 20, 22);
  }

  function refresh() {
    updateLabels();
    draw();
  }

  // Toạ độ con trỏ → pixel trong hệ logic 720×400 (đúng cả khi khung hình được phóng to).
  function toCanvasX(event) {
    var rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * W;
  }

  function nearObject(event) {
    return L && Math.abs(toCanvasX(event) - px(-parseFloat(inputs.dist.value))) < 12;
  }

  canvas.addEventListener('pointerdown', function (event) {
    if (nearObject(event)) {
      dragging = true; // giữ nguyên tỉ lệ trong lúc kéo để vật đi theo con trỏ
      canvas.setPointerCapture(event.pointerId);
    }
  });
  canvas.addEventListener('pointermove', function (event) {
    if (dragging) {
      var d = -(toCanvasX(event) - L.lensX) / L.sx;
      var step = parseFloat(inputs.dist.step);
      if (step > 0) d = Math.round(d / step) * step;
      d = Math.max(parseFloat(inputs.dist.min), Math.min(parseFloat(inputs.dist.max), d));
      if (!(d > 0)) d = Math.max(parseFloat(inputs.dist.min), 0.1);
      inputs.dist.value = String(d);
      inputs.dist.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      canvas.style.cursor = nearObject(event) ? 'grab' : 'default';
    }
  });
  ['pointerup', 'pointercancel'].forEach(function (type) {
    canvas.addEventListener(type, function () {
      if (!dragging) return;
      dragging = false;
      refresh(); // thả vật: tính lại tỉ lệ cho vừa khung
    });
  });
  canvas.style.touchAction = 'pan-y';

  ['focal', 'dist', 'height'].forEach(function (n) {
    inputs[n].addEventListener('input', refresh);
  });
  typeInputs.forEach(function (el) { el.addEventListener('change', refresh); });
  resetBtn.addEventListener('click', function () {
    typeInputs[0].checked = true;
    inputs.focal.value = 12;
    inputs.dist.value = 30;
    inputs.height.value = 3;
    refresh();
  });

  refresh();
})();
