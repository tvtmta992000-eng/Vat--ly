// Chấm bài trắc nghiệm. `answers` là object { [questionId]: chỉ số đáp án đã chọn }.
function gradeQuiz(questions, answers) {
  const results = questions.map((q) => {
    const raw = answers[`q${q.id}`];
    const chosen = raw === undefined || raw === '' ? null : Number(raw);
    return {
      questionId: q.id,
      chosen,
      correct: chosen === q.correct_index,
    };
  });
  const score = results.filter((r) => r.correct).length;
  return { score, total: questions.length, results };
}

function parseOptions(question) {
  try {
    const options = JSON.parse(question.options_json);
    return Array.isArray(options) ? options : [];
  } catch {
    return [];
  }
}

module.exports = { gradeQuiz, parseOptions };
