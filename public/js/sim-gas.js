// Mô hình khí lí tưởng 2D: phân tử là chất điểm va chạm đàn hồi với thành bình và pít-tông.
// Áp suất đo từ xung lượng truyền cho thành bình, so với lí thuyết p = NkT/V (quy đổi đơn vị thật:
// mỗi chấm ≈ 10²² phân tử, thể tích theo lít).
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="gas"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var view = VL.setupCanvas(root.querySelector('canvas'));
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var BOX = { left: 40, top: 50, bottom: 350, maxWidth: 560 };
  var V_MAX = 10;
  var MOLECULES_PER_DOT = 1e22;
  var K_B = 1.38e-23;
  var M_N2 = 4.65e-26; // khối lượng phân tử N₂ (kg) để tính tốc độ thật
  var PX_SPEED_AT_300K = 120; // px/s: độ lệch chuẩn mỗi thành phần vận tốc ở 300 K

  var inputs = {
    temp: root.querySelector('input[name="temp"]'),
    vol: root.querySelector('input[name="vol"]'),
    count: root.querySelector('input[name="count"]'),
  };
  var outputs = {
    temp: root.querySelector('output[data-for="temp"]'),
    vol: root.querySelector('output[data-for="vol"]'),
    count: root.querySelector('output[data-for="count"]'),
  };
  var readout = {
    pmeas: root.querySelector('[data-out="pmeas"]'),
    ptheory: root.querySelector('[data-out="ptheory"]'),
    speed: root.querySelector('[data-out="speed"]'),
    pvt: root.querySelector('[data-out="pvt"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');

  var particles = [];
  var currentT = 300;
  var impulse = 0;
  var impulseTime = 0;
  var measuredRatio = 1;
  var hits = [];
  var running = !VL.reduceMotion;
  var last = null;

  function params() {
    return {
      T: parseFloat(inputs.temp.value),
      V: parseFloat(inputs.vol.value),
      N: parseInt(inputs.count.value, 10),
    };
  }

  function sigma(T) {
    return PX_SPEED_AT_300K * Math.sqrt(T / 300);
  }

  function gaussian() {
    var u = 1 - Math.random();
    var v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function pistonX() {
    return BOX.left + (BOX.maxWidth * parseFloat(inputs.vol.value)) / V_MAX;
  }

  function spawn(n) {
    var sd = sigma(currentT);
    var right = pistonX();
    for (var i = 0; i < n; i++) {
      particles.push({
        x: BOX.left + 5 + Math.random() * (right - BOX.left - 10),
        y: BOX.top + 5 + Math.random() * (BOX.bottom - BOX.top - 10),
        vx: gaussian() * sd,
        vy: gaussian() * sd,
      });
    }
  }

  function syncCount() {
    var n = params().N;
    if (particles.length < n) spawn(n - particles.length);
    else particles.length = n;
  }

  function syncTemperature() {
    var T = params().T;
    var factor = Math.sqrt(T / currentT);
    particles.forEach(function (p) {
      p.vx *= factor;
      p.vy *= factor;
    });
    currentT = T;
  }

  function theoryPressure(p) {
    return (p.N * MOLECULES_PER_DOT * K_B * p.T) / (p.V / 1000);
  }

  function formatPressure(pa) {
    var exp = Math.floor(Math.log10(pa));
    var mant = pa / Math.pow(10, exp);
    return VL.fmt(mant, 2) + '·10' + String(exp).replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }) + ' Pa';
  }

  function updateLabels() {
    var p = params();
    outputs.temp.textContent = p.T + ' K';
    outputs.vol.textContent = VL.fmt(p.V, 1) + ' lít';
    outputs.count.textContent = String(p.N);
    var pt = theoryPressure(p);
    readout.ptheory.textContent = formatPressure(pt) + ' (' + VL.fmt(pt / 101325, 2) + ' atm)';
    var meanSpeed = Math.sqrt((8 * K_B * p.T) / (Math.PI * M_N2));
    readout.speed.textContent = '≈ ' + VL.fmt(meanSpeed, 0) + ' m/s (khí N₂)';
    var pm = pt * measuredRatio;
    readout.pmeas.textContent = formatPressure(pm);
    readout.pvt.textContent = VL.fmt((pm * (p.V / 1000)) / p.T, 2) + ' J/K';
  }

  function step(dt) {
    var right = pistonX();
    var m = 1; // khối lượng mô phỏng
    particles.forEach(function (p) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < BOX.left) {
        p.x = 2 * BOX.left - p.x;
        p.vx = Math.abs(p.vx);
        impulse += 2 * m * p.vx;
      } else if (p.x > right) {
        p.x = Math.max(BOX.left, 2 * right - p.x);
        impulse += 2 * m * Math.abs(p.vx);
        p.vx = -Math.abs(p.vx);
        if (hits.length < 40) hits.push({ x: right, y: p.y, life: 1 });
      }
      if (p.y < BOX.top) {
        p.y = 2 * BOX.top - p.y;
        p.vy = Math.abs(p.vy);
        impulse += 2 * m * p.vy;
      } else if (p.y > BOX.bottom) {
        p.y = 2 * BOX.bottom - p.y;
        impulse += 2 * m * Math.abs(p.vy);
        p.vy = -Math.abs(p.vy);
      }
    });
    impulseTime += dt;
  }

  function measure() {
    // Áp suất 2D mô phỏng = xung lượng / (thời gian × chu vi); lí thuyết = N·m·σ² / diện tích.
    if (impulseTime < 0.5) return;
    var right = pistonX();
    var width = right - BOX.left;
    var height = BOX.bottom - BOX.top;
    var measured = impulse / (impulseTime * 2 * (width + height));
    var sd = sigma(currentT);
    var theory = (particles.length * sd * sd) / (width * height);
    var ratio = measured / theory;
    measuredRatio = measuredRatio * 0.7 + ratio * 0.3;
    impulse = 0;
    impulseTime = 0;
  }

  function speedColor(v) {
    var t = Math.min(1, v / (sigma(1000) * 2));
    var r = Math.round(67 + (234 - 67) * t);
    var g = Math.round(56 + (88 - 56) * t);
    var b = Math.round(202 + (12 - 202) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function draw() {
    var right = pistonX();
    ctx.clearRect(0, 0, W, H);

    // Xi lanh
    ctx.fillStyle = '#f8faff';
    ctx.fillRect(BOX.left, BOX.top, right - BOX.left, BOX.bottom - BOX.top);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(BOX.left + BOX.maxWidth + 40, BOX.top);
    ctx.lineTo(BOX.left, BOX.top);
    ctx.lineTo(BOX.left, BOX.bottom);
    ctx.lineTo(BOX.left + BOX.maxWidth + 40, BOX.bottom);
    ctx.stroke();

    // Pít-tông
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(right, BOX.top + 2, 16, BOX.bottom - BOX.top - 4);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(right + 16, (BOX.top + BOX.bottom) / 2 - 6, W - right - 20, 12);

    hits.forEach(function (h) {
      ctx.fillStyle = 'rgba(234, 88, 12,' + h.life * 0.6 + ')';
      ctx.beginPath();
      ctx.arc(h.x, h.y, 6 * h.life + 2, 0, Math.PI * 2);
      ctx.fill();
      h.life -= 0.08;
    });
    hits = hits.filter(function (h) { return h.life > 0; });

    particles.forEach(function (p) {
      ctx.fillStyle = speedColor(Math.hypot(p.vx, p.vy));
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#1e1b4b';
    ctx.font = '600 13px "Be Vietnam Pro", sans-serif';
    ctx.fillText('V = ' + VL.fmt(parseFloat(inputs.vol.value), 1) + ' lít   T = ' + currentT + ' K', BOX.left, 32);
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText('Màu chấm: tím = chậm, cam = nhanh. Chấm sáng trên pít-tông: phân tử va vào thành.', BOX.left, H - 22);
  }

  var measureTimer = 0;
  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.04);
    last = now;
    for (var i = 0; i < 4; i++) step(dt / 4);
    measureTimer += dt;
    if (measureTimer > 0.5) {
      measureTimer = 0;
      measure();
      updateLabels();
    }
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

  inputs.temp.addEventListener('input', function () {
    syncTemperature();
    updateLabels();
    if (!running) draw();
  });
  inputs.vol.addEventListener('input', function () {
    // Pít-tông dịch vào: đẩy các phân tử vượt quá pít-tông về phía trong.
    var right = pistonX();
    particles.forEach(function (p) {
      if (p.x > right) p.x = right - Math.random() * 10;
    });
    impulse = 0;
    impulseTime = 0;
    updateLabels();
    if (!running) draw();
  });
  inputs.count.addEventListener('input', function () {
    syncCount();
    updateLabels();
    if (!running) draw();
  });
  toggleBtn.addEventListener('click', function () { setRunning(!running); });
  resetBtn.addEventListener('click', function () {
    inputs.temp.value = 300;
    inputs.vol.value = 10;
    inputs.count.value = 80;
    particles = [];
    currentT = 300;
    measuredRatio = 1;
    spawn(80);
    updateLabels();
    draw();
  });

  spawn(params().N);
  updateLabels();
  draw();
  setRunning(running);
})();
