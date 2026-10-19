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
  var BOB_R = 16;

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
  var lastKey = null;

  // Làm tròn tới khoảng 3 chữ số có nghĩa rồi chọn số chữ số thập phân tương ứng.
  function fmtAuto(v, sig) {
    sig = sig || 3;
    var r = isFinite(v) ? Number(v.toPrecision(sig)) : v;
    var a = Math.abs(r);
    var digits = a > 1e-9 && isFinite(a) ? Math.max(0, Math.min(4, sig - 1 - Math.floor(Math.log10(a)))) : 0;
    return VL.fmt(a > 1e-9 ? r : 0, digits);
  }

  function paramKey() {
    return [inputs.length.value, inputs.gravity.value, inputs.angle.value].join('|');
  }

  function niceStep(span, count) {
    var raw = span / count;
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / pow;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
  }

  // Khung nhìn theo các mức 1 – 2,5 – 5 × 10ⁿ mét: trong cùng một mức, đổi chiều dài vẫn thấy dây dài/ngắn đi.
  function viewSpan(l) {
    var pow = Math.pow(10, Math.floor(Math.log10(l)));
    var n = l / pow;
    return (n <= 1 + 1e-9 ? 1 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  }

  // Tỉ lệ px/m tính theo chiều dài dây và biên độ để con lắc luôn vừa khung.
  function pxPerM(p) {
    var down = (H - PIVOT.y - BOB_R - 12) / viewSpan(p.l);
    var side = (W / 2 - 90) / (p.l * Math.max(Math.sin(p.theta0), 0.05));
    return Math.min(down, side);
  }

  // Chu kì nhỏ quá thì chiếu chậm, lớn quá thì tua nhanh (chu kì trên màn hình khoảng 0,8–8 s).
  function playbackRate(p) {
    var T = 2 * Math.PI * Math.sqrt(p.l / p.g);
    var rate = T / Math.max(0.8, Math.min(8, T));
    return rate > 0.8 && rate < 1.25 ? 1 : rate;
  }

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
    lastKey = paramKey();
    updateLabels();
    readout.measured.textContent = '—';
    readout.count.textContent = '0';
    draw();
  }

  function updateLabels() {
    var p = params();
    outputs.length.textContent = fmtAuto(p.l) + ' m';
    outputs.gravity.textContent = fmtAuto(p.g) + ' m/s²';
    outputs.angle.textContent = fmtAuto(parseFloat(inputs.angle.value)) + '°';
    readout.theory.textContent = fmtAuto(2 * Math.PI * Math.sqrt(p.l / p.g), 4) + ' s';
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

  function bobPosition(theta) {
    var p = params();
    var lpx = p.l * pxPerM(p);
    return { x: PIVOT.x + lpx * Math.sin(theta), y: PIVOT.y + lpx * Math.cos(theta) };
  }

  function draw() {
    var p = params();
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);

    // Thước đo chiều dài: bước chia "đẹp" theo tỉ lệ hiện tại
    var scale = pxPerM(p);
    var tick = niceStep((H - PIVOT.y - 20) / scale, 5);
    var digits = Math.max(0, Math.min(4, -Math.floor(Math.log10(tick) + 1e-9)));
    ctx.strokeStyle = '#dfe3f0';
    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, PIVOT.y);
    ctx.lineTo(30, H - 10);
    ctx.stroke();
    for (var i = 1; PIVOT.y + i * tick * scale <= H - 8 && i < 50; i++) {
      var y = PIVOT.y + i * tick * scale;
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(36, y);
      ctx.stroke();
      ctx.fillText(VL.fmt(i * tick, digits) + ' m', 40, y + 4);
    }

    // Đường thẳng đứng và cung biên độ
    var lpx = p.l * scale;
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

    // Vết chuyển động (lưu theo góc nên luôn khớp tỉ lệ hiện tại)
    state.trail.forEach(function (theta, i) {
      var pt = bobPosition(theta);
      ctx.fillStyle = 'rgba(234, 88, 12,' + (i / state.trail.length) * 0.35 + ')';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dây và vật nặng
    var bob = bobPosition(state.theta);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PIVOT.x, PIVOT.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, BOB_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Góc lệch hiện tại
    ctx.fillStyle = primary;
    ctx.font = '600 14px "Be Vietnam Pro", sans-serif';
    ctx.fillText('θ = ' + VL.fmt((state.theta * 180) / Math.PI, 1) + '°', W - 130, 30);
    ctx.fillText('t = ' + VL.fmt(state.t, 2) + ' s', W - 130, 52);
    var rate = playbackRate(p);
    if (rate !== 1) {
      ctx.fillStyle = '#5b6478';
      ctx.font = '12px "Noto Sans", sans-serif';
      ctx.fillText(rate < 1 ? 'Chiếu chậm ' + fmtAuto(1 / rate, 2) + ' lần' : 'Tua nhanh ' + fmtAuto(rate, 2) + ' lần', W - 130, 72);
    }
  }

  function frame(now) {
    if (!running) return;
    var p = params();
    var elapsed = lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, 0.05) * playbackRate(p);
    lastFrame = now;
    // Số bước con đủ nhỏ so với tần số góc (ω·dt ≤ 0,05) để RK4 luôn ổn định.
    var omega0 = Math.sqrt(p.g / p.l);
    var substeps = Math.max(8, Math.min(5000, Math.ceil((elapsed * omega0) / 0.05)));
    for (var i = 0; i < substeps; i++) step(elapsed / substeps);

    state.trail.push(state.theta);
    if (state.trail.length > 40) state.trail.shift();

    if (state.periods.length) {
      var recent = state.periods.slice(-3);
      var avg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
      readout.measured.textContent = fmtAuto(avg, 4) + ' s';
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
      // Giá trị không đổi (ví dụ khi phóng to khung hình): chỉ vẽ lại, không đặt lại dao động.
      if (paramKey() === lastKey) {
        updateLabels();
        draw();
        return;
      }
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
