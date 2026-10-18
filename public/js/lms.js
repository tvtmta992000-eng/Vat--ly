// Tương tác nhỏ cho các trang quản trị học tập (không phụ thuộc thư viện).
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // Form câu hỏi: hiện đúng khối nhập theo dạng câu
    document.querySelectorAll('[data-type-select]').forEach(function (select) {
      var scope = select.closest('fieldset.review-item') || select.closest('form');
      var update = function () {
        scope.querySelectorAll('[data-type-block]').forEach(function (block) {
          if (block.closest('fieldset.review-item') !== select.closest('fieldset.review-item')) return;
          block.hidden = block.getAttribute('data-type-block') !== select.value;
        });
      };
      select.addEventListener('change', update);
      update();
    });

    // Sinh đề: chỉ cần chọn chủ đề với khung đề "tự chọn chủ đề"
    var topicsBlock = document.querySelector('[data-topics-block]');
    if (topicsBlock) {
      var radios = document.querySelectorAll('input[name="blueprint_id"]');
      var sync = function () {
        var checked = document.querySelector('input[name="blueprint_id"]:checked');
        var needs = checked && checked.getAttribute('data-needs-topics') === '1';
        topicsBlock.classList.toggle('is-muted', !needs);
      };
      radios.forEach(function (r) { r.addEventListener('change', sync); });
      sync();
    }

    // Giao bài: điền sẵn theo đề, lọc danh sách học viên theo lớp
    var assignForm = document.querySelector('[data-assign-form]');
    if (assignForm) {
      var examSelect = assignForm.querySelector('[data-exam-select]');
      var titleInput = assignForm.querySelector('#title');
      var durationInput = assignForm.querySelector('[data-duration-input]');
      var attemptsInput = assignForm.querySelector('[data-attempts-input]');
      examSelect.addEventListener('change', function () {
        var opt = examSelect.selectedOptions[0];
        if (!opt || !opt.value) return;
        if (!titleInput.value.trim()) titleInput.value = opt.getAttribute('data-title');
        if (!durationInput.value) durationInput.value = opt.getAttribute('data-duration');
        attemptsInput.value = opt.getAttribute('data-kind') === 'practice' ? 0 : 1;
      });
      var classSelect = assignForm.querySelector('[data-class-select]');
      var list = assignForm.querySelector('[data-target-list]');
      var syncTargets = function () {
        var mode = assignForm.querySelector('input[name="target_mode"]:checked');
        var some = mode && mode.value === 'some';
        list.hidden = !some && classSelect.value !== '';
        list.querySelectorAll('[data-class]').forEach(function (g) {
          g.hidden = classSelect.value !== '' && g.getAttribute('data-class') !== classSelect.value;
        });
      };
      classSelect.addEventListener('change', syncTargets);
      assignForm.querySelectorAll('input[name="target_mode"]').forEach(function (r) { r.addEventListener('change', syncTargets); });
      syncTargets();
    }

    document.querySelectorAll('[data-print]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.print(); });
    });
  });
})();
