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
  var MAX_PX_PER_CM = 4;
  var SWING_PX = 115; // độ lệch lớn nhất của vật trên màn hình (px)
  var REST_Y = 230; // vị trí cân bằng của vật (px)
  var SUPPORT_Y = 60;
  var PLOT = { x: 340, y: 40, w: 350, h: 280 };

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
  var dispScale = MAX_PX_PER_CM; // px/cm đang dùng để vẽ vật (tự co giãn theo biên độ)

  // Làm tròn tới khoảng 3 chữ số có nghĩa rồi chọn số chữ số thập phân tương ứng.
  function fmtAuto(v, sig) {
    sig = sig || 3;
    var r = isFinite(v) ? Number(v.toPrecision(sig)) : v;
    var a = Math.abs(r);
    var digits = a > 1e-9 && isFinite(a) ? Math.max(0, Math.min(4, sig - 1 - Math.floor(Math.log10(a)))) : 0;
    return VL.fmt(a > 1e-9 ? r : 0, digits);
  }

  function niceStep(span, count) {
    var raw = span / count;
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / pow;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
  }

  function stepDigits(step) {
    return Math.max(0, Math.min(5, -Math.floor(Math.log10(step) + 1e-9)));
  }

  // Tần số lớn thì chiếu chậm, rất nhỏ thì tua nhanh để mắt theo kịp (tần số trên màn hình 0,3–2 Hz).
  function playbackRate(p) {
    var fmax = Math.max(p.fd, p.f0);
    return fmax > 2 ? 2 / fmax : fmax < 0.3 ? 0.3 / fmax : 1;
  }

  // Biên độ ổn định lớn nhất (tại tần số cộng hưởng ω_r = √(ω0² − 2β²), hoặc ω → 0 khi cản lớn).
  function peakAmp(p) {
    var wr2 = p.w0 * p.w0 - 2 * p.beta * p.beta;
    return wr2 > 0 ? steadyAmp(p, Math.sqrt(wr2)) : Y_DRIVE;
  }

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
    outputs.fd.textContent = fmtAuto(p.fd) + ' Hz';
    outputs.f0.textContent = fmtAuto(p.f0) + ' Hz';
    // Mức cản đánh giá theo tỉ số cản ζ = β/ω0 (không thứ nguyên).
    var zeta = p.beta / p.w0;
    outputs.damp.textContent = fmtAuto(p.beta) + ' s⁻¹ · ' + (zeta < 0.05 ? 'nhỏ' : zeta < 0.2 ? 'vừa' : 'lớn');
    readout.ratio.textContent = fmtAuto(p.fd / p.f0);
    readout.steady.textContent = fmtAuto(steadyAmp(p, p.w)) + ' cm';
  }

  function reset() {
    s = { x: 0, v: 0, t: 0, peak: 0, history: [] };
    updateLabels();
    readout.amp.textContent = '0 cm';
    readout.time.textContent = '0,0 s';
    dispScale = targetScale();
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

  // Tỉ lệ vẽ theo biên độ đang có: biên độ lớn thì thu nhỏ, biên độ rất nhỏ thì phóng to đủ để vẫn thấy vật dao động.
  function targetScale() {
    var p = params();
    var floor = 0.2 * Math.min(Y_DRIVE, steadyAmp(p, p.w));
    var ref = Math.max(s ? s.peak : 0, Math.abs(s ? s.x : 0), floor, 1e-9);
    var scale = Math.min(MAX_PX_PER_CM, SWING_PX / ref);
    return scale * ref < 15 ? 15 / ref : scale;
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
    // Tỉ lệ vẽ tự co lại ngay khi biên độ lớn lên, giãn ra từ từ khi biên độ nhỏ đi.
    var target = targetScale();
    dispScale = target < dispScale || !running ? target : dispScale + (target - dispScale) * 0.05;
    var cx = 150;
    var supportOffset = 12 * Math.cos(p.w * s.t); // phóng to chuyển động điểm treo để dễ thấy
    var sy = SUPPORT_Y + supportOffset;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx - 50, sy - 10, 100, 10);
    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText('Điểm treo dao động', cx - 52, SUPPORT_Y - 22);
    var massY = Math.max(sy + 40, Math.min(H - 30, REST_Y + s.x * dispScale));
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
    // Thước tỉ lệ cạnh vật
    var barCm = niceStep(SWING_PX / dispScale, 1);
    if (barCm * dispScale > SWING_PX) barCm /= 2;
    var barPx = barCm * dispScale;
    var bx = cx + 95;
    ctx.strokeStyle = '#5b6478';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - 5, REST_Y);
    ctx.lineTo(bx + 5, REST_Y);
    ctx.moveTo(bx, REST_Y);
    ctx.lineTo(bx, REST_Y + barPx);
    ctx.moveTo(bx - 5, REST_Y + barPx);
    ctx.lineTo(bx + 5, REST_Y + barPx);
    ctx.stroke();
    ctx.fillStyle = '#5b6478';
    // Đổi sang mm hoặc µm khi thước rất ngắn để nhãn gọn.
    var unit = barCm >= 0.1 ? [1, ' cm'] : barCm >= 0.001 ? [10, ' mm'] : [1e4, ' µm'];
    var barVal = barCm * unit[0];
    ctx.fillText(VL.fmt(barVal, Math.min(4, stepDigits(barVal))) + unit[1], bx + 8, REST_Y + barPx / 2 + 4);
    var rate = playbackRate(p);
    if (rate !== 1) {
      ctx.fillText(rate < 1 ? 'Chiếu chậm ' + fmtAuto(1 / rate, 2) + ' lần' : 'Tua nhanh ' + fmtAuto(rate, 2) + ' lần', 20, H - 8);
    }
    if (Math.abs(s.x * dispScale) > H - 30 - REST_Y) {
      ctx.fillStyle = '#dc2626';
      ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
      ctx.fillText('Biên độ vượt khung hình!', cx - 70, H - 24);
    }

    // --- Đồ thị biên độ theo tần số bên phải ---
    var fRes = Math.sqrt(Math.max(0, p.w0 * p.w0 - 2 * p.beta * p.beta)) / (2 * Math.PI);
    var fStep = niceStep(Math.max(2.2 * p.f0, 1.15 * p.fd), 5);
    var fMax = Math.ceil(Math.max(2.2 * p.f0, 1.15 * p.fd) / fStep - 1e-9) * fStep;
    var maxA = Math.max(peakAmp(p) * 1.1, Y_DRIVE * 1.2);
    var plotH = PLOT.h - 20;
    function fx(f) {
      return PLOT.x + (f / fMax) * PLOT.w;
    }
    function ay(A) {
      return PLOT.y + PLOT.h - Math.min(1, A / maxA) * plotH;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.strokeStyle = '#eef1fa';
    ctx.lineWidth = 1;
    // Vạch chia trục biên độ
    var aStep = niceStep(maxA, 4);
    ctx.textAlign = 'right';
    for (var k = 1; k * aStep <= maxA && k < 20; k++) {
      var gy = ay(k * aStep);
      ctx.beginPath();
      ctx.moveTo(PLOT.x, gy);
      ctx.lineTo(PLOT.x + PLOT.w, gy);
      ctx.stroke();
      ctx.fillText(VL.fmt(k * aStep, stepDigits(aStep)), PLOT.x - 4, gy + 4);
    }
    ctx.textAlign = 'center';
    for (var j = 0; j * fStep <= fMax + 1e-9 && j < 20; j++) {
      ctx.fillText(VL.fmt(j * fStep, stepDigits(fStep)), fx(j * fStep), PLOT.y + PLOT.h + 16);
    }
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PLOT.x, PLOT.y);
    ctx.lineTo(PLOT.x, PLOT.y + PLOT.h);
    ctx.lineTo(PLOT.x + PLOT.w, PLOT.y + PLOT.h);
    ctx.stroke();
    ctx.fillText('Biên độ (cm)', PLOT.x + 6, PLOT.y + 14);
    ctx.fillText('f (Hz)', PLOT.x + PLOT.w - 36, PLOT.y + PLOT.h + 30);
    // f0
    var f0x = fx(p.f0);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#a5b4fc';
    ctx.beginPath();
    ctx.moveTo(f0x, PLOT.y);
    ctx.lineTo(f0x, PLOT.y + PLOT.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = primary;
    ctx.fillText('f₀', f0x + 4, PLOT.y + 30);
    // Đường cộng hưởng: lấy mẫu đều theo pixel và dày thêm quanh đỉnh để không bỏ sót đỉnh hẹp.
    var samples = [];
    for (var i = 0; i <= 2 * PLOT.w; i++) samples.push((fMax * (i + 0.02)) / (2 * PLOT.w));
    var width = p.beta / (2 * Math.PI);
    for (var m = -6; m <= 6; m++) samples.push(fRes + (m * width) / 2);
    samples = samples.filter(function (f) { return f > 0 && f <= fMax; }).sort(function (a, b) { return a - b; });
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    samples.forEach(function (fi, idx) {
      var px = fx(fi);
      var py = ay(steadyAmp(p, 2 * Math.PI * fi));
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    // điểm hiện tại
    var curX = fx(p.fd);
    var curY = ay(steadyAmp(p, p.w));
    var measY = ay(s.peak);
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
    var p = params();
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05) * playbackRate(p);
    last = now;
    // Số bước con đủ nhỏ so với ω0, ω và β để RK4 luôn ổn định (h·max(ω0, ω, 2β) ≤ 0,1).
    var stiff = Math.max(p.w0, p.w, 2 * p.beta);
    var n = Math.max(10, Math.min(5000, Math.ceil((dt * stiff) / 0.1)));
    for (var i = 0; i < n; i++) step(p, dt / n);
    // Biên độ đang đo: lớn nhất của |x| trong khoảng một chu kì ngoại lực gần nhất
    s.history.push({ t: s.t, x: Math.abs(s.x) });
    var span = Math.max(1 / p.fd, 1 / p.f0);
    while (s.history.length && s.history[0].t < s.t - span) s.history.shift();
    s.peak = s.history.reduce(function (m, h) { return Math.max(m, h.x); }, 0);
    readout.amp.textContent = fmtAuto(s.peak) + ' cm';
    readout.time.textContent = (s.t < 10 ? fmtAuto(s.t, 2) : VL.fmt(s.t, 1)) + ' s';
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
    // Mở rộng thanh trượt f nếu f0 nằm ngoài khoảng hiện tại, để giá trị không bị cắt bớt.
    var f0 = parseFloat(inputs.f0.value);
    if (f0 > parseFloat(inputs.fd.max)) inputs.fd.max = String(f0);
    if (f0 < parseFloat(inputs.fd.min)) inputs.fd.min = String(f0);
    inputs.fd.value = inputs.f0.value;
    if (parseFloat(inputs.fd.value) !== f0) {
      inputs.fd.step = 'any';
      inputs.fd.value = inputs.f0.value;
    }
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
