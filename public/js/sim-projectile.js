// Mô phỏng chuyển động ném xiên (bỏ qua sức cản không khí).
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="projectile"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var canvas = root.querySelector('canvas');
  var view = VL.setupCanvas(canvas);
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var MARGIN = { left: 56, right: 24, top: 28, bottom: 44 };
  var TRAIL_COLORS = ['#a5b4fc', '#fdba74', '#86efac', '#f9a8d4', '#93c5fd'];

  var inputs = {
    speed: root.querySelector('input[name="speed"]'),
    angle: root.querySelector('input[name="angle"]'),
    gravity: root.querySelector('input[name="gravity"]'),
    keep: root.querySelector('input[name="keep"]'),
  };
  var outputs = {
    speed: root.querySelector('output[data-for="speed"]'),
    angle: root.querySelector('output[data-for="angle"]'),
    gravity: root.querySelector('output[data-for="gravity"]'),
  };
  var readout = {
    height: root.querySelector('[data-out="height"]'),
    range: root.querySelector('[data-out="range"]'),
    time: root.querySelector('[data-out="time"]'),
  };
  var launchBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');

  var history = [];
  var flight = null;

  function params() {
    var v0 = parseFloat(inputs.speed.value);
    var alpha = (parseFloat(inputs.angle.value) * Math.PI) / 180;
    var g = parseFloat(inputs.gravity.value);
    var tFlight = (2 * v0 * Math.sin(alpha)) / g;
    return {
      v0: v0,
      alpha: alpha,
      g: g,
      tFlight: tFlight,
      range: v0 * Math.cos(alpha) * tFlight,
      height: Math.pow(v0 * Math.sin(alpha), 2) / (2 * g),
    };
  }

  function position(p, t) {
    return { x: p.v0 * Math.cos(p.alpha) * t, y: p.v0 * Math.sin(p.alpha) * t - 0.5 * p.g * t * t };
  }

  function updateLabels() {
    var p = params();
    outputs.speed.textContent = inputs.speed.value + ' m/s';
    outputs.angle.textContent = inputs.angle.value + '°';
    outputs.gravity.textContent = VL.fmt(p.g, 1) + ' m/s²';
    readout.height.textContent = VL.fmt(p.height, 2) + ' m';
    readout.range.textContent = VL.fmt(p.range, 2) + ' m';
    readout.time.textContent = VL.fmt(p.tFlight, 2) + ' s';
  }

  // Tỉ lệ chung để mọi quỹ đạo (hiện tại và đã lưu) đều vừa khung hình.
  function worldScale() {
    var all = history.map(function (h) { return h.p; }).concat([params()]);
    var maxX = Math.max.apply(null, all.map(function (p) { return p.range; }));
    var maxY = Math.max.apply(null, all.map(function (p) { return p.height; }));
    var sx = (W - MARGIN.left - MARGIN.right) / (maxX * 1.05);
    var sy = (H - MARGIN.top - MARGIN.bottom) / (maxY * 1.15);
    return { s: Math.min(sx, sy), maxX: maxX };
  }

  function niceStep(span) {
    var raw = span / 6;
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / pow;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
  }

  function toCanvas(pt, s) {
    return { x: MARGIN.left + pt.x * s, y: H - MARGIN.bottom - pt.y * s };
  }

  function drawPath(p, s, tEnd, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    var steps = 80;
    for (var i = 0; i <= steps; i++) {
      var c = toCanvas(position(p, (tEnd * i) / steps), s);
      if (i === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    }
    ctx.stroke();
  }

  function draw() {
    var p = params();
    var scale = worldScale();
    var s = scale.s;
    var primary = VL.color('--color-primary') || '#4338ca';
    var accent = VL.color('--color-accent') || '#ea580c';
    ctx.clearRect(0, 0, W, H);

    // Lưới và trục toạ độ
    var stepM = niceStep((W - MARGIN.left - MARGIN.right) / s);
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.strokeStyle = '#e6e9f4';
    ctx.lineWidth = 1;
    for (var x = 0; MARGIN.left + x * s <= W - MARGIN.right + 1; x += stepM) {
      var cx = MARGIN.left + x * s;
      ctx.beginPath();
      ctx.moveTo(cx, MARGIN.top);
      ctx.lineTo(cx, H - MARGIN.bottom);
      ctx.stroke();
      ctx.fillText(VL.fmt(x, stepM < 1 ? 1 : 0), cx - 6, H - MARGIN.bottom + 18);
    }
    for (var y = stepM; H - MARGIN.bottom - y * s >= MARGIN.top; y += stepM) {
      var cy = H - MARGIN.bottom - y * s;
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, cy);
      ctx.lineTo(W - MARGIN.right, cy);
      ctx.stroke();
      ctx.fillText(VL.fmt(y, stepM < 1 ? 1 : 0), 14, cy + 4);
    }
    ctx.fillText('x (m)', W - MARGIN.right - 34, H - 8);
    ctx.fillText('y (m)', 10, MARGIN.top - 10);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, MARGIN.top);
    ctx.lineTo(MARGIN.left, H - MARGIN.bottom);
    ctx.lineTo(W - MARGIN.right, H - MARGIN.bottom);
    ctx.stroke();

    // Quỹ đạo đã lưu
    history.forEach(function (h) { drawPath(h.p, s, h.p.tFlight, h.color, 2); });

    // Quỹ đạo dự kiến (nét đứt) và vectơ vận tốc ban đầu
    ctx.setLineDash([5, 6]);
    drawPath(p, s, p.tFlight, '#c7cde0', 1.5);
    ctx.setLineDash([]);
    var origin = toCanvas({ x: 0, y: 0 }, s);
    var arrowLen = 40 + p.v0 * 1.5;
    var ax = origin.x + arrowLen * Math.cos(p.alpha);
    var ay = origin.y - arrowLen * Math.sin(p.alpha);
    ctx.strokeStyle = primary;
    ctx.fillStyle = primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 10 * Math.cos(p.alpha - 0.4), ay + 10 * Math.sin(p.alpha - 0.4));
    ctx.lineTo(ax - 10 * Math.cos(p.alpha + 0.4), ay + 10 * Math.sin(p.alpha + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.font = '600 13px "Be Vietnam Pro", sans-serif';
    ctx.fillText('v₀', ax + 6, ay - 4);

    // Vật đang bay
    if (flight) {
      drawPath(flight.p, s, flight.t, accent, 3);
      var c = toCanvas(position(flight.p, flight.t), s);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function animate(now) {
    if (!flight) return;
    if (flight.last === null) flight.last = now;
    var dt = Math.min((now - flight.last) / 1000, 0.05);
    flight.last = now;
    // Giữ thời gian bay trên màn hình khoảng 1,5–4 giây dù thông số thế nào.
    var speedUp = Math.max(1, flight.p.tFlight / 3);
    flight.t = Math.min(flight.t + dt * speedUp, flight.p.tFlight);
    draw();
    if (flight.t < flight.p.tFlight) {
      requestAnimationFrame(animate);
    } else {
      if (inputs.keep.checked) {
        history.push({ p: flight.p, color: TRAIL_COLORS[history.length % TRAIL_COLORS.length] });
        if (history.length > 5) history.shift();
      }
      flight = null;
      launchBtn.disabled = false;
      draw();
    }
  }

  function launch() {
    if (flight) return;
    var p = params();
    if (VL.reduceMotion) {
      flight = { p: p, t: p.tFlight, last: null };
      animate(performance.now());
      return;
    }
    flight = { p: p, t: 0, last: null };
    launchBtn.disabled = true;
    requestAnimationFrame(animate);
  }

  ['speed', 'angle', 'gravity'].forEach(function (key) {
    inputs[key].addEventListener('input', function () {
      updateLabels();
      if (!flight) draw();
    });
  });
  inputs.keep.addEventListener('change', function () {
    if (!inputs.keep.checked) {
      history = [];
      draw();
    }
  });
  launchBtn.addEventListener('click', launch);
  resetBtn.addEventListener('click', function () {
    history = [];
    flight = null;
    launchBtn.disabled = false;
    draw();
  });

  updateLabels();
  draw();
})();
