// Mô phỏng con lắc đơn: tích phân phương trình phi tuyến θ'' = -(g/l)·sin θ bằng RK4,
// đo chu kì thực tế qua các lần vật đi qua vị trí cân bằng theo cùng một chiều.
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="pendulum"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var canvas = root.querySelector('canvas');
  var view = VL.setupCanvas(canvas);
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var PIVOT = { x: W / 2, y: 36 };
  var PX_PER_M = (H - 80) / 2.5;

  var inputs = {
    length: root.querySelector('input[name="length"]'),
    gravity: root.querySelector('input[name="gravity"]'),
    angle: root.querySelector('input[name="angle"]'),
  };
  var outputs = {
    length: root.querySelector('output[data-for="length"]'),
    gravity: root.querySelector('output[data-for="gravity"]'),
    angle: root.querySelector('output[data-for="angle"]'),
  };
  var readout = {
    theory: root.querySelector('[data-out="theory"]'),
    measured: root.querySelector('[data-out="measured"]'),
    count: root.querySelector('[data-out="count"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');
  var presets = root.querySelectorAll('[data-gravity]');

  var state;
  var running = false;
  var lastFrame = null;

  function params() {
    return {
      l: parseFloat(inputs.length.value),
      g: parseFloat(inputs.gravity.value),
      theta0: (parseFloat(inputs.angle.value) * Math.PI) / 180,
    };
  }

  function reset() {
    var p = params();
    state = { theta: p.theta0, omega: 0, t: 0, lastCrossing: null, periods: [], trail: [] };
    updateLabels();
    readout.measured.textContent = '—';
    readout.count.textContent = '0';
    draw();
  }

  function updateLabels() {
    var p = params();
    outputs.length.textContent = VL.fmt(p.l, 2) + ' m';
    outputs.gravity.textContent = VL.fmt(p.g, 2) + ' m/s²';
    outputs.angle.textContent = inputs.angle.value + '°';
    readout.theory.textContent = VL.fmt(2 * Math.PI * Math.sqrt(p.l / p.g), 3) + ' s';
    presets.forEach(function (b) {
      b.setAttribute('aria-pressed', String(Math.abs(parseFloat(b.dataset.gravity) - p.g) < 0.02));
    });
  }

  function accel(theta, p) {
    return -(p.g / p.l) * Math.sin(theta);
  }

  function step(dt) {
    var p = params();
    var s = state;
    var k1t = s.omega;
    var k1w = accel(s.theta, p);
    var k2t = s.omega + (k1w * dt) / 2;
    var k2w = accel(s.theta + (k1t * dt) / 2, p);
    var k3t = s.omega + (k2w * dt) / 2;
    var k3w = accel(s.theta + (k2t * dt) / 2, p);
    var k4t = s.omega + k3w * dt;
    var k4w = accel(s.theta + k3t * dt, p);
    var prevTheta = s.theta;
    s.theta += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    s.omega += (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    s.t += dt;

    // Đi qua vị trí cân bằng từ trái sang phải: nội suy thời điểm chính xác.
    if (prevTheta < 0 && s.theta >= 0) {
      var crossing = s.t - dt * (s.theta / (s.theta - prevTheta));
      if (s.lastCrossing !== null) s.periods.push(crossing - s.lastCrossing);
      s.lastCrossing = crossing;
    }
  }

  function bobPosition() {
    var lpx = params().l * PX_PER_M;
    return { x: PIVOT.x + lpx * Math.sin(state.theta), y: PIVOT.y + lpx * Math.cos(state.theta) };
  }

  function draw() {
    var p = params();
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);

    // Thước đo chiều dài
    ctx.strokeStyle = '#dfe3f0';
    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.lineWidth = 1;
    for (var m = 0.5; m <= 2.5; m += 0.5) {
      var y = PIVOT.y + m * PX_PER_M;
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(36, y);
      ctx.stroke();
      ctx.fillText(VL.fmt(m, 1) + ' m', 40, y + 4);
    }

    // Đường thẳng đứng và cung biên độ
    var lpx = p.l * PX_PER_M;
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = '#c7cde0';
    ctx.beginPath();
    ctx.moveTo(PIVOT.x, PIVOT.y);
    ctx.lineTo(PIVOT.x, PIVOT.y + lpx + 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(PIVOT.x, PIVOT.y, lpx, Math.PI / 2 - p.theta0, Math.PI / 2 + p.theta0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Giá treo
    ctx.fillStyle = '#334155';
    ctx.fillRect(PIVOT.x - 60, PIVOT.y - 10, 120, 8);

    // Vết chuyển động
    state.trail.forEach(function (pt, i) {
      ctx.fillStyle = 'rgba(234, 88, 12,' + (i / state.trail.length) * 0.35 + ')';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dây và vật nặng
    var bob = bobPosition();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PIVOT.x, PIVOT.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Góc lệch hiện tại
    ctx.fillStyle = primary;
    ctx.font = '600 14px "Be Vietnam Pro", sans-serif';
    ctx.fillText('θ = ' + VL.fmt((state.theta * 180) / Math.PI, 1) + '°', W - 130, 30);
    ctx.fillText('t = ' + VL.fmt(state.t, 2) + ' s', W - 130, 52);
  }

  function frame(now) {
    if (!running) return;
    var elapsed = lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    var substeps = 8;
    for (var i = 0; i < substeps; i++) step(elapsed / substeps);

    state.trail.push(bobPosition());
    if (state.trail.length > 40) state.trail.shift();

    if (state.periods.length) {
      var recent = state.periods.slice(-3);
      var avg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
      readout.measured.textContent = VL.fmt(avg, 3) + ' s';
    }
    readout.count.textContent = String(state.periods.length);
    draw();
    requestAnimationFrame(frame);
  }

  function setRunning(value) {
    running = value;
    toggleBtn.querySelector('span').textContent = running ? 'Tạm dừng' : 'Chạy';
    toggleBtn.querySelector('use').setAttribute('href', running ? '#i-pause' : '#i-play');
    if (running) {
      lastFrame = null;
      requestAnimationFrame(frame);
    }
  }

  Object.keys(inputs).forEach(function (key) {
    inputs[key].addEventListener('input', function () {
      setRunning(false);
      reset();
    });
  });
  presets.forEach(function (btn) {
    btn.addEventListener('click', function () {
      inputs.gravity.value = btn.dataset.gravity;
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
