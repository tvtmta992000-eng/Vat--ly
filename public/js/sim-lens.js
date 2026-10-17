// Thấu kính mỏng: vẽ 3 tia đặc biệt và ảnh. 1/f = 1/d + 1/d', k = −d'/d (f < 0 với thấu kính phân kì).
// Trục ngang và dọc dùng hai tỉ lệ khác nhau (phép biến đổi affine giữ nguyên đường thẳng và giao điểm).
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
  var LENS_X = 380;
  var AXIS_Y = 210;
  var SX = 5.5; // px/cm theo phương ngang
  var SY = 18; // px/cm theo phương dọc

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

  function params() {
    var checked = root.querySelector('input[name="type"]:checked');
    var converging = !checked || checked.value === 'converging';
    var F = parseFloat(inputs.focal.value);
    return { converging: converging, f: converging ? F : -F, d: parseFloat(inputs.dist.value), h: parseFloat(inputs.height.value) };
  }

  function solve(p) {
    if (Math.abs(p.d - p.f) < 1e-6) return { infinite: true };
    var di = (p.d * p.f) / (p.d - p.f);
    var k = -di / p.d;
    return { infinite: false, di: di, k: k, hi: k * p.h };
  }

  // Toạ độ vật lí (cm, gốc tại quang tâm, trục x hướng sang phải) → pixel
  function px(x) {
    return LENS_X + x * SX;
  }
  function py(y) {
    return AXIS_Y - y * SY;
  }

  function updateLabels() {
    var p = params();
    outputs.focal.textContent = VL.fmt(Math.abs(p.f), 1) + ' cm';
    outputs.dist.textContent = VL.fmt(p.d, 1) + ' cm';
    outputs.height.textContent = VL.fmt(p.h, 1) + ' cm';
    var r = solve(p);
    if (r.infinite) {
      readout.dimg.textContent = 'Ở vô cực';
      readout.mag.textContent = '—';
      readout.himg.textContent = '—';
      readout.nature.textContent = 'Vật đặt tại tiêu điểm: chùm tia ló song song, không cho ảnh.';
      return;
    }
    readout.dimg.textContent = VL.fmt(r.di, 1) + ' cm';
    readout.mag.textContent = VL.fmt(r.k, 2);
    readout.himg.textContent = VL.fmt(Math.abs(r.hi), 1) + ' cm';
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
    var dir = y1 < y0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x - 7, y1 - dir * 11);
    ctx.lineTo(x + 7, y1 - dir * 11);
    ctx.closePath();
    ctx.fill();
  }

  // Tia ló: đi từ điểm tới thấu kính (0, yl) theo hướng (dx, dy) tới mép khung; với ảnh ảo, vẽ thêm đường kéo dài nét đứt.
  function ray(from, yl, outDir, color, virtualTo) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(px(from.x), py(from.y));
    ctx.lineTo(px(0), py(yl));
    var t = (W + 40 - px(0)) / Math.max(1e-6, outDir.dx * SX);
    ctx.lineTo(px(0) + outDir.dx * SX * t, py(yl) - outDir.dy * SY * t);
    ctx.stroke();
    if (virtualTo) {
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(px(0), py(yl));
      ctx.lineTo(px(virtualTo.x), py(virtualTo.y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    var p = params();
    var r = solve(p);
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);

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
    ctx.moveTo(LENS_X, 30);
    ctx.lineTo(LENS_X, H - 30);
    ctx.stroke();
    [30, H - 30].forEach(function (y, i) {
      var tip = i === 0 ? -1 : 1;
      var inward = p.converging ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(LENS_X - 10, y - tip * 10 * inward);
      ctx.lineTo(LENS_X, y);
      ctx.lineTo(LENS_X + 10, y - tip * 10 * inward);
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
      ctx.fillText(pt.label, x - 6, AXIS_Y + 18);
    });
    ctx.fillText('O', LENS_X + 6, AXIS_Y + 18);

    // Vật AB
    var B = { x: -p.d, y: p.h };
    arrowShape(px(B.x), AXIS_Y, py(B.y), accent, false);
    ctx.fillStyle = accent;
    ctx.fillText('B', px(B.x) - 14, py(B.y) - 4);
    ctx.fillText('A', px(B.x) - 4, AXIS_Y + 18);

    // Ba tia đặc biệt
    var virtualImage = !r.infinite && r.di < 0 ? { x: r.di, y: r.hi } : null;
    // 1. Tia song song trục chính → ló qua (hoặc có đường kéo dài qua) F'
    ray(B, p.h, { dx: 1, dy: -p.h / p.f }, '#0e7490', virtualImage);
    // 2. Tia qua quang tâm → truyền thẳng
    ray(B, 0, { dx: 1, dy: -p.h / p.d }, '#7e22ce', virtualImage);
    // 3. Tia hướng tới F → ló song song trục chính
    if (Math.abs(p.d - p.f) > 0.3) {
      var y3 = (p.h * p.f) / (p.f - p.d);
      if (Math.abs(py(y3) - AXIS_Y) < H) ray(B, y3, { dx: 1, dy: 0 }, '#15803d', virtualImage);
    }

    // Ảnh A'B'
    if (!r.infinite) {
      var ix = px(r.di);
      if (ix > 0 && ix < W) {
        var top = Math.max(10, Math.min(H - 10, py(r.hi)));
        arrowShape(ix, AXIS_Y, top, '#1e1b4b', r.di < 0);
        ctx.fillStyle = '#1e1b4b';
        ctx.fillText("B'", ix + 8, top + (r.hi > 0 ? 0 : 12));
        ctx.fillText("A'", ix - 4, AXIS_Y + (r.hi > 0 ? 18 : -8));
      } else {
        ctx.fillStyle = '#5b6478';
        ctx.font = '12px "Noto Sans", sans-serif';
        ctx.fillText('Ảnh nằm ngoài khung hình (d\' = ' + VL.fmt(r.di, 1) + ' cm)', 20, H - 14);
      }
    }

    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText('Nét liền: tia sáng thật · Nét đứt: đường kéo dài, ảnh ảo', 20, 22);
  }

  function refresh() {
    updateLabels();
    draw();
  }

  function toPhysX(event) {
    var rect = canvas.getBoundingClientRect();
    return (((event.clientX - rect.left) / rect.width) * W - LENS_X) / SX;
  }

  canvas.addEventListener('pointerdown', function (event) {
    var x = toPhysX(event);
    if (Math.abs(x + parseFloat(inputs.dist.value)) < 4) {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
    }
  });
  canvas.addEventListener('pointermove', function (event) {
    var x = toPhysX(event);
    if (dragging) {
      var d = Math.max(2, Math.min(60, -x));
      inputs.dist.value = String(Math.round(d * 2) / 2);
      refresh();
    } else {
      canvas.style.cursor = Math.abs(x + parseFloat(inputs.dist.value)) < 4 ? 'grab' : 'default';
    }
  });
  ['pointerup', 'pointercancel'].forEach(function (type) {
    canvas.addEventListener(type, function () { dragging = false; });
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
