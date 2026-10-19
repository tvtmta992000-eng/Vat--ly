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
  var GRID_W = 320;
  var GRID_H = Math.round((GRID_W * H) / W);
  var CELLS_PER_LAMBDA = 8; // ít nhất 8 ô lưới trên một bước sóng (4 ô trên khoảng vân λ/2) để không bị răng cưa
  var MAX_LINES = 40; // quá nhiều đường cực đại/cực tiểu thì không vẽ

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

  // Làm tròn tới khoảng 3 chữ số có nghĩa rồi chọn số chữ số thập phân tương ứng.
  function fmtAuto(v, sig) {
    sig = sig || 3;
    var r = isFinite(v) ? Number(v.toPrecision(sig)) : v;
    var a = Math.abs(r);
    var digits = a > 1e-9 && isFinite(a) ? Math.max(0, Math.min(4, sig - 1 - Math.floor(Math.log10(a)))) : 0;
    return VL.fmt(a > 1e-9 ? r : 0, digits);
  }

  // Bề rộng khung nhìn (cm): đủ chứa hai nguồn và vài bước sóng, nhưng không quá nhiều bước sóng
  // so với độ phân giải lưới. Mặc định (λ = 4 cm, S1S2 = 10 cm) là 40 cm như trước.
  function viewport(p) {
    var want = Math.max(p.two ? 2 * p.d : 0, 10 * p.lambda);
    var widthCm = Math.min(want, (GRID_W / CELLS_PER_LAMBDA) * p.lambda);
    return { widthCm: widthCm, scale: W / widthCm };
  }

  // Chiếu chậm để sóng trên màn hình có tần số khoảng 1,5 Hz.
  function slowMotion(p) {
    return Math.min(1, 1.5 / p.f);
  }

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
    var v = viewport(p);
    var cy = H / 2 / v.scale;
    var cx = v.widthCm / 2;
    return p.two ? [{ x: cx - p.d / 2, y: cy }, { x: cx + p.d / 2, y: cy }] : [{ x: cx, y: cy }];
  }

  function updateLabels() {
    var p = params();
    outputs.freq.textContent = fmtAuto(p.f) + ' Hz';
    outputs.dist.textContent = fmtAuto(p.d) + ' cm';
    outputs.amp.textContent = fmtAuto(p.A) + ' cm';
    readout.lambda.textContent = fmtAuto(p.lambda) + ' cm';
    root.querySelector('input[name="dist"]').disabled = !p.two;
    inputs.lines.disabled = !p.two;
    if (!p.two) {
      readout.ratio.textContent = '—';
      readout.maxima.textContent = 'Cần 2 nguồn';
      readout.minima.textContent = 'Cần 2 nguồn';
      return;
    }
    var ratio = p.d / p.lambda;
    readout.ratio.textContent = fmtAuto(ratio);
    var maxima = 2 * Math.ceil(ratio - 1e-9) - 1;
    var kMin = Math.floor(-ratio - 0.5) + 1;
    var kMax = Math.ceil(ratio - 0.5) - 1;
    readout.maxima.textContent = String(maxima);
    readout.minima.textContent = String(Math.max(0, kMax - kMin + 1));
  }

  function renderField(p) {
    var src = sources(p);
    var v = viewport(p);
    var k = (2 * Math.PI) / p.lambda;
    var phase = 2 * Math.PI * p.f * t;
    var cell = v.widthCm / GRID_W;
    var damping = (25 * Math.max(v.widthCm, p.two ? p.d : 0)) / 40; // khoảng tắt dần tỉ lệ với khung nhìn
    var data = image.data;
    var norm = 1 / (2.4 * 2);
    // Độ đậm màu theo biên độ, giới hạn để biên độ rất nhỏ/rất lớn vẫn thấy rõ vân.
    var Avis = Math.max(0.3, Math.min(2, p.A));
    for (var j = 0; j < GRID_H; j++) {
      var y = (j + 0.5) * cell;
      for (var i = 0; i < GRID_W; i++) {
        var x = (i + 0.5) * cell;
        var u = 0;
        for (var s = 0; s < src.length; s++) {
          var r = Math.hypot(x - src[s].x, y - src[s].y);
          u += (Avis * Math.cos(phase - k * r)) / (1 + r / damping);
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
    var PX_PER_CM = viewport(p).scale;
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

    var v = viewport(p);
    var tooMany = p.d / p.lambda > MAX_LINES;
    if (p.two && inputs.lines.checked && !tooMany) {
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
      var x = s.x * v.scale;
      var y = s.y * v.scale;
      var name = p.two ? 'S' + (i + 1) : 'S';
      // Nguồn nằm ngoài khung nhìn: vẽ mũi tên chỉ hướng ở mép.
      if (x < 0 || x > W) {
        var side = x < 0 ? -1 : 1;
        var ex = side < 0 ? 12 : W - 12;
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(ex + side * 8, y);
        ctx.lineTo(ex - side * 6, y - 10);
        ctx.lineTo(ex - side * 6, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 13px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = side < 0 ? 'left' : 'right';
        ctx.fillText(name + ' (ngoài khung)', ex - side * 10, y - 16);
        ctx.textAlign = 'left';
        return;
      }
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '700 13px "Be Vietnam Pro", sans-serif';
      // Hai nguồn: nhãn S1 lệch trái, S2 lệch phải để không chồng nhau khi hai nguồn rất gần.
      ctx.textAlign = !p.two ? 'center' : i === 0 ? 'right' : 'left';
      ctx.fillText(name, x + (!p.two ? 0 : i === 0 ? -1 : 1), y - 14);
      ctx.textAlign = 'left';
    });

    var slow = slowMotion(p);
    var info = 'Khung rộng ' + fmtAuto(v.widthCm) + ' cm · ' + (slow < 1 ? 'chiếu chậm ' + fmtAuto(1 / slow, 2) + ' lần' : 'tốc độ thật');
    if (p.two && inputs.lines.checked && tooMany) info += ' · quá nhiều vân, không vẽ đường cực đại/cực tiểu';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(10, H - 34, Math.min(W - 20, ctx.measureText(info).width + 16), 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(info, 18, H - 17, W - 36);
  }

  function frame(now) {
    if (!running) return;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt * slowMotion(params());
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
