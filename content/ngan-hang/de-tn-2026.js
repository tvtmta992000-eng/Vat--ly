// Ngân hàng câu hỏi lấy từ Đề thi tốt nghiệp THPT 2026 môn Vật lí (mã đề 0230 và 0207, đề chính thức của Bộ GD&ĐT).
// Đáp án và lời giải do website biên soạn (đề gốc không kèm đáp án) — giáo viên nên rà soát lại.
// Câu có `template` sinh được biến thể số liệu: {{ten_bien}} trong văn bản sẽ được thay bằng giá trị.
// Nhập vào website: npm run nap-ngan-hang -- content/ngan-hang/de-tn-2026.js
const r = String.raw;
const S0230 = 'Đề TN THPT 2026 – Mã đề 0230';
const S0207 = 'Đề TN THPT 2026 – Mã đề 0207';

// ----------------------------------------------------------------------------
// Bối cảnh và mẫu dùng chung cho câu trả lời ngắn
// ----------------------------------------------------------------------------
const PU_CONTEXT = r`Một pin hạt nhân sử dụng đồng vị phóng xạ plutonium $^{238}_{94}\text{Pu}$ với hằng số phóng xạ $\lambda = 2{,}50\cdot 10^{-10}\ \text{s}^{-1}$ để cung cấp năng lượng cho xe tự hành trên Hoả Tinh. Tại thời điểm đưa vào sử dụng để phát điện (thời điểm ban đầu), pin hạt nhân này chứa $\{{N0}}\cdot 10^{24}$ hạt nhân $^{238}_{94}\text{Pu}$. Biết mỗi phân rã hạt nhân $^{238}_{94}\text{Pu}$ toả ra năng lượng là $8{,}97\cdot 10^{-13}$ J và toàn bộ năng lượng này biến thành nhiệt. Trong đó, chỉ có $\{{eff}}\%$ năng lượng nhiệt chuyển thành năng lượng điện. Biết một năm có 365 ngày, một ngày có 86400 s.`;

const TIRE_CONTEXT = r`Trước khi khởi hành, người lái xe điều chỉnh áp suất khí trong lốp xe ô tô về giá trị khuyến nghị của nhà sản xuất. Khi đó, nhiệt độ của khí trong lốp xe là $\{{t1}}\ ^\circ\text{C}$. Sau khi lái xe được một quãng đường, cảm biến cho biết nhiệt độ của khí trong lốp là $\{{t2}}\ ^\circ\text{C}$. Coi khí trong lốp xe là khí lí tưởng và thể tích lốp xe không thay đổi. Lấy $T(\text{K}) = t(^\circ\text{C}) + 273$.`;

const ROD_CONTEXT = r`Một thanh kim loại có chiều dài $\ell = {{l}}$ cm chuyển động đều với tốc độ $v = {{v}}$ cm/s dọc theo hai thanh ray kim loại song song, được nối với nhau bằng một dây dẫn ở một đầu. Hệ thống ở trong một từ trường đều có cảm ứng từ vuông góc, hướng ra khỏi mặt phẳng hình vẽ và có độ lớn $B = {{B}}$ T. Khi đó, suất điện động cảm ứng xuất hiện trong thanh kim loại có độ lớn là $|e_c| = B\ell v$. Thanh kim loại có điện trở là $\{{R}}\ \Omega$, các thanh ray và dây nối có điện trở không đáng kể.`;

function pu(N0, eff) {
  return {
    N0: { min: 6.0, max: 9.5, step: 0.1, value: N0, decimals: 2 },
    eff: { min: 5.0, max: 7.5, step: 0.1, value: eff, decimals: 2 },
  };
}
function tire(t1, t2) {
  return {
    t1: { min: 10, max: 20, step: 0.1, value: t1, decimals: 1 },
    t2: { min: 40, max: 55, step: 0.1, value: t2, decimals: 1 },
  };
}
function rod(l, v, B, R) {
  return {
    l: { min: 20, max: 40, step: 0.5, value: l, decimals: 1 },
    v: { min: 30, max: 60, step: 0.5, value: v, decimals: 1 },
    B: { min: 0.3, max: 0.5, step: 0.01, value: B, decimals: 3 },
    R: { min: 10, max: 30, step: 0.5, value: R, decimals: 1 },
  };
}

const PU_ENERGY = 'lam*N0*1e24*8.97e-13*eff/100/1000';
const PU_REMAIN = 'N0*exp(-lam*t*365*86400)';
const TIRE_UP = '((t2+273)/(t1+273)-1)*100';
const TIRE_OUT = '(1-(t1+273)/(t2+273))*100';
const ROD_I = 'B*(l/100)*(v/100)/R*1000';
const ROD_P = '(B*(l/100)*(v/100))^2/R*1000';

function shortQ(key, source, family, topic, context, stem, vars, answerExpr, decimals, unit, explanation) {
  return {
    key, source, family, type: 'short', grade: 12, topic, difficulty: 3,
    context, stem, explanation,
    data: { decimals, unit },
    template: { vars, answer: answerExpr, constants: { lam: 2.5e-10 } },
  };
}

const EXPL_PU_ENERGY = r`Độ phóng xạ ban đầu $H_0 = \lambda N_0$. Năng lượng điện trong 1 s đầu: $W = \lambda N_0 \cdot 8{,}97\cdot 10^{-13}\cdot {{eff}}\%$ $\approx {{ans}}$ kJ.`;
const EXPL_PU_REMAIN = r`$t = {{t}}\cdot 365\cdot 86400$ s; $N = N_0 e^{-\lambda t} \approx {{ans}}\cdot 10^{24}$ hạt nhân.`;
const EXPL_TIRE_UP = r`Thể tích không đổi nên $\dfrac{p_2}{p_1} = \dfrac{T_2}{T_1} = \dfrac{{{t2}} + 273}{{{t1}} + 273}$, áp suất tăng $\approx {{ans}}\%$.`;
const EXPL_TIRE_OUT = r`Cùng $V$, cùng $T_2$: lượng khí tỉ lệ với áp suất. Sau khi xả $p = p_1$ nên phần khí còn lại là $\dfrac{p_1}{p_2} = \dfrac{T_1}{T_2}$; phần đã xả $= 1 - \dfrac{T_1}{T_2} \approx {{ans}}\%$.`;
const EXPL_ROD_I = r`$|e_c| = B\ell v$; $I = \dfrac{|e_c|}{R} \approx {{ans}}$ mA.`;
const EXPL_ROD_P = r`$P = \dfrac{e_c^2}{R} = I^2R \approx {{ans}}$ mW.`;

