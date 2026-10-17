// Con lắc lò xo treo, điểm treo dao động cưỡng bức: x'' + 2βx' + ω0²x = ω0²·Y·cos(ωt).
// Biên độ ổn định: A = ω0²Y / √((ω0² − ω²)² + (2βω)²) — lớn nhất khi ω ≈ ω0 (cộng hưởng).
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="resonance"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var view = VL.setupCanvas(root.querySelector('canvas'));
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var Y_DRIVE = 0.5; // biên độ điểm treo, cm
  var PX_PER_CM = 4;
  var REST_Y = 230; // vị trí cân bằng của vật (px)
  var SUPPORT_Y = 60;
  var PLOT = { x: 330, y: 40, w: 360, h: 280 };
  var F_MAX = 3;

  var inputs = {
    fd: root.querySelector('input[name="fd"]'),
    f0: root.querySelector('input[name="f0"]'),
    damp: root.querySelector('input[name="damp"]'),
  };
  var outputs = {
    fd: root.querySelector('output[data-for="fd"]'),
    f0: root.querySelector('output[data-for="f0"]'),
    damp: root.querySelector('output[data-for="damp"]'),
  };
  var readout = {
    ratio: root.querySelector('[data-out="ratio"]'),
    amp: root.querySelector('[data-out="amp"]'),
    steady: root.querySelector('[data-out="steady"]'),
    time: root.querySelector('[data-out="time"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');
  var matchBtn = root.querySelector('[data-action="match"]');

  var s;
  var running = false;
  var last = null;

  function params() {
    var fd = parseFloat(inputs.fd.value);
    var f0 = parseFloat(inputs.f0.value);
    return { fd: fd, f0: f0, w: 2 * Math.PI * fd, w0: 2 * Math.PI * f0, beta: parseFloat(inputs.damp.value) };
  }

  function steadyAmp(p, w) {
    var w0sq = p.w0 * p.w0;
    return (w0sq * Y_DRIVE) / Math.sqrt(Math.pow(w0sq - w * w, 2) + Math.pow(2 * p.beta * w, 2));
  }

  function updateLabels() {
    var p = params();
    outputs.fd.textContent = VL.fmt(p.fd, 2) + ' Hz';
    outputs.f0.textContent = VL.fmt(p.f0, 2) + ' Hz';
    outputs.damp.textContent = p.beta < 0.3 ? 'Nhỏ' : p.beta < 0.8 ? 'Vừa' : 'Lớn';
    readout.ratio.textContent = VL.fmt(p.fd / p.f0, 2);
    readout.steady.textContent = VL.fmt(steadyAmp(p, p.w), 1) + ' cm';
  }

  function reset() {
    s = { x: 0, v: 0, t: 0, peak: 0, history: [] };
    updateLabels();
    readout.amp.textContent = '0,0 cm';
    readout.time.textContent = '0,0 s';
    draw();
  }

  function accel(p, x, v, t) {
    return -2 * p.beta * v - p.w0 * p.w0 * x + p.w0 * p.w0 * Y_DRIVE * Math.cos(p.w * t);
  }

  function step(p, dt) {
    // RK4
    var x = s.x;
    var v = s.v;
    var t = s.t;
    var k1x = v;
    var k1v = accel(p, x, v, t);
    var k2x = v + (k1v * dt) / 2;
    var k2v = accel(p, x + (k1x * dt) / 2, v + (k1v * dt) / 2, t + dt / 2);
    var k3x = v + (k2v * dt) / 2;
    var k3v = accel(p, x + (k2x * dt) / 2, v + (k2v * dt) / 2, t + dt / 2);
    var k4x = v + k3v * dt;
    var k4v = accel(p, x + k3x * dt, v + k3v * dt, t + dt);
    s.x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    s.v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    s.t += dt;
  }

  function drawSpring(x, y1, y2, coils) {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    var lead = 10;
    ctx.lineTo(x, y1 + lead);
    var span = y2 - y1 - 2 * lead;
    for (var i = 0; i <= coils * 2; i++) {
      var yy = y1 + lead + (span * i) / (coils * 2);
      ctx.lineTo(x + (i === 0 || i === coils * 2 ? 0 : i % 2 ? 14 : -14), yy);
    }
    ctx.lineTo(x, y2);
    ctx.stroke();
  }

  function draw() {
    var p = params();
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);

    // --- Con lắc lò xo bên trái ---
    var cx = 150;
    var supportOffset = Y_DRIVE * Math.cos(p.w * s.t) * PX_PER_CM * 6; // phóng to chuyển động điểm treo để dễ thấy
    var sy = SUPPORT_Y + supportOffset;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx - 50, sy - 10, 100, 10);
    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText('Điểm treo dao động', cx - 52, SUPPORT_Y - 22);
    var massY = Math.max(sy + 40, Math.min(H - 30, REST_Y + s.x * PX_PER_CM));
    drawSpring(cx, sy, massY - 22, 9);
    ctx.fillStyle = accent;
    ctx.fillRect(cx - 28, massY - 22, 56, 44);
    // Vạch vị trí cân bằng
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = '#a5b4fc';
    ctx.beginPath();
    ctx.moveTo(cx - 70, REST_Y);
    ctx.lineTo(cx + 70, REST_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (Math.abs(s.x * PX_PER_CM) > H - 30 - REST_Y) {
      ctx.fillStyle = '#dc2626';
      ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
      ctx.fillText('Biên độ vượt khung hình!', cx - 70, H - 8);
    }

    // --- Đồ thị biên độ theo tần số bên phải ---
    var maxA = steadyAmp(p, p.w0 * Math.sqrt(Math.max(0, 1 - (2 * p.beta * p.beta) / (p.w0 * p.w0)))) * 1.1;
    maxA = Math.max(maxA, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PLOT.x, PLOT.y);
    ctx.lineTo(PLOT.x, PLOT.y + PLOT.h);
    ctx.lineTo(PLOT.x + PLOT.w, PLOT.y + PLOT.h);
    ctx.stroke();
    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText('Biên độ (cm)', PLOT.x + 6, PLOT.y + 14);
    ctx.fillText('f (Hz)', PLOT.x + PLOT.w - 36, PLOT.y + PLOT.h + 30);
    for (var f = 0; f <= F_MAX; f += 0.5) {
      var gx = PLOT.x + (f / F_MAX) * PLOT.w;
      ctx.fillText(VL.fmt(f, 1), gx - 8, PLOT.y + PLOT.h + 16);
    }
    // f0
    var f0x = PLOT.x + (p.f0 / F_MAX) * PLOT.w;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#a5b4fc';
    ctx.beginPath();
    ctx.moveTo(f0x, PLOT.y);
    ctx.lineTo(f0x, PLOT.y + PLOT.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = primary;
    ctx.fillText('f₀', f0x + 4, PLOT.y + 30);
    // đường cộng hưởng
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 240; i++) {
      var fi = 0.02 + (i / 240) * (F_MAX - 0.02);
      var A = steadyAmp(p, 2 * Math.PI * fi);
      var px = PLOT.x + (fi / F_MAX) * PLOT.w;
      var py = PLOT.y + PLOT.h - Math.min(1, A / maxA) * (PLOT.h - 20);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // điểm hiện tại
    var curX = PLOT.x + (p.fd / F_MAX) * PLOT.w;
    var curY = PLOT.y + PLOT.h - Math.min(1, steadyAmp(p, p.w) / maxA) * (PLOT.h - 20);
    var measY = PLOT.y + PLOT.h - Math.min(1, s.peak / maxA) * (PLOT.h - 20);
    ctx.fillStyle = '#c7cde0';
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(curX, measY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText('● cam: biên độ đang đo · ● xám: khi ổn định', PLOT.x + 6, PLOT.y + PLOT.h + 48);
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    var p = params();
    var n = 10;
    for (var i = 0; i < n; i++) step(p, dt / n);
    // Biên độ đang đo: lớn nhất của |x| trong khoảng một chu kì ngoại lực gần nhất
    s.history.push({ t: s.t, x: Math.abs(s.x) });
    var span = Math.max(1 / p.fd, 1 / p.f0);
    while (s.history.length && s.history[0].t < s.t - span) s.history.shift();
    s.peak = s.history.reduce(function (m, h) { return Math.max(m, h.x); }, 0);
    readout.amp.textContent = VL.fmt(s.peak, 1) + ' cm';
    readout.time.textContent = VL.fmt(s.t, 1) + ' s';
    draw();
    requestAnimationFrame(frame);
  }

  function setRunning(value) {
    running = value;
    toggleBtn.querySelector('span').textContent = running ? 'Tạm dừng' : 'Chạy';
    toggleBtn.querySelector('use').setAttribute('href', running ? '#i-pause' : '#i-play');
    if (running) {
      last = null;
      requestAnimationFrame(frame);
    }
  }

  ['fd', 'f0', 'damp'].forEach(function (n) {
    inputs[n].addEventListener('input', function () {
      updateLabels();
      if (!running) draw();
    });
  });
  matchBtn.addEventListener('click', function () {
    inputs.fd.value = inputs.f0.value;
    updateLabels();
    if (!running) setRunning(true);
  });
  toggleBtn.addEventListener('click', function () { setRunning(!running); });
  resetBtn.addEventListener('click', function () {
    setRunning(false);
    reset();
  });

  reset();
})();
