// Mô phỏng định luật Ohm cho toàn mạch: hai điện trở mắc nối tiếp hoặc song song.
// Các chấm sáng chạy theo chiều dòng điện quy ước, tốc độ tỉ lệ với cường độ.
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="circuit"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var canvas = root.querySelector('canvas');
  var view = VL.setupCanvas(canvas);
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;

  var LEFT = 110;
  var RIGHT = 610;
  var TOP = 110;
  var BOTTOM = 320;
  var NODE_A = 220;
  var NODE_B = 500;
  var DOT_SPACING = 26;

  var inputs = {
    emf: root.querySelector('input[name="emf"]'),
    internal: root.querySelector('input[name="internal"]'),
    r1: root.querySelector('input[name="r1"]'),
    r2: root.querySelector('input[name="r2"]'),
  };
  var modeInputs = root.querySelectorAll('input[name="mode"]');
  var outputs = {
    emf: root.querySelector('output[data-for="emf"]'),
    internal: root.querySelector('output[data-for="internal"]'),
    r1: root.querySelector('output[data-for="r1"]'),
    r2: root.querySelector('output[data-for="r2"]'),
  };
  var readout = {
    rtotal: root.querySelector('[data-out="rtotal"]'),
    current: root.querySelector('[data-out="current"]'),
    voltage: root.querySelector('[data-out="voltage"]'),
    power: root.querySelector('[data-out="power"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');

  var running = !VL.reduceMotion;
  var phase = { main: 0, b1: 0, b2: 0 };
  var last = null;

  function mode() {
    var checked = root.querySelector('input[name="mode"]:checked');
    return checked ? checked.value : 'series';
  }

  function solve() {
    var E = parseFloat(inputs.emf.value);
    var r = parseFloat(inputs.internal.value);
    var R1 = parseFloat(inputs.r1.value);
    var R2 = parseFloat(inputs.r2.value);
    var parallel = mode() === 'parallel';
    var R = parallel ? (R1 * R2) / (R1 + R2) : R1 + R2;
    var I = E / (R + r);
    var U = I * R;
    return {
      E: E, r: r, R1: R1, R2: R2, R: R, I: I, U: U, P: I * I * R, parallel: parallel,
      I1: parallel ? U / R1 : I,
      I2: parallel ? U / R2 : I,
    };
  }

  function updateLabels() {
    var s = solve();
    outputs.emf.textContent = VL.fmt(s.E, 1) + ' V';
    outputs.internal.textContent = VL.fmt(s.r, 1) + ' Ω';
    outputs.r1.textContent = s.R1 + ' Ω';
    outputs.r2.textContent = s.R2 + ' Ω';
    readout.rtotal.textContent = VL.fmt(s.R, 2) + ' Ω';
    readout.current.textContent = VL.fmt(s.I, 2) + ' A';
    readout.voltage.textContent = VL.fmt(s.U, 2) + ' V';
    readout.power.textContent = VL.fmt(s.P, 2) + ' W';
  }

  // Các đường đi của dòng điện (polyline) theo chiều quy ước: từ cực dương đi ra.
  function paths(parallel) {
    if (!parallel) {
      return {
        main: [[LEFT, 250], [LEFT, TOP], [RIGHT, TOP], [RIGHT, BOTTOM], [LEFT, BOTTOM], [LEFT, 250]],
      };
    }
    return {
      main: [[NODE_B, TOP], [RIGHT, TOP], [RIGHT, BOTTOM], [LEFT, BOTTOM], [LEFT, TOP], [NODE_A, TOP]],
      b1: [[NODE_A, TOP], [NODE_A, 60], [NODE_B, 60], [NODE_B, TOP]],
      b2: [[NODE_A, TOP], [NODE_A, 165], [NODE_B, 165], [NODE_B, TOP]],
    };
  }

  function pathLength(pts) {
    var len = 0;
    for (var i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return len;
  }

  function pointAt(pts, d) {
    for (var i = 1; i < pts.length; i++) {
      var seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d <= seg) {
        var t = seg === 0 ? 0 : d / seg;
        return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
      }
      d -= seg;
    }
    return pts[pts.length - 1];
  }

  function wire(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  var RESISTOR_W = 84;
  var RESISTOR_H = 30;

  function resistorCenters(parallel) {
    var mid = (NODE_A + NODE_B) / 2;
    return parallel ? [[mid, 60], [mid, 165]] : [[270, TOP], [450, TOP]];
  }

  function insideResistor(pt, centers) {
    return centers.some(function (c) {
      return Math.abs(pt[0] - c[0]) < RESISTOR_W / 2 + 2 && Math.abs(pt[1] - c[1]) < RESISTOR_H / 2 + 2;
    });
  }

  function resistor(cx, cy, label, value, current) {
    var w = RESISTOR_W;
    var h = RESISTOR_H;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
    ctx.fillStyle = '#1e1b4b';
    ctx.font = '700 14px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + 5);
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText(value + ' Ω · ' + VL.fmt(current, 2) + ' A', cx, cy - h / 2 - 8);
    ctx.textAlign = 'left';
  }

  function draw() {
    var s = solve();
    var p = paths(s.parallel);
    var accent = VL.color('--color-accent') || '#ea580c';
    var primary = VL.color('--color-primary') || '#4338ca';
    ctx.clearRect(0, 0, W, H);

    // Dây dẫn
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    Object.keys(p).forEach(function (k) { wire(p[k]); });

    // Nguồn điện (cạnh trái): vạch dài là cực dương
    ctx.fillStyle = '#f8faff';
    ctx.fillRect(LEFT - 30, 190, 60, 32);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LEFT - 26, 196);
    ctx.lineTo(LEFT + 26, 196);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(LEFT - 14, 214);
    ctx.lineTo(LEFT + 14, 214);
    ctx.stroke();
    ctx.fillStyle = '#1e1b4b';
    ctx.font = '700 14px "Be Vietnam Pro", sans-serif';
    ctx.fillText('+', LEFT + 32, 200);
    ctx.fillText('ℰ = ' + VL.fmt(s.E, 1) + ' V', LEFT - 100, 196);
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText('r = ' + VL.fmt(s.r, 1) + ' Ω', LEFT - 100, 216);

    // Điện trở
    var centers = resistorCenters(s.parallel);
    if (s.parallel) {
      resistor(centers[0][0], centers[0][1], 'R₁', s.R1, s.I1);
      resistor(centers[1][0], centers[1][1], 'R₂', s.R2, s.I2);
      ctx.fillStyle = '#1e1b4b';
      [NODE_A, NODE_B].forEach(function (x) {
        ctx.beginPath();
        ctx.arc(x, TOP, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      resistor(centers[0][0], centers[0][1], 'R₁', s.R1, s.I);
      resistor(centers[1][0], centers[1][1], 'R₂', s.R2, s.I);
    }

    // Ampe kế (cạnh phải)
    var ay = (TOP + BOTTOM) / 2 + 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(RIGHT, ay, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = primary;
    ctx.font = '700 18px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A', RIGHT, ay + 6);
    ctx.font = '700 15px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('I = ' + VL.fmt(s.I, 2) + ' A', RIGHT - 120, ay + 6);

    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText('Chấm cam: chiều dòng điện quy ước', LEFT, BOTTOM + 40);

    // Hạt mang điện
    ctx.fillStyle = accent;
    var currents = { main: s.I, b1: s.I1, b2: s.I2 };
    Object.keys(p).forEach(function (k) {
      var len = pathLength(p[k]);
      var offset = phase[k] % DOT_SPACING;
      for (var d = offset; d < len; d += DOT_SPACING) {
        var pt = pointAt(p[k], d);
        if (k === 'main' && !s.parallel && pt[1] > 188 && pt[1] < 224) continue; // không vẽ qua nguồn
        if (insideResistor(pt, centers)) continue;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], currents[k] > 0.005 ? 4 : 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    var s = solve();
    var k = 45; // px/s cho mỗi ampe
    phase.main += Math.min(s.I * k, 420) * dt;
    phase.b1 += Math.min(s.I1 * k, 420) * dt;
    phase.b2 += Math.min(s.I2 * k, 420) * dt;
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

  Object.keys(inputs).forEach(function (key) {
    inputs[key].addEventListener('input', function () {
      updateLabels();
      if (!running) draw();
    });
  });
  modeInputs.forEach(function (el) {
    el.addEventListener('change', function () {
      phase = { main: 0, b1: 0, b2: 0 };
      updateLabels();
      draw();
    });
  });
  toggleBtn.addEventListener('click', function () { setRunning(!running); });
  resetBtn.addEventListener('click', function () {
    inputs.emf.value = 12;
    inputs.internal.value = 1;
    inputs.r1.value = 6;
    inputs.r2.value = 3;
    modeInputs[0].checked = true;
    phase = { main: 0, b1: 0, b2: 0 };
    updateLabels();
    draw();
  });

  updateLabels();
  draw();
  setRunning(running);
})();
