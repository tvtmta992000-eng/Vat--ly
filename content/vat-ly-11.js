// Vật lí 11 – Bài giảng và hệ thống bài tập (tài liệu của giáo viên, soạn theo Chương trình 2018).
// Nhập lên website: npm run import -- content/vat-ly-11.js
const r = String.raw;

const NOTE = r`> **Lưu ý.** Ví dụ và câu luyện là bài soạn mới, mô phỏng dạng bài thường gặp, không sao chép đề thi thật.`;

module.exports = [
  // ======================================================================
  // CHƯƠNG 1. DAO ĐỘNG
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 11 · Chương 1. Dao động',
    description: 'Dao động điều hoà, con lắc lò xo, con lắc đơn, năng lượng, dao động tắt dần, cưỡng bức và cộng hưởng.',
    position: 111,
    lessons: [
      {
        title: 'Dao động – Kiến thức trọng tâm',
        slug: 'vl11-c1-dao-dong-kien-thuc',
        summary: 'Phương trình dao động điều hoà, liên hệ x – v – a, con lắc lò xo, con lắc đơn, cơ năng, cộng hưởng.',
        simulation: 'pendulum',
        content: r`
Dao động điều hoà là trọng tâm của chương: phương trình, mối liên hệ giữa $x$, $v$, $a$ và năng lượng. Phần này là nền cho chương Sóng ngay sau đó.

## 1. Phương trình dao động điều hoà

$$x = A\cos(\omega t + \varphi) \qquad \omega = \frac{2\pi}{T} = 2\pi f$$

- $A$: biên độ; $\omega$: tần số góc (rad/s); $\varphi$: pha ban đầu.

## 2. Vận tốc và gia tốc

$$v = -\omega A\sin(\omega t + \varphi) \qquad a = -\omega^2 x$$

- $v_{max} = \omega A$ (tại vị trí cân bằng); $a_{max} = \omega^2 A$ (tại biên).
- Hệ thức độc lập với thời gian: $A^2 = x^2 + \dfrac{v^2}{\omega^2}$.

## 3. Con lắc lò xo và con lắc đơn

| Con lắc | Tần số góc | Chu kì |
|---|---|---|
| Lò xo | $\omega = \sqrt{\dfrac{k}{m}}$ | $T = 2\pi\sqrt{\dfrac{m}{k}}$ |
| Đơn (góc nhỏ) | $\omega = \sqrt{\dfrac{g}{l}}$ | $T = 2\pi\sqrt{\dfrac{l}{g}}$ |

## 4. Năng lượng

$$W = \frac{1}{2}kA^2 = \frac{1}{2}m\omega^2A^2$$

Cơ năng bảo toàn khi không có ma sát; động năng và thế năng biến thiên tuần hoàn với chu kì $T/2$.

## 5. Dao động tắt dần, cưỡng bức, cộng hưởng

- **Tắt dần:** biên độ giảm dần do lực cản.
- **Cưỡng bức:** dao động dưới tác dụng của ngoại lực tuần hoàn, tần số bằng tần số ngoại lực.
- **Cộng hưởng:** biên độ dao động cưỡng bức đạt cực đại khi tần số ngoại lực bằng tần số riêng của hệ.

> Thử mô phỏng **Dao động cưỡng bức và cộng hưởng** trong mục Mô phỏng để thấy biên độ tăng vọt khi $f \approx f_0$.
`,
      },
      {
        title: 'Dao động – Các dạng bài tập',
        slug: 'vl11-c1-dao-dong-dang-bai',
        summary: '6 dạng bài: viết phương trình, quan hệ x – v – a, con lắc lò xo và năng lượng, đo g, thời gian giữa hai vị trí, cộng hưởng.',
        simulation: 'resonance',
        content: r`
## Dạng 1. Viết phương trình dao động

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** tìm $A$, $\omega$, rồi lấy $\varphi$ từ điều kiện ban đầu $x(0)$ và dấu của $v(0)$.

**Ví dụ.** Vật dao động điều hoà biên độ 10 cm, chu kì 2 s; tại $t = 0$ vật qua vị trí cân bằng theo chiều dương. Viết phương trình.

**Lời giải.** $\omega = \pi$ rad/s. $x(0) = 0$ nên $\cos\varphi = 0$, $\varphi = \pm\dfrac{\pi}{2}$. $v(0) > 0$ nên $\sin\varphi < 0$, tức $\varphi = -\dfrac{\pi}{2}$.
$$x = 10\cos\left(\pi t - \frac{\pi}{2}\right)\ \text{cm}$$

## Dạng 2. Quan hệ giữa x, v, a

**Kỳ thi hay gặp:** học kỳ, đánh giá năng lực.

**Phương pháp:** dùng $A^2 = x^2 + v^2/\omega^2$ để tìm $v$ tại vị trí cho trước; $a = -\omega^2x$.

**Ví dụ.** Vật có $A = 10$ cm, $T = 1$ s. Tại $x = 6$ cm, tính độ lớn vận tốc và gia tốc.

**Lời giải.** $\omega = 2\pi$ rad/s. $|v| = \omega\sqrt{A^2 - x^2} = 2\pi\cdot 8 = 16\pi \approx 50{,}3$ cm/s; $|a| = \omega^2x = 4\pi^2\cdot 6 \approx 237$ cm/s².

## Dạng 3. Con lắc lò xo và năng lượng

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp (đúng/sai), đánh giá năng lực.

**Phương pháp:** tính $\omega$ từ $k$ và $m$, rồi chu kì, cơ năng và vận tốc cực đại.

**Ví dụ.** Con lắc lò xo $m = 0{,}4$ kg, $k = 100$ N/m, biên độ 5 cm. Tính chu kì, cơ năng và vận tốc cực đại.

**Lời giải.** $T = 2\pi\sqrt{0{,}4/100} \approx 0{,}40$ s; $W = \tfrac{1}{2}\cdot 100\cdot 0{,}05^2 = 0{,}125$ J; $\omega = \sqrt{250} \approx 15{,}8$ rad/s nên $v_{max} = \omega A \approx 0{,}79$ m/s.

## Dạng 4. Thực hành đo g bằng con lắc đơn

**Kỳ thi hay gặp:** học sinh giỏi, học kỳ (câu thực hành).

**Phương pháp:** đo thời gian nhiều dao động để giảm sai số, suy ra $T$ rồi $g = \dfrac{4\pi^2 l}{T^2}$.

**Ví dụ.** Con lắc đơn dài 1,00 m thực hiện 20 dao động hết 40,2 s. Tính $g$.

**Lời giải.** $T = 40{,}2/20 = 2{,}01$ s; $g = \dfrac{4\pi^2\cdot 1{,}00}{2{,}01^2} \approx \dfrac{39{,}48}{4{,}04} \approx 9{,}77$ m/s².

## Dạng 5. Thời gian đi giữa hai vị trí

**Kỳ thi hay gặp:** học sinh giỏi, đánh giá năng lực.

**Phương pháp:** dùng vòng tròn lượng giác; góc quét $\Delta\varphi$ cho thời gian $\Delta t = \Delta\varphi/\omega$.

**Ví dụ.** Chu kì $T = 1{,}2$ s. Tính thời gian ngắn nhất để vật đi từ vị trí cân bằng đến $x = A/2$.

**Lời giải.** Góc quét $\arcsin\tfrac{1}{2} = \tfrac{\pi}{6}$, ứng với $\tfrac{T}{12}$: $\Delta t = 1{,}2/12 = 0{,}1$ s.

## Dạng 6. Cộng hưởng

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** cộng hưởng xảy ra khi chu kì cưỡng bức bằng chu kì riêng.

**Ví dụ.** Xe qua các gờ giảm tốc cách nhau 6 m, chu kì dao động riêng của xe là 0,5 s. Tốc độ nào gây dao động mạnh nhất?

**Lời giải.** Thời gian giữa hai gờ phải bằng 0,5 s nên $v = 6/0{,}5 = 12$ m/s $= 43{,}2$ km/h.

## Câu luyện tập

1. Vật có $x = 4\cos(2\pi t + \pi/3)$ cm. Xác định $A$, $T$, $f$, pha ban đầu và $x(0)$.
2. Vật có $A = 8$ cm, $\omega = 5$ rad/s. Tính $v_{max}$ và $a_{max}$.
3. Con lắc lò xo $k = 50$ N/m, $m = 0{,}2$ kg. Tính chu kì.
4. Con lắc đơn dài 0,25 m tại nơi $g = 9{,}8$ m/s². Tính chu kì.

<details>
<summary>Xem đáp án</summary>

1. $A = 4$ cm; $T = 1$ s; $f = 1$ Hz; $\varphi = \pi/3$; $x(0) = 4\cos(\pi/3) = 2$ cm
2. $v_{max} = 40$ cm/s; $a_{max} = 200$ cm/s²
3. $T = 2\pi\sqrt{0{,}2/50} \approx 0{,}40$ s
4. $T = 2\pi\sqrt{0{,}25/9{,}8} \approx 1{,}0$ s

</details>

${NOTE}
`,
        questions: [
          {
            prompt: r`Vật dao động theo phương trình $x = 4\cos(2\pi t + \pi/3)$ cm. Li độ tại $t = 0$ là:`,
            options: ['4 cm', '2 cm', '3,46 cm', '0 cm'],
            answer: 1,
            explanation: r`$x(0) = 4\cos\dfrac{\pi}{3} = 4\cdot 0{,}5 = 2$ cm.`,
          },
          {
            prompt: r`Vật dao động điều hoà có $A = 8$ cm, $\omega = 5$ rad/s. Gia tốc cực đại là:`,
            options: ['40 cm/s²', '1,6 cm/s²', '200 cm/s²', '320 cm/s²'],
            answer: 2,
            explanation: r`$a_{max} = \omega^2A = 25\cdot 8 = 200$ cm/s². (40 cm/s là $v_{max}$.)`,
          },
          {
            prompt: 'Con lắc lò xo có k = 50 N/m, m = 0,2 kg. Chu kì dao động là:',
            options: ['0,40 s', '2,5 s', '0,063 s', '15,8 s'],
            answer: 0,
            explanation: r`$T = 2\pi\sqrt{\dfrac{m}{k}} = 2\pi\sqrt{0{,}004} \approx 0{,}40$ s.`,
          },
          {
            prompt: r`Con lắc đơn dài 0,25 m tại nơi $g = 9{,}8$ m/s². Chu kì dao động nhỏ xấp xỉ:`,
            options: ['0,5 s', '6,2 s', '2 s', '1,0 s'],
            answer: 3,
            explanation: r`$T = 2\pi\sqrt{\dfrac{0{,}25}{9{,}8}} \approx 2\pi\cdot 0{,}16 \approx 1{,}0$ s.`,
          },
          {
            prompt: 'Một vật dao động cưỡng bức. Biên độ dao động lớn nhất khi:',
            options: ['ngoại lực có độ lớn lớn nhất', 'tần số ngoại lực bằng tần số riêng của hệ', 'lực cản của môi trường lớn nhất', 'tần số ngoại lực rất lớn'],
            answer: 1,
            explanation: 'Đó là hiện tượng cộng hưởng. Lực cản càng nhỏ thì đỉnh cộng hưởng càng cao và nhọn.',
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 2. SÓNG
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 11 · Chương 2. Sóng',
    description: 'Sóng cơ, bước sóng, độ lệch pha, giao thoa, sóng dừng, sóng điện từ.',
    position: 112,
    lessons: [
      {
        title: 'Sóng – Kiến thức trọng tâm',
        slug: 'vl11-c2-song-kien-thuc',
        summary: 'Sóng ngang, sóng dọc, bước sóng, độ lệch pha, điều kiện giao thoa, sóng dừng và sóng điện từ.',
        simulation: 'interference',
        content: r`
Chương này nối dao động với sự truyền năng lượng; hai chủ đề thi nhiều nhất là **giao thoa** và **sóng dừng**.

## 1. Sóng cơ

- Sóng cơ truyền năng lượng và pha dao động, **không truyền vật chất**.
- **Sóng ngang:** phương dao động vuông góc với phương truyền. **Sóng dọc:** phương dao động trùng phương truyền (sóng âm trong không khí là sóng dọc).

## 2. Bước sóng và độ lệch pha

$$\lambda = vT = \frac{v}{f} \qquad \Delta\varphi = \frac{2\pi d}{\lambda}$$

Phương trình sóng truyền theo chiều dương trục $Ox$: $u = A\cos\left(\omega t - \dfrac{2\pi x}{\lambda}\right)$.

## 3. Giao thoa hai nguồn cùng pha

| Điểm | Điều kiện |
|---|---|
| Cực đại | $d_2 - d_1 = k\lambda$ |
| Cực tiểu | $d_2 - d_1 = \left(k + \tfrac{1}{2}\right)\lambda$ |

Trên đoạn nối hai nguồn $AB$: số cực đại là số $k$ nguyên thoả $|k| < \dfrac{AB}{\lambda}$; số cực tiểu là số $k$ nguyên thoả $-\dfrac{AB}{\lambda} - \dfrac{1}{2} < k < \dfrac{AB}{\lambda} - \dfrac{1}{2}$.

## 4. Sóng dừng trên dây hai đầu cố định

$$l = n\frac{\lambda}{2}$$

$n$ là số bụng sóng. Tần số cơ bản $f_1 = \dfrac{v}{2l}$, các hoạ âm $f_n = nf_1$.

## 5. Sóng điện từ

Truyền được trong chân không với tốc độ $c = 3\cdot 10^{8}$ m/s; là **sóng ngang**; $\lambda = \dfrac{c}{f}$.
`,
      },
      {
        title: 'Sóng – Các dạng bài tập',
        slug: 'vl11-c2-song-dang-bai',
        summary: '5 dạng bài: đại lượng của sóng, đọc phương trình sóng, đếm cực đại cực tiểu, sóng dừng, sóng điện từ.',
        content: r`
## Dạng 1. Các đại lượng của sóng

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** tính $\lambda$ từ $v$ và $f$, rồi độ lệch pha giữa hai điểm.

**Ví dụ.** Sóng có $f = 50$ Hz, $v = 20$ m/s. Tính $\lambda$ và độ lệch pha của hai điểm cách nhau 0,1 m trên phương truyền.

**Lời giải.** $\lambda = 20/50 = 0{,}4$ m; $\Delta\varphi = \dfrac{2\pi\cdot 0{,}1}{0{,}4} = \dfrac{\pi}{2}$ rad.

## Dạng 2. Đọc phương trình sóng

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp (trả lời ngắn), đánh giá năng lực.

**Phương pháp:** so sánh với $u = A\cos(\omega t - 2\pi x/\lambda)$ để suy ra $f$, $\lambda$, $v$.

**Ví dụ.** Sóng có $u = 4\cos(20\pi t - \pi x)$ cm ($x$ tính bằng m, $t$ bằng s). Tính $f$, $\lambda$ và $v$.

**Lời giải.** $\omega = 20\pi$ nên $f = 10$ Hz; $\dfrac{2\pi}{\lambda} = \pi$ nên $\lambda = 2$ m; $v = \lambda f = 20$ m/s.

## Dạng 3. Đếm cực đại, cực tiểu giao thoa

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi.

**Phương pháp:** trên đoạn $AB$ nối hai nguồn cùng pha, đếm số $k$ nguyên thoả điều kiện cực đại $|k| < AB/\lambda$ và cực tiểu $-AB/\lambda - \tfrac{1}{2} < k < AB/\lambda - \tfrac{1}{2}$.

**Ví dụ.** Hai nguồn cùng pha cách nhau 10 cm, $\lambda = 2$ cm. Đếm số cực đại và cực tiểu trên đoạn nối hai nguồn.

**Lời giải.** $AB/\lambda = 5$. Cực đại: $|k| < 5$ nên $k = -4 \dots 4$: **9 cực đại**. Cực tiểu: $-5{,}5 < k < 4{,}5$ nên $k = -5 \dots 4$: **10 cực tiểu**.

> Kiểm chứng bằng mô phỏng **Giao thoa sóng trên mặt nước**: chọn $f = 20$ Hz, $S_1S_2 = 10$ cm (khi đó $\lambda = 2$ cm).

## Dạng 4. Sóng dừng trên dây

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi, đánh giá năng lực.

**Phương pháp:** dây hai đầu cố định: $l = n\lambda/2$, tần số cơ bản $f_1 = v/(2l)$, hoạ âm $f_n = nf_1$.

**Ví dụ.** Dây dài 0,6 m hai đầu cố định, $f = 100$ Hz, có 3 bụng. Tính tốc độ truyền sóng.

**Lời giải.** $l = \dfrac{3\lambda}{2}$ nên $\lambda = 0{,}4$ m; $v = \lambda f = 40$ m/s. Tần số cơ bản $40/1{,}2 \approx 33{,}3$ Hz, đúng bằng $f/3$.

## Dạng 5. Sóng điện từ

**Kỳ thi hay gặp:** tốt nghiệp, đánh giá năng lực.

**Phương pháp:** dùng $\lambda = c/f$; nhớ sóng điện từ là sóng ngang.

**Ví dụ.** Đài phát sóng tần số 100 MHz. Tính bước sóng.

**Lời giải.** $\lambda = \dfrac{3\cdot 10^{8}}{10^{8}} = 3$ m.

## Câu luyện tập

1. Sóng âm có $v = 340$ m/s, $f = 170$ Hz. Tính bước sóng.
2. Hai nguồn cùng pha cách nhau 8 cm, $\lambda = 1{,}6$ cm. Có bao nhiêu cực đại trên đoạn nối hai nguồn?
3. Dây dài 1,2 m hai đầu cố định có sóng dừng với $\lambda = 0{,}8$ m. Có bao nhiêu bụng?
4. Sóng điện từ có bước sóng 30 m. Tính tần số.

<details>
<summary>Xem đáp án</summary>

1. $\lambda = 2$ m
2. $AB/\lambda = 5$ nên $k = -4 \dots 4$: 9 cực đại
3. $n = 2l/\lambda = 3$ bụng
4. $f = 3\cdot 10^{8}/30 = 10^{7}$ Hz $= 10$ MHz

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Sóng âm có tốc độ 340 m/s, tần số 170 Hz. Bước sóng là:',
            options: ['0,5 m', '2 m', '57 800 m', '1 m'],
            answer: 1,
            explanation: r`$\lambda = \dfrac{v}{f} = \dfrac{340}{170} = 2$ m.`,
          },
          {
            prompt: r`Hai nguồn cùng pha cách nhau 8 cm, bước sóng 1,6 cm. Số cực đại trên đoạn nối hai nguồn là:`,
            options: ['5', '10', '9', '11'],
            answer: 2,
            explanation: r`$AB/\lambda = 5$; các $k$ nguyên thoả $|k| < 5$ là $-4 \dots 4$: 9 cực đại.`,
          },
          {
            prompt: r`Dây dài 1,2 m hai đầu cố định có sóng dừng với $\lambda = 0{,}8$ m. Số bụng sóng là:`,
            options: ['3', '2', '1,5', '6'],
            answer: 0,
            explanation: r`$l = n\dfrac{\lambda}{2} \Rightarrow n = \dfrac{2l}{\lambda} = \dfrac{2{,}4}{0{,}8} = 3$.`,
          },
          {
            prompt: 'Sóng điện từ có bước sóng 30 m. Tần số của sóng là:',
            options: ['9 GHz', '100 MHz', '1 MHz', '10 MHz'],
            answer: 3,
            explanation: r`$f = \dfrac{c}{\lambda} = \dfrac{3\cdot 10^{8}}{30} = 10^{7}$ Hz $= 10$ MHz.`,
          },
          {
            prompt: r`Sóng có phương trình $u = 4\cos(20\pi t - \pi x)$ cm ($x$: m, $t$: s). Tốc độ truyền sóng là:`,
            options: ['20 m/s', '10 m/s', '2 m/s', '40 m/s'],
            answer: 0,
            explanation: r`$f = 10$ Hz, $\lambda = 2$ m nên $v = \lambda f = 20$ m/s.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 3. TRƯỜNG ĐIỆN
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 11 · Chương 3. Trường điện',
    description: 'Lực Coulomb, điện trường, điện thế, chuyển động của hạt mang điện, tụ điện.',
    position: 113,
    lessons: [
      {
        title: 'Trường điện – Kiến thức trọng tâm',
        slug: 'vl11-c3-truong-dien-kien-thuc',
        summary: 'Định luật Coulomb, cường độ điện trường, điện trường đều, công của lực điện, tụ điện và cách ghép tụ.',
        content: r`
Chương mở đầu phần điện học: lực Coulomb, điện trường, điện thế và tụ điện.

## 1. Định luật Coulomb

$$F = k\frac{|q_1q_2|}{\varepsilon r^2} \qquad k = 9\cdot 10^{9}\ \text{N·m}^2/\text{C}^2$$

Hai điện tích cùng dấu thì đẩy nhau, trái dấu thì hút nhau. Đổi điện tích ra coulomb ($1\ \mu\text{C} = 10^{-6}$ C, $1$ nC $= 10^{-9}$ C), khoảng cách ra mét.

## 2. Điện trường

- Cường độ điện trường: $E = \dfrac{F}{q}$ (V/m).
- Do điện tích điểm $Q$: $E = k\dfrac{|Q|}{\varepsilon r^2}$; vectơ $\vec E$ hướng **ra xa** điện tích dương, hướng **vào** điện tích âm.
- Điện trường tổng hợp: cộng vectơ $\vec E = \vec E_1 + \vec E_2 + \dots$

## 3. Điện trường đều và công của lực điện

$$U = Ed \qquad A = qEd = qU$$

$d$ là khoảng cách dọc theo đường sức.

## 4. Tụ điện

$$C = \frac{Q}{U} \qquad W = \frac{1}{2}CU^2 = \frac{1}{2}QU$$

| Cách ghép | Điện dung tương đương | Đặc điểm |
|---|---|---|
| Song song | $C = C_1 + C_2$ | $U$ chung, $Q$ cộng lại |
| Nối tiếp | $\dfrac{1}{C} = \dfrac{1}{C_1} + \dfrac{1}{C_2}$ | $Q$ chung, $U$ cộng lại |
`,
      },
      {
        title: 'Trường điện – Các dạng bài tập',
        slug: 'vl11-c3-truong-dien-dang-bai',
        summary: '5 dạng bài: lực Coulomb, điện trường tổng hợp, hạt chuyển động trong điện trường đều, tụ điện, quả cầu cân bằng.',
        content: r`
## Dạng 1. Lực Coulomb

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** đổi điện tích ra coulomb và khoảng cách ra mét; dấu của $q$ chỉ dùng để xác định hút hay đẩy.

**Ví dụ.** Hai điện tích $2\ \mu$C và $-3\ \mu$C cách nhau 3 cm trong chân không. Tính độ lớn lực tương tác.

**Lời giải.**
$$F = \frac{9\cdot 10^{9}\cdot 2\cdot 10^{-6}\cdot 3\cdot 10^{-6}}{0{,}03^2} = \frac{0{,}054}{9\cdot 10^{-4}} = 60\ \text{N}$$
Là lực hút vì hai điện tích trái dấu.

## Dạng 2. Cường độ điện trường tổng hợp

**Kỳ thi hay gặp:** học kỳ, học sinh giỏi.

**Phương pháp:** vẽ vectơ $\vec E$ do từng điện tích gây ra tại điểm cần xét, rồi cộng vectơ.

**Ví dụ.** Điện tích $+4$ nC và $-4$ nC đặt cách nhau 0,6 m. Tính $E$ tại trung điểm của đoạn nối.

**Lời giải.** Mỗi điện tích cách trung điểm 0,3 m nên $E_1 = E_2 = \dfrac{9\cdot 10^{9}\cdot 4\cdot 10^{-9}}{0{,}09} = 400$ V/m. Hai vectơ cùng hướng (từ $+q$ về $-q$) nên $E = 800$ V/m.

## Dạng 3. Chuyển động của hạt trong điện trường đều

**Kỳ thi hay gặp:** học sinh giỏi, đánh giá năng lực.

**Phương pháp:** dùng định lí động năng với công của lực điện $A = qU$, hoặc định luật II Newton với $a = qE/m$.

**Ví dụ.** Electron bắt đầu chuyển động từ nghỉ trong điện trường đều $E = 1000$ V/m, đi được 1 cm. Tính vận tốc ($e = 1{,}6\cdot 10^{-19}$ C, $m = 9{,}1\cdot 10^{-31}$ kg).

**Lời giải.** $U = Ed = 10$ V. $eU = \tfrac{1}{2}mv^2$ nên
$$v = \sqrt{\frac{2\cdot 1{,}6\cdot 10^{-19}\cdot 10}{9{,}1\cdot 10^{-31}}} \approx 1{,}9\cdot 10^{6}\ \text{m/s}$$

## Dạng 4. Tụ điện

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** ghép song song thì $U$ chung, $Q$ cộng lại; ghép nối tiếp thì $Q$ chung, $U$ cộng lại.

**Ví dụ.** Tụ 2 μF nối vào hiệu điện thế 12 V. Tính điện tích và năng lượng. Nếu ghép nối tiếp với tụ 3 μF thì điện dung tương đương bao nhiêu?

**Lời giải.** $Q = CU = 24\ \mu$C; $W = \tfrac{1}{2}\cdot 2\cdot 10^{-6}\cdot 12^2 = 1{,}44\cdot 10^{-4}$ J. Nối tiếp: $C = \dfrac{2\cdot 3}{2 + 3} = 1{,}2\ \mu$F.

## Dạng 5. Quả cầu tích điện cân bằng trong điện trường

**Kỳ thi hay gặp:** học sinh giỏi, học kỳ (câu vận dụng).

**Phương pháp:** cân bằng dưới tác dụng của trọng lực, lực điện, lực căng: $\tan\alpha = \dfrac{qE}{mg}$ khi điện trường nằm ngang.

**Ví dụ.** Quả cầu 1 g mang điện 2 μC treo bằng dây trong điện trường ngang $E = 5000$ V/m, $g = 10$ m/s². Tính góc lệch của dây.

**Lời giải.** $qE = 2\cdot 10^{-6}\cdot 5000 = 0{,}01$ N; $mg = 10^{-3}\cdot 10 = 0{,}01$ N. $\tan\alpha = 1$ nên $\alpha = 45^\circ$.

## Câu luyện tập

1. Hai điện tích 1 μC cách nhau 3 cm trong chân không. Tính lực đẩy.
2. Tính $E$ tại điểm cách điện tích 2 nC một khoảng 0,3 m.
3. Hai bản kim loại cách nhau 2 cm, hiệu điện thế 100 V. Tính $E$ và lực lên điện tích 2 μC ở giữa hai bản.
4. Tụ 5 μF tích điện ở 20 V. Tính $Q$ và $W$.

<details>
<summary>Xem đáp án</summary>

1. $F = \dfrac{9\cdot 10^{9}\cdot 10^{-12}}{9\cdot 10^{-4}} = 10$ N
2. $E = \dfrac{9\cdot 10^{9}\cdot 2\cdot 10^{-9}}{0{,}09} = 200$ V/m
3. $E = 100/0{,}02 = 5000$ V/m; $F = 2\cdot 10^{-6}\cdot 5000 = 0{,}01$ N
4. $Q = 100\ \mu$C; $W = \tfrac{1}{2}\cdot 5\cdot 10^{-6}\cdot 20^2 = 1$ mJ

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Hai điện tích điểm 1 μC đặt cách nhau 3 cm trong chân không. Lực đẩy giữa chúng là:',
            options: ['0,1 N', '10 N', '3 N', '1000 N'],
            answer: 1,
            explanation: r`$F = \dfrac{9\cdot 10^{9}\cdot(10^{-6})^2}{(0{,}03)^2} = \dfrac{9\cdot 10^{-3}}{9\cdot 10^{-4}} = 10$ N.`,
          },
          {
            prompt: 'Cường độ điện trường tại điểm cách điện tích 2 nC một khoảng 0,3 m là:',
            options: ['60 V/m', '600 V/m', '200 V/m', '20 V/m'],
            answer: 2,
            explanation: r`$E = \dfrac{9\cdot 10^{9}\cdot 2\cdot 10^{-9}}{0{,}3^2} = \dfrac{18}{0{,}09} = 200$ V/m.`,
          },
          {
            prompt: 'Hai bản kim loại song song cách nhau 2 cm, hiệu điện thế 100 V. Cường độ điện trường giữa hai bản là:',
            options: ['5000 V/m', '50 V/m', '2 V/m', '200 V/m'],
            answer: 0,
            explanation: r`$E = \dfrac{U}{d} = \dfrac{100}{0{,}02} = 5000$ V/m. Đáp án 50 V/m là do quên đổi cm sang m.`,
          },
          {
            prompt: 'Tụ điện 5 μF được tích điện ở hiệu điện thế 20 V. Năng lượng của tụ là:',
            options: ['100 J', '1 J', '50 μJ', '1 mJ'],
            answer: 3,
            explanation: r`$W = \tfrac{1}{2}CU^2 = \tfrac{1}{2}\cdot 5\cdot 10^{-6}\cdot 400 = 10^{-3}$ J $= 1$ mJ.`,
          },
          {
            prompt: 'Khi tăng khoảng cách giữa hai điện tích điểm lên gấp ba thì lực tương tác giữa chúng:',
            options: ['giảm 3 lần', 'giảm 9 lần', 'tăng 3 lần', 'tăng 9 lần'],
            answer: 1,
            explanation: r`$F \sim \dfrac{1}{r^2}$ nên $r$ tăng 3 lần thì $F$ giảm $3^2 = 9$ lần.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // CHƯƠNG 4. DÒNG ĐIỆN, MẠCH ĐIỆN
  // ======================================================================
  {
    level: 'thpt',
    title: 'Vật lí 11 · Chương 4. Dòng điện, mạch điện',
    description: 'Cường độ dòng điện, điện trở, định luật Ohm, mạch hỗn hợp, nguồn điện, công suất.',
    position: 114,
    lessons: [
      {
        title: 'Dòng điện, mạch điện – Kiến thức trọng tâm',
        slug: 'vl11-c4-mach-dien-kien-thuc',
        summary: 'Cường độ dòng điện, điện trở dây dẫn, định luật Ohm, ghép điện trở, định luật Ohm toàn mạch, công suất và hiệu suất.',
        simulation: 'circuit',
        content: r`
Chương có nhiều bài tính toán nhất ở lớp 11; dạng toàn mạch và công suất cực đại thường xuất hiện ở đề học sinh giỏi.

## 1. Cường độ dòng điện và điện trở

$$I = \frac{\Delta q}{\Delta t} \qquad R = \rho\frac{l}{S} \qquad I = \frac{U}{R}$$

Đổi tiết diện: $1\ \text{mm}^2 = 10^{-6}\ \text{m}^2$.

## 2. Ghép điện trở

| Cách ghép | Điện trở tương đương | Đặc điểm |
|---|---|---|
| Nối tiếp | $R = R_1 + R_2 + \dots$ | $I$ chung, $U$ cộng lại |
| Song song | $\dfrac{1}{R} = \dfrac{1}{R_1} + \dfrac{1}{R_2} + \dots$ | $U$ chung, $I$ cộng lại |

## 3. Định luật Ohm cho toàn mạch

Nguồn có suất điện động $\xi$ và điện trở trong $r$:

$$I = \frac{\xi}{R + r} \qquad U = \xi - Ir$$

## 4. Công suất, điện năng, hiệu suất

$$P = UI = I^2R \qquad A = UIt \qquad H = \frac{U}{\xi}$$

- $1\ \text{kWh} = 3{,}6\cdot 10^{6}$ J.
- Công suất trên biến trở $R$ cực đại khi $R = r$: $P_{max} = \dfrac{\xi^2}{4r}$.
- Đèn ghi ($U_{đm}$; $P_{đm}$): $I_{đm} = \dfrac{P}{U}$, $R_đ = \dfrac{U^2}{P}$; đèn sáng bình thường khi $I = I_{đm}$.
`,
      },
      {
        title: 'Dòng điện, mạch điện – Các dạng bài tập',
        slug: 'vl11-c4-mach-dien-dang-bai',
        summary: '5 dạng bài: điện trở dây dẫn, mạch hỗn hợp, định luật Ohm toàn mạch, công suất cực đại, đèn và điện trở phụ.',
        content: r`
## Dạng 1. Điện trở của dây dẫn

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp.

**Phương pháp:** đổi tiết diện sang m² trước khi dùng $R = \rho l/S$.

**Ví dụ.** Dây đồng $\rho = 1{,}7\cdot 10^{-8}\ \Omega$·m, dài 100 m, tiết diện 1 mm². Tính điện trở.

**Lời giải.** $R = \dfrac{1{,}7\cdot 10^{-8}\cdot 100}{10^{-6}} = 1{,}7\ \Omega$.

## Dạng 2. Mạch hỗn hợp

**Kỳ thi hay gặp:** học kỳ, đánh giá năng lực.

**Phương pháp:** rút gọn từ trong ra ngoài để tìm $R$ tương đương, tính $I$ tổng rồi chia ngược lại cho từng nhánh.

**Ví dụ.** $R_1 = 6\ \Omega$ nối tiếp với cụm ($R_2 = 3\ \Omega$ song song $R_3 = 6\ \Omega$), đặt vào $U = 24$ V. Tính dòng qua mỗi điện trở.

**Lời giải.** $R_{23} = \dfrac{3\cdot 6}{3 + 6} = 2\ \Omega$ nên $R = 8\ \Omega$, $I_1 = 24/8 = 3$ A. $U_{23} = 3\cdot 2 = 6$ V nên $I_2 = 2$ A, $I_3 = 1$ A.

## Dạng 3. Định luật Ohm toàn mạch

**Kỳ thi hay gặp:** học kỳ, tốt nghiệp, đánh giá năng lực.

**Phương pháp:** tính $I = \xi/(R + r)$, sau đó $U$, công suất và hiệu suất.

**Ví dụ.** Nguồn $\xi = 12$ V, $r = 1\ \Omega$ nối với $R = 5\ \Omega$. Tính $I$, $U$ hai cực, công suất trên $R$ và hiệu suất nguồn.

**Lời giải.** $I = 12/6 = 2$ A; $U = 12 - 2\cdot 1 = 10$ V; $P_R = 2^2\cdot 5 = 20$ W; $H = 10/12 \approx 83\%$.

## Dạng 4. Công suất cực đại trên biến trở

**Kỳ thi hay gặp:** học sinh giỏi, đánh giá năng lực.

**Phương pháp:** $P = \dfrac{\xi^2R}{(R + r)^2}$ đạt cực đại khi $R = r$ (bất đẳng thức Cô-si cho mẫu số $R + \dfrac{r^2}{R}$).

**Ví dụ.** Nguồn $\xi = 12$ V, $r = 2\ \Omega$ nối với biến trở $R$. Tìm $R$ để công suất trên $R$ cực đại và giá trị cực đại đó.

**Lời giải.** $R = r = 2\ \Omega$; $I = 12/4 = 3$ A nên $P_{max} = 3^2\cdot 2 = 18$ W, trùng với $\dfrac{\xi^2}{4r} = \dfrac{144}{8} = 18$ W.

## Dạng 5. Đèn và điện trở phụ

**Kỳ thi hay gặp:** học kỳ, đánh giá năng lực.

**Phương pháp:** từ giá trị định mức suy ra $I_{đm} = P/U$ và $R_đ = U^2/P$; đèn sáng bình thường khi dòng điện bằng $I_{đm}$.

**Ví dụ.** Đèn 6 V – 3 W muốn sáng bình thường khi nối vào nguồn 9 V (bỏ qua $r$). Cần mắc nối tiếp điện trở bao nhiêu?

**Lời giải.** $I_{đm} = 3/6 = 0{,}5$ A; $R = \dfrac{9 - 6}{0{,}5} = 6\ \Omega$.

## Câu luyện tập

1. Trong 10 s có 30 C đi qua tiết diện dây. Tính cường độ dòng điện.
2. Dây 10 Ω cắt đôi rồi mắc song song hai đoạn. Tính điện trở tương đương.
3. Nguồn $\xi = 9$ V, $r = 1\ \Omega$ nối với $R = 8\ \Omega$. Tính $I$, $U$ và công suất trên $R$.
4. Bếp 1000 W – 220 V hoạt động đúng định mức 30 phút. Tính điện năng tiêu thụ theo J và kWh.

<details>
<summary>Xem đáp án</summary>

1. $I = 3$ A
2. Mỗi đoạn 5 Ω nên $R = 2{,}5\ \Omega$
3. $I = 1$ A; $U = 8$ V; $P_R = 8$ W
4. $A = 1000\cdot 1800 = 1{,}8\cdot 10^{6}$ J $= 0{,}5$ kWh

</details>

${NOTE}
`,
        questions: [
          {
            prompt: 'Trong 10 s có điện lượng 30 C đi qua tiết diện dây dẫn. Cường độ dòng điện là:',
            options: ['300 A', '0,33 A', '3 A', '30 A'],
            answer: 2,
            explanation: r`$I = \dfrac{\Delta q}{\Delta t} = \dfrac{30}{10} = 3$ A.`,
          },
          {
            prompt: 'Dây dẫn 10 Ω được cắt đôi rồi mắc song song hai đoạn. Điện trở tương đương là:',
            options: ['5 Ω', '20 Ω', '10 Ω', '2,5 Ω'],
            answer: 3,
            explanation: r`Mỗi đoạn 5 Ω; hai điện trở bằng nhau mắc song song: $R = 5/2 = 2{,}5\ \Omega$.`,
          },
          {
            prompt: r`Nguồn $\xi = 9$ V, $r = 1\ \Omega$ nối với $R = 8\ \Omega$. Hiệu điện thế giữa hai cực nguồn là:`,
            options: ['8 V', '9 V', '1 V', '10 V'],
            answer: 0,
            explanation: r`$I = \dfrac{9}{8 + 1} = 1$ A; $U = \xi - Ir = 9 - 1 = 8$ V.`,
          },
          {
            prompt: 'Bếp điện 1000 W – 220 V hoạt động đúng định mức trong 30 phút. Điện năng tiêu thụ là:',
            options: ['30 kWh', '0,5 kWh', '1,8 kWh', '30 000 J'],
            answer: 1,
            explanation: r`$A = Pt = 1\ \text{kW}\cdot 0{,}5\ \text{h} = 0{,}5$ kWh $= 1{,}8\cdot 10^{6}$ J.`,
          },
          {
            prompt: r`Nguồn $\xi = 12$ V, điện trở trong $r = 2\ \Omega$ nối với biến trở $R$. Công suất trên $R$ lớn nhất bằng:`,
            options: ['72 W', '36 W', '18 W', '24 W'],
            answer: 2,
            explanation: r`Cực đại khi $R = r = 2\ \Omega$: $P_{max} = \dfrac{\xi^2}{4r} = \dfrac{144}{8} = 18$ W.`,
          },
        ],
      },
    ],
  },

  // ======================================================================
  // ÔN THI VẬT LÍ 11
  // ======================================================================
  {
    level: 'on-thi',
    title: 'Ôn thi Vật lí 11',
    description: 'Đề luyện tổng hợp theo dạng đề tốt nghiệp và bảng công thức Vật lí 11.',
    position: 9,
    lessons: [
      {
        title: 'Đề luyện tổng hợp Vật lí 11',
        slug: 'vl11-de-luyen-tong-hop',
        summary: 'Đề theo cấu trúc tốt nghiệp: 4 câu nhiều lựa chọn, 1 câu đúng/sai, 2 câu trả lời ngắn, 1 câu tự luận HSG.',
        content: r`
Đề theo ba dạng câu hỏi của đề tốt nghiệp, cộng một câu tự luận mức học sinh giỏi.

- **Phần I** (nhiều lựa chọn) và **Phần II** (đúng/sai, mỗi ý là một câu) nằm ở phần **Trắc nghiệm** cuối trang, nộp bài để được chấm điểm ngay.
- **Phần III** (trả lời ngắn) và **Phần IV** (tự luận) làm ra giấy rồi mở đáp án để tự chấm.

## Phần III. Trả lời ngắn

5. Dây dài 0,9 m hai đầu cố định có sóng dừng với 3 bụng. Bước sóng là bao nhiêu mét?
6. Tụ 4 μF được tích điện ở hiệu điện thế 10 V. Năng lượng tụ tích trữ là bao nhiêu mJ?

<details>
<summary>Xem đáp án Phần III</summary>

5. **0,6 m**: $l = \dfrac{3\lambda}{2}$ nên $\lambda = \dfrac{2\cdot 0{,}9}{3} = 0{,}6$ m
6. **0,2 mJ**: $W = \tfrac{1}{2}\cdot 4\cdot 10^{-6}\cdot 10^2 = 2\cdot 10^{-4}$ J

</details>

## Phần IV. Tự luận (mức học sinh giỏi)

Nguồn $\xi = 12$ V, $r = 1\ \Omega$ nối với đèn 6 V – 6 W và biến trở $R$ mắc nối tiếp.

- a) Tính điện trở và dòng điện định mức của đèn.
- b) Tìm $R$ để đèn sáng bình thường.
- c) Tính công suất toả nhiệt trên biến trở ở trạng thái đó.

<details>
<summary>Xem lời giải Phần IV</summary>

a) $R_đ = \dfrac{U^2}{P} = 6\ \Omega$; $I_{đm} = \dfrac{P}{U} = 1$ A.

b) Đèn sáng bình thường khi $I = 1$ A: $\dfrac{12}{6 + R + 1} = 1$ nên $R = 5\ \Omega$.

c) $P_R = I^2R = 5$ W.

</details>

${NOTE}
`,
        questions: [
          {
            prompt: r`**Câu 1.** Vật dao động theo phương trình $x = 6\cos(4\pi t)$ cm. Chu kì là:`,
            options: ['0,25 s', '0,5 s', '2 s', '4 s'],
            answer: 1,
            explanation: r`$T = \dfrac{2\pi}{\omega} = \dfrac{2\pi}{4\pi} = 0{,}5$ s.`,
          },
          {
            prompt: '**Câu 2.** Sóng truyền với tốc độ 12 m/s, tần số 4 Hz. Bước sóng là:',
            options: ['0,33 m', '3 m', '8 m', '48 m'],
            answer: 1,
            explanation: r`$\lambda = v/f = 12/4 = 3$ m.`,
          },
          {
            prompt: '**Câu 3.** Khi tăng khoảng cách giữa hai điện tích điểm lên gấp đôi thì lực Coulomb:',
            options: ['tăng 2 lần', 'giảm 2 lần', 'tăng 4 lần', 'giảm 4 lần'],
            answer: 3,
            explanation: r`$F \sim 1/r^2$ nên $r$ tăng 2 lần thì $F$ giảm 4 lần.`,
          },
          {
            prompt: r`**Câu 4.** Nguồn $\xi = 6$ V, $r = 1\ \Omega$ nối với $R = 2\ \Omega$. Cường độ dòng điện là:`,
            options: ['1 A', '2 A', '3 A', '6 A'],
            answer: 1,
            explanation: r`$I = \dfrac{6}{2 + 1} = 2$ A.`,
          },
          {
            prompt: '**Phần II – ý a.** Con lắc lò xo nằm ngang có m = 0,1 kg, k = 40 N/m, biên độ 5 cm. Nhận định: *"Tần số góc là 20 rad/s."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`$\omega = \sqrt{k/m} = \sqrt{400} = 20$ rad/s.`,
          },
          {
            prompt: '**Phần II – ý b.** Cùng con lắc trên. Nhận định: *"Chu kì xấp xỉ 0,31 s."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`$T = 2\pi/20 \approx 0{,}31$ s.`,
          },
          {
            prompt: '**Phần II – ý c.** Cùng con lắc trên. Nhận định: *"Cơ năng dao động là 0,05 J."*',
            options: ['Đúng', 'Sai'],
            answer: 0,
            explanation: r`$W = \tfrac{1}{2}\cdot 40\cdot 0{,}05^2 = 0{,}05$ J.`,
          },
          {
            prompt: '**Phần II – ý d.** Cùng con lắc trên. Nhận định: *"Vận tốc cực đại là 0,5 m/s."*',
            options: ['Đúng', 'Sai'],
            answer: 1,
            explanation: r`$v_{max} = \omega A = 20\cdot 0{,}05 = 1$ m/s.`,
          },
        ],
      },
      {
        title: 'Tổng hợp công thức Vật lí 11',
        slug: 'vl11-tong-hop-cong-thuc',
        summary: 'Bảng công thức 4 chương kèm đơn vị SI và lưu ý dễ sai — ôn nhanh trước khi thi.',
        content: r`
Mỗi bảng gom công thức của một chương, kèm đơn vị SI và lưu ý dễ sai.

## Chương 1. Dao động

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Phương trình | $x = A\cos(\omega t + \varphi)$ | $x$, $A$: m hoặc cm |
| Tần số góc | $\omega = 2\pi/T = 2\pi f$ | rad/s |
| Vận tốc | $v = -\omega A\sin(\omega t + \varphi)$ | $v_{max} = \omega A$ ở vị trí cân bằng |
| Gia tốc | $a = -\omega^2x$ | $a_{max} = \omega^2A$ ở biên |
| Hệ thức độc lập | $A^2 = x^2 + v^2/\omega^2$ | |
| Con lắc lò xo | $\omega = \sqrt{k/m}$; $T = 2\pi\sqrt{m/k}$ | $k$: N/m |
| Con lắc đơn | $T = 2\pi\sqrt{l/g}$ | góc lệch nhỏ |
| Cơ năng | $W = \tfrac{1}{2}kA^2 = \tfrac{1}{2}m\omega^2A^2$ | $W_đ$, $W_t$ biến thiên với chu kì $T/2$ |
| Thời gian từ O đến A/2 | $T/12$ | dùng vòng tròn lượng giác |
| Cộng hưởng | $f_{\text{cb}} = f_0$ | biên độ cực đại |

## Chương 2. Sóng

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Bước sóng | $\lambda = vT = v/f$ | m |
| Phương trình sóng | $u = A\cos(\omega t - 2\pi x/\lambda)$ | sóng truyền theo chiều $+x$ |
| Độ lệch pha | $\Delta\varphi = 2\pi d/\lambda$ | rad |
| Giao thoa, cực đại | $d_2 - d_1 = k\lambda$ | hai nguồn cùng pha |
| Giao thoa, cực tiểu | $d_2 - d_1 = (k + \tfrac{1}{2})\lambda$ | |
| Số cực đại trên AB | số $k$ nguyên thoả $\lvert k\rvert < AB/\lambda$ | |
| Số cực tiểu trên AB | $-AB/\lambda - \tfrac{1}{2} < k < AB/\lambda - \tfrac{1}{2}$ | |
| Sóng dừng, hai đầu cố định | $l = n\lambda/2$ | $n$ là số bụng |
| Sóng điện từ | $\lambda = c/f$ | $c = 3\cdot 10^{8}$ m/s |

## Chương 3. Trường điện

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Lực Coulomb | $F = k\dfrac{\lvert q_1q_2\rvert}{\varepsilon r^2}$ | $k = 9\cdot 10^{9}$ N·m²/C²; $q$: C; $r$: m |
| Cường độ điện trường | $E = F/q$ | V/m |
| Điện trường của điện tích điểm | $E = k\dfrac{\lvert Q\rvert}{\varepsilon r^2}$ | tổng hợp bằng cộng vectơ |
| Điện trường đều | $U = Ed$ | $d$ dọc theo đường sức |
| Công của lực điện | $A = qEd = qU$ | J |
| Tụ điện | $C = Q/U$ | F |
| Năng lượng tụ | $W = \tfrac{1}{2}CU^2 = \tfrac{1}{2}QU$ | J |
| Ghép tụ song song | $C = C_1 + C_2$ | $U$ chung |
| Ghép tụ nối tiếp | $1/C = 1/C_1 + 1/C_2$ | $Q$ chung |

## Chương 4. Dòng điện, mạch điện

| Nội dung | Công thức | Chú thích |
|---|---|---|
| Cường độ dòng điện | $I = \Delta q/\Delta t$ | A |
| Điện trở dây | $R = \rho l/S$ | $S$: m² ($1$ mm² $= 10^{-6}$ m²) |
| Định luật Ohm | $I = U/R$ | |
| Nối tiếp | $R = R_1 + R_2$; $I$ chung | $U$ cộng lại |
| Song song | $1/R = 1/R_1 + 1/R_2$; $U$ chung | $I$ cộng lại |
| Định luật Ohm toàn mạch | $I = \dfrac{\xi}{R + r}$ | $\xi$: V; $r$: Ω |
| Hiệu điện thế hai cực nguồn | $U = \xi - Ir$ | |
| Công suất, điện năng | $P = UI = I^2R$; $A = UIt$ | $1$ kWh $= 3{,}6\cdot 10^{6}$ J |
| Hiệu suất nguồn | $H = U/\xi$ | |
| Công suất cực đại trên R | $P_{max} = \dfrac{\xi^2}{4r}$ khi $R = r$ | |
| Đèn ghi ($U_{đm}$; $P_{đm}$) | $I_{đm} = P/U$; $R_đ = U^2/P$ | sáng bình thường khi $I = I_{đm}$ |
`,
      },
    ],
  },
];
