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
  var BOTTOM = { x: 650, y: 360 };
  var SLOPE_PX = 540;
  var BLOCK = 46;

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
    outputs.angle.textContent = inputs.angle.value + '°';
    outputs.mass.textContent = VL.fmt(p.m, 1) + ' kg';
    outputs.mus.textContent = VL.fmt(p.mus, 2);
    outputs.muk.textContent = VL.fmt(p.muk, 2);
    outputs.pull.textContent = p.F + ' N';

    var r = analyse(p, sim && sim.moving, sim ? sim.v : 0);
    var labels = { rest: 'Đứng yên', up: 'Trượt lên dốc', down: 'Trượt xuống dốc' };
    readout.state.textContent = labels[r.state];
    readout.acc.textContent = VL.fmt(Math.abs(r.a), 2) + ' m/s²';
    readout.normal.textContent = VL.fmt(r.N, 1) + ' N';
    readout.friction.textContent = VL.fmt(Math.abs(r.friction), 1) + ' N (' + r.kind + ')';
  }

  function reset() {
    sim = { s: LENGTH / 2, v: 0, moving: false, t: 0, done: false };
    updateLabels();
    draw();
  }

  function slopePoint(s) {
    var p = params();
    var px = (s / LENGTH) * SLOPE_PX;
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
    ctx.font = '700 12px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(VL.fmt(p.m, 1) + ' kg', 0, -BLOCK / 2 + 4);
    ctx.textAlign = 'left';
    ctx.restore();

    if (showVectors.checked) {
      var r = analyse(p, sim.moving, sim.v);
      var scale = Math.min(2.2, 110 / Math.max(r.P, 1));
      // Tâm vật (lệch khỏi mặt dốc theo pháp tuyến)
      var nx = Math.sin(p.alpha);
      var ny = -Math.cos(p.alpha);
      var cx = c.x + nx * BLOCK / 2;
      var cy = c.y + ny * BLOCK / 2;
      var upx = -Math.cos(p.alpha);
      var upy = -Math.sin(p.alpha);
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
    if (sim.done) {
      ctx.fillStyle = accent;
      ctx.font = '600 13px "Be Vietnam Pro", sans-serif';
      ctx.fillText(sim.s <= 0 ? 'Vật đã tới chân dốc' : sim.s >= LENGTH ? 'Vật đã tới đỉnh dốc' : 'Vật đứng yên', 20, 96);
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    var p = params();
    var r = analyse(p, sim.moving, sim.v);
    if (r.state === 'rest') {
      sim.done = true;
    } else {
      sim.moving = true;
      var vBefore = sim.v;
      sim.v += r.a * dt;
      // Vật đang trượt chậm dần mà đổi chiều thì dừng lại (ma sát nghỉ giữ).
      if (vBefore !== 0 && Math.sign(sim.v) !== Math.sign(vBefore)) {
        sim.v = 0;
        sim.moving = false;
      }
      sim.s += sim.v * dt;
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

  names.forEach(function (n) {
    inputs[n].addEventListener('input', function () {
      // Hệ số ma sát trượt không vượt quá hệ số ma sát nghỉ.
      if (n === 'muk' && parseFloat(inputs.muk.value) > parseFloat(inputs.mus.value)) inputs.mus.value = inputs.muk.value;
      if (n === 'mus' && parseFloat(inputs.mus.value) < parseFloat(inputs.muk.value)) inputs.muk.value = inputs.mus.value;
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
