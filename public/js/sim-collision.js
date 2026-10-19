// Va chạm một chiều giữa hai xe. Hệ số phục hồi e: 1 = đàn hồi, 0 = mềm (dính nhau).
// v1' = (m1v1 + m2v2 − m2·e·(v1 − v2)) / (m1 + m2),  v2' = (m1v1 + m2v2 + m1·e·(v1 − v2)) / (m1 + m2)
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="collision"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var view = VL.setupCanvas(root.querySelector('canvas'));
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var TRACK_Y = 300;
  var X0 = 30;
  var PX_PER_M = (W - 60) / 12;

  var names = ['m1', 'v1', 'm2', 'v2', 'e'];
  var inputs = {};
  var outputs = {};
  names.forEach(function (n) {
    inputs[n] = root.querySelector('input[name="' + n + '"]');
    outputs[n] = root.querySelector('output[data-for="' + n + '"]');
  });
  var readout = {
    v1p: root.querySelector('[data-out="v1p"]'),
    v2p: root.querySelector('[data-out="v2p"]'),
    p: root.querySelector('[data-out="p"]'),
    w: root.querySelector('[data-out="w"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');
  var presets = root.querySelectorAll('[data-e]');

  var state;
  var running = false;
  var last = null;
  var lastKey = null;

  function params() {
    return {
      m1: parseFloat(inputs.m1.value),
      v1: parseFloat(inputs.v1.value),
      m2: parseFloat(inputs.m2.value),
      v2: parseFloat(inputs.v2.value),
      e: parseFloat(inputs.e.value),
    };
  }

  // Kích thước xe tăng theo log của khối lượng để 0,01 kg hay 1000 kg đều vừa khung.
  function cartWidth(m) {
    return 62 + 16 * Math.log10(1 + 10 * m);
  }

  function cartHeight(m) {
    return 36 + 6 * Math.log10(1 + 10 * m);
  }

  // Làm tròn tới khoảng 3 chữ số có nghĩa rồi chọn số chữ số thập phân tương ứng.
  function fmtAuto(v, sig) {
    sig = sig || 3;
    var r = isFinite(v) ? Number(v.toPrecision(sig)) : v;
    var a = Math.abs(r);
    var digits = a > 1e-9 && isFinite(a) ? Math.max(0, Math.min(4, sig - 1 - Math.floor(Math.log10(a)))) : 0;
    return VL.fmt(a > 1e-9 ? r : 0, digits);
  }

  function paramKey() {
    return names.map(function (n) { return inputs[n].value; }).join('|');
  }

  function solve(p) {
    var total = p.m1 * p.v1 + p.m2 * p.v2;
    var rel = p.v1 - p.v2;
    return {
      v1: (total - p.m2 * p.e * rel) / (p.m1 + p.m2),
      v2: (total + p.m1 * p.e * rel) / (p.m1 + p.m2),
    };
  }

  function updateLabels() {
    var p = params();
    outputs.m1.textContent = fmtAuto(p.m1) + ' kg';
    outputs.m2.textContent = fmtAuto(p.m2) + ' kg';
    outputs.v1.textContent = fmtAuto(p.v1) + ' m/s';
    outputs.v2.textContent = fmtAuto(p.v2) + ' m/s';
    outputs.e.textContent = VL.fmt(p.e, 2);
    presets.forEach(function (b) {
      b.setAttribute('aria-pressed', String(Math.abs(parseFloat(b.dataset.e) - p.e) < 0.001));
    });

    var pBefore = p.m1 * p.v1 + p.m2 * p.v2;
    var wBefore = 0.5 * p.m1 * p.v1 * p.v1 + 0.5 * p.m2 * p.v2 * p.v2;
    if (p.v1 <= p.v2) {
      readout.v1p.textContent = '—';
      readout.v2p.textContent = '—';
      readout.p.textContent = fmtAuto(pBefore) + ' kg·m/s';
      readout.w.textContent = 'Hai xe không gặp nhau';
      return;
    }
    var after = solve(p);
    var wAfter = 0.5 * p.m1 * after.v1 * after.v1 + 0.5 * p.m2 * after.v2 * after.v2;
    readout.v1p.textContent = fmtAuto(after.v1) + ' m/s';
    readout.v2p.textContent = fmtAuto(after.v2) + ' m/s';
    readout.p.textContent = fmtAuto(pBefore) + ' → ' + fmtAuto(p.m1 * after.v1 + p.m2 * after.v2) + ' kg·m/s';
    var lost = wBefore - wAfter;
    readout.w.textContent =
      fmtAuto(wBefore) + ' → ' + fmtAuto(wAfter) + ' J' + (lost > 1e-3 * wBefore ? ' (mất ' + fmtAuto(lost) + ' J)' : '');
  }

  // Tốc độ lớn nhất (trước và sau va chạm) để chọn tỉ lệ thời gian và độ dài mũi tên.
  function speedRef(p) {
    var after = p.v1 > p.v2 ? solve(p) : { v1: p.v1, v2: p.v2 };
    return Math.max(Math.abs(p.v1), Math.abs(p.v2), Math.abs(after.v1), Math.abs(after.v2));
  }

  function reset() {
    var p = params();
    // Chiếu chậm/tua nhanh để xe nhanh nhất đi khoảng 4 m mỗi giây trên màn hình.
    var rate = Math.max(0.001, Math.min(20, 4 / Math.max(speedRef(p), 1e-6)));
    if (rate > 0.8 && rate < 1.25) rate = 1;
    state = { x1: 3, x2: 9, v1: p.v1, v2: p.v2, collided: false, t: 0, after: 0, done: false, rate: rate };
    lastKey = paramKey();
    updateLabels();
    draw();
  }

  function step(dt) {
    var p = params();
    var s = state;
    s.t += dt;
    s.x1 += s.v1 * dt;
    s.x2 += s.v2 * dt;
    var gap = s.x2 - cartWidth(p.m2) / 2 / PX_PER_M - (s.x1 + cartWidth(p.m1) / 2 / PX_PER_M);
    if (!s.collided && gap <= 0 && s.v1 > s.v2) {
      var after = solve({ m1: p.m1, m2: p.m2, v1: s.v1, v2: s.v2, e: p.e });
      s.v1 = after.v1;
      s.v2 = after.v2;
      s.collided = true;
      s.x1 += gap / 2;
      s.x2 -= gap / 2;
    }
    if (s.collided) s.after += dt;
    var out1 = s.x1 < -1 || s.x1 > 13;
    var out2 = s.x2 < -1 || s.x2 > 13;
    if ((out1 && out2) || s.after > 3 * s.rate || s.t > 12 * s.rate) s.done = true;
  }

  function drawCart(x, m, v, color, label, vRef) {
    var w = cartWidth(m);
    var h = cartHeight(m);
    var cx = X0 + x * PX_PER_M;
    var top = TRACK_Y - h - 12;
    // Xe đã chạy ra ngoài khung: chỉ vẽ mũi tên chỉ hướng ở mép khung.
    if (cx < -w / 2 || cx > W + w / 2) {
      var side = cx < 0 ? -1 : 1;
      var ex = side < 0 ? 14 : W - 14;
      var ey = TRACK_Y - (label === 'Xe 1' ? 30 : 70); // hai xe cùng ra một phía không chồng nhãn
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(ex + side * 8, ey);
      ctx.lineTo(ex - side * 6, ey - 10);
      ctx.lineTo(ex - side * 6, ey + 10);
      ctx.closePath();
      ctx.fill();
      ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = side < 0 ? 'left' : 'right';
      ctx.fillText(label + ' (ngoài khung)', ex - side * 12, ey - 16);
      ctx.textAlign = 'left';
      return;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, top, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    [cx - w / 3, cx + w / 3].forEach(function (wx) {
      ctx.beginPath();
      ctx.arc(wx, TRACK_Y - 8, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, top + h / 2 - 2);
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText(fmtAuto(m) + ' kg', cx, top + h / 2 + 14);

    // Vectơ vận tốc phía trên xe: dài tối đa 90 px, tỉ lệ với tốc độ lớn nhất trong bài.
    var len = (90 * v) / Math.max(vRef, 1e-9);
    if (Math.abs(len) > 1) {
      var y = top - 18;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + len, y);
      ctx.stroke();
      var dir = Math.sign(len);
      ctx.beginPath();
      ctx.moveTo(cx + len + dir * 8, y);
      ctx.lineTo(cx + len - dir * 2, y - 6);
      ctx.lineTo(cx + len - dir * 2, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fmtAuto(v) + ' m/s', Math.max(40, Math.min(W - 40, cx + len / 2)), y - 10);
    }
    ctx.textAlign = 'left';
  }

  function drawBars(p) {
    // Biểu đồ cột động năng trước/sau va chạm
    var wBefore = 0.5 * p.m1 * p.v1 * p.v1 + 0.5 * p.m2 * p.v2 * p.v2;
    var after = p.v1 > p.v2 ? solve(p) : { v1: p.v1, v2: p.v2 };
    var wAfter = 0.5 * p.m1 * after.v1 * after.v1 + 0.5 * p.m2 * after.v2 * after.v2;
    var max = Math.max(wBefore, wAfter, 1e-12);
    var bx = W - 190;
    var by = 40;
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText('Động năng hệ', bx, by);
    [['Trước', wBefore, '#a5b4fc'], ['Sau', wAfter, '#ea580c']].forEach(function (row, i) {
      var y = by + 12 + i * 26;
      var len = (row[1] / max) * 120;
      ctx.fillStyle = '#eef1fa';
      ctx.fillRect(bx + 40, y, 120, 16);
      ctx.fillStyle = row[2];
      ctx.fillRect(bx + 40, y, len, 16);
      ctx.fillStyle = '#334155';
      ctx.fillText(row[0], bx, y + 12);
    });
  }

  function draw() {
    var p = params();
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);

    // Đường ray và thước đo
    ctx.fillStyle = '#334155';
    ctx.fillRect(X0 - 10, TRACK_Y, W - 40, 6);
    ctx.fillStyle = '#5b6478';
    ctx.font = '11px "Noto Sans", sans-serif';
    for (var m = 0; m <= 12; m += 2) {
      var x = X0 + m * PX_PER_M;
      ctx.fillRect(x, TRACK_Y + 6, 1, 6);
      ctx.fillText(m + ' m', x - 8, TRACK_Y + 24);
    }

    var vRef = speedRef(p);
    drawCart(state.x1, p.m1, state.v1, primary, 'Xe 1', vRef);
    drawCart(state.x2, p.m2, state.v2, accent, 'Xe 2', vRef);

    ctx.font = '600 14px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = '#1e1b4b';
    var msg = p.v1 <= p.v2 ? 'Xe 1 không đuổi kịp xe 2 — không có va chạm' : state.collided ? 'Sau va chạm' : 'Trước va chạm';
    ctx.fillText(msg, 20, 30);
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText('Chiều dương: từ trái sang phải', 20, 50);
    if (state.rate !== 1) {
      var r = state.rate;
      ctx.fillText((r < 1 ? 'Chiếu chậm ' + fmtAuto(1 / r, 2) : 'Tua nhanh ' + fmtAuto(r, 2)) + ' lần', 20, 68);
    }
    drawBars(p);
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    for (var i = 0; i < 4; i++) step(dt / 4);
    draw();
    if (state.done) {
      setRunning(false);
      return;
    }
    requestAnimationFrame(frame);
  }

  function setRunning(value) {
    running = value;
    toggleBtn.querySelector('span').textContent = running ? 'Tạm dừng' : 'Chạy';
    toggleBtn.querySelector('use').setAttribute('href', running ? '#i-pause' : '#i-play');
    if (running) {
      if (state.done) reset();
      last = null;
      requestAnimationFrame(frame);
    }
  }

  names.forEach(function (n) {
    inputs[n].addEventListener('input', function () {
      // Giá trị không đổi (ví dụ khi phóng to khung hình): chỉ vẽ lại, không đặt lại chuyển động.
      if (paramKey() === lastKey) {
        updateLabels();
        draw();
        return;
      }
      setRunning(false);
      reset();
    });
  });
  presets.forEach(function (b) {
    b.addEventListener('click', function () {
      inputs.e.value = b.dataset.e;
      setRunning(false);
      reset();
    });
  });
  toggleBtn.addEventListener('click', function () { setRunning(!running); });
  resetBtn.addEventListener('click', function () {
    setRunning(false);
    reset();
  });

  reset();
})();
