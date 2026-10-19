// Cảm ứng điện từ: nam châm thẳng chuyển động dọc trục cuộn dây.
// Từ thông qua cuộn (lưỡng cực trên trục): Φ(x) = ±Φ0 / (1 + ((x − xc)/a)²)^(3/2); e = −N·dΦ/dt.
// Dấu + khi cực N hướng vào cuộn dây (từ trường trên trục hướng sang phải).
(function () {
  'use strict';
  var root = document.querySelector('.sim[data-sim="induction"]');
  if (!root || !window.VL24) return;
  var VL = window.VL24;

  var canvas = root.querySelector('canvas');
  var view = VL.setupCanvas(canvas);
  var ctx = view.ctx;
  var W = view.width;
  var H = view.height;
  var AXIS_Y = 250;
  var COIL_X = 440;
  var COIL_R = 62;
  var SPREAD = 70;
  var MAG_W = 150;
  var MAG_H = 40;
  var X_MIN = 90;
  var X_MAX = 690;
  var EMF_SCALE = 6; // quy đổi sang mV
  var EMF_FULL = 60; // mV: thang đo nhỏ nhất của điện kế, cũng là mức đèn sáng hết cỡ
  var MAX_DRAWN_TURNS = 40; // vẽ tối đa 40 vòng; nhiều hơn thì các vòng vẽ đại diện
  var COIL_MAX_W = 160; // bề rộng tối đa của cuộn dây trên màn hình (px)

  var inputs = {
    turns: root.querySelector('input[name="turns"]'),
    speed: root.querySelector('input[name="speed"]'),
    pos: root.querySelector('input[name="pos"]'),
  };
  var poleInputs = root.querySelectorAll('input[name="pole"]');
  var outputs = {
    turns: root.querySelector('output[data-for="turns"]'),
    speed: root.querySelector('output[data-for="speed"]'),
    pos: root.querySelector('output[data-for="pos"]'),
  };
  var readout = {
    flux: root.querySelector('[data-out="flux"]'),
    emf: root.querySelector('[data-out="emf"]'),
    dir: root.querySelector('[data-out="dir"]'),
    lenz: root.querySelector('[data-out="lenz"]'),
  };
  var toggleBtn = root.querySelector('[data-action="toggle"]');
  var resetBtn = root.querySelector('[data-action="reset"]');

  var magX = X_MIN + (X_MAX - X_MIN) * parseFloat(inputs.pos.value);
  var prevFlux = null;
  var emf = 0;
  var dFlux = 0;
  var auto = false;
  var autoPhase = 0;
  var dragging = false;
  var dragOffset = 0;
  var dashOffset = 0;
  var last = null;
  var emfPeak = 0; // đỉnh |e| gần đây (giảm dần) để điện kế tự đổi thang đo

  // Làm tròn tới khoảng 3 chữ số có nghĩa rồi chọn số chữ số thập phân tương ứng.
  function fmtAuto(v, sig) {
    sig = sig || 3;
    var r = isFinite(v) ? Number(v.toPrecision(sig)) : v;
    var a = Math.abs(r);
    var digits = a > 1e-9 && isFinite(a) ? Math.max(0, Math.min(6, sig - 1 - Math.floor(Math.log10(a)))) : 0;
    return VL.fmt(a > 1e-9 ? r : 0, digits);
  }

  // Suất điện động (mV) ghi theo mV hoặc V cho gọn.
  function fmtEmf(mv) {
    return Math.abs(mv) >= 1000 ? fmtAuto(mv / 1000) + ' V' : fmtAuto(mv) + ' mV';
  }

  function turns() {
    return Math.max(1, Math.round(parseFloat(inputs.turns.value)));
  }

  // Thang đo điện kế: 60 mV như cũ; khi e vượt thang thì chuyển lên giá trị "đẹp" 1–2–5 × 10ⁿ mV.
  function meterRange() {
    var need = emfPeak * 1.05;
    if (need <= EMF_FULL) return EMF_FULL;
    var pow = Math.pow(10, Math.floor(Math.log10(need)));
    var n = need / pow;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
  }

  function polarity() {
    var checked = root.querySelector('input[name="pole"]:checked');
    return checked && checked.value === 'S' ? -1 : 1;
  }

  // Đầu cực hướng vào cuộn là đầu bên phải của thanh nam châm.
  function flux(x) {
    var face = x + MAG_W / 2 - 20; // tâm lưỡng cực lệch về phía cực gần cuộn
    var u = (face - COIL_X) / SPREAD;
    return polarity() / Math.pow(1 + u * u, 1.5);
  }

  function updateLabels() {
    var N = turns();
    outputs.turns.textContent = N + ' vòng';
    var sp = parseFloat(inputs.speed.value);
    outputs.speed.textContent = fmtAuto(sp, 2) + '× · ' + (sp < 0.8 ? 'chậm' : sp < 1.8 ? 'vừa' : 'nhanh');
    var pos = (magX - X_MIN) / (X_MAX - X_MIN);
    outputs.pos.textContent = Math.round(Math.max(0, Math.min(1, pos)) * 100) + '%';
    var phi = flux(magX);
    readout.flux.textContent = VL.fmt(phi, 2);
    readout.emf.textContent = fmtEmf(emf);
    if (Math.abs(emf) < 0.5) {
      readout.dir.textContent = 'Không có dòng điện';
      readout.lenz.textContent = 'Từ thông không đổi → không có dòng cảm ứng.';
    } else {
      readout.dir.textContent = emf > 0 ? 'Cùng chiều kim đồng hồ' : 'Ngược chiều kim đồng hồ';
      readout.lenz.textContent =
        Math.abs(phi) > Math.abs(phi - dFlux)
          ? 'Từ thông tăng → từ trường cảm ứng ngược chiều, đẩy nam châm ra.'
          : 'Từ thông giảm → từ trường cảm ứng cùng chiều, hút nam châm lại.';
    }
  }

  function setMag(x) {
    magX = Math.max(X_MIN - MAG_W / 2 + 20, Math.min(X_MAX, x));
    inputs.pos.value = String((magX - X_MIN) / (X_MAX - X_MIN));
  }

  function drawCoil(N, front) {
    // Vẽ nửa sau (front = false) hoặc nửa trước (front = true) của các vòng dây.
    // Nhiều vòng thì thu hẹp khoảng cách và chỉ vẽ tối đa MAX_DRAWN_TURNS vòng đại diện.
    var shown = Math.min(N, MAX_DRAWN_TURNS);
    var spacing = shown > 1 ? Math.min(14, COIL_MAX_W / (shown - 1)) : 14;
    var start = COIL_X - ((shown - 1) * spacing) / 2;
    ctx.lineWidth = shown > 15 ? 2.5 : 4;
    for (var i = 0; i < shown; i++) {
      var x = start + i * spacing;
      ctx.strokeStyle = front ? '#b45309' : '#d6a26a';
      ctx.beginPath();
      ctx.ellipse(x, AXIS_Y, 16, COIL_R, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : (3 * Math.PI) / 2);
      ctx.stroke();
    }
    return { left: start, right: start + (shown - 1) * spacing };
  }

  function drawMagnet() {
    var x = magX - MAG_W / 2;
    var y = AXIS_Y - MAG_H / 2;
    var pol = polarity();
    var rightIsN = pol > 0;
    ctx.fillStyle = rightIsN ? '#2563eb' : '#dc2626';
    ctx.fillRect(x, y, MAG_W / 2, MAG_H);
    ctx.fillStyle = rightIsN ? '#dc2626' : '#2563eb';
    ctx.fillRect(x + MAG_W / 2, y, MAG_W / 2, MAG_H);
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rightIsN ? 'S' : 'N', x + MAG_W / 4, AXIS_Y + 6);
    ctx.fillText(rightIsN ? 'N' : 'S', x + (3 * MAG_W) / 4, AXIS_Y + 6);
    ctx.textAlign = 'left';
    if (!auto) {
      ctx.fillStyle = '#5b6478';
      ctx.font = '12px "Noto Sans", sans-serif';
      ctx.fillText('⇆ kéo', magX - 16, y + MAG_H + 18);
    }
  }

  function drawMeter(cx, cy) {
    // Điện kế: kim lệch theo e
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 52, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5b6478';
    ctx.font = '11px "Noto Sans", sans-serif';
    for (var k = -2; k <= 2; k++) {
      var a = -Math.PI / 2 + (k * Math.PI) / 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 42, cy + Math.sin(a) * 42);
      ctx.lineTo(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50);
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
    }
    var range = meterRange();
    var frac = Math.max(-1, Math.min(1, emf / range));
    var angle = -Math.PI / 2 + frac * (Math.PI * 0.42);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 46, cy + Math.sin(angle) * 46);
    ctx.stroke();
    ctx.fillStyle = '#1e1b4b';
    ctx.font = '700 13px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('G', cx, cy - 14);
    ctx.font = '11px "Noto Sans", sans-serif';
    ctx.fillStyle = '#5b6478';
    ctx.fillText('thang ±' + fmtEmf(range), cx, cy - 58);
    ctx.textAlign = 'left';
  }

  function drawBulb(cx, cy) {
    var glow = Math.min(1, Math.abs(emf) / EMF_FULL);
    if (glow > 0.02) {
      var g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 70);
      g.addColorStop(0, 'rgba(253, 224, 71,' + glow + ')');
      g.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 251, 235,' + (0.6 + glow * 0.4) + ')';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = glow > 0.05 ? '#f59e0b' : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 6);
    ctx.lineTo(cx - 4, cy - 6);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx + 4, cy - 6);
    ctx.lineTo(cx + 8, cy + 6);
    ctx.stroke();
  }

  function draw() {
    var N = turns();
    ctx.clearRect(0, 0, W, H);

    var ends = drawCoil(N, false);
    // Dây nối: hai đầu cuộn dây lên điện kế và bóng đèn
    var meter = { x: 330, y: 95 };
    var bulb = { x: 560, y: 80 };
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.setLineDash(Math.abs(emf) > 0.5 ? [8, 8] : []);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    ctx.moveTo(ends.left, AXIS_Y - COIL_R);
    ctx.lineTo(ends.left, meter.y + 20);
    ctx.lineTo(meter.x, meter.y + 20);
    ctx.moveTo(meter.x, meter.y + 20);
    ctx.lineTo(meter.x, meter.y);
    ctx.moveTo(meter.x + 52, meter.y);
    ctx.lineTo(bulb.x, meter.y);
    ctx.lineTo(bulb.x, bulb.y + 20);
    ctx.moveTo(bulb.x, bulb.y - 20);
    ctx.lineTo(bulb.x, 30);
    ctx.lineTo(ends.right + 40, 30);
    ctx.lineTo(ends.right + 40, AXIS_Y - COIL_R);
    ctx.lineTo(ends.right, AXIS_Y - COIL_R);
    ctx.stroke();
    ctx.setLineDash([]);

    drawMagnet();
    drawCoil(N, true);
    drawMeter(meter.x + 26, meter.y);
    drawBulb(bulb.x, bulb.y);

    ctx.fillStyle = '#5b6478';
    ctx.font = '12px "Noto Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cuộn dây ' + N + ' vòng' + (N > MAX_DRAWN_TURNS ? ' (vẽ ' + MAX_DRAWN_TURNS + ' vòng đại diện)' : ''), COIL_X, AXIS_Y + COIL_R + 26);
    ctx.textAlign = 'left';
    ctx.fillText('Chiều dòng điện xét khi nhìn cuộn dây từ bên trái.', 20, H - 14);
  }

  function updatePhysics(dt) {
    var phi = flux(magX);
    if (prevFlux !== null && dt > 0) {
      var N = turns();
      var rate = (phi - prevFlux) / dt;
      dFlux = phi - prevFlux;
      var instant = -N * rate * EMF_SCALE;
      emf = emf * 0.6 + instant * 0.4; // làm mượt
    }
    prevFlux = phi;
    // Đỉnh |e| giảm dần trong vài giây để thang đo trở lại khi dòng điện nhỏ đi.
    emfPeak = Math.max(Math.abs(emf), emfPeak * Math.exp(-dt / 3));
    // Tốc độ chạy của nét đứt có giới hạn; lấy phần dư để số không lớn dần.
    dashOffset = (dashOffset - Math.max(-120, Math.min(120, emf)) * dt * 2) % 16;
  }

  function frame(now) {
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    if (auto) {
      autoPhase += dt * parseFloat(inputs.speed.value) * 0.9;
      var center = (X_MIN + X_MAX) / 2 - 60;
      var amp = (X_MAX - X_MIN) / 2 - 30;
      setMag(center + amp * Math.sin(autoPhase - Math.PI / 2));
    }
    updatePhysics(dt);
    updateLabels();
    draw();
    requestAnimationFrame(frame);
  }

  function toCanvasX(event) {
    var rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * W;
  }
  function toCanvasY(event) {
    var rect = canvas.getBoundingClientRect();
    return ((event.clientY - rect.top) / rect.height) * H;
  }

  canvas.addEventListener('pointerdown', function (event) {
    var x = toCanvasX(event);
    var y = toCanvasY(event);
    if (Math.abs(x - magX) < MAG_W / 2 + 10 && Math.abs(y - AXIS_Y) < MAG_H) {
      dragging = true;
      dragOffset = x - magX;
      setAuto(false);
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    }
  });
  canvas.addEventListener('pointermove', function (event) {
    var x = toCanvasX(event);
    if (dragging) {
      setMag(x - dragOffset);
    } else {
      var y = toCanvasY(event);
      canvas.style.cursor = Math.abs(x - magX) < MAG_W / 2 && Math.abs(y - AXIS_Y) < MAG_H ? 'grab' : 'default';
    }
  });
  ['pointerup', 'pointercancel'].forEach(function (type) {
    canvas.addEventListener(type, function () {
      dragging = false;
      canvas.style.cursor = 'default';
    });
  });

  function setAuto(value) {
    auto = value;
    toggleBtn.querySelector('span').textContent = auto ? 'Dừng' : 'Tự động';
    toggleBtn.querySelector('use').setAttribute('href', auto ? '#i-pause' : '#i-play');
  }

  // Vòng lặp vẽ chạy liên tục, nhưng vẫn vẽ lại ngay khi đổi thông số (kể cả khi phóng to khung hình).
  ['turns', 'speed'].forEach(function (n) {
    inputs[n].addEventListener('input', function () {
      updateLabels();
      draw();
    });
  });
  inputs.pos.addEventListener('input', function () {
    setAuto(false);
    magX = X_MIN + (X_MAX - X_MIN) * parseFloat(inputs.pos.value);
    updateLabels();
    draw();
  });
  poleInputs.forEach(function (el) {
    el.addEventListener('change', function () {
      prevFlux = null;
      emf = 0;
    });
  });
  toggleBtn.addEventListener('click', function () { setAuto(!auto); });
  resetBtn.addEventListener('click', function () {
    setAuto(false);
    inputs.turns.value = 5;
    inputs.speed.value = 1;
    poleInputs[0].checked = true;
    setMag(X_MIN + (X_MAX - X_MIN) * 0.12);
    prevFlux = null;
    emf = 0;
    emfPeak = 0;
  });

  canvas.style.touchAction = 'pan-y'; // vẫn cuộn trang theo chiều dọc, kéo ngang để di chuyển nam châm
  requestAnimationFrame(frame);
})();
