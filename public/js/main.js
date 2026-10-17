(function () {
  'use strict';

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
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx: ctx, width: width, height: height };
  }

  function readCssColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  window.VL24 = { renderMath: renderMath, fmt: fmt, setupCanvas: setupCanvas, reduceMotion: reduceMotion, color: readCssColor };

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
})();
