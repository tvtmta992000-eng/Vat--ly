(function () {
  'use strict';

  if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) {
      this.rect(x, y, w, h);
    };
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var KATEX_OPTIONS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
    strict: 'ignore',
  };

  function renderMath(element) {
    if (window.renderMathInElement) window.renderMathInElement(element || document.body, KATEX_OPTIONS);
  }

  // Định dạng số kiểu Việt Nam (dấu phẩy thập phân).
  function fmt(value, digits) {
    if (!isFinite(value)) return '—';
    return value.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  // Canvas sắc nét trên màn hình mật độ điểm ảnh cao, dùng hệ toạ độ logic cố định.
  function setupCanvas(canvas) {
    var width = canvas.width;
    var height = canvas.height;
    canvas.setAttribute('data-logical-width', width);
    canvas.setAttribute('data-logical-height', height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx: ctx, width: width, height: height };
  }

  // Đổi độ phân giải thật của canvas (khi phóng to) mà vẫn giữ hệ toạ độ logic để mô phỏng vẽ như cũ.
  function rescaleCanvas(canvas, factor) {
    var w = Number(canvas.getAttribute('data-logical-width'));
    var h = Number(canvas.getAttribute('data-logical-height'));
    if (!w || !h) return;
    var f = Math.max(1, Math.min(4, factor));
    canvas.width = Math.round(w * f);
    canvas.height = Math.round(h * f);
    canvas.getContext('2d').setTransform(f, 0, 0, f, 0, 0);
  }

  function readCssColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  window.VL24 = { renderMath: renderMath, fmt: fmt, setupCanvas: setupCanvas, rescaleCanvas: rescaleCanvas, reduceMotion: reduceMotion, color: readCssColor };

  document.addEventListener('DOMContentLoaded', function () {
    renderMath(document.body);

    // Menu di động
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }

    // Nút hiện/ẩn mật khẩu cho mọi ô mật khẩu
    document.querySelectorAll('input[type="password"]').forEach(function (input) {
      var wrap = document.createElement('div');
      wrap.className = 'password-field';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'password-toggle';
      btn.setAttribute('aria-label', 'Hiện mật khẩu');
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-eye"/></svg>';
      wrap.appendChild(btn);

      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        btn.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
        input.focus();
      });
      // Luôn ẩn lại trước khi gửi form để trình duyệt không lưu lịch sử dạng văn bản.
      if (input.form) input.form.addEventListener('submit', function () { input.type = 'password'; });
    });

    // Xác nhận trước khi thực hiện thao tác xoá
    document.querySelectorAll('form[data-confirm]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        if (!window.confirm(form.getAttribute('data-confirm'))) event.preventDefault();
      });
    });

    document.querySelectorAll('.sim').forEach(enhanceSim);

    // Đưa tiêu điểm tới kết quả trắc nghiệm sau khi nộp bài
    var result = document.getElementById('quiz-result');
    if (result) result.focus({ preventScroll: true });

    // Xem trước Markdown + công thức trong trang soạn bài
    var source = document.querySelector('[data-preview-source]');
    var target = document.querySelector('[data-preview-target]');
    var csrfInput = document.querySelector('input[name="_csrf"]');
    if (source && target && csrfInput) {
      var timer = null;
      var updatePreview = function () {
        fetch('/quan-tri/xem-truoc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfInput.value },
          body: JSON.stringify({ markdown: source.value }),
          credentials: 'same-origin',
        })
          .then(function (res) { return res.ok ? res.json() : null; })
          .then(function (data) {
            if (!data) return;
            target.innerHTML = data.html;
            renderMath(target);
          })
          .catch(function () { /* bỏ qua lỗi mạng tạm thời */ });
      };
      source.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(updatePreview, 400);
      });
      updatePreview();
    }
  });

  // ---------- Mô phỏng: ô nhập số cạnh thanh trượt + nút phóng to ----------

  function decimalsOf(step) {
    var s = String(step);
    return s.indexOf('.') >= 0 ? s.split('.')[1].length : 0;
  }

  function showNumber(range, box) {
    var step = range.step === 'any' ? Number(box.getAttribute('data-step')) || 0.01 : Number(range.step) || 1;
    var digits = Math.min(4, Math.max(decimalsOf(step), decimalsOf(box.getAttribute('data-step') || step)));
    var v = parseFloat(range.value);
    box.value = isFinite(v) ? String(Number(v.toFixed(digits))).replace('.', ',') : '';
  }

  // Ô số cho phép tự nhập giá trị; vượt khỏi thanh trượt thì mở rộng thanh trượt tới giới hạn data-hard-min/max.
  function enhanceSlider(range) {
    if (range.hasAttribute('data-enhanced')) return;
    range.setAttribute('data-enhanced', '');
    var label = range.closest('.slider');
    if (!label) return;
    var name = (label.querySelector('span') || label).textContent.trim();
    var box = document.createElement('input');
    box.type = 'text';
    box.inputMode = 'decimal';
    box.className = 'slider-number';
    box.setAttribute('aria-label', name + ' — nhập giá trị');
    box.setAttribute('data-step', range.step || '1');
    box.title = 'Nhập giá trị rồi bấm Enter';
    var output = label.querySelector('output');
    if (output && output.nextSibling) label.insertBefore(box, output.nextSibling);
    else label.insertBefore(box, range);
    label.classList.add('has-number');
    showNumber(range, box);

    var apply = function () {
      var raw = box.value.trim().replace(',', '.');
      var v = parseFloat(raw);
      if (raw === '' || !isFinite(v)) { showNumber(range, box); return; }
      var hardMin = range.hasAttribute('data-hard-min') ? Number(range.getAttribute('data-hard-min')) : Number(range.min);
      var hardMax = range.hasAttribute('data-hard-max') ? Number(range.getAttribute('data-hard-max')) : Number(range.max);
      var clamped = Math.min(hardMax, Math.max(hardMin, v));
      box.classList.toggle('is-clamped', clamped !== v);
      if (clamped !== v) box.title = 'Giới hạn: ' + fmt(hardMin, decimalsOf(box.getAttribute('data-step'))) + ' – ' + fmt(hardMax, 0);
      if (clamped < Number(range.min)) range.min = clamped;
      if (clamped > Number(range.max)) range.max = clamped;
      var step = Number(box.getAttribute('data-step')) || 1;
      var base = Number(range.min);
      if (Math.abs((clamped - base) / step - Math.round((clamped - base) / step)) > 1e-6) range.step = 'any';
      range.value = String(clamped);
      range.dispatchEvent(new Event('input', { bubbles: true }));
      range.dispatchEvent(new Event('change', { bubbles: true }));
      showNumber(range, box);
    };
    box.addEventListener('change', apply);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); apply(); }
    });
    range.addEventListener('input', function () {
      if (document.activeElement !== box) showNumber(range, box);
    });
  }

  function redrawSim(root) {
    var first = root.querySelector('input[type="range"]');
    if (first) first.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function enhanceSim(root) {
    var enhanceAll = function () {
      root.querySelectorAll('.slider input[type="range"]').forEach(enhanceSlider);
    };
    enhanceAll();
    root.addEventListener('sim:controls-changed', enhanceAll);
    // Thanh trượt bị mô phỏng đổi giá trị bằng mã (nút mẫu, đặt lại) không phát sự kiện: đồng bộ định kỳ.
    setInterval(function () {
      root.querySelectorAll('.slider-number').forEach(function (box) {
        var range = box.parentNode.querySelector('input[type="range"]');
        if (range && document.activeElement !== box) showNumber(range, box);
      });
    }, 500);

    var canvas = root.querySelector('.sim-canvas');
    if (!canvas) return;
    var buttons = root.querySelector('.sim-buttons');
    if (!buttons) {
      buttons = document.createElement('div');
      buttons.className = 'sim-buttons';
      (root.querySelector('.sim-panel') || root).appendChild(buttons);
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-sm sim-expand';
    btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-search"/></svg><span>Phóng to</span>';
    buttons.appendChild(btn);

    var expanded = false;
    var applyScale = function () {
      var dpr = window.devicePixelRatio || 1;
      var logical = Number(canvas.getAttribute('data-logical-width')) || canvas.clientWidth;
      var factor = expanded ? (canvas.getBoundingClientRect().width / logical) * dpr : Math.min(dpr, 2);
      rescaleCanvas(canvas, factor);
      redrawSim(root);
    };
    var setExpanded = function (on) {
      if (on === expanded) return;
      expanded = on;
      root.classList.toggle('is-expanded', on);
      document.body.classList.toggle('sim-open', on);
      btn.querySelector('span').textContent = on ? 'Thu nhỏ' : 'Phóng to';
      btn.setAttribute('aria-pressed', String(on));
      requestAnimationFrame(applyScale);
      if (on) btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', function () {
      if (!expanded) {
        setExpanded(true);
        if (root.requestFullscreen) root.requestFullscreen().catch(function () { /* giữ chế độ phóng to trong trang */ });
      } else {
        if (document.fullscreenElement === root && document.exitFullscreen) document.exitFullscreen().catch(function () {});
        setExpanded(false);
      }
    });
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement && expanded) setExpanded(false);
      else if (expanded) requestAnimationFrame(applyScale);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && expanded) setExpanded(false);
    });
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (!expanded) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyScale, 150);
    });
  }
})();
