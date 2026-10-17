// Giao thoa hai nguồn kết hợp cùng pha trên mặt nước.
// u(M) = Σ A·cos(ωt − 2π·r/λ) / (1 + r/R), vẽ thành bản đồ màu; chiếu chậm để mắt theo kịp.
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="interference"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var canvas = root.querySelector('canvas');
  var view = VL.setupCanvas(canvas);
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var SPEED = 40; // cm/s
  var WIDTH_CM = 40;
  var PX_PER_CM = W / WIDTH_CM;
  var GRID_W = 240;
  var GRID_H = Math.round((GRID_W * H) / W);
  var SLOW_MOTION = 0.15;

  var field = document.createElement('canvas');
  field.width = GRID_W;
  field.height = GRID_H;
  var fctx = field.getContext('2d');
  var image = fctx.createImageData(GRID_W, GRID_H);

  var inputs = {
    freq: root.querySelector('input[name="freq"]'),
    dist: root.querySelector('input[name="dist"]'),
    amp: root.querySelector('input[name="amp"]'),
    lines: root.querySelector('input[name="lines"]'),
  };
  var sourceInputs = root.querySelectorAll('input[name="sources"]');
  var outputs = {
    freq: root.querySelector('output[data-for="freq"]'),
    dist: root.querySelector('output[data-for="dist"]'),
    amp: root.querySelector('output[data-for="amp"]'),
  };
  var readout = {
    lambda: root.querySelector('[data-out="lambda"]'),
    ratio: root.querySelector('[data-out="ratio"]'),
    maxima: root.querySelector('[data-out="maxima"]'),
    minima: root.querySelector('[data-out="minima"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');

  var running = !VL.reduceMotion;
  var t = 0;
  var last = null;

  function params() {
    var checked = root.querySelector('input[name="sources"]:checked');
    var f = parseFloat(inputs.freq.value);
    return {
      two: !checked || checked.value === '2',
      f: f,
      d: parseFloat(inputs.dist.value),
      A: parseFloat(inputs.amp.value),
      lambda: SPEED / f,
    };
  }

  function sources(p) {
    var cy = H / 2 / PX_PER_CM;
    var cx = WIDTH_CM / 2;
    return p.two ? [{ x: cx - p.d / 2, y: cy }, { x: cx + p.d / 2, y: cy }] : [{ x: cx, y: cy }];
  }

  function updateLabels() {
    var p = params();
    outputs.freq.textContent = p.f + ' Hz';
    outputs.dist.textContent = VL.fmt(p.d, 1) + ' cm';
    outputs.amp.textContent = VL.fmt(p.A, 1) + ' cm';
    readout.lambda.textContent = VL.fmt(p.lambda, 2) + ' cm';
    root.querySelector('input[name="dist"]').disabled = !p.two;
    inputs.lines.disabled = !p.two;
    if (!p.two) {
      readout.ratio.textContent = '—';
      readout.maxima.textContent = 'Cần 2 nguồn';
      readout.minima.textContent = 'Cần 2 nguồn';
      return;
    }
    var ratio = p.d / p.lambda;
    readout.ratio.textContent = VL.fmt(ratio, 2);
    var maxima = 2 * Math.ceil(ratio - 1e-9) - 1;
    var kMin = Math.floor(-ratio - 0.5) + 1;
    var kMax = Math.ceil(ratio - 0.5) - 1;
    readout.maxima.textContent = String(maxima);
    readout.minima.textContent = String(Math.max(0, kMax - kMin + 1));
  }

  function renderField(p) {
    var src = sources(p);
    var k = (2 * Math.PI) / p.lambda;
    var phase = 2 * Math.PI * p.f * t;
    var cell = WIDTH_CM / GRID_W;
    var data = image.data;
    var norm = 1 / (2.4 * 2);
    for (var j = 0; j < GRID_H; j++) {
      var y = (j + 0.5) * cell;
      for (var i = 0; i < GRID_W; i++) {
        var x = (i + 0.5) * cell;
        var u = 0;
        for (var s = 0; s < src.length; s++) {
          var r = Math.hypot(x - src[s].x, y - src[s].y);
          u += (p.A * Math.cos(phase - k * r)) / (1 + r / 25);
        }
        var v = Math.max(-1, Math.min(1, u * norm)); // −1 … 1
        var idx = (j * GRID_W + i) * 4;
        // Lõm: xanh đậm, lồi: xanh nhạt gần trắng
        data[idx] = 30 + 110 * (v + 1);
        data[idx + 1] = 64 + 92 * (v + 1);
        data[idx + 2] = 150 + 52 * (v + 1);
        data[idx + 3] = 255;
      }
    }
    fctx.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(field, 0, 0, W, H);
  }

  // Đường hypebol tập hợp điểm có d2 − d1 = c (tiêu điểm là hai nguồn).
  function hyperbola(p, c, dashed) {
    var focus = p.d / 2;
    var a = Math.abs(c) / 2;
    var cx = W / 2;
    var cy = H / 2;
    ctx.setLineDash(dashed ? [5, 5] : []);
    ctx.beginPath();
    if (a < 1e-6) {
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, H);
    } else {
      var b2 = focus * focus - a * a;
      if (b2 <= 0) return;
      var sign = c > 0 ? 1 : -1; // c > 0: gần nguồn 1 (bên trái) hơn → nhánh trái
      var started = false;
      for (var py = 0; py <= H; py += 4) {
        var y = (py - cy) / PX_PER_CM;
        var x = a * Math.sqrt(1 + (y * y) / b2);
        var px = cx - sign * x * PX_PER_CM;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    var p = params();
    renderField(p);
    var src = sources(p);

    if (p.two && inputs.lines.checked) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 237, 213, 0.85)';
      for (var k = -Math.floor(p.d / p.lambda); k <= Math.floor(p.d / p.lambda); k++) {
        if (Math.abs(k * p.lambda) < p.d - 1e-9) hyperbola(p, k * p.lambda, false);
      }
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
      for (var m = -Math.ceil(p.d / p.lambda) - 1; m <= Math.ceil(p.d / p.lambda); m++) {
        var c = (m + 0.5) * p.lambda;
        if (Math.abs(c) < p.d - 1e-9) hyperbola(p, c, true);
      }
    }

    src.forEach(function (s, i) {
      var x = s.x * PX_PER_CM;
      var y = s.y * PX_PER_CM;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '700 13px "Be Vietnam Pro", sans-serif';
      ctx.fillText(p.two ? 'S' + (i + 1) : 'S', x - 8, y - 14);
    });

    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(10, H - 34, 250, 24);
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillText('Khung rộng 40 cm · chiếu chậm ' + Math.round(1 / SLOW_MOTION) + ' lần', 18, H - 17);
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt * SLOW_MOTION;
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

  ['freq', 'dist', 'amp'].forEach(function (n) {
    inputs[n].addEventListener('input', function () {
      updateLabels();
      if (!running) draw();
    });
  });
  inputs.lines.addEventListener('change', function () { if (!running) draw(); });
  sourceInputs.forEach(function (el) {
    el.addEventListener('change', function () {
      updateLabels();
      if (!running) draw();
    });
  });
  toggleBtn.addEventListener('click', function () { setRunning(!running); });
  resetBtn.addEventListener('click', function () {
    inputs.freq.value = 10;
    inputs.dist.value = 10;
    inputs.amp.value = 1;
    sourceInputs[1].checked = true;
    t = 0;
    updateLabels();
    draw();
  });

  updateLabels();
  draw();
  setRunning(running);
})();
