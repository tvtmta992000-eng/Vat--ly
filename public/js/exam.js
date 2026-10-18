// Trang làm bài: đồng hồ đếm ngược, tự lưu câu trả lời, bảng câu đã làm, xác nhận khi nộp.
(function () {
  'use strict';

  var form = document.querySelector('[data-exam]');
  if (!form) return;
  var csrf = form.querySelector('input[name="_csrf"]').value;
  var saveUrl = form.getAttribute('data-save-url');
  var deadline = Number(form.getAttribute('data-deadline')) || null;
  var due = Number(form.getAttribute('data-due')) || null;
  var questions = Array.prototype.slice.call(form.querySelectorAll('[data-item]'));
  var saveStatus = document.querySelector('[data-save-status]');
  var progress = document.querySelector('[data-progress]');
  var dirty = false;
  var submitting = false;
  var saving = false;
  var startedAt = Number(form.getAttribute('data-started')) || Date.now();

  function collect() {
    var answers = {};
    questions.forEach(function (q) {
      var id = q.getAttribute('data-item');
      var type = q.getAttribute('data-type');
      if (type === 'mcq') {
        var c = q.querySelector('input[type="radio"]:checked');
        if (c) answers[id] = Number(c.value);
      } else if (type === 'tf') {
        var arr = [null, null, null, null];
        var any = false;
        for (var i = 0; i < 4; i++) {
          var r = q.querySelector('input[name="a_' + id + '_' + i + '"]:checked');
          if (r) { arr[i] = r.value === 'true'; any = true; }
        }
        if (any) answers[id] = arr;
      } else {
        var input = q.querySelector('input[type="text"]');
        if (input && input.value.trim()) answers[id] = input.value.trim();
      }
    });
    return answers;
  }

  function isDone(q, answers) {
    var id = q.getAttribute('data-item');
    var v = answers[id];
    if (v === undefined) return 'none';
    if (q.getAttribute('data-type') === 'tf') {
      var n = v.filter(function (x) { return x !== null; }).length;
      return n === 4 ? 'done' : 'part';
    }
    return 'done';
  }

  function refreshNav() {
    var answers = collect();
    var done = 0;
    questions.forEach(function (q) {
      var state = isDone(q, answers);
      if (state === 'done') done++;
      var link = document.querySelector('[data-nav-for="' + q.getAttribute('data-item') + '"]');
      if (link) {
        link.classList.toggle('is-done', state === 'done');
        link.classList.toggle('is-part', state === 'part');
      }
    });
    if (progress) progress.textContent = 'Đã làm ' + done + '/' + questions.length;
    return { done: done, answers: answers };
  }

  function save() {
    if (!dirty || saving || submitting) return Promise.resolve();
    saving = true;
    dirty = false;
    var answers = collect();
    return fetch(saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Accept: 'application/json' },
      body: JSON.stringify({ answers: answers }),
      credentials: 'same-origin',
    })
      .then(function (res) {
        if (res.status === 409) { window.location.reload(); return; }
        if (!res.ok) throw new Error('save failed');
        var t = new Date();
        saveStatus.textContent = 'Đã lưu lúc ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + ':' + String(t.getSeconds()).padStart(2, '0');
        saveStatus.classList.remove('text-danger');
      })
      .catch(function () {
        dirty = true;
        saveStatus.textContent = 'Chưa lưu được (mất kết nối?) — sẽ thử lại. Đừng đóng trang.';
        saveStatus.classList.add('text-danger');
      })
      .then(function () { saving = false; });
  }

  form.addEventListener('change', function () { dirty = true; refreshNav(); save(); });
  form.addEventListener('input', function (e) {
    if (e.target.type === 'text') { dirty = true; refreshNav(); }
  });
  setInterval(save, 15000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });

  window.addEventListener('beforeunload', function (e) {
    if (dirty && !submitting) { e.preventDefault(); e.returnValue = ''; }
  });

  form.addEventListener('submit', function (e) {
    var state = refreshNav();
    var missing = questions.length - state.done;
    var msg = missing > 0 ? 'Còn ' + missing + ' câu chưa làm xong. Vẫn nộp bài?' : 'Nộp bài? Sau khi nộp không sửa được nữa.';
    if (!window.confirm(msg)) { e.preventDefault(); return; }
    submitting = true;
    form.querySelectorAll('[data-submit]').forEach(function (b) { b.disabled = true; b.textContent = 'Đang nộp…'; });
    document.querySelectorAll('button[form="exam-form"]').forEach(function (b) { b.disabled = true; });
  });

  // Đồng hồ: đếm ngược nếu có giới hạn thời gian, ngược lại đếm thời gian đã làm. Quá giờ không khoá bài.
  var timerValue = document.querySelector('[data-timer-value]');
  var timerNote = document.querySelector('[data-timer-note]');
  var timerBox = document.querySelector('[data-timer]');
  function fmt(ms) {
    var s = Math.floor(Math.abs(ms) / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(sec).padStart(2, '0');
  }
  var warned = false;
  function tick() {
    var now = Date.now();
    if (deadline) {
      var left = deadline - now;
      if (left >= 0) {
        timerValue.textContent = fmt(left);
        timerBox.classList.toggle('is-warning', left < 5 * 60000);
        if (left < 5 * 60000 && !warned) { warned = true; timerNote.textContent = 'Còn dưới 5 phút!'; }
      } else {
        timerValue.textContent = '+' + fmt(left);
        timerBox.classList.add('is-over');
        timerNote.textContent = 'Đã hết giờ — hãy nộp ngay, bài sẽ bị đánh dấu trễ.';
      }
    } else {
      timerValue.textContent = fmt(now - startedAt);
    }
    if (due && now > due && !timerBox.classList.contains('is-over')) {
      timerNote.textContent = 'Đã quá hạn nộp — bài sẽ bị đánh dấu trễ.';
    }
  }
  tick();
  setInterval(tick, 1000);
  refreshNav();
})();
