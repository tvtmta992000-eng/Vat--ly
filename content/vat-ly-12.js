// Vật lí 12 – Bài giảng và hệ thống bài tập (tài liệu của giáo viên, soạn theo Chương trình 2018).
// Nhập lên website: npm run import -- content/vat-ly-12.js
const r = String.raw;

const NOTE_ORIGINAL = r`> **Lưu ý.** Ví dụ và câu luyện là bài soạn mới, mô phỏng dạng bài thường gặp, không sao chép đề thi thật.`;

module.exports = [
  // ======================================================================
  // CHƯƠNG 1. VẬT LÍ NHIỆT
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 12 · Chương 1. Vật lí nhiệt',
    description: 'Nhiệt lượng, cân bằng nhiệt, chuyển thể và định luật I nhiệt động lực học.',
    position: 121,
    lessons: [
      {
        title: 'Vật lí nhiệt – Kiến thức trọng tâm',
        slug: 'vl12-c1-vat-li-nhiet-kien-thuc',
        summary: 'Thang Kelvin, nội năng, định luật I nhiệt động lực học, nhiệt dung riêng, nhiệt nóng chảy và hoá hơi.',
        content: r`
Chương mở đầu lớp 12: các bài toán nhiệt lượng, cân bằng nhiệt và định luật I nhiệt động lực học thường có trong các đề thi.

## 1. Thang nhiệt độ Kelvin

$$T\,(\text{K}) = t\,(^\circ\text{C}) + 273$$

Độ chênh nhiệt độ theo hai thang bằng nhau: $\Delta T = \Delta t$.

## 2. Nội năng và định luật I nhiệt động lực học

**Nội năng** là tổng động năng và thế năng tương tác của các phân tử cấu tạo nên vật. Nội năng thay đổi bằng hai cách: **thực hiện công** hoặc **truyền nhiệt**.

$$\Delta U = A + Q$$

- $A$: công vật **nhận** được; $Q$: nhiệt lượng vật **nhận** được.
- Quy ước dấu: vật nhận thì dương; vật toả nhiệt hoặc sinh công thì âm.

## 3. Nhiệt lượng

| Quá trình | Công thức | Ghi chú |
|---|---|---|
| Thay đổi nhiệt độ | $Q = mc\Delta t$ | $c$: nhiệt dung riêng, J/(kg·K) |
| Nóng chảy | $Q = \lambda m$ | $\lambda$: nhiệt nóng chảy riêng, J/kg; nhiệt độ không đổi |
| Hoá hơi | $Q = Lm$ | $L$: nhiệt hoá hơi riêng, J/kg; nhiệt độ không đổi |

## 4. Cân bằng nhiệt

Bỏ qua hao phí, tổng nhiệt lượng toả ra bằng tổng nhiệt lượng thu vào:

$$Q_{\text{toả}} = Q_{\text{thu}}$$

## Giá trị thường dùng

| Đại lượng | Giá trị |
|---|---|
| Nhiệt dung riêng của nước | $c_{\text{nước}} \approx 4180$ J/(kg·K) |
| Nhiệt dung riêng của nước đá | $c_{\text{đá}} \approx 2100$ J/(kg·K) |
| Nhiệt nóng chảy riêng của nước đá | $\lambda_{\text{đá}} \approx 3{,}34\cdot 10^{5}$ J/kg |
| Nhiệt hoá hơi riêng của nước | $L_{\text{nước}} \approx 2{,}26\cdot 10^{6}$ J/kg |

> Khi làm bài, luôn dùng giá trị đề cho nếu đề có ghi.
`,
      },
      {
        title: 'Vật lí nhiệt – Các dạng bài tập',
        slug: 'vl12-c1-vat-li-nhiet-dang-bai',
        summary: '4 dạng bài: cân bằng nhiệt, nhiệt lượng nhiều giai đoạn, định luật I, đo nhiệt dung riêng bằng thiết bị điện.',
        content: r`
## Dạng 1. Cân bằng nhiệt

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** viết $Q_{\text{toả}} = Q_{\text{thu}}$. Ở vật toả dùng $(t_{\text{đầu}} - t_{\text{cuối}})$, ở vật thu dùng $(t_{\text{cuối}} - t_{\text{đầu}})$ để mọi nhiệt lượng đều dương.

**Ví dụ.** Trộn 0,5 kg nước ở 80 °C với 1 kg nước ở 20 °C. Tính nhiệt độ cuối (bỏ qua hao phí).

**Lời giải.**
$$0{,}5\,c\,(80 - t) = 1\cdot c\,(t - 20) \;\Rightarrow\; 40 - 0{,}5t = t - 20 \;\Rightarrow\; t = \frac{60}{1{,}5} = 40\ ^\circ\text{C}$$

## Dạng 2. Nhiệt lượng qua nhiều giai đoạn có chuyển thể

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi, đánh giá năng lực.

**Phương pháp:** chia thành các giai đoạn: tăng nhiệt độ trong một pha ($Q = mc\Delta t$), chuyển thể ở nhiệt độ không đổi ($Q = \lambda m$ hoặc $Q = Lm$), rồi cộng lại.

**Ví dụ.** Cần bao nhiêu nhiệt lượng để đưa 200 g nước đá ở −10 °C thành nước ở 20 °C?

**Lời giải.**

- Đá từ −10 °C lên 0 °C: $Q_1 = 0{,}2\cdot 2100\cdot 10 = 4200$ J
- Nóng chảy: $Q_2 = 3{,}34\cdot 10^{5}\cdot 0{,}2 = 66\,800$ J
- Nước từ 0 °C lên 20 °C: $Q_3 = 0{,}2\cdot 4180\cdot 20 = 16\,720$ J

$$Q = Q_1 + Q_2 + Q_3 = 87\,720\ \text{J} \approx 8{,}8\cdot 10^{4}\ \text{J}$$

## Dạng 3. Định luật I nhiệt động lực học

**Kỳ thi hay gặp:** tốt nghiệp (câu đúng/sai), đánh giá năng lực.

**Phương pháp:** đọc đúng dấu. Khí nhận nhiệt thì $Q > 0$; khí sinh công ra ngoài thì $A < 0$; khí bị nén thì $A > 0$.

**Ví dụ.** Khí nhận 200 J nhiệt và sinh công 50 J. Tính độ biến thiên nội năng.

**Lời giải.** $Q = +200$ J, $A = -50$ J nên $\Delta U = 200 - 50 = 150$ J (nội năng tăng).

## Dạng 4. Đo nhiệt dung riêng bằng thiết bị điện

**Kỳ thi hay gặp:** học sinh giỏi, học kỳ (câu thực hành), đánh giá năng lực.

**Phương pháp:** điện năng cung cấp $P\,t$ chuyển thành nhiệt lượng $mc\Delta t$. Thực tế có hao phí nên giá trị đo thường lớn hơn giá trị thật.

**Ví dụ.** Điện trở nhiệt 50 W đun 0,2 kg chất lỏng trong 120 s, nhiệt độ tăng 15 °C (bỏ qua hao phí). Tính nhiệt dung riêng.

**Lời giải.**
$$c = \frac{P\,t}{m\,\Delta t} = \frac{50\cdot 120}{0{,}2\cdot 15} = 2000\ \text{J/(kg·K)}$$

## Câu luyện tập

1. Đun 2 kg nước tăng thêm 30 °C. Tính nhiệt lượng cần thiết.
2. Cần bao nhiêu nhiệt lượng để làm nóng chảy hoàn toàn 0,5 kg nước đá ở 0 °C?
3. Tính nhiệt lượng cần để hoá hơi 100 g nước ở 100 °C.
4. Khí nhận công 100 J và toả nhiệt 30 J. Tính $\Delta U$.

<details>
<summary>Xem đáp án</summary>

1. $Q = 2\cdot 4180\cdot 30 = 250\,800$ J
2. $Q = 0{,}5\cdot 3{,}34\cdot 10^{5} = 1{,}67\cdot 10^{5}$ J
3. $Q = 0{,}1\cdot 2{,}26\cdot 10^{6} = 2{,}26\cdot 10^{5}$ J
4. $\Delta U = 100 - 30 = 70$ J

</details>

Làm thêm phần **trắc nghiệm** bên dưới để tự kiểm tra.

${NOTE_ORIGINAL}
`,
        questions: [
          {
            prompt: r`Đun 2 kg nước ($c = 4180$ J/(kg·K)) tăng thêm 30 °C. Nhiệt lượng cần thiết là:`,
            options: ['125 400 J', '250 800 J', '83 600 J', '501 600 J'],
            answer: 1,
            explanation: r`$Q = mc\Delta t = 2\cdot 4180\cdot 30 = 250\,800$ J.`,
          },
          {
            prompt: r`Nhiệt lượng cần để làm nóng chảy hoàn toàn 0,5 kg nước đá ở 0 °C ($\lambda = 3{,}34\cdot 10^{5}$ J/kg) là:`,
            options: ['$6{,}68\\cdot 10^{5}$ J', '$1{,}67\\cdot 10^{4}$ J', '$1{,}67\\cdot 10^{5}$ J', '$3{,}34\\cdot 10^{5}$ J'],
            answer: 2,
            explanation: r`$Q = \lambda m = 3{,}34\cdot 10^{5}\cdot 0{,}5 = 1{,}67\cdot 10^{5}$ J.`,
          },
          {
            prompt: r`Nhiệt lượng cần để hoá hơi 100 g nước ở 100 °C ($L = 2{,}26\cdot 10^{6}$ J/kg) là:`,
            options: ['$2{,}26\\cdot 10^{5}$ J', '$2{,}26\\cdot 10^{8}$ J', '$2{,}26\\cdot 10^{4}$ J', '$4{,}18\\cdot 10^{4}$ J'],
            answer: 0,
            explanation: r`Đổi $m = 0{,}1$ kg, $Q = Lm = 2{,}26\cdot 10^{6}\cdot 0{,}1 = 2{,}26\cdot 10^{5}$ J.`,
          },
          {
            prompt: 'Một lượng khí nhận công 100 J và toả nhiệt 30 J. Độ biến thiên nội năng của khí là:',
            options: ['130 J', '−70 J', '70 J', '−130 J'],
            answer: 2,
            explanation: r`$A = +100$ J (nhận công), $Q = -30$ J (toả nhiệt) nên $\Delta U = A + Q = 70$ J.`,
          },
          {
            prompt: 'Trộn 0,5 kg nước ở 80 °C với 1 kg nước ở 20 °C, bỏ qua hao phí. Nhiệt độ khi cân bằng là:',
            options: ['50 °C', '30 °C', '60 °C', '40 °C'],
            answer: 3,
            explanation: r`$0{,}5(80 - t) = 1\cdot(t - 20) \Rightarrow t = 40$ °C. Không lấy trung bình cộng vì hai khối lượng khác nhau.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 2. KHÍ LÍ TƯỞNG
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 12 · Chương 2. Khí lí tưởng',
    description: 'Các đẳng quá trình, phương trình trạng thái, Clapeyron và thuyết động học phân tử.',
    position: 122,
    lessons: [
      {
        title: 'Khí lí tưởng – Kiến thức trọng tâm',
        slug: 'vl12-c2-khi-li-tuong-kien-thuc',
        simulation: 'gas',
        summary: 'Định luật Boyle, Charles, Gay-Lussac, phương trình trạng thái, pV = nRT, động năng phân tử, đồ thị.',
        content: r`
Chương có nhiều câu tính nhanh và câu đọc đồ thị nhất ở lớp 12. **Sai lầm phổ biến nhất là quên đổi °C sang K.**

## 1. Ba đẳng quá trình

| Quá trình | Điều kiện | Định luật |
|---|---|---|
| Đẳng nhiệt (Boyle) | $T$ không đổi | $p_1V_1 = p_2V_2$ |
| Đẳng áp (Charles) | $p$ không đổi | $\dfrac{V_1}{T_1} = \dfrac{V_2}{T_2}$ |
| Đẳng tích (Gay-Lussac) | $V$ không đổi | $\dfrac{p_1}{T_1} = \dfrac{p_2}{T_2}$ |

## 2. Phương trình trạng thái và phương trình Clapeyron

$$\frac{p_1V_1}{T_1} = \frac{p_2V_2}{T_2} \qquad pV = nRT$$

với $R \approx 8{,}31$ J/(mol·K). Trong $pV = nRT$ phải dùng đơn vị SI: $p$ (Pa), $V$ (m³), $T$ (K).

## 3. Thuyết động học phân tử

- Động năng tịnh tiến trung bình của phân tử: $\overline{W}_đ = \dfrac{3}{2}kT$, với $k = 1{,}38\cdot 10^{-23}$ J/K.
- Áp suất khí theo vi mô: $p = \dfrac{1}{3}\mu m\overline{v^2}$ ($\mu$: mật độ phân tử).
- Số Avogadro: $N_A = 6{,}02\cdot 10^{23}$ mol⁻¹; số phân tử $N = nN_A$.

> Động năng tịnh tiến trung bình **chỉ phụ thuộc nhiệt độ tuyệt đối**, không phụ thuộc loại khí hay số mol.

## 4. Đồ thị

- Đường đẳng nhiệt trên hệ $p$–$V$ là một **hypebol**.
- Đường đẳng áp trên hệ $V$–$T$ và đường đẳng tích trên hệ $p$–$T$ là **đường thẳng kéo dài đi qua gốc toạ độ** (khi $T$ tính bằng K).
`,
      },
      {
        title: 'Khí lí tưởng – Các dạng bài tập',
        slug: 'vl12-c2-khi-li-tuong-dang-bai',
        summary: '6 dạng bài: đẳng nhiệt, đẳng áp, phương trình trạng thái, Clapeyron, động năng phân tử, đọc đồ thị.',
        content: r`
## Dạng 1. Quá trình đẳng nhiệt

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** $pV$ không đổi; hai đại lượng thay đổi ngược nhau.

**Ví dụ.** Khí 2 lít ở 1 atm bị nén đẳng nhiệt còn 0,5 lít. Tính áp suất sau.

**Lời giải.** $p_2 = \dfrac{p_1V_1}{V_2} = \dfrac{1\cdot 2}{0{,}5} = 4$ atm.

## Dạng 2. Quá trình đẳng áp

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** đổi nhiệt độ sang kelvin rồi dùng $V/T$ không đổi.

**Ví dụ.** Khí 3 lít ở 27 °C được nung nóng đẳng áp đến 127 °C. Tính thể tích sau.

**Lời giải.** $T_1 = 300$ K, $T_2 = 400$ K nên $V_2 = \dfrac{3\cdot 400}{300} = 4$ lít.

## Dạng 3. Phương trình trạng thái

**Kỳ thi hay gặp:** học kỳ, đánh giá năng lực, học sinh giỏi.

**Phương pháp:** cả ba thông số cùng thay đổi thì dùng $pV/T$ không đổi.

**Ví dụ.** Khí 10 lít, 1 atm, 27 °C được nén còn 5 lít và nóng lên 127 °C. Tính áp suất mới.

**Lời giải.**
$$p_2 = \frac{p_1V_1T_2}{V_2T_1} = \frac{1\cdot 10\cdot 400}{5\cdot 300} \approx 2{,}67\ \text{atm}$$

## Dạng 4. Phương trình Clapeyron

**Kỳ thi hay gặp:** tốt nghiệp (trả lời ngắn), đánh giá năng lực.

**Phương pháp:** $pV = nRT$; đổi $V$ ra m³, $p$ ra Pa, $T$ ra K.

**Ví dụ.** Tính thể tích của 1 mol khí ở 0 °C và $1{,}013\cdot 10^{5}$ Pa.

**Lời giải.**
$$V = \frac{nRT}{p} = \frac{1\cdot 8{,}31\cdot 273}{1{,}013\cdot 10^{5}} \approx 2{,}24\cdot 10^{-2}\ \text{m}^3 = 22{,}4\ \text{lít}$$

## Dạng 5. Động năng phân tử

**Kỳ thi hay gặp:** tốt nghiệp, đánh giá năng lực.

**Phương pháp:** động năng tịnh tiến trung bình chỉ phụ thuộc nhiệt độ tuyệt đối, không phụ thuộc loại khí.

**Ví dụ.** Tính động năng tịnh tiến trung bình của phân tử khí ở 300 K.

**Lời giải.** $\overline{W}_đ = \dfrac{3}{2}\cdot 1{,}38\cdot 10^{-23}\cdot 300 \approx 6{,}21\cdot 10^{-21}$ J.

## Dạng 6. Đọc đồ thị

**Kỳ thi hay gặp:** đánh giá năng lực, tốt nghiệp.

**Phương pháp:** đồ thị $p$–$T$ là đường thẳng kéo dài qua gốc ($T$ tính bằng K) thì đó là quá trình đẳng tích, khi đó $p/T$ không đổi.

**Ví dụ.** Đồ thị $p$–$T$ của một lượng khí là đường thẳng qua gốc; tại $T = 300$ K thì $p = 1$ atm. Tìm $p$ khi $T = 450$ K.

**Lời giải.** $p = \dfrac{1\cdot 450}{300} = 1{,}5$ atm.

## Câu luyện tập

1. Khí 5 lít, 2 atm giãn đẳng nhiệt đến 10 lít. Tính áp suất.
2. Khí ở 300 K được nung đẳng tích để áp suất tăng từ 1 atm lên 2 atm. Tính nhiệt độ sau.
3. Hai mol khí ở 300 K chứa trong bình 10 lít. Tính áp suất ($R = 8{,}31$ J/(mol·K)).
4. Tính số phân tử trong 2 mol khí.

<details>
<summary>Xem đáp án</summary>

1. $p_2 = 1$ atm
2. $T_2 = 600$ K
3. $p = \dfrac{2\cdot 8{,}31\cdot 300}{0{,}01} \approx 5\cdot 10^{5}$ Pa
4. $N = 2\cdot 6{,}02\cdot 10^{23} \approx 1{,}2\cdot 10^{24}$ phân tử

</details>

${NOTE_ORIGINAL}
`,
        questions: [
          {
            prompt: 'Khí 5 lít, 2 atm giãn nở đẳng nhiệt đến 10 lít. Áp suất sau khi giãn là:',
            options: ['4 atm', '1 atm', '0,5 atm', '2 atm'],
            answer: 1,
            explanation: r`$p_2 = \dfrac{p_1V_1}{V_2} = \dfrac{2\cdot 5}{10} = 1$ atm.`,
          },
          {
            prompt: 'Khí ở 300 K được nung đẳng tích để áp suất tăng từ 1 atm lên 2 atm. Nhiệt độ sau là:',
            options: ['600 K', '150 K', '327 K', '573 K'],
            answer: 0,
            explanation: r`$\dfrac{p_1}{T_1} = \dfrac{p_2}{T_2} \Rightarrow T_2 = 300\cdot\dfrac{2}{1} = 600$ K.`,
          },
          {
            prompt: r`Hai mol khí ở 300 K chứa trong bình 10 lít ($R = 8{,}31$ J/(mol·K)). Áp suất khí xấp xỉ:`,
            options: ['$5\\cdot 10^{2}$ Pa', '$2{,}5\\cdot 10^{5}$ Pa', '$5\\cdot 10^{5}$ Pa', '$5\\cdot 10^{3}$ Pa'],
            answer: 2,
            explanation: r`Đổi $V = 10$ lít $= 0{,}01$ m³. $p = \dfrac{nRT}{V} = \dfrac{2\cdot 8{,}31\cdot 300}{0{,}01} \approx 5\cdot 10^{5}$ Pa. Quên đổi lít sang m³ sẽ ra kết quả sai $10^3$ lần.`,
          },
          {
            prompt: 'Số phân tử có trong 2 mol khí là:',
            options: ['$3{,}01\\cdot 10^{23}$', '$6{,}02\\cdot 10^{23}$', '$1{,}2\\cdot 10^{23}$', '$1{,}2\\cdot 10^{24}$'],
            answer: 3,
            explanation: r`$N = nN_A = 2\cdot 6{,}02\cdot 10^{23} \approx 1{,}2\cdot 10^{24}$.`,
          },
          {
            prompt: 'Khí 3 lít ở 27 °C được nung nóng đẳng áp đến 127 °C. Thể tích sau là:',
            options: ['14,1 lít', '4 lít', '2,25 lít', '3,5 lít'],
            answer: 1,
            explanation: r`Phải đổi sang K: $T_1 = 300$ K, $T_2 = 400$ K, nên $V_2 = 3\cdot\dfrac{400}{300} = 4$ lít. Đáp án 14,1 lít là do dùng nhầm °C.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 3. TỪ TRƯỜNG
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 12 · Chương 3. Từ trường và cảm ứng điện từ',
    description: 'Lực từ, từ thông, suất điện động cảm ứng, dòng điện xoay chiều, máy biến áp, truyền tải điện năng.',
    position: 123,
    lessons: [
      {
        title: 'Từ trường và cảm ứng điện từ – Kiến thức trọng tâm',
        slug: 'vl12-c3-tu-truong-kien-thuc',
        simulation: 'induction',
        summary: 'Lực từ, từ thông, định luật Faraday – Lenz, dòng điện xoay chiều, máy biến áp, hao phí truyền tải.',
        content: r`
Chương dài nhất của lớp 12, gồm lực từ, cảm ứng điện từ, dòng điện xoay chiều, máy biến áp và truyền tải điện năng. Phần lớn câu điện trong đề thi nằm ở chương này.

## 1. Lực từ lên đoạn dây có dòng điện

$$F = BIl\sin\alpha$$

$\alpha$ là góc giữa dây dẫn và vectơ cảm ứng từ $\vec B$. Chiều của lực xác định bằng **quy tắc bàn tay trái**.

## 2. Từ thông và cảm ứng điện từ

- Từ thông: $\Phi = BS\cos\theta$ (Wb), $\theta$ là góc giữa $\vec B$ và pháp tuyến của mặt.
- Suất điện động cảm ứng (định luật Faraday): $e = -N\dfrac{\Delta\Phi}{\Delta t}$, độ lớn $|e| = N\dfrac{|\Delta\Phi|}{\Delta t}$.
- Chiều dòng điện cảm ứng theo **định luật Lenz**: dòng cảm ứng sinh ra từ trường chống lại sự biến thiên của từ thông.
- Thanh dẫn dài $l$ chuyển động với vận tốc $v$ vuông góc với $\vec B$: $e = Blv$.

## 3. Dòng điện xoay chiều

$$i = I_0\cos(\omega t + \varphi) \qquad I = \frac{I_0}{\sqrt{2}} \qquad U = \frac{U_0}{\sqrt{2}}$$

Tần số $f = \dfrac{\omega}{2\pi}$. Công suất toả nhiệt trên điện trở thuần: $P = I^2R$ (dùng giá trị **hiệu dụng**).

## 4. Máy biến áp lí tưởng

$$\frac{U_1}{U_2} = \frac{N_1}{N_2} = \frac{I_2}{I_1}$$

## 5. Truyền tải điện năng

Với hệ số công suất bằng 1: $I = \dfrac{P}{U}$, công suất hao phí trên đường dây

$$\Delta P = I^2R = \frac{P^2R}{U^2}$$

> Tăng điện áp truyền tải lên $k$ lần thì hao phí giảm $k^2$ lần.
`,
      },
      {
        title: 'Từ trường và cảm ứng điện từ – Các dạng bài tập',
        slug: 'vl12-c3-tu-truong-dang-bai',
        summary: '6 dạng bài: lực từ, suất điện động cảm ứng, thanh dẫn cắt từ trường, dòng xoay chiều, máy biến áp, hao phí truyền tải.',
        content: r`
## Dạng 1. Lực từ lên dây dẫn

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** xác định góc $\alpha$ giữa dây và $\vec B$; dây vuông góc với $\vec B$ thì $\sin\alpha = 1$.

**Ví dụ.** Dây dài 0,5 m có dòng 4 A đặt trong từ trường đều $B = 0{,}2$ T. Tính lực từ khi dây vuông góc với $\vec B$ và khi dây hợp với $\vec B$ góc 30°.

**Lời giải.** Vuông góc: $F = 0{,}2\cdot 4\cdot 0{,}5 = 0{,}4$ N. Góc 30°: $F = 0{,}4\cdot\sin 30^\circ = 0{,}2$ N.

## Dạng 2. Từ thông biến thiên và suất điện động cảm ứng

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** tính $\Delta\Phi = \Phi_{\text{sau}} - \Phi_{\text{trước}}$ rồi $|e| = N\dfrac{|\Delta\Phi|}{\Delta t}$. Nhớ đổi diện tích ra m².

**Ví dụ.** Khung 50 vòng, diện tích mỗi vòng 100 cm², đặt vuông góc với $\vec B$. $B$ giảm đều từ 0,5 T về 0 trong 0,1 s. Tính suất điện động cảm ứng.

**Lời giải.** $\Phi_{\text{đầu}} = 0{,}5\cdot 0{,}01 = 5\cdot 10^{-3}$ Wb, $\Phi_{\text{cuối}} = 0$.
$$|e| = \frac{50\cdot 5\cdot 10^{-3}}{0{,}1} = 2{,}5\ \text{V}$$

## Dạng 3. Thanh dẫn chuyển động cắt từ trường

**Kỳ thi hay gặp:** học sinh giỏi, đánh giá năng lực.

**Phương pháp:** $e = Blv$, dòng $I = e/R$, lực từ cản trở $F = BIl$. Thanh chuyển động đều thì lực kéo bằng lực từ.

**Ví dụ.** Thanh dài 0,4 m chuyển động với vận tốc 5 m/s vuông góc với $B = 0{,}3$ T; mạch kín có điện trở 2 Ω. Tính $e$, $I$ và lực từ.

**Lời giải.** $e = 0{,}3\cdot 0{,}4\cdot 5 = 0{,}6$ V; $I = 0{,}6/2 = 0{,}3$ A; $F = 0{,}3\cdot 0{,}3\cdot 0{,}4 = 0{,}036$ N.

## Dạng 4. Dòng điện xoay chiều

**Kỳ thi hay gặp:** tốt nghiệp, đánh giá năng lực.

**Phương pháp:** đọc $I_0$, $\omega$, $\varphi$ từ biểu thức; $I = I_0/\sqrt 2$; $f = \omega/2\pi$.

**Ví dụ.** Dòng $i = 2\sqrt 2\cos(100\pi t)$ A chạy qua điện trở 10 Ω. Tính cường độ hiệu dụng, tần số và công suất.

**Lời giải.** $I = \dfrac{2\sqrt 2}{\sqrt 2} = 2$ A; $f = \dfrac{100\pi}{2\pi} = 50$ Hz; $P = I^2R = 4\cdot 10 = 40$ W.

## Dạng 5. Máy biến áp

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** tỉ số điện áp bằng tỉ số số vòng; dòng điện tỉ lệ nghịch (máy lí tưởng, công suất hai cuộn bằng nhau).

**Ví dụ.** Máy biến áp có $N_1 = 1000$ vòng, $N_2 = 50$ vòng, $U_1 = 220$ V. Tính $U_2$; nếu $I_2 = 2$ A thì $I_1$ bằng bao nhiêu?

**Lời giải.** $U_2 = 220\cdot\dfrac{50}{1000} = 11$ V; $I_1 = I_2\dfrac{N_2}{N_1} = 2\cdot\dfrac{50}{1000} = 0{,}1$ A.

## Dạng 6. Hao phí khi truyền tải điện

**Kỳ thi hay gặp:** học sinh giỏi, tốt nghiệp (trả lời ngắn).

**Phương pháp:** $I = P/U$; $\Delta P = I^2R$. Tăng $U$ lên $k$ lần thì hao phí giảm $k^2$ lần.

**Ví dụ.** Truyền 100 kW qua dây có điện trở 5 Ω. So sánh hao phí khi truyền ở 10 kV và 1 kV (hệ số công suất bằng 1).

**Lời giải.**

| Điện áp | Cường độ | Hao phí | Tỉ lệ hao phí |
|---|---|---|---|
| 10 kV | 10 A | $10^2\cdot 5 = 500$ W | 0,5% |
| 1 kV | 100 A | $100^2\cdot 5 = 50\,000$ W | 50% |

Điện áp tăng 10 lần thì hao phí giảm 100 lần.

## Câu luyện tập

1. Dây 0,2 m có dòng 5 A, vuông góc với $B = 0{,}1$ T. Tính lực từ.
2. Từ thông qua khung (1 vòng) biến thiên 0,02 Wb trong 0,04 s. Tính $|e|$.
3. Dòng $i = 3\cos(100\pi t)$ A. Tính cường độ hiệu dụng và tần số.
4. Máy biến áp hạ áp từ 220 V xuống 12 V, cuộn sơ cấp 1100 vòng. Tính số vòng cuộn thứ cấp.

<details>
<summary>Xem đáp án</summary>

1. $F = 0{,}1\cdot 5\cdot 0{,}2 = 0{,}1$ N
2. $|e| = 0{,}02/0{,}04 = 0{,}5$ V
3. $I = 3/\sqrt 2 \approx 2{,}12$ A; $f = 50$ Hz
4. $N_2 = 1100\cdot 12/220 = 60$ vòng

</details>

${NOTE_ORIGINAL}
`,
        questions: [
          {
            prompt: r`Dây dài 0,2 m có dòng 5 A, đặt vuông góc với từ trường đều $B = 0{,}1$ T. Lực từ tác dụng lên dây là:`,
            options: ['1 N', '0,01 N', '0,1 N', '10 N'],
            answer: 2,
            explanation: r`$F = BIl = 0{,}1\cdot 5\cdot 0{,}2 = 0{,}1$ N.`,
          },
          {
            prompt: 'Từ thông qua một khung dây (1 vòng) biến thiên 0,02 Wb trong 0,04 s. Độ lớn suất điện động cảm ứng là:',
            options: ['0,5 V', '2 V', '0,0008 V', '0,8 V'],
            answer: 0,
            explanation: r`$|e| = \dfrac{|\Delta\Phi|}{\Delta t} = \dfrac{0{,}02}{0{,}04} = 0{,}5$ V.`,
          },
          {
            prompt: r`Dòng điện $i = 3\cos(100\pi t)$ A có cường độ hiệu dụng và tần số lần lượt là:`,
            options: ['3 A; 100 Hz', '2,12 A; 50 Hz', '4,24 A; 50 Hz', '2,12 A; 100 Hz'],
            answer: 1,
            explanation: r`$I = \dfrac{3}{\sqrt 2} \approx 2{,}12$ A; $f = \dfrac{100\pi}{2\pi} = 50$ Hz.`,
          },
          {
            prompt: 'Máy biến áp lí tưởng hạ áp từ 220 V xuống 12 V, cuộn sơ cấp có 1100 vòng. Số vòng cuộn thứ cấp là:',
            options: ['20 166 vòng', '120 vòng', '600 vòng', '60 vòng'],
            answer: 3,
            explanation: r`$N_2 = N_1\dfrac{U_2}{U_1} = 1100\cdot\dfrac{12}{220} = 60$ vòng.`,
          },
          {
            prompt: 'Khi tăng điện áp truyền tải lên 10 lần (giữ nguyên công suất truyền đi và điện trở dây), công suất hao phí trên đường dây:',
            options: ['giảm 10 lần', 'tăng 10 lần', 'giảm 100 lần', 'không đổi'],
            answer: 2,
            explanation: r`$\Delta P = \dfrac{P^2R}{U^2}$ tỉ lệ nghịch với $U^2$, nên $U$ tăng 10 lần thì $\Delta P$ giảm $10^2 = 100$ lần.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 4. VẬT LÍ HẠT NHÂN
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 12 · Chương 4. Vật lí hạt nhân và phóng xạ',
    description: 'Cấu tạo hạt nhân, năng lượng liên kết, định luật phóng xạ, phản ứng hạt nhân.',
    position: 124,
    lessons: [
      {
        title: 'Vật lí hạt nhân – Kiến thức trọng tâm',
        slug: 'vl12-c4-hat-nhan-kien-thuc',
        summary: 'Cấu tạo hạt nhân, độ hụt khối, năng lượng liên kết, định luật phóng xạ, độ phóng xạ, phản ứng hạt nhân.',
        content: r`
Chương kết thúc chương trình; phần lớn là câu tính nhanh, nên định luật phóng xạ và năng lượng liên kết cần thành thạo.

## 1. Cấu tạo hạt nhân

Hạt nhân $^{A}_{Z}\text{X}$ có $Z$ proton và $N = A - Z$ nơtron. **Đồng vị**: cùng $Z$, khác $A$.

## 2. Độ hụt khối và năng lượng liên kết

$$\Delta m = Z\,m_p + (A - Z)\,m_n - m_X \qquad W_{lk} = \Delta m\,c^2$$

- $1\ \text{u} = 931{,}5\ \text{MeV}/c^2$.
- Năng lượng liên kết riêng $\varepsilon = \dfrac{W_{lk}}{A}$ (MeV/nucleon): **càng lớn thì hạt nhân càng bền**.

## 3. Định luật phóng xạ

$$N = N_0\cdot 2^{-t/T} \qquad m = m_0\cdot 2^{-t/T}$$

- Hằng số phóng xạ $\lambda = \dfrac{\ln 2}{T}$.
- Độ phóng xạ $H = \lambda N = H_0\cdot 2^{-t/T}$ (Bq).
- $t$ và $T$ phải cùng đơn vị thời gian.

## 4. Phản ứng hạt nhân

- Bảo toàn **số khối**, **điện tích**, **động lượng** và **năng lượng toàn phần**.
- **Không** bảo toàn khối lượng nghỉ.
- Năng lượng toả ra: $\Delta E = (m_{\text{trước}} - m_{\text{sau}})\,c^2$.
- Phân hạch và nhiệt hạch đều là phản ứng toả năng lượng.
`,
      },
      {
        title: 'Vật lí hạt nhân – Các dạng bài tập',
        slug: 'vl12-c4-hat-nhan-dang-bai',
        summary: '6 dạng bài: cấu tạo hạt nhân, năng lượng liên kết, phóng xạ, độ phóng xạ, phản ứng hạt nhân, xác định tuổi mẫu vật.',
        content: r`
## Dạng 1. Cấu tạo hạt nhân

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** đọc kí hiệu $^{A}_{Z}\text{X}$ rồi tính $N = A - Z$.

**Ví dụ.** Hạt nhân $^{60}_{27}\text{Co}$ có bao nhiêu proton và nơtron?

**Lời giải.** $Z = 27$ proton; $N = 60 - 27 = 33$ nơtron.

## Dạng 2. Năng lượng liên kết

**Kỳ thi hay gặp:** tốt nghiệp, đánh giá năng lực.

**Phương pháp:** tính $\Delta m$ theo u, nhân với 931,5 MeV/u, chia cho $A$ để ra năng lượng liên kết riêng.

**Ví dụ.** Tính năng lượng liên kết và năng lượng liên kết riêng của $^{4}_{2}\text{He}$, biết $m_p = 1{,}0073$ u, $m_n = 1{,}0087$ u, $m_{He} = 4{,}0015$ u.

**Lời giải.**
$$\Delta m = 2\cdot 1{,}0073 + 2\cdot 1{,}0087 - 4{,}0015 = 0{,}0305\ \text{u}$$
$$W_{lk} = 0{,}0305\cdot 931{,}5 \approx 28{,}4\ \text{MeV} \qquad \varepsilon = \frac{28{,}4}{4} \approx 7{,}10\ \text{MeV/nucleon}$$

## Dạng 3. Định luật phóng xạ

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp (trả lời ngắn), đánh giá năng lực.

**Phương pháp:** tính $t/T$. Nếu $t/T$ nguyên thì chia đôi $t/T$ lần; nếu không nguyên thì dùng máy tính.

**Ví dụ.** Iot-131 có chu kì bán rã 8 ngày. Mẫu 80 g, sau 24 ngày còn lại bao nhiêu?

**Lời giải.** $t/T = 3$ nên $m = 80\cdot 2^{-3} = 10$ g (còn 12,5%).

## Dạng 4. Độ phóng xạ

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** độ phóng xạ giảm theo cùng quy luật với số hạt: $H = H_0\cdot 2^{-t/T}$.

**Ví dụ.** Chất phóng xạ có $T = 5$ ngày, độ phóng xạ ban đầu $8\cdot 10^{6}$ Bq. Tính độ phóng xạ sau 15 ngày.

**Lời giải.** $t/T = 3$ nên $H = \dfrac{8\cdot 10^{6}}{8} = 1\cdot 10^{6}$ Bq.

## Dạng 5. Phản ứng hạt nhân

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** cân bằng tổng số khối và tổng điện tích hai vế để tìm hạt còn thiếu; năng lượng toả ra $\Delta E = (m_{\text{trước}} - m_{\text{sau}})c^2$.

**Ví dụ.** Hoàn thành phản ứng $^{238}_{92}\text{U} \to\, ^{234}_{90}\text{Th} + \text{X}$. X là hạt gì?

**Lời giải.** $A = 238 - 234 = 4$; $Z = 92 - 90 = 2$, nên X là hạt alpha ($^{4}_{2}\text{He}$).

## Dạng 6. Xác định tuổi mẫu vật

**Kỳ thi hay gặp:** học sinh giỏi, tốt nghiệp (trả lời ngắn).

**Phương pháp:** tỉ lệ còn lại cho biết số chu kì bán rã đã trôi qua: còn $\dfrac{1}{2^n}$ thì $t = nT$.

**Ví dụ.** Một mẫu gỗ còn 25% lượng C-14 so với gỗ mới, $T = 5730$ năm. Tính tuổi mẫu.

**Lời giải.** $25\% = \dfrac{1}{4} = 2^{-2}$ nên $t = 2T = 11\,460$ năm.

## Câu luyện tập

1. Hạt nhân $^{235}_{92}\text{U}$ có bao nhiêu proton và nơtron?
2. Chất phóng xạ có $T = 4$ ngày, $m_0 = 32$ g. Sau 12 ngày còn lại bao nhiêu?
3. Hoàn thành phản ứng $^{14}_{7}\text{N} + {}^{4}_{2}\text{He} \to\, ^{17}_{8}\text{O} + \text{X}$.
4. Mẫu gỗ còn 12,5% C-14 so với gỗ mới ($T = 5730$ năm). Tính tuổi mẫu.

<details>
<summary>Xem đáp án</summary>

1. $Z = 92$; $N = 143$
2. $t/T = 3$ nên $m = 4$ g
3. $A = 14 + 4 - 17 = 1$, $Z = 7 + 2 - 8 = 1$: X là proton
4. $12{,}5\% = 2^{-3}$ nên $t = 3T = 17\,190$ năm

</details>

${NOTE_ORIGINAL}
`,
        questions: [
          {
            prompt: r`Hạt nhân $^{235}_{92}\text{U}$ có:`,
            options: ['92 proton và 235 nơtron', '143 proton và 92 nơtron', '92 proton và 143 nơtron', '235 proton và 92 nơtron'],
            answer: 2,
            explanation: r`$Z = 92$ proton; $N = A - Z = 235 - 92 = 143$ nơtron.`,
          },
          {
            prompt: r`Chất phóng xạ có chu kì bán rã $T = 4$ ngày, khối lượng ban đầu 32 g. Sau 12 ngày khối lượng còn lại là:`,
            options: ['8 g', '4 g', '10,7 g', '2 g'],
            answer: 1,
            explanation: r`$t/T = 3$ nên $m = 32\cdot 2^{-3} = 4$ g.`,
          },
          {
            prompt: r`Trong phản ứng $^{14}_{7}\text{N} + {}^{4}_{2}\text{He} \to\, ^{17}_{8}\text{O} + \text{X}$, hạt X là:`,
            options: ['nơtron', 'electron', 'hạt alpha', 'proton'],
            answer: 3,
            explanation: r`Bảo toàn số khối: $A = 14 + 4 - 17 = 1$. Bảo toàn điện tích: $Z = 7 + 2 - 8 = 1$. Vậy X là $^{1}_{1}\text{p}$ (proton).`,
          },
          {
            prompt: 'Một mẫu gỗ còn 12,5% lượng C-14 so với gỗ mới (T = 5730 năm). Tuổi của mẫu gỗ là:',
            options: ['17 190 năm', '11 460 năm', '5730 năm', '22 920 năm'],
            answer: 0,
            explanation: r`$12{,}5\% = \dfrac{1}{8} = 2^{-3}$ nên $t = 3T = 17\,190$ năm.`,
          },
          {
            prompt: 'Hạt nhân càng bền vững khi có:',
            options: ['số khối càng lớn', 'năng lượng liên kết riêng càng lớn', 'năng lượng liên kết càng lớn', 'số proton càng nhỏ'],
            answer: 1,
            explanation: r`Độ bền phụ thuộc **năng lượng liên kết riêng** $W_{lk}/A$, không phải năng lượng liên kết toàn phần.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // ÔN THI: cấu trúc đề, đề luyện tổng hợp, bảng công thức
  // ======================================================================
  {
    level: 'on-thi',
    title: 'Ôn thi Vật lí 12',
    description: 'Cấu trúc các kỳ thi, đề luyện tổng hợp theo dạng đề tốt nghiệp và bảng công thức toàn chương trình.',
    position: 10,
    lessons: [
      {
        title: 'Cấu trúc các kỳ thi môn Vật lí lớp 12',
        slug: 'vl12-cau-truc-ky-thi',
        summary: 'Học kỳ, học sinh giỏi, đánh giá năng lực HSA và tốt nghiệp THPT 2026: hình thức thi và cách tính điểm.',
        content: r`
Tài liệu gom nội dung Vật lí 12 (Chương trình 2018) theo bốn chương: **Vật lí nhiệt**, **Khí lí tưởng**, **Từ trường** (gồm cảm ứng điện từ và dòng điện xoay chiều), **Vật lí hạt nhân và phóng xạ**. Đây là lớp trực tiếp thi tốt nghiệp và đánh giá năng lực, nên bộ đề luyện bám theo ba dạng câu hỏi của đề tốt nghiệp.

## Các kỳ thi

| Kỳ thi | Hình thức | Ghi chú khi ôn |
|---|---|---|
| Học kỳ | Do trường hoặc sở ra đề, thường gồm trắc nghiệm và tự luận | Bám yêu cầu cần đạt trong sách giáo khoa; ưu tiên dạng cơ bản và vận dụng |
| Học sinh giỏi | Thường tự luận, nhiều bước, mở rộng hơn sách giáo khoa | Hay kết hợp nhiều phần (cơ – nhiệt – điện), cần lập luận đầy đủ |
| Đánh giá năng lực (HSA, ĐHQG Hà Nội) | Thi trên máy, 150 điểm, 195 phút; phần khoa học chọn 3 trong 5 môn (Lí, Hoá, Sinh, Sử, Địa); kiến thức chủ yếu lớp 12; có dạng câu hỏi chùm | Đọc đồ thị, xử lí số liệu, lập luận ngắn; làm nhanh |
| Tốt nghiệp THPT 2026 | 28 câu, 50 phút: 18 câu nhiều lựa chọn, 4 câu đúng/sai, 6 câu trả lời ngắn | Nắm vững ba dạng câu hỏi; câu đúng/sai có 4 ý nên phải kiểm tra từng ý |

## Thang điểm đề tốt nghiệp 2026

| Dạng câu | Điểm |
|---|---|
| Nhiều lựa chọn | 0,25 điểm/câu |
| Đúng/sai | Đúng 1 ý: 0,1 · 2 ý: 0,25 · 3 ý: 0,5 · cả 4 ý: 1 điểm |
| Trả lời ngắn | 0,25 điểm/câu |

> Cấu trúc và tỉ lệ mức độ tham khảo theo đề 2025 (Bộ không công bố đề minh hoạ 2026). Khi ôn thi cần theo dõi thông báo mới nhất.

Nguồn: [Thư viện Pháp luật](https://thuvienphapluat.vn/hoi-dap-phap-luat/de-vat-li-thi-tot-nghiep-thpt-2026-bao-nhieu-cau-138084641.html) · [Dạng thức bài thi HSA – ĐHQG Hà Nội](https://idt.vnu.edu.vn/ky-thi-hsa/dang-thuc-bai-thi)
`,
      },
      {
        title: 'Đề luyện tổng hợp Vật lí 12',
        slug: 'vl12-de-luyen-tong-hop',
        summary: 'Đề rút gọn theo cấu trúc tốt nghiệp: 6 câu nhiều lựa chọn, 1 câu đúng/sai, 3 câu trả lời ngắn, 1 câu tự luận HSG.',
        content: r`
Đề rút gọn theo cấu trúc ba dạng câu hỏi của đề tốt nghiệp (đề thật có 28 câu).

- **Phần I** (6 câu nhiều lựa chọn) và **Phần II** (đúng/sai, mỗi ý là một câu) nằm ở phần **Trắc nghiệm** cuối trang. Nộp bài để được chấm điểm ngay.
- **Phần III** (trả lời ngắn) và **Phần IV** (tự luận) làm ra giấy, sau đó mở đáp án để tự chấm.

## Phần III. Trả lời ngắn

7. Mẫu phóng xạ có $T = 6$ giờ, ban đầu 64 g. Sau 18 giờ còn bao nhiêu gam?
8. Dòng $i = 4\cos(100\pi t)$ A. Giá trị hiệu dụng là bao nhiêu ampe (làm tròn đến 0,1)?
9. Truyền 50 kW ở điện áp 5 kV qua dây có điện trở 4 Ω (hệ số công suất bằng 1). Công suất hao phí là bao nhiêu oát?

<details>
<summary>Xem đáp án Phần III</summary>

7. **8 g**: $t/T = 3$ nên $64/8 = 8$ g
8. **2,8 A**: $I = 4/\sqrt 2 \approx 2{,}83$ A
9. **400 W**: $I = 50\,000/5000 = 10$ A; $\Delta P = 10^2\cdot 4 = 400$ W

</details>

## Phần IV. Tự luận (mức học sinh giỏi)

Thanh dẫn MN dài 0,5 m trượt không ma sát trên hai ray ngang nối với điện trở $R = 0{,}5\ \Omega$, đặt trong từ trường đều thẳng đứng $B = 0{,}4$ T. Bỏ qua điện trở của thanh và ray. Thanh được kéo chuyển động đều với $v = 2$ m/s. Tính:

- a) suất điện động cảm ứng;
- b) cường độ dòng điện;
- c) lực kéo cần thiết;
- d) công suất của lực kéo, và so sánh với công suất toả nhiệt trên $R$.

<details>
<summary>Xem lời giải Phần IV</summary>

a) $e = Blv = 0{,}4\cdot 0{,}5\cdot 2 = 0{,}4$ V

b) $I = \dfrac{e}{R} = \dfrac{0{,}4}{0{,}5} = 0{,}8$ A

c) Thanh chuyển động đều nên lực kéo bằng lực từ: $F = BIl = 0{,}4\cdot 0{,}8\cdot 0{,}5 = 0{,}16$ N

d) $P = Fv = 0{,}16\cdot 2 = 0{,}32$ W, bằng công suất toả nhiệt $I^2R = 0{,}64\cdot 0{,}5 = 0{,}32$ W. Công của lực kéo chuyển hoá hoàn toàn thành nhiệt (bảo toàn năng lượng).

</details>

${NOTE_ORIGINAL}
`,
        questions: [
          {
            prompt: r`**Câu 1.** 0,5 kg nước nhận 10 kJ nhiệt ($c = 4180$ J/(kg·K)). Nhiệt độ tăng khoảng:`,
            options: ['2,4 °C', '4,8 °C', '9,6 °C', '20 °C'],
            answer: 1,
            explanation: r`$\Delta t = \dfrac{Q}{mc} = \dfrac{10\,000}{0{,}5\cdot 4180} \approx 4{,}8$ °C.`,
          },
          {
            prompt: '**Câu 2.** Khí ở 1 atm, 6 lít bị nén đẳng nhiệt đến 3 atm. Thể tích sau là:',
            options: ['2 lít', '3 lít', '9 lít', '18 lít'],
            answer: 0,
            explanation: r`$V_2 = \dfrac{p_1V_1}{p_2} = \dfrac{1\cdot 6}{3} = 2$ lít.`,
          },
          {
            prompt: r`**Câu 3.** Máy biến áp lí tưởng có $N_1 = 500$, $N_2 = 100$, $U_1 = 220$ V. $U_2$ bằng:`,
            options: ['44 V', '110 V', '220 V', '1100 V'],
            answer: 0,
            explanation: r`$U_2 = 220\cdot\dfrac{100}{500} = 44$ V.`,
          },
          {
            prompt: '**Câu 4.** Sau 3 chu kì bán rã, tỉ lệ số hạt nhân phóng xạ còn lại là:',
            options: ['1/3', '1/6', '1/8', '1/9'],
            answer: 2,
            explanation: r`$2^{-3} = \dfrac{1}{8}$.`,
          },
          {
            prompt: r`**Câu 5.** Dây dài 0,25 m có dòng 2 A, vuông góc với $B = 0{,}4$ T. Lực từ là:`,
            options: ['0,1 N', '0,2 N', '0,8 N', '2 N'],
            answer: 1,
            explanation: r`$F = BIl = 0{,}4\cdot 2\cdot 0{,}25 = 0{,}2$ N.`,
          },
          {
            prompt: '**Câu 6.** Khi nhiệt độ tuyệt đối của khí lí tưởng tăng gấp đôi thì động năng tịnh tiến trung bình của phân tử:',
            options: ['tăng 2 lần', 'tăng 4 lần', 'tăng √2 lần', 'không đổi'],
            answer: 0,
            explanation: r`$\overline{W}_đ = \dfrac{3}{2}kT$ tỉ lệ thuận với $T$.`,
          },
          {
            prompt: r`**Phần II – ý a.** Hai mol khí lí tưởng ở 300 K trong bình kín thể tích 10 lít ($R = 8{,}31$ J/(mol·K)). Nhận định: *"Áp suất khí xấp xỉ $5\cdot 10^{5}$ Pa."*`,
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`$p = \dfrac{2\cdot 8{,}31\cdot 300}{0{,}01} \approx 4{,}99\cdot 10^{5}$ Pa.`,
          },
          {
            prompt: '**Phần II – ý b.** Cùng lượng khí trên. Nhận định: *"Nếu nung đến 600 K trong bình kín thì áp suất tăng gấp đôi."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: 'Bình kín nên thể tích không đổi, áp suất tỉ lệ thuận với nhiệt độ tuyệt đối: T tăng gấp đôi thì p tăng gấp đôi.',
          },
          {
            prompt: '**Phần II – ý c.** Cùng lượng khí trên. Nhận định: *"Động năng tịnh tiến trung bình của mỗi phân tử phụ thuộc vào số mol khí."*',
            options: ['Đúng', 'Sai'],
            answer: 1,
            explanation: r`$\overline{W}_đ = \dfrac{3}{2}kT$ chỉ phụ thuộc nhiệt độ tuyệt đối.`,
          },
          {
            prompt: '**Phần II – ý d.** Cùng lượng khí trên. Nhận định: *"Đồ thị p–T của quá trình nung đó là đường thẳng kéo dài đi qua gốc toạ độ (T tính bằng K)."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`Quá trình đẳng tích nên $p/T$ không đổi: đồ thị là đường thẳng qua gốc toạ độ.`,
          },
        ],
      },
      {
        title: 'Tổng hợp công thức Vật lí 12',
        slug: 'vl12-tong-hop-cong-thuc',
        summary: 'Bảng công thức 4 chương kèm đơn vị SI và lưu ý dễ sai — dùng để ôn nhanh trước khi thi.',
        content: r`
Mỗi bảng gom công thức của một chương, kèm đơn vị SI và lưu ý dễ sai. **Nhiệt độ trong mọi công thức về khí phải đổi sang kelvin.**

## Chương 1. Vật lí nhiệt

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Thang nhiệt độ | $T\,(\text{K}) = t\,(^\circ\text{C}) + 273$ | $\Delta T = \Delta t$ |
| Nhiệt lượng khi đổi nhiệt độ | $Q = mc\Delta t$ | $c$: J/(kg·K) |
| Nhiệt nóng chảy | $Q = \lambda m$ | $\lambda$: J/kg; nhiệt độ không đổi |
| Nhiệt hoá hơi | $Q = Lm$ | $L$: J/kg; nhiệt độ không đổi |
| Cân bằng nhiệt | $Q_{\text{toả}} = Q_{\text{thu}}$ | dùng độ chênh nhiệt độ dương |
| Định luật I | $\Delta U = A + Q$ | $A, Q > 0$ khi vật nhận |
| Nhiệt lượng từ điện | $Q = Pt$ | bỏ qua hao phí |

## Chương 2. Khí lí tưởng

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Đẳng nhiệt (Boyle) | $p_1V_1 = p_2V_2$ | $T$ không đổi |
| Đẳng áp (Charles) | $V_1/T_1 = V_2/T_2$ | $p$ không đổi |
| Đẳng tích (Gay-Lussac) | $p_1/T_1 = p_2/T_2$ | $V$ không đổi |
| Phương trình trạng thái | $\dfrac{p_1V_1}{T_1} = \dfrac{p_2V_2}{T_2}$ | $T$ tính bằng K |
| Clapeyron | $pV = nRT$ | $R \approx 8{,}31$ J/(mol·K); $p$: Pa; $V$: m³ |
| Số phân tử | $N = nN_A$ | $N_A = 6{,}02\cdot 10^{23}$ mol⁻¹ |
| Động năng tịnh tiến trung bình | $\overline{W}_đ = \tfrac{3}{2}kT$ | $k = 1{,}38\cdot 10^{-23}$ J/K |
| Áp suất theo vi mô | $p = \tfrac{1}{3}\mu m\overline{v^2}$ | $\mu$: mật độ phân tử |

## Chương 3. Từ trường và cảm ứng điện từ

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Lực từ lên dây | $F = BIl\sin\alpha$ | $B$: T; $\alpha$: góc giữa dây và $\vec B$ |
| Từ thông | $\Phi = BS\cos\theta$ | Wb; $\theta$: góc giữa $\vec B$ và pháp tuyến |
| Suất điện động cảm ứng | $\lvert e\rvert = N\dfrac{\lvert\Delta\Phi\rvert}{\Delta t}$ | V; đổi cm² sang m² |
| Thanh cắt từ trường | $e = Blv$ | $B$, $v$, $l$ đôi một vuông góc |
| Lực từ cản thanh | $F = BIl$ | với $I = e/R$ |
| Dòng xoay chiều | $i = I_0\cos(\omega t + \varphi)$ | $\omega = 2\pi f$ |
| Giá trị hiệu dụng | $I = I_0/\sqrt 2$; $U = U_0/\sqrt 2$ | $P = I^2R$ trên điện trở thuần |
| Máy biến áp lí tưởng | $\dfrac{U_1}{U_2} = \dfrac{N_1}{N_2} = \dfrac{I_2}{I_1}$ | bảo toàn công suất |
| Hao phí truyền tải | $\Delta P = \dfrac{P^2R}{U^2}$ | hệ số công suất bằng 1 |

## Chương 4. Hạt nhân và phóng xạ

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Số nơtron | $N = A - Z$ | |
| Độ hụt khối | $\Delta m = Zm_p + (A - Z)m_n - m_X$ | đơn vị u |
| Năng lượng liên kết | $W_{lk} = \Delta m\,c^2$ | $1\ \text{u} = 931{,}5$ MeV/$c^2$ |
| Năng lượng liên kết riêng | $W_{lk}/A$ | MeV/nucleon; càng lớn càng bền |
| Phóng xạ | $N = N_0\cdot 2^{-t/T}$; $m = m_0\cdot 2^{-t/T}$ | $t$ và $T$ cùng đơn vị |
| Hằng số phóng xạ | $\lambda = \ln 2/T$ | |
| Độ phóng xạ | $H = \lambda N = H_0\cdot 2^{-t/T}$ | Bq |
| Phản ứng hạt nhân | bảo toàn $A$, $Z$ | $\Delta E = (m_{\text{trước}} - m_{\text{sau}})c^2$ |
`,
      },
    ],
  },
];
