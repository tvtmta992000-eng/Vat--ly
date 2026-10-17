// Vật lí 10 – Bài giảng và hệ thống bài tập (tài liệu của giáo viên, soạn theo Chương trình 2018).
// Nhập lên website: npm run import -- content/vat-ly-10.js
const r = String.raw;

const NOTE = r`> **Lưu ý.** Ví dụ và câu luyện là bài soạn mới, mô phỏng dạng bài thường gặp, không sao chép đề thi thật.`;

module.exports = [
  // ======================================================================
  // CHƯƠNG 1. MỞ ĐẦU: ĐƠN VỊ VÀ SAI SỐ
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 10 · Chương 1. Mở đầu: đơn vị và sai số',
    description: 'Đơn vị SI, thứ nguyên, sai số phép đo trực tiếp và gián tiếp.',
    position: 101,
    lessons: [
      {
        title: 'Đơn vị và sai số – Kiến thức trọng tâm',
        slug: 'vl10-c1-sai-so-kien-thuc',
        summary: 'Phương pháp nghiên cứu vật lí, 7 đơn vị cơ bản SI, thứ nguyên, cách tính sai số tuyệt đối và tỉ đối.',
        content: r`
Chương này xây nền cho mọi bài thực hành và là nguồn câu hỏi **xử lí số liệu** quen thuộc ở đề học kỳ và đề học sinh giỏi.

## 1. Vật lí và phương pháp nghiên cứu

Vật lí nghiên cứu các dạng vận động của vật chất và năng lượng, dùng hai phương pháp chính: **thực nghiệm** và **lí thuyết** (mô hình).

## 2. Hệ đơn vị SI

| Đại lượng | Đơn vị | Kí hiệu |
|---|---|---|
| Chiều dài | mét | m |
| Khối lượng | kilôgam | kg |
| Thời gian | giây | s |
| Cường độ dòng điện | ampe | A |
| Nhiệt độ | kelvin | K |
| Lượng chất | mol | mol |
| Cường độ sáng | candela | cd |

**Thứ nguyên:** vế trái và vế phải của mọi công thức vật lí phải cùng thứ nguyên.

## 3. Sai số của phép đo trực tiếp

Đo đại lượng $A$ trong $n$ lần:

$$\overline{A} = \frac{A_1 + A_2 + \dots + A_n}{n} \qquad \Delta A_i = \lvert A_i - \overline{A}\rvert$$

$$\Delta A = \overline{\Delta A} + \Delta A_{\text{dc}} \qquad \delta A = \frac{\Delta A}{\overline{A}}\cdot 100\%$$

- $\overline{\Delta A}$ là trung bình các sai số $\Delta A_i$; $\Delta A_{\text{dc}}$ là sai số dụng cụ.
- Sai số dụng cụ thường lấy bằng **một nửa độ chia nhỏ nhất**, hoặc theo giá trị đề cho.
- Kết quả viết dưới dạng $A = \overline{A} \pm \Delta A$, sai số làm tròn về **một chữ số có nghĩa**.

## 4. Sai số của phép đo gián tiếp

| Phép tính | Quy tắc |
|---|---|
| Tổng, hiệu $x \pm y$ | Cộng **sai số tuyệt đối**: $\Delta = \Delta x + \Delta y$ |
| Tích, thương $xy$, $x/y$ | Cộng **sai số tỉ đối**: $\delta = \delta x + \delta y$ |
| Luỹ thừa $x^n$ | Nhân sai số tỉ đối với số mũ: $\delta = n\,\delta x$ |
`,
      },
      {
        title: 'Đơn vị và sai số – Các dạng bài tập',
        slug: 'vl10-c1-sai-so-dang-bai',
        summary: '3 dạng bài: thứ nguyên và đổi đơn vị, sai số phép đo gián tiếp, xử lí bảng số liệu xác định g.',
        content: r`
## Dạng 1. Thứ nguyên và đổi đơn vị

**Kỳ thi hay gặp:** học kỳ, trắc nghiệm đánh giá năng lực.

**Phương pháp:** thay từng đại lượng bằng đơn vị SI rồi rút gọn. Hai vế khác thứ nguyên thì công thức sai.

**Ví dụ.** Kiểm tra thứ nguyên của công thức $s = vt + \tfrac{1}{2}at^2$.

**Lời giải.** $[vt] = \tfrac{\text{m}}{\text{s}}\cdot\text{s} = \text{m}$; $[at^2] = \tfrac{\text{m}}{\text{s}^2}\cdot\text{s}^2 = \text{m}$. Cả hai số hạng đều có thứ nguyên chiều dài, nhất quán với $[s] = \text{m}$.

## Dạng 2. Sai số của phép đo gián tiếp

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi (phần thực hành), đánh giá năng lực.

**Phương pháp:** viết công thức đại lượng cần tìm, tính sai số tỉ đối bằng quy tắc tổng hợp, suy ra sai số tuyệt đối, làm tròn về một chữ số có nghĩa.

**Ví dụ.** Đo hai cạnh hình chữ nhật được $a = 12{,}0 \pm 0{,}1$ cm và $b = 5{,}0 \pm 0{,}1$ cm. Viết kết quả diện tích.

**Lời giải.** $S = ab = 60$ cm².
$$\delta S = \frac{0{,}1}{12{,}0} + \frac{0{,}1}{5{,}0} = 0{,}0083 + 0{,}0200 = 0{,}0283 \approx 2{,}8\%$$
$\Delta S = 60\cdot 0{,}0283 \approx 1{,}7$ cm², làm tròn thành 2 cm². Kết quả: $S = (60 \pm 2)$ cm².

## Dạng 3. Xử lí bảng số liệu và xác định g

**Kỳ thi hay gặp:** học sinh giỏi, học kỳ (câu thực hành).

**Phương pháp:** tính giá trị trung bình, sai số từng lần, sai số trung bình cộng sai số dụng cụ, rồi lan truyền sang đại lượng gián tiếp.

**Ví dụ.** Thả vật từ độ cao $h = 1{,}00 \pm 0{,}01$ m, đo thời gian rơi 5 lần: 0,45; 0,47; 0,44; 0,46; 0,48 s (sai số dụng cụ 0,01 s). Tính $g = 2h/t^2$ và sai số.

**Lời giải.**

- $\overline{t} = 2{,}30/5 = 0{,}46$ s. Sai số từng lần: 0,01; 0,01; 0,02; 0,00; 0,02, trung bình 0,012 s.
- $\Delta t = 0{,}012 + 0{,}01 \approx 0{,}02$ s, nên $\delta t = 0{,}02/0{,}46 \approx 4{,}3\%$.
- $g = \dfrac{2\cdot 1{,}00}{0{,}46^2} \approx 9{,}45$ m/s².
- Vì $t$ có số mũ 2: $\delta g = \delta h + 2\delta t = 1\% + 8{,}7\% \approx 9{,}7\%$, nên $\Delta g \approx 9{,}45\cdot 0{,}097 \approx 0{,}9$ m/s².

Kết quả: $g = (9{,}5 \pm 0{,}9)$ m/s².

## Câu luyện tập

1. Biểu diễn đơn vị oát (W) qua các đơn vị cơ bản SI.
2. Đo đường kính hình tròn $d = 2{,}50 \pm 0{,}02$ cm. Tính diện tích $S = \pi d^2/4$ và viết kết quả có sai số.
3. Đo cường độ dòng điện 5 lần được 2,0; 2,1; 2,0; 1,9; 2,0 A, sai số dụng cụ 0,05 A. Viết kết quả đo.

<details>
<summary>Xem đáp án</summary>

1. $\text{W} = \text{kg}\cdot\text{m}^2\cdot\text{s}^{-3}$
2. $\delta S = 2\cdot 0{,}02/2{,}50 = 1{,}6\%$; $S \approx 4{,}91$ cm²; $\Delta S \approx 0{,}08$ cm²; $S = (4{,}91 \pm 0{,}08)$ cm²
3. Trung bình 2,00 A; sai số trung bình các lần 0,04 A; $\Delta I = 0{,}04 + 0{,}05 \approx 0{,}1$ A; $I = (2{,}0 \pm 0{,}1)$ A

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Đơn vị oát (W) biểu diễn qua các đơn vị cơ bản SI là:',
            options: ['$\\text{kg}\\cdot\\text{m}^2\\cdot\\text{s}^{-2}$', '$\\text{kg}\\cdot\\text{m}\\cdot\\text{s}^{-2}$', '$\\text{kg}\\cdot\\text{m}^2\\cdot\\text{s}^{-3}$', '$\\text{kg}\\cdot\\text{m}^{2}\\cdot\\text{s}^{-1}$'],
            answer: 2,
            explanation: r`$\text{W} = \text{J/s}$ và $\text{J} = \text{N}\cdot\text{m} = \text{kg}\cdot\text{m}^2\cdot\text{s}^{-2}$, nên $\text{W} = \text{kg}\cdot\text{m}^2\cdot\text{s}^{-3}$.`,
          },
          {
            prompt: r`Đo đường kính $d = 2{,}50 \pm 0{,}02$ cm rồi tính $S = \pi d^2/4$. Sai số tỉ đối của $S$ là:`,
            options: ['0,8%', '1,6%', '3,2%', '0,4%'],
            answer: 1,
            explanation: r`$d$ có số mũ 2 nên $\delta S = 2\,\delta d = 2\cdot\dfrac{0{,}02}{2{,}50} = 1{,}6\%$.`,
          },
          {
            prompt: 'Đo cường độ dòng điện 5 lần được 2,0; 2,1; 2,0; 1,9; 2,0 A, sai số dụng cụ 0,05 A. Kết quả đo là:',
            options: ['(2,0 ± 0,1) A', '(2,0 ± 0,04) A', '(2,0 ± 0,05) A', '(2,00 ± 0,2) A'],
            answer: 0,
            explanation: r`Trung bình 2,00 A; sai số trung bình $\overline{\Delta I} = 0{,}04$ A; $\Delta I = 0{,}04 + 0{,}05 = 0{,}09 \approx 0{,}1$ A.`,
          },
          {
            prompt: r`Đo $a = 12{,}0 \pm 0{,}1$ cm và $b = 5{,}0 \pm 0{,}1$ cm. Kết quả diện tích $S = ab$ là:`,
            options: ['(60,0 ± 0,2) cm²', '(60 ± 1) cm²', '(60 ± 0,2) cm²', '(60 ± 2) cm²'],
            answer: 3,
            explanation: r`$\delta S = \tfrac{0{,}1}{12} + \tfrac{0{,}1}{5} \approx 2{,}8\%$, $\Delta S \approx 1{,}7 \approx 2$ cm². Không được cộng sai số tuyệt đối khi nhân.`,
          },
          {
            prompt: r`Đại lượng $g$ được tính theo $g = 2h/t^2$. Sai số tỉ đối của $g$ là:`,
            options: [r`$\delta g = \delta h + \delta t$`, r`$\delta g = \delta h + 2\delta t$`, r`$\delta g = 2\delta h + \delta t$`, r`$\delta g = \delta h - 2\delta t$`],
            answer: 1,
            explanation: r`Thương cộng sai số tỉ đối; $t^2$ nhân sai số tỉ đối với số mũ 2: $\delta g = \delta h + 2\delta t$. Hằng số 2 không có sai số.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 2. ĐỘNG HỌC
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 10 · Chương 2. Động học',
    description: 'Chuyển động thẳng biến đổi đều, rơi tự do, ném ngang, cộng vận tốc, đồ thị v–t.',
    position: 102,
    lessons: [
      {
        title: 'Động học – Kiến thức trọng tâm',
        slug: 'vl10-c2-dong-hoc-kien-thuc',
        summary: 'Độ dịch chuyển, vận tốc, gia tốc, chuyển động thẳng biến đổi đều, rơi tự do, ném ngang và cộng vận tốc.',
        content: r`
Chương có nhiều dạng bài nhất ở lớp 10, là nền cho động lực học, ném xiên và dao động ở các lớp sau.

## 1. Các khái niệm

- **Độ dịch chuyển** là đại lượng vectơ; **quãng đường** là đại lượng vô hướng.
- Vận tốc = độ dịch chuyển / thời gian.
- Chuyển động thẳng biến đổi đều có **gia tốc không đổi**.

## 2. Chuyển động thẳng biến đổi đều

$$v = v_0 + at \qquad d = v_0t + \frac{1}{2}at^2 \qquad v^2 - v_0^2 = 2ad$$

> Chọn chiều dương theo chiều chuyển động; vật chuyển động chậm dần thì $a < 0$. Đổi km/h sang m/s bằng cách **chia 3,6**.

## 3. Rơi tự do

Chuyển động thẳng nhanh dần đều với gia tốc $g$ (lấy 9,8 hoặc 10 m/s² theo đề):

$$h = \frac{1}{2}gt^2 \qquad v = gt \qquad v^2 = 2gh$$

## 4. Ném ngang

Phân tích thành chuyển động **đều theo Ox** và **rơi tự do theo Oy**:

$$x = v_0t \qquad y = \frac{1}{2}gt^2 \qquad t = \sqrt{\frac{2h}{g}} \qquad L = v_0\sqrt{\frac{2h}{g}}$$

Vận tốc lúc chạm đất: $v = \sqrt{v_0^2 + (gt)^2}$, hợp với phương ngang góc $\alpha$ với $\tan\alpha = \dfrac{gt}{v_0}$.

## 5. Cộng vận tốc

$$\vec v_{13} = \vec v_{12} + \vec v_{23}$$

## 6. Đồ thị vận tốc – thời gian

- **Độ dốc** của đồ thị $v$–$t$ là gia tốc.
- **Diện tích** dưới đồ thị là độ dịch chuyển.
`,
      },
      {
        title: 'Động học – Các dạng bài tập',
        slug: 'vl10-c2-dong-hoc-dang-bai',
        simulation: 'projectile',
        summary: '5 dạng bài: biến đổi đều cơ bản, quãng đường phanh, hai vật gặp nhau, ném ngang, đọc đồ thị v–t.',
        content: r`
## Dạng 1. Chuyển động thẳng biến đổi đều cơ bản

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp (nền tảng).

**Phương pháp:** chọn chiều dương theo hướng chuyển động, ghi $v_0$, $a$, $t$ rồi chọn công thức có đúng đại lượng cần tìm.

**Ví dụ.** Ô tô có $v_0 = 10$ m/s tăng tốc với $a = 2$ m/s² trong 5 s. Tính quãng đường và vận tốc cuối.

**Lời giải.** $d = 10\cdot 5 + \tfrac{1}{2}\cdot 2\cdot 5^2 = 75$ m; $v = 10 + 2\cdot 5 = 20$ m/s.

## Dạng 2. Quãng đường phanh

**Kỳ thi hay gặp:** học kỳ, đánh giá năng lực.

**Phương pháp:** vật dừng thì $v = 0$ và $a < 0$; dùng $v^2 - v_0^2 = 2ad$, không cần tính thời gian trước.

**Ví dụ.** Xe chạy 72 km/h thì phanh với gia tốc −5 m/s². Tính quãng đường và thời gian đến khi dừng.

**Lời giải.** $v_0 = 72/3{,}6 = 20$ m/s.
$$d = \frac{0 - 20^2}{2\cdot(-5)} = 40\ \text{m} \qquad t = \frac{0 - 20}{-5} = 4\ \text{s}$$

## Dạng 3. Hai vật gặp nhau, đuổi nhau

**Kỳ thi hay gặp:** học sinh giỏi, học kỳ (câu vận dụng).

**Phương pháp:** chọn gốc toạ độ và gốc thời gian chung, viết phương trình toạ độ của từng vật, cho hai toạ độ bằng nhau và giải theo $t$ (loại nghiệm âm).

**Ví dụ.** Xe B chạy đều 10 m/s, đang ở trước xe A 50 m. Cùng lúc đó xe A bắt đầu chuyển động từ nghỉ với $a = 2$ m/s² cùng chiều. Khi nào A đuổi kịp B, và lúc đó A đã đi bao xa?

**Lời giải.** Gốc tại A: $x_A = t^2$; $x_B = 50 + 10t$.
$$t^2 - 10t - 50 = 0 \;\Rightarrow\; t = 5 + \sqrt{75} \approx 13{,}7\ \text{s}$$
Khi đó $x_A \approx 187$ m và $v_A = 2t \approx 27{,}3$ m/s.

## Dạng 4. Ném ngang

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi, tốt nghiệp (câu trả lời ngắn).

**Phương pháp:** thời gian bay chỉ phụ thuộc độ cao; tầm xa $L = v_0t$; vận tốc lúc chạm là tổng hợp của $v_x = v_0$ và $v_y = gt$.

**Ví dụ.** Ném ngang vật từ độ cao 45 m với $v_0 = 15$ m/s, lấy $g = 10$ m/s². Tính thời gian bay, tầm xa và vận tốc lúc chạm đất.

**Lời giải.** $t = \sqrt{2\cdot 45/10} = 3$ s; $L = 15\cdot 3 = 45$ m; $v_y = 30$ m/s nên
$$v = \sqrt{15^2 + 30^2} \approx 33{,}5\ \text{m/s}, \qquad \tan\alpha = \frac{30}{15} = 2 \Rightarrow \alpha \approx 63{,}4^\circ$$

## Dạng 5. Đọc đồ thị vận tốc – thời gian

**Kỳ thi hay gặp:** đánh giá năng lực, tốt nghiệp.

**Phương pháp:** độ dốc đồ thị $v$–$t$ là gia tốc; diện tích dưới đồ thị là độ dịch chuyển.

**Ví dụ.** Vật chuyển động thẳng theo chiều dương: tăng tốc đều từ 0 đến 10 m/s trong 5 s, chạy đều 10 m/s trong 10 s, rồi giảm đều về 0 trong 5 s. Tính quãng đường.

**Lời giải.** Đồ thị là hình thang có đáy lớn 20 s, đáy nhỏ 10 s, cao 10 m/s: $d = \tfrac{1}{2}(20 + 10)\cdot 10 = 150$ m.

## Câu luyện tập

1. Tàu bắt đầu chạy từ nghỉ với $a = 0{,}5$ m/s². Sau bao lâu đạt 54 km/h và khi đó đã đi bao xa?
2. Thả vật rơi tự do từ độ cao 80 m, lấy $g = 10$ m/s². Tính thời gian rơi và vận tốc chạm đất.
3. Ném ngang từ độ cao 20 m, tầm xa 30 m, lấy $g = 10$ m/s². Tính $v_0$.
4. Hai xe ngược chiều chạy đều 15 m/s và 25 m/s, ban đầu cách nhau 400 m. Sau bao lâu gặp nhau và gặp tại đâu?

<details>
<summary>Xem đáp án</summary>

1. 54 km/h = 15 m/s nên $t = 30$ s; $d = \tfrac{1}{2}\cdot 0{,}5\cdot 30^2 = 225$ m
2. $t = 4$ s; $v = 40$ m/s
3. $t = 2$ s nên $v_0 = 30/2 = 15$ m/s
4. $t = 400/(15 + 25) = 10$ s; gặp cách vị trí xuất phát của xe thứ nhất 150 m

</details>

${NOTE}
`,
        questions: [
          {
            prompt: r`Tàu bắt đầu chạy từ nghỉ với $a = 0{,}5$ m/s². Thời gian để đạt 54 km/h là:`,
            options: ['108 s', '27 s', '30 s', '15 s'],
            answer: 2,
            explanation: r`Đổi $54$ km/h $= 15$ m/s; $t = \dfrac{v}{a} = \dfrac{15}{0{,}5} = 30$ s. Đáp án 108 s là do quên đổi đơn vị.`,
          },
          {
            prompt: r`Thả vật rơi tự do từ độ cao 80 m ($g = 10$ m/s²). Vận tốc khi chạm đất là:`,
            options: ['40 m/s', '80 m/s', '20 m/s', '800 m/s'],
            answer: 0,
            explanation: r`$v = \sqrt{2gh} = \sqrt{2\cdot 10\cdot 80} = 40$ m/s (hoặc $t = 4$ s, $v = gt = 40$ m/s).`,
          },
          {
            prompt: r`Ném ngang từ độ cao 20 m, tầm xa đo được 30 m ($g = 10$ m/s²). Vận tốc ban đầu là:`,
            options: ['10 m/s', '15 m/s', '20 m/s', '30 m/s'],
            answer: 1,
            explanation: r`$t = \sqrt{2h/g} = 2$ s, nên $v_0 = L/t = 15$ m/s.`,
          },
          {
            prompt: 'Hai xe chạy ngược chiều với 15 m/s và 25 m/s, ban đầu cách nhau 400 m. Thời gian đến khi gặp nhau là:',
            options: ['40 s', '16 s', '26,7 s', '10 s'],
            answer: 3,
            explanation: r`Ngược chiều nên tốc độ lại gần là $15 + 25 = 40$ m/s; $t = 400/40 = 10$ s.`,
          },
          {
            prompt: 'Xe chạy 72 km/h thì phanh với gia tốc có độ lớn 5 m/s². Quãng đường phanh là:',
            options: ['40 m', '518,4 m', '20 m', '80 m'],
            answer: 0,
            explanation: r`$v_0 = 20$ m/s; $d = \dfrac{v_0^2}{2\lvert a\rvert} = \dfrac{400}{10} = 40$ m.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 3. ĐỘNG LỰC HỌC
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 10 · Chương 3. Động lực học',
    description: 'Ba định luật Newton, lực ma sát, mặt phẳng nghiêng, hệ vật nối dây, moment lực.',
    position: 103,
    lessons: [
      {
        title: 'Động lực học – Kiến thức trọng tâm',
        slug: 'vl10-c3-dong-luc-hoc-kien-thuc',
        simulation: 'incline',
        summary: 'Ba định luật Newton, trọng lực, lực ma sát trượt, mặt phẳng nghiêng, moment lực và điều kiện cân bằng.',
        content: r`
Chương này nối lực với chuyển động. Bài toán quen thuộc nhất là **phân tích lực rồi viết định luật II Newton**.

## 1. Ba định luật Newton

1. **Định luật I:** không có lực tác dụng hoặc hợp lực bằng 0 thì vật giữ nguyên trạng thái chuyển động.
2. **Định luật II:** gia tốc cùng hướng với hợp lực, tỉ lệ thuận với hợp lực, tỉ lệ nghịch với khối lượng:
$$\vec F_{\text{hl}} = m\vec a$$
3. **Định luật III:** lực và phản lực cùng độ lớn, ngược chiều, **đặt vào hai vật khác nhau**.

## 2. Một số lực thường gặp

| Lực | Công thức | Ghi chú |
|---|---|---|
| Trọng lực | $P = mg$ | hướng thẳng đứng xuống |
| Ma sát trượt | $F_{ms} = \mu N$ | ngược chiều chuyển động |
| Phản lực trên mặt nghiêng góc $\alpha$ | $N = mg\cos\alpha$ | khi không có lực khác vuông góc mặt |

Gia tốc vật trượt xuống dốc có ma sát: $a = g(\sin\alpha - \mu\cos\alpha)$.

## 3. Moment lực và cân bằng vật có trục quay

$$M = Fd$$

$d$ là **cánh tay đòn** (khoảng cách từ trục quay đến giá của lực). Vật cân bằng khi tổng moment làm vật quay theo chiều kim đồng hồ bằng tổng moment làm vật quay ngược chiều:

$$\sum M_{\text{thuận}} = \sum M_{\text{ngược}}$$
`,
      },
      {
        title: 'Động lực học – Các dạng bài tập',
        slug: 'vl10-c3-dong-luc-hoc-dang-bai',
        summary: '4 dạng bài: mặt ngang có ma sát, mặt phẳng nghiêng, hệ hai vật nối dây, cân bằng vật có trục quay.',
        content: r`
## Dạng 1. Mặt phẳng ngang có ma sát

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp (nền tảng).

**Phương pháp:** vẽ lực, chọn trục theo chiều chuyển động; trục vuông góc cho $N$, trục dọc cho $F - F_{ms} = ma$.

**Ví dụ.** Kéo vật 5 kg trên sàn bằng lực ngang 30 N, $\mu = 0{,}2$, $g = 10$ m/s². Tính gia tốc.

**Lời giải.** $N = mg = 50$ N nên $F_{ms} = 10$ N; $a = \dfrac{30 - 10}{5} = 4$ m/s².

## Dạng 2. Mặt phẳng nghiêng

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi, đánh giá năng lực.

**Phương pháp:** phân tích trọng lực thành thành phần song song $mg\sin\alpha$ và vuông góc $mg\cos\alpha$ với mặt phẳng nghiêng.

**Ví dụ.** Vật trượt xuống dốc nghiêng 30°, $\mu = 0{,}1$, $g = 10$ m/s². Tính gia tốc.

**Lời giải.** $a = g(\sin\alpha - \mu\cos\alpha) = 10(0{,}5 - 0{,}1\cdot 0{,}866) \approx 4{,}1$ m/s².

## Dạng 3. Hệ hai vật nối bằng dây

**Kỳ thi hay gặp:** học sinh giỏi, học kỳ (câu vận dụng cao).

**Phương pháp:** dây không giãn, ròng rọc nhẹ nên gia tốc hai vật cùng độ lớn và lực căng hai đầu dây bằng nhau. Viết định luật II cho từng vật rồi giải hệ.

**Ví dụ.** Vật $m_1 = 2$ kg trên bàn nhẵn nối bằng dây vắt qua ròng rọc với vật $m_2 = 3$ kg treo thẳng đứng, $g = 10$ m/s². Tính $a$ và lực căng $T$.

**Lời giải.** Với $m_1$: $T = m_1a$. Với $m_2$: $m_2g - T = m_2a$. Cộng lại:
$$a = \frac{m_2g}{m_1 + m_2} = \frac{30}{5} = 6\ \text{m/s}^2 \qquad T = 2\cdot 6 = 12\ \text{N}$$

## Dạng 4. Cân bằng của vật có trục quay

**Kỳ thi hay gặp:** học kỳ, đánh giá năng lực, tốt nghiệp (nền tảng).

**Phương pháp:** chọn trục quay tại điểm có nhiều lực đi qua, viết tổng moment thuận bằng tổng moment ngược.

**Ví dụ.** Bập bênh có trục ở giữa. Em bé 40 kg ngồi cách trục 1,5 m. Em 30 kg phải ngồi cách trục bao nhiêu để cân bằng?

**Lời giải.** $30g\cdot d = 40g\cdot 1{,}5$ nên $d = 2$ m.

## Câu luyện tập

1. Vật 2 kg chịu lực kéo ngang 10 N, $\mu = 0{,}25$, $g = 10$ m/s². Tính gia tốc.
2. Xe 1000 kg có lực kéo 2500 N và lực cản 500 N. Tính gia tốc.
3. Cờ lê dài 0,25 m, tác dụng lực 80 N vuông góc với cán. Tính moment lực.
4. Hai vật 1 kg và 2 kg treo hai bên ròng rọc nhẹ (máy Atwood), $g = 10$ m/s². Tính gia tốc và lực căng dây.

<details>
<summary>Xem đáp án</summary>

1. $F_{ms} = 5$ N nên $a = 2{,}5$ m/s²
2. $a = 2000/1000 = 2$ m/s²
3. $M = 80\cdot 0{,}25 = 20$ N·m
4. $a = \dfrac{(2 - 1)\cdot 10}{3} \approx 3{,}3$ m/s²; $T = \dfrac{2\cdot 1\cdot 2\cdot 10}{3} \approx 13{,}3$ N

</details>

${NOTE}
`,
        questions: [
          {
            prompt: r`Vật 2 kg chịu lực kéo ngang 10 N trên sàn có $\mu = 0{,}25$ ($g = 10$ m/s²). Gia tốc của vật là:`,
            options: ['5 m/s²', '2,5 m/s²', '7,5 m/s²', '1,25 m/s²'],
            answer: 1,
            explanation: r`$F_{ms} = \mu mg = 5$ N; $a = \dfrac{10 - 5}{2} = 2{,}5$ m/s².`,
          },
          {
            prompt: 'Xe 1000 kg có lực kéo 2500 N và lực cản 500 N. Gia tốc của xe là:',
            options: ['3 m/s²', '2,5 m/s²', '0,5 m/s²', '2 m/s²'],
            answer: 3,
            explanation: r`Hợp lực $2500 - 500 = 2000$ N; $a = 2000/1000 = 2$ m/s².`,
          },
          {
            prompt: 'Cờ lê dài 0,25 m, tác dụng lực 80 N vuông góc với cán. Moment lực là:',
            options: ['20 N·m', '320 N·m', '3,1 N·m', '80 N·m'],
            answer: 0,
            explanation: r`$M = Fd = 80\cdot 0{,}25 = 20$ N·m.`,
          },
          {
            prompt: r`Máy Atwood: hai vật 1 kg và 2 kg treo hai bên ròng rọc nhẹ ($g = 10$ m/s²). Gia tốc của hệ là:`,
            options: ['10 m/s²', '5 m/s²', '3,3 m/s²', '6,7 m/s²'],
            answer: 2,
            explanation: r`$a = \dfrac{(m_2 - m_1)g}{m_1 + m_2} = \dfrac{1\cdot 10}{3} \approx 3{,}3$ m/s².`,
          },
          {
            prompt: 'Theo định luật III Newton, lực và phản lực:',
            options: ['cân bằng nhau vì cùng độ lớn, ngược chiều', 'đặt vào hai vật khác nhau nên không cân bằng nhau', 'luôn đặt vào cùng một vật', 'có độ lớn khác nhau nếu hai vật khác khối lượng'],
            answer: 1,
            explanation: 'Lực và phản lực cùng độ lớn, ngược chiều nhưng đặt vào hai vật khác nhau, nên không bao giờ triệt tiêu nhau.',
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 4. CÔNG, NĂNG LƯỢNG, CÔNG SUẤT
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 10 · Chương 4. Công, năng lượng, công suất',
    description: 'Công, công suất, động năng, thế năng, định lí động năng, bảo toàn cơ năng, hiệu suất.',
    position: 104,
    lessons: [
      {
        title: 'Công và năng lượng – Kiến thức trọng tâm',
        slug: 'vl10-c4-nang-luong-kien-thuc',
        summary: 'Công của lực, công suất, động năng, thế năng trọng trường, định lí động năng, bảo toàn cơ năng, hiệu suất.',
        content: r`
Chương này cho **cách giải thứ hai** (không cần tính gia tốc) cho nhiều bài chuyển động; đề học sinh giỏi thường kết hợp với định luật bảo toàn.

## 1. Công và công suất

$$A = Fs\cos\alpha \qquad P = \frac{A}{t} = Fv$$

- $\alpha$ là góc giữa lực và hướng dịch chuyển.
- $\alpha < 90^\circ$: công phát động ($A > 0$); $\alpha > 90^\circ$: công cản ($A < 0$); $\alpha = 90^\circ$: lực không sinh công.

## 2. Động năng, thế năng

$$W_đ = \frac{1}{2}mv^2 \qquad W_t = mgh$$

Thế năng phụ thuộc cách chọn **mốc thế năng**.

## 3. Định lí động năng

Tổng công của các lực tác dụng lên vật bằng độ biến thiên động năng:

$$\sum A = W_{đ2} - W_{đ1}$$

## 4. Bảo toàn cơ năng

Khi chỉ có trọng lực (và lực đàn hồi) sinh công:

$$W = W_đ + W_t = \text{hằng số}$$

## 5. Hiệu suất

$$H = \frac{A_{\text{ích}}}{A_{\text{toàn phần}}} = \frac{P_{\text{ích}}}{P_{\text{tiêu thụ}}}$$
`,
      },
      {
        title: 'Công và năng lượng – Các dạng bài tập',
        slug: 'vl10-c4-nang-luong-dang-bai',
        summary: '4 dạng bài: công và công suất, bảo toàn cơ năng, định lí động năng khi có lực hãm, hiệu suất của máy.',
        content: r`
## Dạng 1. Công và công suất của lực

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** xác định đúng góc $\alpha$ giữa lực và hướng dịch chuyển rồi áp dụng $A = Fs\cos\alpha$.

**Ví dụ.** Người kéo xe bằng lực 100 N hợp với phương ngang 60°, xe đi 20 m trong 40 s. Tính công và công suất trung bình.

**Lời giải.** $A = 100\cdot 20\cdot\cos 60^\circ = 1000$ J; $P = 1000/40 = 25$ W.

## Dạng 2. Bảo toàn cơ năng

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi, đánh giá năng lực.

**Phương pháp:** chọn mốc thế năng, viết cơ năng tại hai vị trí và cho bằng nhau. Với câu hỏi "động năng bằng thế năng" thì cơ năng bằng **2 lần thế năng**.

**Ví dụ.** Ném vật thẳng đứng lên với $v_0 = 20$ m/s, $g = 10$ m/s². Tìm độ cao cực đại và độ cao tại đó động năng bằng thế năng.

**Lời giải.** $h_{max} = \dfrac{v_0^2}{2g} = 20$ m. Khi $W_đ = W_t$: $\tfrac{1}{2}mv_0^2 = 2mgh$ nên $h = \dfrac{v_0^2}{4g} = 10$ m.

## Dạng 3. Định lí động năng khi có ma sát hoặc lực hãm

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi.

**Phương pháp:** công của lực hãm là âm: $A_{\text{hãm}} = -Fs = 0 - \tfrac{1}{2}mv^2$.

**Ví dụ.** Xe 1000 kg đang chạy 20 m/s thì hãm bằng lực không đổi 4000 N. Tính quãng đường đến khi dừng.

**Lời giải.** $-4000s = 0 - \tfrac{1}{2}\cdot 1000\cdot 20^2$ nên $s = \dfrac{200\,000}{4000} = 50$ m.

## Dạng 4. Hiệu suất của máy

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** tính công (hoặc công suất) có ích, rồi chia cho hiệu suất để ra công suất tiêu thụ.

**Ví dụ.** Máy bơm nâng khối 100 kg lên cao 10 m trong 20 s, hiệu suất 80%, $g = 10$ m/s². Tính công suất điện tiêu thụ.

**Lời giải.** $A_{\text{ích}} = mgh = 10\,000$ J nên $P_{\text{ích}} = 500$ W; $P_{\text{tiêu thụ}} = 500/0{,}8 = 625$ W.

## Câu luyện tập

1. Lực 50 N cùng hướng chuyển động, vật dịch chuyển 4 m. Tính công.
2. Vật 2 kg rơi tự do từ độ cao 20 m, $g = 10$ m/s². Tính vận tốc và động năng khi chạm đất.
3. Ô tô công suất 40 kW chạy đều 20 m/s. Tính lực kéo của động cơ.
4. Con lắc đơn dài 1 m thả từ góc lệch 60°, bỏ qua ma sát, $g = 10$ m/s². Tính vận tốc ở vị trí thấp nhất.

<details>
<summary>Xem đáp án</summary>

1. $A = 200$ J
2. $v = 20$ m/s; $W_đ = 400$ J
3. $F = P/v = 2000$ N
4. $h = l(1 - \cos 60^\circ) = 0{,}5$ m nên $v = \sqrt{2\cdot 10\cdot 0{,}5} = \sqrt{10} \approx 3{,}16$ m/s

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Lực 50 N cùng hướng chuyển động, vật dịch chuyển 4 m. Công của lực là:',
            options: ['12,5 J', '200 J', '54 J', '100 J'],
            answer: 1,
            explanation: r`$A = Fs\cos 0^\circ = 50\cdot 4 = 200$ J.`,
          },
          {
            prompt: r`Vật 2 kg rơi tự do từ độ cao 20 m ($g = 10$ m/s²). Động năng khi chạm đất là:`,
            options: ['200 J', '40 J', '800 J', '400 J'],
            answer: 3,
            explanation: r`Bảo toàn cơ năng: $W_đ = mgh = 2\cdot 10\cdot 20 = 400$ J.`,
          },
          {
            prompt: 'Ô tô có công suất 40 kW chạy đều với 20 m/s. Lực kéo của động cơ là:',
            options: ['2000 N', '800 N', '800 000 N', '20 N'],
            answer: 0,
            explanation: r`$P = Fv \Rightarrow F = \dfrac{40\,000}{20} = 2000$ N.`,
          },
          {
            prompt: r`Con lắc đơn dài 1 m thả từ góc lệch 60°, bỏ qua ma sát ($g = 10$ m/s²). Vận tốc ở vị trí thấp nhất là:`,
            options: ['4,47 m/s', '10 m/s', '3,16 m/s', '2,24 m/s'],
            answer: 2,
            explanation: r`$h = l(1 - \cos 60^\circ) = 0{,}5$ m; $v = \sqrt{2gh} = \sqrt{10} \approx 3{,}16$ m/s. Đáp án 4,47 m/s là do lấy $h = l$.`,
          },
          {
            prompt: r`Ném vật thẳng đứng lên với $v_0 = 20$ m/s ($g = 10$ m/s²). Độ cao tại đó động năng bằng thế năng là:`,
            options: ['20 m', '10 m', '5 m', '14,1 m'],
            answer: 1,
            explanation: r`$W_đ = W_t$ thì $W = 2W_t$: $\tfrac{1}{2}mv_0^2 = 2mgh \Rightarrow h = \dfrac{v_0^2}{4g} = 10$ m.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 5. ĐỘNG LƯỢNG
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 10 · Chương 5. Động lượng',
    description: 'Động lượng, xung lượng, bảo toàn động lượng, va chạm mềm và va chạm đàn hồi, chuyển động bằng phản lực.',
    position: 105,
    lessons: [
      {
        title: 'Động lượng – Kiến thức trọng tâm',
        slug: 'vl10-c5-dong-luong-kien-thuc',
        simulation: 'collision',
        summary: 'Động lượng, xung lượng của lực, hệ kín và định luật bảo toàn động lượng, va chạm mềm và đàn hồi.',
        content: r`
Bảo toàn động lượng giải được những bài **va chạm** và **nổ** mà lực tương tác rất phức tạp.

## 1. Động lượng và xung lượng

$$\vec p = m\vec v \qquad \vec F\,\Delta t = \Delta\vec p$$

Động lượng là **đại lượng vectơ** cùng hướng với vận tốc, đơn vị kg·m/s.

## 2. Định luật bảo toàn động lượng

Với **hệ kín** (tổng ngoại lực bằng 0 hoặc rất nhỏ so với nội lực):

$$m_1\vec v_1 + m_2\vec v_2 = m_1\vec v_1\,' + m_2\vec v_2\,'$$

> Khi chiếu lên một trục, phải chọn chiều dương và giữ đúng dấu của từng vận tốc.

## 3. Hai loại va chạm

| Va chạm | Động lượng | Động năng | Công thức |
|---|---|---|---|
| Mềm (dính vào nhau) | bảo toàn | **giảm** | $V = \dfrac{m_1v_1 + m_2v_2}{m_1 + m_2}$ |
| Đàn hồi | bảo toàn | bảo toàn | xem bên dưới |

Va chạm đàn hồi xuyên tâm, vật 2 ban đầu đứng yên:

$$v_1' = \frac{m_1 - m_2}{m_1 + m_2}\,v_1 \qquad v_2' = \frac{2m_1}{m_1 + m_2}\,v_1$$
`,
      },
      {
        title: 'Động lượng – Các dạng bài tập',
        slug: 'vl10-c5-dong-luong-dang-bai',
        summary: '4 dạng bài: xung lượng và lực trung bình, va chạm mềm, va chạm đàn hồi, súng giật và chuyển động bằng phản lực.',
        content: r`
## Dạng 1. Xung lượng và lực trung bình

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** chọn chiều dương, tính $\Delta p = m(v_{\text{sau}} - v_{\text{trước}})$ rồi $F = \Delta p/\Delta t$.

**Ví dụ.** Bóng 0,5 kg bay vào tường với 10 m/s, bật ngược lại với 8 m/s, thời gian chạm 0,02 s. Tính lực trung bình của tường.

**Lời giải.** Chọn chiều dương là chiều bay vào: $\Delta p = 0{,}5(-8 - 10) = -9$ kg·m/s. $F = 9/0{,}02 = 450$ N, hướng ra khỏi tường.

## Dạng 2. Va chạm mềm

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** sau va chạm hai vật có chung vận tốc $V$: $(m_1 + m_2)V = m_1v_1 + m_2v_2$.

**Ví dụ.** Toa 10 tấn chạy 2 m/s va vào toa 5 tấn đứng yên rồi móc vào nhau. Tính vận tốc sau va chạm.

**Lời giải.** $V = \dfrac{10\cdot 2}{10 + 5} \approx 1{,}33$ m/s.

## Dạng 3. Va chạm đàn hồi xuyên tâm

**Kỳ thi hay gặp:** học sinh giỏi, đánh giá năng lực.

**Phương pháp:** viết đồng thời bảo toàn động lượng và bảo toàn động năng; với vật 2 đứng yên dùng công thức nhanh.

**Ví dụ.** Vật 2 kg chạy 6 m/s va đàn hồi vào vật 4 kg đứng yên. Tìm vận tốc hai vật sau va chạm.

**Lời giải.** $v_1' = \dfrac{2 - 4}{6}\cdot 6 = -2$ m/s (bật ngược lại); $v_2' = \dfrac{2\cdot 2}{6}\cdot 6 = 4$ m/s.

Kiểm tra: động lượng $2(-2) + 4\cdot 4 = 12 = 2\cdot 6$; động năng sau $4 + 32 = 36$ J bằng động năng trước.

## Dạng 4. Súng giật và chuyển động bằng phản lực

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi.

**Phương pháp:** hệ ban đầu đứng yên nên tổng động lượng bằng 0; hai phần chuyển động ngược chiều.

**Ví dụ.** Súng 5 kg bắn viên đạn 20 g với vận tốc 500 m/s. Tính vận tốc giật lùi của súng.

**Lời giải.** $0 = 0{,}02\cdot 500 - 5V$ nên $V = 2$ m/s, ngược chiều đạn.

## Câu luyện tập

1. Xe 2 kg chạy 3 m/s va chạm mềm vào xe 1 kg đứng yên. Tính vận tốc chung.
2. Lực 20 N tác dụng trong 0,5 s. Tính xung lượng của lực.
3. Người 60 kg nhảy khỏi thuyền 120 kg đang đứng yên với vận tốc 3 m/s so với bờ. Tính vận tốc thuyền.
4. Đạn 10 g bay 400 m/s cắm vào khối gỗ 0,99 kg đang nằm yên trên mặt nhẵn. Tính vận tốc hệ sau va chạm.

<details>
<summary>Xem đáp án</summary>

1. $V = 6/3 = 2$ m/s
2. $F\Delta t = 10$ N·s
3. 1,5 m/s, ngược chiều người nhảy
4. $V = \dfrac{0{,}01\cdot 400}{1{,}0} = 4$ m/s

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Xe 2 kg chạy 3 m/s va chạm mềm vào xe 1 kg đứng yên. Vận tốc chung sau va chạm là:',
            options: ['3 m/s', '1,5 m/s', '2 m/s', '1 m/s'],
            answer: 2,
            explanation: r`$V = \dfrac{2\cdot 3}{2 + 1} = 2$ m/s.`,
          },
          {
            prompt: 'Lực 20 N tác dụng trong 0,5 s. Xung lượng của lực là:',
            options: ['10 N·s', '40 N·s', '20,5 N·s', '0,025 N·s'],
            answer: 0,
            explanation: r`$F\Delta t = 20\cdot 0{,}5 = 10$ N·s.`,
          },
          {
            prompt: 'Người 60 kg nhảy khỏi thuyền 120 kg đang đứng yên với vận tốc 3 m/s so với bờ. Vận tốc của thuyền là:',
            options: ['6 m/s cùng chiều người', '3 m/s ngược chiều người', '1,5 m/s cùng chiều người', '1,5 m/s ngược chiều người'],
            answer: 3,
            explanation: r`$0 = 60\cdot 3 + 120V \Rightarrow V = -1{,}5$ m/s: thuyền chuyển động ngược chiều người.`,
          },
          {
            prompt: 'Đạn 10 g bay 400 m/s cắm vào khối gỗ 0,99 kg đang nằm yên trên mặt nhẵn. Vận tốc của hệ sau va chạm là:',
            options: ['400 m/s', '4 m/s', '4,04 m/s', '0,4 m/s'],
            answer: 1,
            explanation: r`$V = \dfrac{0{,}01\cdot 400}{0{,}01 + 0{,}99} = 4$ m/s.`,
          },
          {
            prompt: 'Trong va chạm mềm giữa hai vật:',
            options: ['động lượng và động năng đều bảo toàn', 'động lượng không bảo toàn, động năng bảo toàn', 'động lượng bảo toàn, động năng giảm', 'cả động lượng và động năng đều giảm'],
            answer: 2,
            explanation: 'Hệ kín nên động lượng luôn bảo toàn; một phần động năng chuyển thành nhiệt và biến dạng nên động năng giảm.',
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 6. CHUYỂN ĐỘNG TRÒN
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 10 · Chương 6. Chuyển động tròn',
    description: 'Tốc độ góc, chu kì, gia tốc hướng tâm, lực hướng tâm, xe qua cua, xe qua cầu, con lắc nón.',
    position: 106,
    lessons: [
      {
        title: 'Chuyển động tròn – Kiến thức trọng tâm',
        slug: 'vl10-c6-chuyen-dong-tron-kien-thuc',
        summary: 'Tốc độ góc, chu kì, tần số, tốc độ dài, gia tốc hướng tâm và lực hướng tâm.',
        content: r`
Chương này đưa ra khái niệm **gia tốc hướng tâm** và **lực hướng tâm**; bài xe qua cua và qua cầu hay gặp ở đề học sinh giỏi.

## 1. Các đại lượng đặc trưng

$$\omega = \frac{\Delta\theta}{\Delta t} = \frac{2\pi}{T} = 2\pi f \qquad v = \omega r$$

- $\omega$: tốc độ góc (rad/s); $T$: chu kì (s); $f = 1/T$: tần số (Hz).
- $v$: tốc độ dài (m/s); $r$: bán kính quỹ đạo (m).

## 2. Gia tốc hướng tâm

Chuyển động tròn **đều** vẫn có gia tốc, hướng vào tâm:

$$a_{ht} = \frac{v^2}{r} = \omega^2 r$$

## 3. Lực hướng tâm

$$F_{ht} = m\frac{v^2}{r} = m\omega^2 r$$

> Lực hướng tâm **không phải một loại lực mới**, mà là hợp lực (hoặc một lực cụ thể như ma sát, lực căng, trọng lực…) đóng vai trò gây ra gia tốc hướng tâm.

## 4. Một số trường hợp thường gặp

| Tình huống | Lực đóng vai trò hướng tâm | Kết quả |
|---|---|---|
| Xe qua cua phẳng | ma sát nghỉ | không trượt khi $v \le \sqrt{\mu g r}$ |
| Xe ở đỉnh cầu vồng lồi | $P - N$ | $N = m\left(g - \dfrac{v^2}{r}\right)$; rời mặt cầu khi $v = \sqrt{gr}$ |
| Con lắc nón | hợp lực của $\vec P$ và $\vec T$ | $T = 2\pi\sqrt{\dfrac{l\cos\alpha}{g}}$ |
`,
      },
      {
        title: 'Chuyển động tròn – Các dạng bài tập',
        slug: 'vl10-c6-chuyen-dong-tron-dang-bai',
        summary: '4 dạng bài: đại lượng đặc trưng, xe qua cua, xe qua cầu cong, con lắc nón.',
        content: r`
## Dạng 1. Tính các đại lượng đặc trưng

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** đổi về rad và giây, rồi dùng $\omega = 2\pi/T$, $v = \omega r$, $a = \omega^2 r$.

**Ví dụ.** Kim phút của đồng hồ dài 10 cm. Tính tốc độ góc và tốc độ dài của đầu kim.

**Lời giải.** $T = 3600$ s nên $\omega = \dfrac{2\pi}{3600} \approx 1{,}75\cdot 10^{-3}$ rad/s; $v = \omega r \approx 1{,}75\cdot 10^{-4}$ m/s.

## Dạng 2. Xe qua đoạn cua nằm ngang

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi.

**Phương pháp:** ma sát nghỉ đóng vai trò lực hướng tâm; xe không trượt khi $\mu mg \ge \dfrac{mv^2}{r}$.

**Ví dụ.** Xe 1000 kg qua đoạn cong bán kính 50 m với 10 m/s. Tính lực hướng tâm. Với $\mu = 0{,}5$, vận tốc tối đa không trượt là bao nhiêu ($g = 10$ m/s²)?

**Lời giải.** $F_{ht} = \dfrac{1000\cdot 10^2}{50} = 2000$ N; $v_{max} = \sqrt{\mu gr} = \sqrt{250} \approx 15{,}8$ m/s.

## Dạng 3. Xe qua cầu cong

**Kỳ thi hay gặp:** học sinh giỏi, đánh giá năng lực.

**Phương pháp:** tại điểm cao nhất của cầu lồi, hướng tâm hướng xuống: $mg - N = \dfrac{mv^2}{r}$.

**Ví dụ.** Xe 1000 kg qua cầu vồng lồi bán kính 40 m với 10 m/s, $g = 10$ m/s². Tính áp lực lên mặt cầu ở điểm cao nhất và vận tốc để xe bắt đầu rời mặt cầu.

**Lời giải.** $N = m\left(g - \dfrac{v^2}{r}\right) = 1000(10 - 2{,}5) = 7500$ N. Xe rời mặt cầu khi $N = 0$: $v = \sqrt{gr} = 20$ m/s.

## Dạng 4. Con lắc nón

**Kỳ thi hay gặp:** học sinh giỏi (nâng cao).

**Phương pháp:** $\tan\alpha = \dfrac{\omega^2 r}{g}$ với $r = l\sin\alpha$, suy ra $\omega^2 = \dfrac{g}{l\cos\alpha}$.

**Ví dụ.** Vật nặng buộc dây dài 1 m quay tròn đều trong mặt phẳng ngang, dây lệch 30° so với phương thẳng đứng, $g = 10$ m/s². Tính chu kì.

**Lời giải.** $T = 2\pi\sqrt{\dfrac{l\cos\alpha}{g}} = 2\pi\sqrt{\dfrac{0{,}866}{10}} \approx 1{,}85$ s.

## Câu luyện tập

1. Vật chuyển động tròn đều bán kính 0,5 m, tần số 2 Hz. Tính $\omega$, $v$ và $a$.
2. Xe 800 kg qua cua bán kính 100 m với 20 m/s. Tính lực hướng tâm.
3. Vật 0,2 kg buộc dây dài 0,5 m quay đều trên mặt bàn nhẵn với 3 m/s. Tính lực căng dây.
4. Để xe qua cầu lồi bán kính 90 m không rời mặt cầu, vận tốc tối đa là bao nhiêu ($g = 10$ m/s²)?

<details>
<summary>Xem đáp án</summary>

1. $\omega = 4\pi \approx 12{,}6$ rad/s; $v \approx 6{,}28$ m/s; $a \approx 79$ m/s²
2. $F = 800\cdot 400/100 = 3200$ N
3. $T = 0{,}2\cdot 9/0{,}5 = 3{,}6$ N
4. $v = \sqrt{10\cdot 90} = 30$ m/s

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Vật chuyển động tròn đều bán kính 0,5 m với tần số 2 Hz. Tốc độ dài của vật là:',
            options: ['1 m/s', '6,28 m/s', '12,6 m/s', '3,14 m/s'],
            answer: 1,
            explanation: r`$\omega = 2\pi f = 4\pi$ rad/s; $v = \omega r = 4\pi\cdot 0{,}5 = 2\pi \approx 6{,}28$ m/s.`,
          },
          {
            prompt: 'Xe 800 kg qua cua bán kính 100 m với tốc độ 20 m/s. Lực hướng tâm là:',
            options: ['160 N', '1600 N', '3200 N', '320 000 N'],
            answer: 2,
            explanation: r`$F = \dfrac{mv^2}{r} = \dfrac{800\cdot 400}{100} = 3200$ N.`,
          },
          {
            prompt: 'Vật 0,2 kg buộc dây dài 0,5 m quay đều trên mặt bàn nhẵn với tốc độ 3 m/s. Lực căng dây là:',
            options: ['3,6 N', '1,2 N', '0,9 N', '1,8 N'],
            answer: 0,
            explanation: r`Lực căng đóng vai trò lực hướng tâm: $T = \dfrac{mv^2}{r} = \dfrac{0{,}2\cdot 9}{0{,}5} = 3{,}6$ N.`,
          },
          {
            prompt: r`Để xe qua cầu lồi bán kính 90 m mà không rời mặt cầu ($g = 10$ m/s²), vận tốc tối đa là:`,
            options: ['9 m/s', '900 m/s', '45 m/s', '30 m/s'],
            answer: 3,
            explanation: r`Xe rời mặt cầu khi $N = 0$, tức $v = \sqrt{gr} = \sqrt{900} = 30$ m/s.`,
          },
          {
            prompt: 'Khi xe chạy qua đỉnh cầu vồng lồi, áp lực của xe lên mặt cầu:',
            options: ['lớn hơn trọng lượng xe', 'nhỏ hơn trọng lượng xe', 'bằng trọng lượng xe', 'không phụ thuộc tốc độ xe'],
            answer: 1,
            explanation: r`$N = m\left(g - \dfrac{v^2}{r}\right) < mg$; xe chạy càng nhanh thì áp lực càng nhỏ.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 7. BIẾN DẠNG CỦA VẬT RẮN
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 10 · Chương 7. Biến dạng của vật rắn',
    description: 'Biến dạng đàn hồi, định luật Hooke, ghép lò xo, ứng suất, suất Young.',
    position: 107,
    lessons: [
      {
        title: 'Biến dạng vật rắn – Kiến thức trọng tâm',
        slug: 'vl10-c7-bien-dang-kien-thuc',
        summary: 'Biến dạng đàn hồi, định luật Hooke, ghép lò xo nối tiếp và song song, ứng suất, biến dạng tỉ đối, suất Young.',
        content: r`
Chương ngắn nhưng hay xuất hiện ở câu trắc nghiệm và bài đọc đồ thị lực – độ giãn.

## 1. Biến dạng đàn hồi và định luật Hooke

**Biến dạng đàn hồi:** vật trở về hình dạng cũ khi thôi tác dụng lực (trong giới hạn đàn hồi).

$$F = k\,\Delta l$$

$k$ là **độ cứng** của lò xo (N/m). Vật treo cân bằng: $k\,\Delta l = mg$.

## 2. Ghép lò xo

| Cách ghép | Độ cứng tương đương | Đặc điểm |
|---|---|---|
| Nối tiếp | $\dfrac{1}{k} = \dfrac{1}{k_1} + \dfrac{1}{k_2}$ | lực bằng nhau, độ giãn cộng lại |
| Song song | $k = k_1 + k_2$ | độ giãn bằng nhau, lực cộng lại |

> Cắt lò xo thành đoạn ngắn hơn thì đoạn đó **cứng hơn**: độ cứng tỉ lệ nghịch với chiều dài.

## 3. Ứng suất và suất Young

$$\sigma = \frac{F}{S} \qquad \varepsilon = \frac{\Delta l}{l_0} \qquad E = \frac{\sigma}{\varepsilon} \;\Rightarrow\; \Delta l = \frac{Fl_0}{ES}$$

- $\sigma$: ứng suất (Pa); $\varepsilon$: biến dạng tỉ đối (không đơn vị); $E$: suất Young (Pa).
- Đổi tiết diện: $1\ \text{mm}^2 = 10^{-6}\ \text{m}^2$.
`,
      },
      {
        title: 'Biến dạng vật rắn – Các dạng bài tập',
        slug: 'vl10-c7-bien-dang-dang-bai',
        summary: '4 dạng bài: lực đàn hồi của lò xo, ghép lò xo, suất Young và độ giãn của dây, đọc đồ thị lực – độ giãn.',
        content: r`
## Dạng 1. Lực đàn hồi của lò xo

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** vật treo cân bằng thì lực đàn hồi bằng trọng lực: $k\,\Delta l = mg$.

**Ví dụ.** Lò xo $k = 100$ N/m treo vật 0,5 kg, $g = 10$ m/s². Tính độ giãn.

**Lời giải.** $\Delta l = \dfrac{mg}{k} = \dfrac{5}{100} = 0{,}05$ m $= 5$ cm.

## Dạng 2. Ghép lò xo

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi.

**Phương pháp:** nối tiếp thì lực bằng nhau, độ giãn cộng lại; song song thì độ giãn bằng nhau, lực cộng lại.

**Ví dụ.** Hai lò xo $k_1 = 100$ N/m và $k_2 = 200$ N/m. Tính độ cứng tương đương khi ghép nối tiếp và song song.

**Lời giải.** Nối tiếp: $k = \dfrac{100\cdot 200}{100 + 200} \approx 66{,}7$ N/m. Song song: $k = 300$ N/m.

## Dạng 3. Suất Young và độ giãn của dây

**Kỳ thi hay gặp:** học kỳ, đánh giá năng lực.

**Phương pháp:** dùng $\Delta l = \dfrac{Fl_0}{ES}$, đổi tiết diện sang m².

**Ví dụ.** Dây thép dài 2 m, tiết diện 1 mm², $E = 2\cdot 10^{11}$ Pa, chịu lực kéo 200 N. Tính độ giãn.

**Lời giải.**
$$\Delta l = \frac{200\cdot 2}{2\cdot 10^{11}\cdot 10^{-6}} = 2\cdot 10^{-3}\ \text{m} = 2\ \text{mm}$$

## Dạng 4. Đọc đồ thị lực – độ giãn

**Kỳ thi hay gặp:** tốt nghiệp, đánh giá năng lực.

**Phương pháp:** độ dốc đoạn thẳng của đồ thị $F$ theo $\Delta l$ chính là $k$.

**Ví dụ.** Đồ thị lực – độ giãn là đường thẳng qua gốc toạ độ và điểm (4 cm; 8 N). Tìm $k$ và lực khi $\Delta l = 6$ cm.

**Lời giải.** $k = \dfrac{8}{0{,}04} = 200$ N/m. Khi $\Delta l = 0{,}06$ m thì $F = 200\cdot 0{,}06 = 12$ N.

## Câu luyện tập

1. Lò xo $k = 50$ N/m giãn 4 cm. Tính lực đàn hồi.
2. Treo vật 200 g thì lò xo dài 12 cm, treo vật 300 g thì dài 13 cm ($g = 10$ m/s²). Tìm $k$ và chiều dài tự nhiên.
3. Tính ứng suất trong dây tiết diện $2\cdot 10^{-6}$ m² chịu lực 600 N.
4. Cắt lò xo $k = 100$ N/m thành hai phần bằng nhau. Tính độ cứng mỗi phần.

<details>
<summary>Xem đáp án</summary>

1. $F = 50\cdot 0{,}04 = 2$ N
2. $k = \dfrac{0{,}1\cdot 10}{0{,}01} = 100$ N/m; ban đầu $\Delta l_1 = 2/100 = 2$ cm nên $l_0 = 10$ cm
3. $\sigma = \dfrac{600}{2\cdot 10^{-6}} = 3\cdot 10^{8}$ Pa
4. $k = 200$ N/m (mỗi nửa ngắn hơn nên cứng hơn)

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Lò xo có độ cứng 50 N/m bị giãn 4 cm. Lực đàn hồi có độ lớn:',
            options: ['200 N', '12,5 N', '2 N', '0,08 N'],
            answer: 2,
            explanation: r`Đổi $\Delta l = 0{,}04$ m; $F = k\Delta l = 50\cdot 0{,}04 = 2$ N. Đáp án 200 N là do quên đổi cm sang m.`,
          },
          {
            prompt: r`Treo vật 200 g thì lò xo dài 12 cm, treo vật 300 g thì dài 13 cm ($g = 10$ m/s²). Chiều dài tự nhiên của lò xo là:`,
            options: ['10 cm', '11 cm', '9 cm', '12 cm'],
            answer: 0,
            explanation: r`Thêm 1 N làm lò xo giãn thêm 1 cm nên $k = 100$ N/m. Với vật 200 g: $\Delta l_1 = 2/100 = 2$ cm, nên $l_0 = 12 - 2 = 10$ cm.`,
          },
          {
            prompt: r`Ứng suất trong dây có tiết diện $2\cdot 10^{-6}$ m² chịu lực kéo 600 N là:`,
            options: ['$1{,}2\\cdot 10^{-3}$ Pa', '$3\\cdot 10^{8}$ Pa', '$3\\cdot 10^{2}$ Pa', '$1{,}2\\cdot 10^{9}$ Pa'],
            answer: 1,
            explanation: r`$\sigma = \dfrac{F}{S} = \dfrac{600}{2\cdot 10^{-6}} = 3\cdot 10^{8}$ Pa.`,
          },
          {
            prompt: 'Cắt lò xo có độ cứng 100 N/m thành hai phần bằng nhau. Độ cứng của mỗi phần là:',
            options: ['50 N/m', '100 N/m', '400 N/m', '200 N/m'],
            answer: 3,
            explanation: 'Độ cứng tỉ lệ nghịch với chiều dài: mỗi nửa dài bằng một nửa nên cứng gấp đôi, k = 200 N/m.',
          },
          {
            prompt: 'Ghép nối tiếp hai lò xo có độ cứng 100 N/m và 200 N/m. Độ cứng tương đương là:',
            options: ['300 N/m', '150 N/m', '66,7 N/m', '20 000 N/m'],
            answer: 2,
            explanation: r`$k = \dfrac{k_1k_2}{k_1 + k_2} = \dfrac{100\cdot 200}{300} \approx 66{,}7$ N/m. 300 N/m là kết quả khi ghép song song.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // ÔN THI VẬT LÍ 10
  // ======================================================================
  {
    level: 'on-thi',
    title: 'Ôn thi Vật lí 10',
    description: 'Đề luyện tổng hợp theo dạng đề tốt nghiệp và bảng công thức Vật lí 10.',
    position: 8,
    lessons: [
      {
        title: 'Đề luyện tổng hợp Vật lí 10',
        slug: 'vl10-de-luyen-tong-hop',
        summary: 'Đề theo cấu trúc tốt nghiệp: 4 câu nhiều lựa chọn, 1 câu đúng/sai, 2 câu trả lời ngắn, 1 câu tự luận HSG.',
        content: r`
Đề theo ba dạng câu hỏi của đề tốt nghiệp, cộng một câu tự luận mức học sinh giỏi. Lấy $g = 10$ m/s².

- **Phần I** (nhiều lựa chọn) và **Phần II** (đúng/sai, mỗi ý là một câu) nằm ở phần **Trắc nghiệm** cuối trang, nộp bài để được chấm điểm ngay.
- **Phần III** (trả lời ngắn) và **Phần IV** (tự luận) làm ra giấy rồi mở đáp án để tự chấm.

## Phần III. Trả lời ngắn

5. Vật 0,5 kg chuyển động tròn đều bán kính 0,4 m với tốc độ 2 m/s. Lực hướng tâm là bao nhiêu newton?
6. Lò xo $k = 200$ N/m bị nén 3 cm. Độ lớn lực đàn hồi là bao nhiêu newton?

<details>
<summary>Xem đáp án Phần III</summary>

5. **5 N**: $F = \dfrac{0{,}5\cdot 2^2}{0{,}4} = 5$ N
6. **6 N**: $F = 200\cdot 0{,}03 = 6$ N

</details>

## Phần IV. Tự luận (mức học sinh giỏi)

Vật 1 kg trượt từ trạng thái nghỉ, từ đỉnh dốc nghiêng 30° dài 4 m, hệ số ma sát 0,1. Xuống chân dốc vật tiếp tục trượt trên mặt ngang có cùng hệ số ma sát. Tính:

- a) vận tốc ở chân dốc;
- b) quãng đường vật đi thêm trên mặt ngang cho đến khi dừng.

<details>
<summary>Xem lời giải Phần IV</summary>

a) Trên dốc: $a_1 = g(\sin 30^\circ - 0{,}1\cos 30^\circ) \approx 4{,}13$ m/s², nên $v = \sqrt{2\cdot 4{,}13\cdot 4} \approx 5{,}75$ m/s.

b) Trên mặt ngang: $a_2 = \mu g = 1$ m/s² (chậm dần), nên $s = \dfrac{v^2}{2a_2} \approx 16{,}5$ m.

</details>

${NOTE}
`,
        questions: [
          {
            prompt: '**Câu 1.** Vật rơi tự do từ độ cao 45 m. Thời gian rơi là:',
            options: ['2 s', '3 s', '4,5 s', '9 s'],
            answer: 1,
            explanation: r`$t = \sqrt{\dfrac{2h}{g}} = \sqrt{\dfrac{90}{10}} = 3$ s.`,
          },
          {
            prompt: '**Câu 2.** Lực 12 N tác dụng lên vật 3 kg trên mặt nhẵn. Gia tốc của vật là:',
            options: ['2 m/s²', '4 m/s²', '6 m/s²', '36 m/s²'],
            answer: 1,
            explanation: r`$a = F/m = 12/3 = 4$ m/s².`,
          },
          {
            prompt: '**Câu 3.** Động cơ nâng vật 200 kg lên cao 6 m trong 12 s. Công suất có ích trung bình là:',
            options: ['100 W', '1000 W', '1200 W', '14 400 W'],
            answer: 1,
            explanation: r`$A = mgh = 12\,000$ J; $P = 12\,000/12 = 1000$ W.`,
          },
          {
            prompt: '**Câu 4.** Vật 2 kg chạy 4 m/s va chạm mềm với vật 2 kg đứng yên. Vận tốc sau va chạm là:',
            options: ['1 m/s', '2 m/s', '4 m/s', '8 m/s'],
            answer: 1,
            explanation: r`$V = \dfrac{2\cdot 4}{2 + 2} = 2$ m/s.`,
          },
          {
            prompt: '**Phần II – ý a.** Xe 1000 kg đang chạy 10 m/s thì phanh bằng lực hãm không đổi 2000 N trên đường thẳng. Nhận định: *"Gia tốc của xe có độ lớn 2 m/s²."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`$a = 2000/1000 = 2$ m/s².`,
          },
          {
            prompt: '**Phần II – ý b.** Cùng xe trên. Nhận định: *"Xe dừng sau 5 s."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`$t = v_0/a = 10/2 = 5$ s.`,
          },
          {
            prompt: '**Phần II – ý c.** Cùng xe trên. Nhận định: *"Quãng đường phanh là 25 m."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`$d = \dfrac{v_0^2}{2a} = \dfrac{100}{4} = 25$ m.`,
          },
          {
            prompt: r`**Phần II – ý d.** Cùng xe trên. Nhận định: *"Động năng ban đầu của xe là $5\cdot 10^3$ J."*`,
            options: ['Đúng', 'Sai'],
            answer: 1,
            explanation: r`$W_đ = \tfrac{1}{2}\cdot 1000\cdot 10^2 = 5\cdot 10^4$ J, không phải $5\cdot 10^3$ J.`,
          },
        ],
      },
      {
        title: 'Tổng hợp công thức Vật lí 10',
        slug: 'vl10-tong-hop-cong-thuc',
        summary: 'Bảng công thức 7 chương kèm đơn vị SI và lưu ý dễ sai — ôn nhanh trước khi thi.',
        content: r`
Mỗi bảng gom công thức của một chương, kèm đơn vị SI và lưu ý dễ sai.

## Chương 1. Đơn vị và sai số

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Giá trị trung bình | $\overline{A} = \dfrac{A_1 + \dots + A_n}{n}$ | |
| Sai số từng lần | $\Delta A_i = \lvert A_i - \overline{A}\rvert$ | |
| Sai số tuyệt đối | $\Delta A = \overline{\Delta A} + \Delta A_{\text{dc}}$ | làm tròn về 1 chữ số có nghĩa |
| Sai số tỉ đối | $\delta A = \dfrac{\Delta A}{\overline{A}}\cdot 100\%$ | |
| Tổng, hiệu | $\Delta(x \pm y) = \Delta x + \Delta y$ | cộng sai số tuyệt đối |
| Tích, thương | $\delta(xy) = \delta(x/y) = \delta x + \delta y$ | cộng sai số tỉ đối |
| Luỹ thừa | $\delta(x^n) = n\,\delta x$ | |

## Chương 2. Động học

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Vận tốc | $v = v_0 + at$ | m/s |
| Độ dịch chuyển | $d = v_0t + \tfrac{1}{2}at^2$ | m |
| Không có thời gian | $v^2 - v_0^2 = 2ad$ | $a < 0$ khi hãm |
| Rơi tự do | $h = \tfrac{1}{2}gt^2$; $v = gt$; $v^2 = 2gh$ | $g = 9{,}8$ hoặc 10 m/s² |
| Ném ngang | $x = v_0t$; $y = \tfrac{1}{2}gt^2$ | |
| Thời gian bay, tầm xa | $t = \sqrt{2h/g}$; $L = v_0t$ | |
| Vận tốc chạm đất | $v = \sqrt{v_0^2 + g^2t^2}$; $\tan\alpha = gt/v_0$ | $\alpha$ so với phương ngang |
| Cộng vận tốc | $\vec v_{13} = \vec v_{12} + \vec v_{23}$ | cộng vectơ |
| Đổi đơn vị | km/h chia 3,6 được m/s | |

## Chương 3. Động lực học

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Định luật II | $\vec F_{\text{hl}} = m\vec a$ | N, kg, m/s² |
| Trọng lực | $P = mg$ | |
| Lực ma sát trượt | $F_{ms} = \mu N$ | $N = mg\cos\alpha$ trên mặt nghiêng |
| Gia tốc trên dốc nghiêng | $a = g(\sin\alpha - \mu\cos\alpha)$ | khi trượt xuống |
| Hai vật nối dây qua ròng rọc | $a = \dfrac{m_2g}{m_1 + m_2}$; $T = m_1a$ | $m_1$ trên bàn nhẵn, $m_2$ treo |
| Moment lực | $M = Fd$ | N·m; $d$ là cánh tay đòn |
| Cân bằng moment | $\sum M_{\text{thuận}} = \sum M_{\text{ngược}}$ | |

## Chương 4. Công, năng lượng, công suất

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Công | $A = Fs\cos\alpha$ | J; $\alpha$ là góc giữa lực và dịch chuyển |
| Công suất | $P = A/t = Fv$ | W |
| Động năng | $W_đ = \tfrac{1}{2}mv^2$ | J |
| Thế năng trọng trường | $W_t = mgh$ | chọn mốc thế năng |
| Định lí động năng | $\sum A = W_{đ2} - W_{đ1}$ | lực hãm sinh công âm |
| Bảo toàn cơ năng | $W = W_đ + W_t = \text{hằng số}$ | không ma sát |
| Hiệu suất | $H = A_{\text{ích}}/A_{\text{tp}} = P_{\text{ích}}/P_{\text{tt}}$ | |

## Chương 5. Động lượng

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Động lượng | $\vec p = m\vec v$ | kg·m/s; vectơ |
| Xung lượng | $\vec F\Delta t = \Delta\vec p$ | N·s |
| Bảo toàn động lượng | $m_1\vec v_1 + m_2\vec v_2 = m_1\vec v_1\,' + m_2\vec v_2\,'$ | hệ kín; chọn chiều dương |
| Va chạm mềm | $V = \dfrac{m_1v_1 + m_2v_2}{m_1 + m_2}$ | động năng giảm |
| Va chạm đàn hồi ($v_2 = 0$) | $v_1' = \dfrac{m_1 - m_2}{m_1 + m_2}v_1$; $v_2' = \dfrac{2m_1}{m_1 + m_2}v_1$ | bảo toàn cả động năng |

## Chương 6. Chuyển động tròn

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Tốc độ góc | $\omega = \Delta\theta/\Delta t = 2\pi/T = 2\pi f$ | rad/s |
| Tốc độ dài | $v = \omega r$ | m/s |
| Gia tốc hướng tâm | $a = v^2/r = \omega^2 r$ | m/s² |
| Lực hướng tâm | $F = mv^2/r$ | hợp lực hướng vào tâm |
| Xe qua cua phẳng | $v_{max} = \sqrt{\mu gr}$ | ma sát nghỉ làm lực hướng tâm |
| Cầu vồng lồi, điểm cao nhất | $N = m(g - v^2/r)$ | rời mặt cầu khi $v = \sqrt{gr}$ |
| Con lắc nón | $T = 2\pi\sqrt{l\cos\alpha/g}$ | $\alpha$ so với phương thẳng đứng |

## Chương 7. Biến dạng của vật rắn

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Định luật Hooke | $F = k\Delta l$ | $k$: N/m |
| Vật treo cân bằng | $k\Delta l = mg$ | |
| Lò xo nối tiếp | $1/k = 1/k_1 + 1/k_2$ | lực bằng nhau |
| Lò xo song song | $k = k_1 + k_2$ | độ giãn bằng nhau |
| Ứng suất | $\sigma = F/S$ | Pa |
| Biến dạng tỉ đối | $\varepsilon = \Delta l/l_0$ | không đơn vị |
| Suất Young | $E = \sigma/\varepsilon$; $\Delta l = \dfrac{Fl_0}{ES}$ | Pa |
`,
      },
    ],
  },
];
