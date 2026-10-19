// Vật trên mặt phẳng nghiêng có ma sát nghỉ/trượt và lực kéo song song mặt dốc (hướng lên).
// Trục s dọc mặt dốc, chiều dương hướng lên dốc. Dốc dài 5 m, vật thả từ giữa dốc.
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="incline"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var view = VL.setupCanvas(root.querySelector('canvas'));
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var G = 9.8;
  var LENGTH = 5;
  var BOTTOM = { x: 650, y: 345 };
  var BLOCK = 52;

  var names = ['angle', 'mass', 'mus', 'muk', 'pull'];
  var inputs = {};
  var outputs = {};
  names.forEach(function (n) {
    inputs[n] = root.querySelector('input[name="' + n + '"]');
    outputs[n] = root.querySelector('output[data-for="' + n + '"]');
  });
  var showVectors = root.querySelector('input[name="vectors"]');
  var readout = {
    state: root.querySelector('[data-out="state"]'),
    acc: root.querySelector('[data-out="acc"]'),
    normal: root.querySelector('[data-out="normal"]'),
    friction: root.querySelector('[data-out="friction"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');

  var sim;
  var running = false;
  var last = null;
  var lastKey = null;

  // Làm tròn tới khoảng 3 chữ số có nghĩa rồi chọn số chữ số thập phân tương ứng.
  function fmtAuto(v, sig) {
    sig = sig || 3;
    var r = isFinite(v) ? Number(v.toPrecision(sig)) : v;
    var a = Math.abs(r);
    var digits = a > 1e-9 && isFinite(a) ? Math.max(0, Math.min(6, sig - 1 - Math.floor(Math.log10(a)))) : 0;
    return VL.fmt(a > 1e-9 ? r : 0, digits);
  }

  function paramKey() {
    return names.map(function (n) { return inputs[n].value; }).join('|');
  }

  // Chiều dài mặt dốc trên màn hình (px): vừa khung với mọi góc 0–90°.
  function slopePx(alpha) {
    var byWidth = (BOTTOM.x - 60) / Math.max(Math.cos(alpha), 1e-9);
    var byHeight = (BOTTOM.y - 165) / Math.max(Math.sin(alpha), 1e-9);
    return Math.min(byWidth, byHeight);
  }

  function params() {
    return {
      alpha: (parseFloat(inputs.angle.value) * Math.PI) / 180,
      m: parseFloat(inputs.mass.value),
      mus: parseFloat(inputs.mus.value),
      muk: parseFloat(inputs.muk.value),
      F: parseFloat(inputs.pull.value),
    };
  }

  // Phân tích lực: trả về trạng thái, gia tốc (dọc dốc, dương = lên dốc) và các lực.
  function analyse(p, moving, velocity) {
    var P = p.m * G;
    var N = P * Math.cos(p.alpha);
    var along = p.F - P * Math.sin(p.alpha); // hợp lực dọc dốc khi chưa kể ma sát
    if (!moving) {
      if (Math.abs(along) <= p.mus * N + 1e-9) {
        return { state: 'rest', a: 0, N: N, friction: -along, kind: 'nghỉ', P: P };
      }
      var dir = Math.sign(along);
      return { state: dir > 0 ? 'up' : 'down', a: (along - dir * p.muk * N) / p.m, N: N, friction: -dir * p.muk * N, kind: 'trượt', P: P };
    }
    var vdir = Math.sign(velocity);
    return { state: vdir > 0 ? 'up' : 'down', a: (along - vdir * p.muk * N) / p.m, N: N, friction: -vdir * p.muk * N, kind: 'trượt', P: P };
  }

  function updateLabels() {
    var p = params();
    outputs.angle.textContent = fmtAuto(parseFloat(inputs.angle.value)) + '°';
    outputs.mass.textContent = fmtAuto(p.m) + ' kg';
    outputs.mus.textContent = VL.fmt(p.mus, 2);
    outputs.muk.textContent = VL.fmt(p.muk, 2);
    outputs.pull.textContent = fmtAuto(p.F) + ' N';

    var r = analyse(p, sim && sim.moving, sim ? sim.v : 0);
    var labels = { rest: 'Đứng yên', up: 'Trượt lên dốc', down: 'Trượt xuống dốc' };
    readout.state.textContent = labels[r.state];
    readout.acc.textContent = fmtAuto(Math.abs(r.a)) + ' m/s²';
    readout.normal.textContent = fmtAuto(r.N) + ' N';
    readout.friction.textContent = fmtAuto(Math.abs(r.friction)) + ' N (' + r.kind + ')';
  }

  function reset() {
    // Gia tốc không đổi khi trượt: chọn tỉ lệ thời gian để vật tới đầu dốc sau khoảng 1,5–6 giây trên màn hình.
    var r = analyse(params(), false, 0);
    var rate = 1;
    if (r.state !== 'rest' && Math.abs(r.a) > 0) {
      var tEnd = Math.sqrt(LENGTH / Math.abs(r.a));
      rate = tEnd / Math.max(1.5, Math.min(6, tEnd));
      if (rate > 0.8 && rate < 1.25) rate = 1;
    }
    sim = { s: LENGTH / 2, v: 0, moving: false, t: 0, done: false, rate: rate };
    lastKey = paramKey();
    updateLabels();
    draw();
  }

  function slopePoint(s) {
    var p = params();
    var px = (s / LENGTH) * slopePx(p.alpha);
    return { x: BOTTOM.x - px * Math.cos(p.alpha), y: BOTTOM.y - px * Math.sin(p.alpha) };
  }

  function arrow(x, y, dx, dy, color, label) {
    var len = Math.hypot(dx, dy);
    if (len < 2) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    var ux = dx / len;
    var uy = dy / len;
    ctx.beginPath();
    ctx.moveTo(x + dx + ux * 8, y + dy + uy * 8);
    ctx.lineTo(x + dx - uy * 6, y + dy + ux * 6);
    ctx.lineTo(x + dx + uy * 6, y + dy - ux * 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 13px "Be Vietnam Pro", sans-serif';
    ctx.fillText(label, x + dx + ux * 14 - 6, y + dy + uy * 14 + 4);
  }

  function draw() {
    var p = params();
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);

    // Mặt dốc
    var top = slopePoint(LENGTH);
    ctx.fillStyle = '#e6e9f4';
    ctx.beginPath();
    ctx.moveTo(BOTTOM.x, BOTTOM.y);
    ctx.lineTo(top.x, top.y);
    ctx.lineTo(top.x, BOTTOM.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(BOTTOM.x, BOTTOM.y);
    ctx.lineTo(40, BOTTOM.y);
    ctx.stroke();

    // Cung góc
    ctx.strokeStyle = primary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(BOTTOM.x, BOTTOM.y, 50, Math.PI, Math.PI + p.alpha);
    ctx.stroke();
    ctx.fillStyle = primary;
    ctx.font = '600 13px "Be Vietnam Pro", sans-serif';
    ctx.fillText('α = ' + inputs.angle.value + '°', BOTTOM.x - 120, BOTTOM.y - 10);

    // Vật
    var c = slopePoint(sim.s);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(p.alpha);
    ctx.fillStyle = accent;
    ctx.fillRect(-BLOCK / 2, -BLOCK, BLOCK, BLOCK);
    ctx.fillStyle = '#fff';
    ctx.font = '700 11px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fmtAuto(p.m) + ' kg', 0, -BLOCK / 2 + 4, BLOCK - 4);
    ctx.textAlign = 'left';
    ctx.restore();

    if (showVectors.checked) {
      var r = analyse(p, sim.moving, sim.v);
      // Lực lớn nhất dài tối đa 110 px, các lực khác theo cùng tỉ lệ.
      var maxF = Math.max(r.P, r.N, Math.abs(r.friction), p.F, 1e-12);
      var scale = Math.min(2.2, 110 / maxF);
      // Tâm vật (lệch khỏi mặt dốc theo pháp tuyến)
      var nx = Math.sin(p.alpha);
      var ny = -Math.cos(p.alpha);
      var cx = c.x + nx * BLOCK / 2;
      var cy = c.y + ny * BLOCK / 2;
      var upx = -Math.cos(p.alpha);
      var upy = -Math.sin(p.alpha);
      // Thu nhỏ đồng loạt mọi vectơ nếu có vectơ chạm mép khung (vẫn giữ tỉ lệ giữa các lực).
      [[0, 1, r.P], [nx, ny, r.N], [upx, upy, r.friction], [upx, upy, p.F]].forEach(function (f) {
        var ux = f[0] * Math.sign(f[2]);
        var uy = f[1] * Math.sign(f[2]);
        var mag = Math.abs(f[2]);
        if (mag * scale < 2) return;
        var tx = ux > 1e-9 ? (W - cx) / ux : ux < -1e-9 ? cx / -ux : Infinity;
        var ty = uy > 1e-9 ? (H - cy) / uy : uy < -1e-9 ? cy / -uy : Infinity;
        var room = Math.min(tx, ty) - 26;
        if (room > 0) scale = Math.min(scale, room / mag);
      });
      scale = Math.max(scale, 30 / maxF);
      arrow(cx, cy, 0, r.P * scale, '#1e1b4b', 'P');
      arrow(cx, cy, nx * r.N * scale, ny * r.N * scale, '#0e7490', 'N');
      if (Math.abs(r.friction) > 0.01) arrow(cx, cy, upx * r.friction * scale, upy * r.friction * scale, '#dc2626', 'Fms');
      if (p.F > 0) arrow(cx, cy, upx * p.F * scale, upy * p.F * scale, '#15803d', 'F');
    }

    ctx.fillStyle = '#1e1b4b';
    ctx.font = '600 14px "Be Vietnam Pro", sans-serif';
    ctx.fillText('v = ' + VL.fmt(Math.abs(sim.v), 2) + ' m/s', 20, 30);
    ctx.fillText('t = ' + VL.fmt(sim.t, 2) + ' s', 20, 52);
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText('Dốc dài 5 m, g = 9,8 m/s². Vật thả không vận tốc đầu từ giữa dốc.', 20, 74);
    if (sim.rate !== 1) {
      ctx.fillText(sim.rate < 1 ? 'Chiếu chậm ' + fmtAuto(1 / sim.rate, 2) + ' lần' : 'Tua nhanh ' + fmtAuto(sim.rate, 2) + ' lần', 20, 92);
    }
    if (sim.done) {
      ctx.fillStyle = accent;
      ctx.font = '600 13px "Be Vietnam Pro", sans-serif';
      ctx.fillText(sim.s <= 0 ? 'Vật đã tới chân dốc' : sim.s >= LENGTH ? 'Vật đã tới đỉnh dốc' : 'Vật đứng yên', 20, 112);
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05) * sim.rate;
    last = now;
    var p = params();
    var r = analyse(p, sim.moving, sim.v);
    if (r.state === 'rest') {
      sim.done = true;
    } else {
      sim.moving = true;
      var vBefore = sim.v;
      // Gia tốc không đổi trong bước: cập nhật đúng theo công thức chuyển động biến đổi đều.
      sim.s += vBefore * dt + 0.5 * r.a * dt * dt;
      sim.v += r.a * dt;
      // Vật đang trượt chậm dần mà đổi chiều thì dừng lại (ma sát nghỉ giữ).
      if (vBefore !== 0 && Math.sign(sim.v) !== Math.sign(vBefore)) {
        sim.v = 0;
        sim.moving = false;
      }
      sim.t += dt;
      if (sim.s <= 0 || sim.s >= LENGTH) {
        sim.s = Math.max(0, Math.min(LENGTH, sim.s));
        sim.done = true;
      }
    }
    updateLabels();
    draw();
    if (sim.done) return setRunning(false);
    requestAnimationFrame(frame);
  }

  function setRunning(value) {
    running = value;
    toggleBtn.querySelector('span').textContent = running ? 'Tạm dừng' : 'Thả vật';
    toggleBtn.querySelector('use').setAttribute('href', running ? '#i-pause' : '#i-play');
    if (running) {
      if (sim.done) reset();
      last = null;
      requestAnimationFrame(frame);
    }
  }

  // Gán giá trị cho thanh trượt, mở rộng min/max nếu cần để trình duyệt không cắt bớt giá trị.
  function setValue(input, value) {
    var v = parseFloat(value);
    if (v > parseFloat(input.max)) input.max = String(v);
    if (v < parseFloat(input.min)) input.min = String(v);
    input.value = String(v);
  }

  names.forEach(function (n) {
    inputs[n].addEventListener('input', function () {
      // Hệ số ma sát trượt không vượt quá hệ số ma sát nghỉ.
      if (n === 'muk' && parseFloat(inputs.muk.value) > parseFloat(inputs.mus.value)) setValue(inputs.mus, inputs.muk.value);
      if (n === 'mus' && parseFloat(inputs.mus.value) < parseFloat(inputs.muk.value)) setValue(inputs.muk, inputs.mus.value);
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
  showVectors.addEventListener('change', draw);
  toggleBtn.addEventListener('click', function () { setRunning(!running); });
  resetBtn.addEventListener('click', function () {
    setRunning(false);
    reset();
  });

  reset();
})();