module.exports = [
  // ==========================================================================
  // MÃ ĐỀ 0230 — PHẦN I
  // ==========================================================================
  {
    key: 'tn2026-0230-1-01', source: S0230, family: 'hn-wlk-bang-nhau', type: 'mcq', grade: 12, topic: 'vl12-c4', difficulty: 2,
    stem: 'Hai hạt nhân X và Y có năng lượng liên kết bằng nhau. Nếu số nucleon của hạt nhân X nhỏ hơn số nucleon của hạt nhân Y thì',
    data: { options: ['độ hụt khối của hạt nhân Y lớn hơn độ hụt khối của hạt nhân X.', 'độ hụt khối của hạt nhân X lớn hơn độ hụt khối của hạt nhân Y.', 'hạt nhân X bền vững hơn hạt nhân Y.', 'hạt nhân Y bền vững hơn hạt nhân X.'], answer: 2 },
    explanation: r`$W_{lk}$ bằng nhau nên độ hụt khối bằng nhau. Năng lượng liên kết riêng $W_{lk}/A$ của X lớn hơn (A nhỏ hơn) nên X bền hơn.`,
  },
  {
    key: 'tn2026-0230-1-02', source: S0230, family: 'nhiet-cung-q', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: 'Khi truyền cùng một nhiệt lượng cho hai vật có cùng khối lượng được làm từ hai chất khác nhau, trong điều kiện không xảy ra sự chuyển thể, phát biểu nào sau đây là đúng?',
    data: { options: ['Vật được làm từ chất có nhiệt dung riêng lớn hơn có độ biến thiên nhiệt độ lớn hơn.', 'Hai vật có độ biến thiên nhiệt độ bằng nhau.', 'Hai vật không thay đổi nhiệt độ.', 'Vật được làm từ chất có nhiệt dung riêng lớn hơn có độ biến thiên nhiệt độ nhỏ hơn.'], answer: 3 },
    explanation: r`$\Delta t = \dfrac{Q}{mc}$: cùng $Q$, cùng $m$ thì $c$ càng lớn, $\Delta t$ càng nhỏ.`,
  },
  {
    key: 'tn2026-0230-1-03', source: S0230, family: 'px-binh-chi', type: 'mcq', grade: 12, topic: 'vl12-c4', difficulty: 2,
    stem: 'Một nguồn phóng xạ dùng trong y tế được bảo quản trong bình chì. Khi cần sử dụng, người ta mở cửa bình cho tia phóng xạ phát ra ngoài để chiếu xạ. Thời gian mỗi lần chiếu xạ được coi là bằng thời gian mỗi lần mở cửa bình. Tổng thời gian mà nguồn phóng xạ này còn có thể phát tia phóng xạ đủ để sử dụng',
    data: { options: ['chỉ phụ thuộc vào độ mạnh hay yếu của chùm tia phóng xạ trong mỗi lần chiếu.', 'chỉ phụ thuộc vào số lần mở cửa bình.', 'không phụ thuộc vào số lần mở cửa bình cũng như độ mạnh hay yếu của chùm tia phóng xạ trong mỗi lần chiếu.', 'phụ thuộc vào số lần mở cửa bình cũng như độ mạnh hay yếu của chùm tia phóng xạ trong mỗi lần chiếu.'], answer: 2 },
    explanation: 'Sự phân rã diễn ra liên tục, kể cả khi cửa bình đóng; lượng chất phóng xạ còn lại chỉ phụ thuộc thời gian và chu kì bán rã, không phụ thuộc việc mở bình.',
  },
  {
    key: 'tn2026-0230-1-04', source: S0230, family: 'kl-ap-suat', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 1,
    stem: 'Các phân tử khí lí tưởng gây ra áp suất lên thành bình chứa là do chúng',
    data: { options: ['va chạm vào thành bình.', 'hút nhau khi chuyển động lại gần nhau.', 'va chạm với nhau.', 'đẩy nhau khi chuyển động lại gần nhau.'], answer: 0 },
    explanation: 'Áp suất khí do các phân tử chuyển động hỗn loạn va chạm vào thành bình.',
  },
  {
    key: 'tn2026-0230-1-05', source: S0230, family: 'hat-tron-tu-truong', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 2,
    stem: 'Trong một từ trường đều, một proton chuyển động tròn đều chỉ do tác dụng của lực từ. Phát biểu nào sau đây là đúng?',
    data: { options: ['Vận tốc của hạt không đổi.', 'Động năng của hạt tăng.', 'Lực từ không sinh công.', 'Gia tốc của hạt không đổi.'], answer: 2 },
    explanation: 'Lực từ luôn vuông góc với vận tốc nên không sinh công; tốc độ và động năng không đổi nhưng vectơ vận tốc và gia tốc đổi hướng liên tục.',
  },
  {
    key: 'tn2026-0230-1-06', source: S0230, family: 'nhiet-luong-chua', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: 'Khi đặt vật 1 tiếp xúc nhiệt với vật 2 và có sự truyền nhiệt từ vật 1 sang vật 2, phát biểu nào sau đây là đúng?',
    data: { options: ['Vật 1 chứa rất nhiều nhiệt lượng.', 'Vật 2 chứa rất ít nhiệt lượng.', 'Vật 1 chứa nhiều nhiệt lượng hơn vật 2.', 'Vật 1 và vật 2 đều không chứa nhiệt lượng.'], answer: 3 },
    explanation: 'Nhiệt lượng là phần năng lượng truyền đi trong quá trình truyền nhiệt, không phải thứ mà vật "chứa". Vật chứa nội năng.',
  },
  {
    key: 'tn2026-0230-1-07', source: S0230, family: 'tuong-tac-tu', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 1,
    stem: 'Khi ở gần nhau,',
    data: { options: ['hai điện tích trái dấu đẩy nhau.', 'hai cực khác loại của hai nam châm hút nhau.', 'hai dòng điện ngược chiều hút nhau.', 'hai dòng điện cùng chiều đẩy nhau.'], answer: 1 },
    explanation: 'Cực khác tên hút nhau. Điện tích trái dấu hút nhau; dòng điện cùng chiều hút nhau, ngược chiều đẩy nhau.',
  },
  {
    key: 'tn2026-0230-1-08', source: S0230, family: 'kl-dang-nhiet-dan', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 1,
    stem: 'Khi một khối khí lí tưởng xác định dãn nở đẳng nhiệt thì',
    data: { options: ['nội năng của khối khí tăng.', 'áp suất của khối khí giảm.', 'nội năng của khối khí giảm.', 'áp suất của khối khí không đổi.'], answer: 1 },
    explanation: r`$pV$ không đổi, $V$ tăng nên $p$ giảm. Nhiệt độ không đổi nên nội năng khí lí tưởng không đổi.`,
  },
  {
    key: 'tn2026-0230-1-09', source: S0230, family: 'kl-dang-tich-cong', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 2,
    stem: 'Một khối khí lí tưởng xác định biến đổi theo quá trình thể tích không đổi từ trạng thái X sang trạng thái Y, phát biểu nào sau đây là đúng?',
    data: { options: ['Khoảng cách trung bình giữa các phân tử tăng lên.', 'Nhiệt độ của khối khí không đổi.', 'Mật độ phân tử của khối khí tăng lên.', 'Công mà khối khí sinh ra bằng không.'], answer: 3 },
    explanation: r`Thể tích không đổi nên khí không sinh công ($A = p\Delta V = 0$); mật độ và khoảng cách phân tử không đổi.`,
  },
  {
    key: 'tn2026-0230-1-10', source: S0230, family: 'nuoc-soi', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: r`Khi đun một ấm nước, lúc nước đang sôi, dù tiếp tục được cung cấp nhiệt lượng thì nhiệt độ vẫn ở $100\ ^\circ\text{C}$ cho đến khi cạn nước. Phát biểu nào sau đây là đúng?`,
    data: { options: [r`Việc đun với công suất nhiệt cao hơn sẽ làm nhiệt độ sôi của nước cao hơn $100\ ^\circ\text{C}$.`, 'Do nhiệt độ của nước không thay đổi nên nội năng của khối nước trong ấm không đổi.', 'Nhiệt lượng cung cấp cho nước đang sôi làm tăng tốc độ trung bình của các phân tử nước.', 'Nhiệt lượng cung cấp cho nước đang sôi dùng để phá vỡ liên kết giữa các phân tử nước.'], answer: 3 },
    explanation: 'Khi sôi, nhiệt lượng nhận vào dùng để chuyển thể (phá vỡ liên kết phân tử), nhiệt độ không đổi nên động năng trung bình phân tử không đổi.',
  },
  {
    key: 'tn2026-0230-1-11', source: S0230, family: 'px-chan-doan', type: 'mcq', grade: 12, topic: 'vl12-c4', difficulty: 1,
    stem: 'Trong chẩn đoán bệnh, khi đưa một đồng vị phóng xạ vào cơ thể người bệnh, để đảm bảo an toàn, người ta dùng đồng vị có',
    data: { options: ['năng lượng liên kết riêng nhỏ để dễ dàng phân rã trong mạch máu.', 'khả năng phát ra tia alpha mạnh để dễ dàng xuyên qua cơ thể đến máy thu.', 'chu kì bán rã dài để kéo dài thời gian tác dụng của chất phóng xạ trong cơ thể.', 'chu kì bán rã ngắn để giảm thời gian tồn tại của chất phóng xạ trong cơ thể.'], answer: 3 },
    explanation: 'Chu kì bán rã ngắn giúp chất phóng xạ nhanh chóng giảm hoạt độ, hạn chế liều chiếu trong cơ thể.',
  },
  {
    key: 'tn2026-0230-1-12', source: S0230, family: 'the-long', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 1,
    stem: 'Một khối chất lỏng có đặc điểm nào sau đây?',
    data: { options: ['Có hình dạng xác định nhưng không có thể tích xác định.', 'Có thể tích xác định nhưng không có hình dạng xác định.', 'Không có thể tích và hình dạng xác định.', 'Có thể tích và hình dạng xác định.'], answer: 1 },
    explanation: 'Chất lỏng có thể tích xác định nhưng có hình dạng của phần bình chứa nó.',
  },
  {
    key: 'tn2026-0230-1-13', source: S0230, family: 'kl-charles', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 1,
    stem: 'Với một khối khí lí tưởng xác định, định luật Charles mô tả mối liên hệ giữa',
    data: { options: ['thể tích và nhiệt độ tuyệt đối của khối khí khi áp suất không đổi.', 'thể tích và khối lượng của khối khí khi nhiệt độ tuyệt đối không đổi.', 'áp suất và nhiệt độ tuyệt đối của khối khí khi thể tích không đổi.', 'áp suất và thể tích của khối khí khi nhiệt độ tuyệt đối không đổi.'], answer: 0 },
    explanation: r`Định luật Charles (đẳng áp): $V/T$ không đổi.`,
  },
  {
    key: 'tn2026-0230-1-14', source: S0230, family: 'chuyen-the-ten', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 1,
    stem: 'Quá trình chuyển từ thể rắn sang thể lỏng gọi là',
    data: { options: ['sự đông đặc.', 'sự nóng chảy.', 'sự hoá hơi.', 'sự sôi.'], answer: 1 },
    explanation: 'Rắn → lỏng là sự nóng chảy; lỏng → rắn là sự đông đặc.',
  },
  {
    key: 'tn2026-0230-1-15', source: S0230, family: 'xoay-chieu', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 2,
    stem: 'Khi nói về dòng điện xoay chiều, phát biểu nào sau đây là đúng?',
    data: { options: ['Giá trị hiệu dụng của điện áp bằng một nửa giá trị cực đại.', 'Giá trị hiệu dụng của dòng điện bằng một nửa giá trị cực đại.', 'Cường độ dòng điện biến thiên theo thời gian theo định luật dạng sin (hoặc cosin).', 'Công suất toả nhiệt ở điện trở R tỉ lệ thuận với cường độ hiệu dụng của dòng điện qua điện trở.'], answer: 2 },
    explanation: r`Giá trị hiệu dụng bằng giá trị cực đại chia $\sqrt 2$; công suất $P = I^2R$ tỉ lệ với bình phương cường độ hiệu dụng.`,
  },
  {
    key: 'tn2026-0230-1-16', source: S0230, family: 'lenz', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 1,
    stem: 'Theo định luật Lenz, dòng điện cảm ứng sinh ra trong một mạch điện kín có chiều sao cho từ trường mà nó sinh ra có tác dụng',
    data: { options: ['làm tăng từ thông qua mạch.', 'chống lại sự biến thiên của từ thông qua mạch.', 'làm giảm từ thông qua mạch.', 'làm từ thông qua mạch bằng không.'], answer: 1 },
    explanation: 'Phát biểu định luật Lenz: từ trường cảm ứng chống lại sự biến thiên từ thông sinh ra nó.',
  },
  {
    key: 'tn2026-0230-1-17', source: S0230, family: 'hat-dung-yen', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 1,
    stem: 'Nếu một proton đứng yên, nó sẽ',
    data: { options: ['không tạo ra điện trường.', 'tạo ra từ trường khi nó nằm gần một dây dẫn.', 'không tạo ra từ trường.', 'tạo ra từ trường giống như một nam châm nhỏ.'], answer: 2 },
    explanation: 'Điện tích đứng yên chỉ tạo ra điện trường; từ trường do điện tích chuyển động (dòng điện) tạo ra.',
  },
  {
    key: 'tn2026-0230-1-18', source: S0230, family: 'nen-khi-noi-nang', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: 'Nén một khối khí lí tưởng trong xilanh kín. Nội năng của khối khí',
    data: { options: ['tăng do khối khí nhận công.', 'không đổi, nếu xilanh cách nhiệt.', 'giảm do khối khí nhận công.', 'tăng, nếu xilanh cách nhiệt.'], answer: 3 },
    explanation: r`$\Delta U = A + Q$. Khí nhận công ($A > 0$); nếu cách nhiệt ($Q = 0$) thì chắc chắn $\Delta U > 0$. Nếu không cách nhiệt, khí có thể toả nhiệt nên nội năng chưa chắc tăng.`,
  },

  // ==========================================================================
  // MÃ ĐỀ 0230 — PHẦN II (ĐÚNG/SAI)
  // ==========================================================================
  {
    key: 'tn2026-0230-2-01', source: S0230, family: 'tf-luc-tu', type: 'tf', grade: 12, topic: 'vl12-c3', difficulty: 2,
    stem: r`Ở một mặt phẳng nằm ngang cố định trong một từ trường đều có các đường sức từ nằm ngang, đặt một đoạn dây dẫn thẳng có dòng điện không đổi sao cho chiều của dòng điện hợp với chiều của đường sức một góc $\alpha$. Khi thay đổi góc $\alpha$, đoạn dây vẫn nằm trong mặt phẳng cố định nói trên.`,
    data: {
      statements: ['Lực từ tác dụng lên đoạn dây có độ lớn cực đại khi đoạn dây vuông góc với đường sức từ.', 'Lực từ tác dụng lên đoạn dây có phương vuông góc với cả đoạn dây và đường sức từ.', 'Khi đặt đoạn dây song song với các đường sức từ, không có lực từ tác dụng lên đoạn dây.', r`Khi thay đổi góc $\alpha$ thì phương của lực từ tác dụng lên đoạn dây cũng thay đổi.`],
      answers: [true, true, true, false],
    },
    explanation: r`$F = BI\ell\sin\alpha$ lớn nhất khi $\alpha = 90^\circ$, bằng 0 khi $\alpha = 0$. Lực luôn vuông góc với mặt phẳng nằm ngang chứa dây và đường sức, nên phương lực (thẳng đứng) không đổi khi $\alpha$ thay đổi.`,
  },
  {
    key: 'tn2026-0230-2-02', source: S0230, family: 'tf-rutherford', type: 'tf', grade: 12, topic: 'vl12-c4', difficulty: 2,
    stem: 'Cuối thế kỷ XIX, quan điểm phổ biến cho rằng nguyên tử là một khối cầu trung hoà về điện. Tuy nhiên, cấu trúc bên trong của nguyên tử vẫn là một bí ẩn. Năm 1904, Thomson đã đề xuất mô hình nguyên tử gồm các electron nằm rải rác trong một khối cầu tích điện dương phân bố đều. Để kiểm tra tính đúng đắn của mô hình này, Rutherford cùng cộng sự đã thực hiện thí nghiệm bắn phá một lá vàng mỏng bằng chùm hạt alpha.',
    data: {
      statements: ['Kết quả thí nghiệm cho thấy phần lớn hạt alpha đi thẳng qua lá vàng, một số ít bị lệch hướng (tán xạ) với các góc khác nhau.', 'Kết quả thí nghiệm này cho thấy nguyên tử không có cấu tạo như mô hình nguyên tử của Thomson.', 'Các hạt alpha bị tán xạ với các góc khác nhau là do chúng tương tác điện với electron.', 'Kết quả thí nghiệm này chứng minh các electron chuyển động theo quỹ đạo dừng quanh hạt nhân.'],
      answers: [true, true, false, false],
    },
    explanation: 'Hạt alpha bị lệch do lực đẩy tĩnh điện của hạt nhân mang điện dương tập trung ở tâm (electron quá nhẹ, không làm lệch đáng kể). Quỹ đạo dừng là mô hình Bohr, không được thí nghiệm này chứng minh.',
  },
  {
    key: 'tn2026-0230-2-03', source: S0230, family: 'tf-nhiet-dung-rieng', type: 'tf', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: r`Nhiệt dung riêng của nước được xác định bằng công thức $c = \dfrac{Q}{m\Delta T}$, trong đó $Q$ là nhiệt lượng cần cung cấp, $m$ là khối lượng của nước, $\Delta T$ là độ thay đổi nhiệt độ của nước. Thảo luận về công thức này, một nhóm học sinh cho rằng: *Nhiệt dung riêng của nước phụ thuộc vào khối lượng của nước.* Để kiểm tra giả thuyết, họ dùng nhiệt lượng kế có dây điện trở hoạt động với dòng điện có cường độ $I$ và hiệu điện thế $U$ không đổi, cân, nhiệt kế, đồng hồ và làm thí nghiệm theo các bước: (1) Cho một lượng nước có khối lượng $m$ ở nhiệt độ $T_1$ (nhiệt độ phòng) vào bình nhiệt lượng kế; sau khoảng thời gian $\Delta t$ tính từ lúc cấp điện cho dây điện trở, nhiệt độ của nước trong bình là $T_2$. (2) Tính giá trị nhiệt dung riêng của nước. (3) Lặp lại bước (1) và (2) với các giá trị khối lượng $m$ khác nhau. Kết quả thí nghiệm cho thấy *nhiệt dung riêng của nước không phụ thuộc vào khối lượng của nước.*`,
    data: {
      statements: [r`Khoảng thời gian cấp điện $\Delta t$ càng lớn thì nhiệt lượng do dây điện trở toả ra càng lớn.`, 'Tất cả nhiệt lượng do dây điện trở toả ra đều được dùng để làm tăng nhiệt độ của nước.', r`Nhiệt độ $T_2$ càng lớn thì nhiệt lượng bị mất mát càng nhỏ.`, 'Kết quả thí nghiệm bác bỏ giả thuyết của nhóm học sinh.'],
      answers: [true, false, false, true],
    },
    explanation: r`$Q = UI\Delta t$ tăng theo $\Delta t$. Một phần nhiệt làm nóng bình, nhiệt kế và toả ra môi trường; chênh lệch nhiệt độ với môi trường càng lớn thì hao phí càng lớn. Kết quả "không phụ thuộc khối lượng" bác bỏ giả thuyết.`,
  },
  {
    key: 'tn2026-0230-2-04', source: S0230, family: 'tf-xilanh-2-ngan', type: 'tf', grade: 12, topic: 'vl12-c1', difficulty: 3,
    stem: 'Một xilanh cách nhiệt nằm ngang được chia thành hai ngăn kín bởi một pit-tông cách nhiệt có thể dịch chuyển không ma sát. Trong mỗi ngăn có một lượng khí lí tưởng xác định. Ban đầu hệ ở trạng thái cân bằng. Giả sử làm dịch chuyển pit-tông để nén khí ở ngăn 1.',
    data: {
      statements: ['Nội năng của khối khí ở ngăn 1 không đổi do ngăn này được cách nhiệt.', 'Khối khí ở ngăn 1 và khối khí ở ngăn 2 đều nhận công từ pit-tông.', 'Khối khí ở ngăn 1 và khối khí ở ngăn 2 đều không nhận nhiệt lượng từ môi trường bên ngoài.', 'Nhiệt độ của khối khí ở ngăn 2 giảm.'],
      answers: [false, false, true, true],
    },
    explanation: r`Cách nhiệt nên $Q = 0$ ở cả hai ngăn. Khí ngăn 1 bị nén, nhận công nên nội năng và nhiệt độ tăng. Khí ngăn 2 dãn ra, sinh công ($A < 0$) nên nội năng và nhiệt độ giảm.`,
  },

  // ==========================================================================
  // MÃ ĐỀ 0230 — PHẦN III (TRẢ LỜI NGẮN, CÓ BIẾN THỂ SỐ LIỆU)
  // ==========================================================================
  shortQ('tn2026-0230-3-01', S0230, 'tn-pu-nang-luong', 'vl12-c4', PU_CONTEXT,
    'Năng lượng điện do pin cung cấp trong giây đầu tiên tính từ thời điểm ban đầu là bao nhiêu kilôjun (kJ) (làm tròn kết quả đến chữ số hàng phần trăm)?',
    pu(8.6, 6.2), PU_ENERGY, 2, 'kJ', EXPL_PU_ENERGY),
  shortQ('tn2026-0230-3-02', S0230, 'tn-pu-con-lai', 'vl12-c4', PU_CONTEXT,
    r`Ở thời điểm $t = {{t}}$ năm kể từ thời điểm ban đầu, số lượng hạt nhân $^{238}_{94}\text{Pu}$ chưa phân rã trong pin là $x\cdot 10^{24}$ hạt nhân. Tìm $x$ (làm tròn kết quả đến chữ số hàng phần trăm).`,
    { ...pu(8.6, 6.2), t: { min: 20, max: 30, step: 0.5, value: 25.0, decimals: 1 } }, PU_REMAIN, 2, '', EXPL_PU_REMAIN),
  shortQ('tn2026-0230-3-03', S0230, 'tn-lop-ap-suat', 'vl12-c2', TIRE_CONTEXT,
    'Áp suất khí trong lốp xe đã tăng thêm bao nhiêu phần trăm so với giá trị khuyến nghị (làm tròn kết quả đến chữ số hàng phần mười)?',
    tire(14.5, 48.5), TIRE_UP, 1, '%', EXPL_TIRE_UP),
  shortQ('tn2026-0230-3-04', S0230, 'tn-lop-xa-khi', 'vl12-c2', TIRE_CONTEXT,
    r`Người lái xe giảm áp suất khí trong lốp về giá trị khuyến nghị bằng cách xả bớt một lượng khí qua van. Nhiệt độ của khí trong lốp xe vẫn giữ ở mức $\{{t2}}\ ^\circ\text{C}$. Khối lượng khí đã được xả ra ngoài bằng bao nhiêu phần trăm khối lượng khí trong lốp xe trước khi xả (làm tròn kết quả đến chữ số hàng phần mười)?`,
    tire(14.5, 48.5), TIRE_OUT, 1, '%', EXPL_TIRE_OUT),
  shortQ('tn2026-0230-3-05', S0230, 'tn-thanh-cuong-do', 'vl12-c3', ROD_CONTEXT,
    'Cường độ dòng điện trong thanh kim loại là bao nhiêu miliampe (mA) (làm tròn kết quả đến chữ số hàng phần trăm)?',
    rod(25.0, 55.0, 0.35, 18.0), ROD_I, 2, 'mA', EXPL_ROD_I),
  shortQ('tn2026-0230-3-06', S0230, 'tn-thanh-cong-suat', 'vl12-c3', ROD_CONTEXT,
    'Công suất toả nhiệt ở thanh kim loại là bao nhiêu milioát (mW) (làm tròn kết quả đến chữ số hàng phần trăm)?',
    rod(25.0, 55.0, 0.35, 18.0), ROD_P, 2, 'mW', EXPL_ROD_P),

  // ==========================================================================
  // MÃ ĐỀ 0207 — PHẦN I
  // ==========================================================================
  {
    key: 'tn2026-0207-1-01', source: S0207, family: 'nuoc-soi', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: r`Khi đun một ấm nước, lúc nước đang sôi, dù tiếp tục được cung cấp nhiệt lượng thì nhiệt độ vẫn ở $100\ ^\circ\text{C}$ cho đến khi cạn nước. Phát biểu nào sau đây là đúng?`,
    data: { options: ['Nhiệt lượng cung cấp cho nước đang sôi dùng để phá vỡ liên kết giữa các phân tử nước.', 'Nhiệt lượng cung cấp cho nước đang sôi làm tăng tốc độ trung bình của các phân tử nước.', 'Do nhiệt độ của nước không thay đổi nên nội năng của khối nước trong ấm không đổi.', r`Việc đun với công suất nhiệt cao hơn sẽ làm nhiệt độ sôi của nước cao hơn $100\ ^\circ\text{C}$.`], answer: 0 },
    explanation: 'Khi sôi, nhiệt lượng nhận vào dùng để chuyển thể (phá vỡ liên kết phân tử), nhiệt độ không đổi.',
  },
  {
    key: 'tn2026-0207-1-02', source: S0207, family: 'tuong-tac-tu', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 1,
    stem: 'Khi ở gần nhau,',
    data: { options: ['hai dòng điện cùng chiều đẩy nhau.', 'hai dòng điện ngược chiều hút nhau.', 'hai điện tích cùng dấu hút nhau.', 'hai cực từ cùng loại của hai nam châm đẩy nhau.'], answer: 3 },
    explanation: 'Cực từ cùng tên đẩy nhau. Dòng điện cùng chiều hút, ngược chiều đẩy; điện tích cùng dấu đẩy nhau.',
  },
  {
    key: 'tn2026-0207-1-03', source: S0207, family: 'the-khi', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 1,
    stem: 'Một khối khí có đặc điểm nào sau đây?',
    data: { options: ['Không có thể tích và hình dạng xác định.', 'Có hình dạng xác định nhưng không có thể tích xác định.', 'Có thể tích và hình dạng xác định.', 'Có thể tích xác định nhưng không có hình dạng xác định.'], answer: 0 },
    explanation: 'Chất khí chiếm toàn bộ thể tích bình chứa, không có thể tích và hình dạng riêng.',
  },
  {
    key: 'tn2026-0207-1-04', source: S0207, family: 'nhiet-luong-chua', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: 'Khi đặt vật X tiếp xúc nhiệt với vật Y và có sự truyền nhiệt từ vật Y sang vật X, phát biểu nào sau đây là đúng?',
    data: { options: ['Vật X và vật Y đều không chứa nhiệt lượng.', 'Vật X chứa rất ít nhiệt lượng.', 'Vật Y chứa nhiều nhiệt lượng hơn vật X.', 'Vật Y chứa rất nhiều nhiệt lượng.'], answer: 0 },
    explanation: 'Nhiệt lượng là năng lượng truyền đi, không phải thứ mà vật "chứa".',
  },
  {
    key: 'tn2026-0207-1-05', source: S0207, family: 'nen-khi-noi-nang', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: 'Một khối khí lí tưởng bị nén trong xilanh kín. Nội năng của khối khí',
    data: { options: ['tăng do khối khí nhận công.', 'không đổi, nếu xilanh cách nhiệt.', 'giảm do khối khí nhận công.', 'tăng, nếu xilanh cách nhiệt.'], answer: 3 },
    explanation: r`$\Delta U = A + Q$ với $A > 0$; chỉ khi cách nhiệt ($Q = 0$) mới chắc chắn nội năng tăng.`,
  },
  {
    key: 'tn2026-0207-1-06', source: S0207, family: 'px-chan-doan', type: 'mcq', grade: 12, topic: 'vl12-c4', difficulty: 1,
    stem: 'Trong chẩn đoán bệnh, khi đưa một đồng vị phóng xạ vào cơ thể người bệnh, để đảm bảo an toàn, người ta dùng đồng vị có',
    data: { options: ['khả năng phát ra tia alpha mạnh để dễ dàng xuyên qua cơ thể đến máy thu.', 'năng lượng liên kết riêng nhỏ để dễ dàng phân rã trong mạch máu.', 'chu kì bán rã dài để kéo dài thời gian tác dụng của chất phóng xạ trong cơ thể.', 'chu kì bán rã ngắn để giảm thời gian tồn tại của chất phóng xạ trong cơ thể.'], answer: 3 },
    explanation: 'Chu kì bán rã ngắn giúp giảm thời gian chất phóng xạ tồn tại và gây chiếu xạ trong cơ thể.',
  },
  {
    key: 'tn2026-0207-1-07', source: S0207, family: 'lenz', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 1,
    stem: 'Theo định luật Lenz, dòng điện cảm ứng sinh ra trong một mạch điện kín có chiều sao cho từ trường mà nó sinh ra có tác dụng',
    data: { options: ['làm giảm từ thông qua mạch.', 'chống lại sự biến thiên của từ thông qua mạch.', 'làm từ thông qua mạch bằng không.', 'làm tăng từ thông qua mạch.'], answer: 1 },
    explanation: 'Từ trường cảm ứng chống lại sự biến thiên từ thông sinh ra nó.',
  },
  {
    key: 'tn2026-0207-1-08', source: S0207, family: 'chuyen-the-ten', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 1,
    stem: 'Quá trình chuyển từ thể lỏng sang thể rắn được gọi là',
    data: { options: ['sự nóng chảy.', 'sự đông đặc.', 'sự hoá hơi.', 'sự sôi.'], answer: 1 },
    explanation: 'Lỏng → rắn là sự đông đặc.',
  },
  {
    key: 'tn2026-0207-1-09', source: S0207, family: 'xoay-chieu', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 2,
    stem: 'Khi nói về dòng điện xoay chiều, phát biểu nào sau đây là đúng?',
    data: { options: ['Công suất toả nhiệt ở điện trở R tỉ lệ thuận với cường độ hiệu dụng của dòng điện qua điện trở.', 'Giá trị hiệu dụng của điện áp bằng một nửa giá trị cực đại.', 'Giá trị hiệu dụng của dòng điện bằng một nửa giá trị cực đại.', 'Cường độ dòng điện biến thiên theo thời gian theo định luật dạng sin (hoặc cosin).'], answer: 3 },
    explanation: r`Hiệu dụng = cực đại chia $\sqrt 2$; $P = I^2R$ tỉ lệ với bình phương cường độ hiệu dụng.`,
  },
  {
    key: 'tn2026-0207-1-10', source: S0207, family: 'kl-boyle', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 1,
    stem: 'Với một khối khí lí tưởng xác định, định luật Boyle mô tả mối liên hệ giữa',
    data: { options: ['thể tích và nhiệt độ tuyệt đối của khối khí khi áp suất không đổi.', 'áp suất và nhiệt độ tuyệt đối của khối khí khi thể tích không đổi.', 'áp suất và thể tích của khối khí khi nhiệt độ tuyệt đối không đổi.', 'áp suất và khối lượng của khối khí khi nhiệt độ tuyệt đối không đổi.'], answer: 2 },
    explanation: r`Định luật Boyle (đẳng nhiệt): $pV$ không đổi.`,
  },
  {
    key: 'tn2026-0207-1-11', source: S0207, family: 'px-binh-chi', type: 'mcq', grade: 12, topic: 'vl12-c4', difficulty: 2,
    stem: 'Một nguồn phóng xạ dùng trong y tế được bảo quản trong bình chì. Khi cần sử dụng, người ta mở cửa bình cho tia phóng xạ phát ra ngoài để chiếu xạ. Thời gian mỗi lần chiếu xạ được coi là bằng thời gian mỗi lần mở cửa bình. Tổng thời gian mà nguồn phóng xạ này còn có thể phát tia phóng xạ đủ để sử dụng',
    data: { options: ['chỉ phụ thuộc vào số lần mở cửa bình.', 'phụ thuộc vào số lần mở cửa bình cũng như độ mạnh hay yếu của chùm tia phóng xạ trong mỗi lần chiếu.', 'không phụ thuộc vào số lần mở cửa bình cũng như độ mạnh hay yếu của chùm tia phóng xạ trong mỗi lần chiếu.', 'chỉ phụ thuộc vào độ mạnh hay yếu của chùm tia phóng xạ trong mỗi lần chiếu.'], answer: 2 },
    explanation: 'Phân rã diễn ra liên tục dù cửa bình đóng hay mở; thời gian sử dụng được chỉ phụ thuộc chu kì bán rã.',
  },
  {
    key: 'tn2026-0207-1-12', source: S0207, family: 'hat-dung-yen', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 1,
    stem: 'Nếu một electron đứng yên, nó sẽ',
    data: { options: ['tạo ra từ trường giống như một nam châm nhỏ.', 'không tạo ra điện trường.', 'tạo ra từ trường khi nó nằm gần một dây dẫn.', 'không tạo ra từ trường.'], answer: 3 },
    explanation: 'Điện tích đứng yên chỉ tạo ra điện trường, không tạo ra từ trường.',
  },
  {
    key: 'tn2026-0207-1-13', source: S0207, family: 'hn-wlk-bang-nhau', type: 'mcq', grade: 12, topic: 'vl12-c4', difficulty: 2,
    stem: 'Hai hạt nhân X và Y có năng lượng liên kết bằng nhau. Nếu số nucleon của hạt nhân X lớn hơn số nucleon của hạt nhân Y thì',
    data: { options: ['độ hụt khối của hạt nhân Y lớn hơn độ hụt khối của hạt nhân X.', 'hạt nhân Y bền vững hơn hạt nhân X.', 'độ hụt khối của hạt nhân X lớn hơn độ hụt khối của hạt nhân Y.', 'hạt nhân X bền vững hơn hạt nhân Y.'], answer: 1 },
    explanation: r`Độ hụt khối bằng nhau; Y có A nhỏ hơn nên năng lượng liên kết riêng lớn hơn, Y bền hơn.`,
  },
  {
    key: 'tn2026-0207-1-14', source: S0207, family: 'kl-dang-tich-cong', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 2,
    stem: 'Một khối khí lí tưởng xác định biến đổi theo quá trình thể tích không đổi từ trạng thái 1 sang trạng thái 2, phát biểu nào sau đây là đúng?',
    data: { options: ['Mật độ phân tử của khối khí tăng lên.', 'Khoảng cách trung bình giữa các phân tử tăng lên.', 'Nhiệt độ của khối khí không đổi.', 'Công mà khối khí nhận được bằng không.'], answer: 3 },
    explanation: 'Thể tích không đổi nên công trao đổi bằng không; mật độ phân tử không đổi.',
  },
  {
    key: 'tn2026-0207-1-15', source: S0207, family: 'kl-ap-suat', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 1,
    stem: 'Các phân tử khí lí tưởng chuyển động hỗn loạn',
    data: { options: ['hút nhau khi chuyển động lại gần nhau.', 'làm nhiệt độ của khối khí tăng lên.', 'va chạm vào thành bình gây ra áp suất.', 'làm nhiệt độ của khối khí giảm đi.'], answer: 2 },
    explanation: 'Va chạm của phân tử với thành bình gây ra áp suất; phân tử khí lí tưởng không tương tác khi chưa va chạm.',
  },
  {
    key: 'tn2026-0207-1-16', source: S0207, family: 'kl-dang-ap-dan', type: 'mcq', grade: 12, topic: 'vl12-c2', difficulty: 2,
    stem: 'Khi một khối khí lí tưởng xác định dãn nở đẳng áp thì',
    data: { options: ['nhiệt độ của khối khí tăng.', 'nội năng của khối khí giảm.', 'nội năng của khối khí không đổi.', 'nhiệt độ của khối khí giảm.'], answer: 0 },
    explanation: r`$V/T$ không đổi, $V$ tăng nên $T$ tăng; nội năng khí lí tưởng tăng theo nhiệt độ.`,
  },
  {
    key: 'tn2026-0207-1-17', source: S0207, family: 'nhiet-cung-q', type: 'mcq', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: 'Khi truyền cùng một nhiệt lượng cho hai vật có cùng khối lượng được làm từ hai chất khác nhau, trong điều kiện không xảy ra sự chuyển thể, phát biểu nào sau đây là đúng?',
    data: { options: ['Hai vật có độ biến thiên nhiệt độ bằng nhau.', 'Vật được làm từ chất có nhiệt dung riêng nhỏ hơn có độ biến thiên nhiệt độ nhỏ hơn.', 'Hai vật không thay đổi nhiệt độ.', 'Vật được làm từ chất có nhiệt dung riêng nhỏ hơn có độ biến thiên nhiệt độ lớn hơn.'], answer: 3 },
    explanation: r`$\Delta t = \dfrac{Q}{mc}$: $c$ càng nhỏ thì $\Delta t$ càng lớn.`,
  },
  {
    key: 'tn2026-0207-1-18', source: S0207, family: 'hat-tron-tu-truong', type: 'mcq', grade: 12, topic: 'vl12-c3', difficulty: 2,
    stem: 'Trong một từ trường đều, một electron chuyển động tròn đều chỉ do tác dụng của lực từ. Phát biểu nào sau đây là đúng?',
    data: { options: ['Vận tốc của hạt không đổi.', 'Lực từ không sinh công.', 'Gia tốc của hạt không đổi.', 'Động năng của hạt tăng.'], answer: 1 },
    explanation: 'Lực từ vuông góc với vận tốc nên không sinh công; vectơ vận tốc và gia tốc đổi hướng liên tục.',
  },

  // ==========================================================================
  // MÃ ĐỀ 0207 — PHẦN II
  // ==========================================================================
  {
    key: 'tn2026-0207-2-01', source: S0207, family: 'tf-luc-tu', type: 'tf', grade: 12, topic: 'vl12-c3', difficulty: 2,
    stem: r`Ở một mặt phẳng nằm ngang cố định trong một từ trường đều có các đường sức từ nằm ngang, đặt một đoạn dây dẫn thẳng có dòng điện không đổi sao cho chiều của dòng điện hợp với chiều của đường sức một góc $\alpha$. Khi thay đổi góc $\alpha$, đoạn dây vẫn nằm trong mặt phẳng cố định nói trên.`,
    data: {
      statements: ['Lực từ tác dụng lên đoạn dây có độ lớn cực đại khi đoạn dây vuông góc với đường sức từ.', 'Khi đặt đoạn dây song song với các đường sức từ, không có lực từ tác dụng lên đoạn dây.', r`Khi thay đổi góc $\alpha$ thì phương của lực từ tác dụng lên đoạn dây cũng thay đổi.`, 'Lực từ tác dụng lên đoạn dây có phương vuông góc với cả đoạn dây và đường sức từ.'],
      answers: [true, true, false, true],
    },
    explanation: r`$F = BI\ell\sin\alpha$; lực luôn vuông góc với mặt phẳng ngang chứa dây và đường sức nên phương không đổi.`,
  },
  {
    key: 'tn2026-0207-2-02', source: S0207, family: 'tf-rutherford', type: 'tf', grade: 12, topic: 'vl12-c4', difficulty: 2,
    stem: 'Cuối thế kỷ XIX, quan điểm phổ biến cho rằng nguyên tử là một khối cầu trung hoà về điện. Tuy nhiên, cấu trúc bên trong của nguyên tử vẫn là một bí ẩn. Năm 1904, Thomson đã đề xuất mô hình nguyên tử gồm các electron nằm rải rác trong một khối cầu tích điện dương phân bố đều. Để kiểm tra tính đúng đắn của mô hình này, Rutherford cùng cộng sự đã thực hiện thí nghiệm bắn phá một lá vàng mỏng bằng chùm hạt alpha.',
    data: {
      statements: ['Kết quả thí nghiệm cho thấy phần lớn hạt alpha đi thẳng qua lá vàng, một số ít bị lệch hướng (tán xạ) với các góc khác nhau.', 'Kết quả thí nghiệm này cho thấy nguyên tử không có cấu tạo như mô hình nguyên tử của Thomson.', 'Các hạt alpha bị tán xạ với các góc khác nhau là do chúng tương tác điện với electron.', 'Kết quả thí nghiệm này chứng minh các electron chuyển động theo quỹ đạo dừng quanh hạt nhân.'],
      answers: [true, true, false, false],
    },
    explanation: 'Alpha bị lệch do lực đẩy của hạt nhân dương; quỹ đạo dừng là mô hình Bohr.',
  },
  {
    key: 'tn2026-0207-2-03', source: S0207, family: 'tf-xilanh-2-ngan', type: 'tf', grade: 12, topic: 'vl12-c1', difficulty: 3,
    stem: 'Một xilanh cách nhiệt nằm ngang được chia thành hai ngăn kín bởi một pit-tông cách nhiệt có thể dịch chuyển không ma sát. Trong mỗi ngăn có một lượng khí lí tưởng xác định. Ban đầu hệ ở trạng thái cân bằng. Giả sử làm dịch chuyển pit-tông để nén khí ở ngăn 1.',
    data: {
      statements: ['Khối khí ở ngăn 1 và khối khí ở ngăn 2 đều nhận công từ pit-tông.', 'Khối khí ở ngăn 1 và khối khí ở ngăn 2 đều nhận nhiệt lượng từ môi trường bên ngoài.', 'Nhiệt độ của khối khí ở ngăn 1 tăng.', 'Nội năng của khối khí ở ngăn 2 không đổi do ngăn này được cách nhiệt.'],
      answers: [false, false, true, false],
    },
    explanation: r`$Q = 0$ ở cả hai ngăn. Ngăn 1 bị nén, nhận công: nhiệt độ tăng. Ngăn 2 dãn, sinh công: nội năng giảm.`,
  },
  {
    key: 'tn2026-0207-2-04', source: S0207, family: 'tf-nhiet-dung-rieng', type: 'tf', grade: 12, topic: 'vl12-c1', difficulty: 2,
    stem: r`Nhiệt dung riêng của nước được xác định bằng công thức $c = \dfrac{Q}{m\Delta T}$, trong đó $Q$ là nhiệt lượng cần cung cấp, $m$ là khối lượng của nước, $\Delta T$ là độ thay đổi nhiệt độ của nước. Thảo luận về công thức này, một nhóm học sinh cho rằng: *Nhiệt dung riêng của nước phụ thuộc vào khối lượng của nước.* Để kiểm tra giả thuyết, họ dùng nhiệt lượng kế có dây điện trở hoạt động với dòng điện có cường độ $I$ và hiệu điện thế $U$ không đổi, cân, nhiệt kế, đồng hồ và làm thí nghiệm theo các bước: (1) Cho một lượng nước có khối lượng $m$ ở nhiệt độ $T_1$ (nhiệt độ phòng) vào bình nhiệt lượng kế; sau khoảng thời gian $\Delta t$ tính từ lúc cấp điện cho dây điện trở, nhiệt độ của nước trong bình là $T_2$. (2) Tính giá trị nhiệt dung riêng của nước. (3) Lặp lại bước (1) và (2) với các giá trị khối lượng $m$ khác nhau. Kết quả thí nghiệm cho thấy *nhiệt dung riêng của nước không phụ thuộc vào khối lượng của nước.*`,
    data: {
      statements: [r`Khoảng thời gian cấp điện $\Delta t$ càng lớn thì nhiệt lượng do dây điện trở toả ra càng lớn.`, 'Tất cả nhiệt lượng do dây điện trở toả ra đều được dùng để làm tăng nhiệt độ của nước.', r`Nhiệt độ $T_2$ càng lớn thì nhiệt lượng bị mất mát càng nhỏ.`, 'Kết quả thí nghiệm bác bỏ giả thuyết của nhóm học sinh.'],
      answers: [true, false, false, true],
    },
    explanation: r`$Q = UI\Delta t$; luôn có hao phí nhiệt và hao phí tăng khi chênh lệch nhiệt độ với môi trường tăng.`,
  },

  // ==========================================================================
  // MÃ ĐỀ 0207 — PHẦN III
  // ==========================================================================
  shortQ('tn2026-0207-3-01', S0207, 'tn-lop-ap-suat', 'vl12-c2', TIRE_CONTEXT,
    'Áp suất khí trong lốp xe đã tăng thêm bao nhiêu phần trăm so với giá trị khuyến nghị (làm tròn kết quả đến chữ số hàng phần mười)?',
    tire(16.8, 50.5), TIRE_UP, 1, '%', EXPL_TIRE_UP),
  shortQ('tn2026-0207-3-02', S0207, 'tn-lop-xa-khi', 'vl12-c2', TIRE_CONTEXT,
    r`Người lái xe giảm áp suất khí trong lốp về giá trị khuyến nghị bằng cách xả bớt một lượng khí qua van. Nhiệt độ của khí trong lốp xe vẫn giữ ở mức $\{{t2}}\ ^\circ\text{C}$. Khối lượng khí đã được xả ra ngoài bằng bao nhiêu phần trăm khối lượng khí trong lốp xe trước khi xả (làm tròn kết quả đến chữ số hàng phần mười)?`,
    tire(16.8, 50.5), TIRE_OUT, 1, '%', EXPL_TIRE_OUT),
  shortQ('tn2026-0207-3-03', S0207, 'tn-pu-nang-luong', 'vl12-c4', PU_CONTEXT,
    'Năng lượng điện do pin cung cấp trong giây đầu tiên tính từ thời điểm ban đầu là bao nhiêu kilôjun (kJ) (làm tròn kết quả đến chữ số hàng phần trăm)?',
    pu(7.6, 6.5), PU_ENERGY, 2, 'kJ', EXPL_PU_ENERGY),
  shortQ('tn2026-0207-3-04', S0207, 'tn-pu-con-lai', 'vl12-c4', PU_CONTEXT,
    r`Ở thời điểm $t = {{t}}$ năm kể từ thời điểm ban đầu, số lượng hạt nhân $^{238}_{94}\text{Pu}$ chưa phân rã trong pin là $x\cdot 10^{24}$ hạt nhân. Tìm $x$ (làm tròn kết quả đến chữ số hàng phần trăm).`,
    { ...pu(7.6, 6.5), t: { min: 20, max: 30, step: 0.5, value: 26.0, decimals: 1 } }, PU_REMAIN, 2, '', EXPL_PU_REMAIN),
  shortQ('tn2026-0207-3-05', S0207, 'tn-thanh-cuong-do', 'vl12-c3', ROD_CONTEXT,
    'Cường độ dòng điện trong thanh kim loại là bao nhiêu miliampe (mA) (làm tròn kết quả đến chữ số hàng phần trăm)?',
    rod(35.0, 45.0, 0.4, 25.0), ROD_I, 2, 'mA', EXPL_ROD_I),
  shortQ('tn2026-0207-3-06', S0207, 'tn-thanh-cong-suat', 'vl12-c3', ROD_CONTEXT,
    'Công suất toả nhiệt ở thanh kim loại là bao nhiêu milioát (mW) (làm tròn kết quả đến chữ số hàng phần trăm)?',
    rod(35.0, 45.0, 0.4, 25.0), ROD_P, 2, 'mW', EXPL_ROD_P),
];
