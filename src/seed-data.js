// Nội dung mẫu cho lần chạy đầu tiên. Giáo viên có thể sửa/xoá trong trang Quản trị.
// Công thức viết bằng LaTeX trong $...$ (inline) hoặc $$...$$ (khối riêng).
const r = String.raw;

module.exports = [
  {
    level: 'thcs',
    title: 'Chương 1. Tốc độ và chuyển động',
    description: 'Mô tả chuyển động, đo tốc độ và tính tốc độ trung bình.',
    position: 1,
    lessons: [
      {
        title: 'Tốc độ chuyển động',
        slug: 'toc-do-chuyen-dong',
        summary: 'Tốc độ cho biết vật chuyển động nhanh hay chậm. Công thức, đơn vị và cách đổi đơn vị.',
        content: r`
## 1. Tốc độ là gì?

Tốc độ là đại lượng cho biết **mức độ nhanh hay chậm** của chuyển động, được xác định bằng quãng đường vật đi được trong một đơn vị thời gian.

$$v = \frac{s}{t}$$

Trong đó:

- $v$ là tốc độ
- $s$ là quãng đường đi được
- $t$ là thời gian đi hết quãng đường đó

## 2. Đơn vị tốc độ

Đơn vị thường dùng là **mét trên giây** (m/s) và **kilômét trên giờ** (km/h).

$$1\ \text{m/s} = 3{,}6\ \text{km/h}$$

## 3. Tốc độ trung bình

Khi vật chuyển động trên nhiều đoạn đường với tốc độ khác nhau, ta dùng tốc độ trung bình:

$$v_{tb} = \frac{s_1 + s_2 + \dots}{t_1 + t_2 + \dots}$$

> **Lưu ý:** Tốc độ trung bình **không phải** trung bình cộng của các tốc độ.

## Ví dụ

Một bạn đi xe đạp 3 km trong 10 phút. Đổi $t = 10\ \text{phút} = \frac{1}{6}\ \text{h}$, ta có:

$$v = \frac{3}{1/6} = 18\ \text{km/h}$$
`,
        questions: [
          {
            prompt: r`Đổi $36\ \text{km/h}$ sang m/s, ta được:`,
            options: ['3,6 m/s', '10 m/s', '36 m/s', '129,6 m/s'],
            answer: 1,
            explanation: r`$36 : 3{,}6 = 10\ \text{m/s}$.`,
          },
          {
            prompt: 'Một ô tô đi được 120 km trong 2 giờ. Tốc độ của ô tô là:',
            options: ['60 km/h', '240 km/h', '30 km/h', '120 km/h'],
            answer: 0,
            explanation: r`$v = \frac{s}{t} = \frac{120}{2} = 60\ \text{km/h}$.`,
          },
          {
            prompt: 'Một xe đi 30 km đầu với tốc độ 60 km/h, 30 km sau với tốc độ 30 km/h. Tốc độ trung bình trên cả quãng đường là:',
            options: ['45 km/h', '40 km/h', '50 km/h', '35 km/h'],
            answer: 1,
            explanation: r`$t_1 = 0{,}5\ \text{h}$, $t_2 = 1\ \text{h}$, nên $v_{tb} = \frac{60}{1{,}5} = 40\ \text{km/h}$.`,
          },
        ],
      },
    ],
  },
  {
    level: 'thcs',
    title: 'Chương 2. Ánh sáng',
    description: 'Sự truyền ánh sáng, phản xạ ánh sáng và ảnh tạo bởi gương phẳng.',
    position: 2,
    lessons: [
      {
        title: 'Định luật phản xạ ánh sáng',
        slug: 'dinh-luat-phan-xa-anh-sang',
        summary: 'Tia tới, tia phản xạ, pháp tuyến và mối quan hệ giữa góc tới và góc phản xạ.',
        content: r`
## 1. Các khái niệm

- **Tia tới** $SI$: tia sáng chiếu đến mặt gương.
- **Tia phản xạ** $IR$: tia sáng hắt lại từ mặt gương.
- **Pháp tuyến** $IN$: đường thẳng vuông góc với mặt gương tại điểm tới $I$.
- **Góc tới** $i$: góc hợp bởi tia tới và pháp tuyến.
- **Góc phản xạ** $i'$: góc hợp bởi tia phản xạ và pháp tuyến.

## 2. Định luật phản xạ ánh sáng

1. Tia phản xạ nằm trong mặt phẳng chứa tia tới và pháp tuyến tại điểm tới.
2. Góc phản xạ bằng góc tới:

$$i' = i$$

## 3. Ứng dụng

Gương phẳng, kính tiềm vọng, gương chiếu hậu (gương cầu lồi) đều hoạt động dựa trên hiện tượng phản xạ ánh sáng.
`,
        questions: [
          {
            prompt: r`Chiếu một tia sáng tới gương phẳng với góc tới $i = 40^\circ$. Góc phản xạ bằng:`,
            options: ['40°', '50°', '80°', '90°'],
            answer: 0,
            explanation: r`Theo định luật phản xạ, $i' = i = 40^\circ$.`,
          },
          {
            prompt: r`Tia tới hợp với mặt gương một góc $30^\circ$. Góc giữa tia tới và tia phản xạ là:`,
            options: ['30°', '60°', '120°', '150°'],
            answer: 2,
            explanation: r`Góc tới $i = 90^\circ - 30^\circ = 60^\circ$, nên góc giữa tia tới và tia phản xạ là $i + i' = 120^\circ$.`,
          },
        ],
      },
    ],
  },
  {
    level: 'thpt',
    title: 'Chương 1. Động học',
    description: 'Chuyển động thẳng, chuyển động ném ngang và ném xiên.',
    position: 1,
    lessons: [
      {
        title: 'Chuyển động ném xiên',
        slug: 'chuyen-dong-nem-xien',
        summary: 'Phân tích chuyển động ném xiên thành hai chuyển động thành phần, tính tầm cao và tầm xa.',
        simulation: 'projectile',
        content: r`
## 1. Phân tích chuyển động

Vật được ném từ mặt đất với vận tốc $v_0$ hợp với phương ngang góc $\alpha$. Bỏ qua sức cản không khí, chuyển động được phân tích thành:

- **Theo phương ngang (Ox):** chuyển động thẳng đều với $v_x = v_0 \cos\alpha$
- **Theo phương thẳng đứng (Oy):** chuyển động biến đổi đều với gia tốc $-g$

$$x = v_0 \cos\alpha \cdot t \qquad y = v_0 \sin\alpha \cdot t - \frac{1}{2} g t^2$$

## 2. Các đại lượng đặc trưng

Độ cao cực đại:

$$H = \frac{v_0^2 \sin^2\alpha}{2g}$$

Tầm xa (khi vật rơi lại độ cao ban đầu):

$$L = \frac{v_0^2 \sin 2\alpha}{g}$$

> Tầm xa lớn nhất khi $\alpha = 45^\circ$. Hai góc ném phụ nhau (ví dụ $30^\circ$ và $60^\circ$) cho cùng tầm xa.

Hãy dùng mô phỏng bên dưới để kiểm chứng các nhận xét trên.
`,
        questions: [
          {
            prompt: r`Ném vật với $v_0 = 20\ \text{m/s}$, góc $\alpha = 30^\circ$, lấy $g = 10\ \text{m/s}^2$. Độ cao cực đại là:`,
            options: ['5 m', '10 m', '15 m', '20 m'],
            answer: 0,
            explanation: r`$H = \frac{20^2 \cdot \sin^2 30^\circ}{2 \cdot 10} = \frac{400 \cdot 0{,}25}{20} = 5\ \text{m}$.`,
          },
          {
            prompt: 'Với cùng vận tốc ban đầu, góc ném cho tầm xa lớn nhất là:',
            options: ['30°', '45°', '60°', '90°'],
            answer: 1,
            explanation: r`$L$ lớn nhất khi $\sin 2\alpha = 1$, tức $\alpha = 45^\circ$.`,
          },
          {
            prompt: r`Góc ném nào cho cùng tầm xa với góc $25^\circ$ (cùng $v_0$)?`,
            options: ['50°', '55°', '65°', '75°'],
            answer: 2,
            explanation: r`Hai góc phụ nhau cho cùng tầm xa: $90^\circ - 25^\circ = 65^\circ$.`,
          },
        ],
      },
    ],
  },
  {
    level: 'thpt',
    title: 'Chương 2. Dao động',
    description: 'Dao động điều hoà, con lắc lò xo, con lắc đơn.',
    position: 2,
    lessons: [
      {
        title: 'Con lắc đơn',
        slug: 'con-lac-don',
        summary: 'Cấu tạo, điều kiện dao động điều hoà và công thức chu kì của con lắc đơn.',
        simulation: 'pendulum',
        content: r`
## 1. Cấu tạo

Con lắc đơn gồm một vật nhỏ khối lượng $m$ treo ở đầu một sợi dây không dãn, khối lượng không đáng kể, chiều dài $l$.

## 2. Điều kiện dao động điều hoà

Khi góc lệch nhỏ ($\alpha_0 \lesssim 10^\circ$) và bỏ qua ma sát, con lắc đơn dao động điều hoà với tần số góc:

$$\omega = \sqrt{\frac{g}{l}}$$

## 3. Chu kì và tần số

$$T = 2\pi\sqrt{\frac{l}{g}} \qquad f = \frac{1}{2\pi}\sqrt{\frac{g}{l}}$$

Nhận xét:

- Chu kì **không phụ thuộc** vào khối lượng vật và biên độ (khi góc nhỏ).
- Chu kì tỉ lệ thuận với $\sqrt{l}$: tăng chiều dài 4 lần thì chu kì tăng 2 lần.

## 4. Ứng dụng

Đo gia tốc trọng trường: đo $T$ và $l$, suy ra $g = \frac{4\pi^2 l}{T^2}$.
`,
        questions: [
          {
            prompt: r`Con lắc đơn dài $l = 1\ \text{m}$ tại nơi có $g = \pi^2\ \text{m/s}^2$. Chu kì dao động là:`,
            options: ['1 s', '2 s', '3,14 s', '0,5 s'],
            answer: 1,
            explanation: r`$T = 2\pi\sqrt{\frac{1}{\pi^2}} = 2\ \text{s}$.`,
          },
          {
            prompt: 'Tăng chiều dài con lắc đơn lên 4 lần thì chu kì:',
            options: ['Tăng 4 lần', 'Giảm 2 lần', 'Tăng 2 lần', 'Không đổi'],
            answer: 2,
            explanation: r`$T \sim \sqrt{l}$ nên $T' = \sqrt{4}\,T = 2T$.`,
          },
          {
            prompt: 'Chu kì dao động nhỏ của con lắc đơn KHÔNG phụ thuộc vào:',
            options: ['Chiều dài dây', 'Gia tốc trọng trường', 'Khối lượng vật nặng', 'Vĩ độ địa lí'],
            answer: 2,
            explanation: r`$T = 2\pi\sqrt{l/g}$ không chứa $m$. Vĩ độ ảnh hưởng tới $g$ nên vẫn ảnh hưởng tới $T$.`,
          },
        ],
      },
    ],
  },
  {
    level: 'on-thi',
    title: 'Chuyên đề 1. Dao động điều hoà',
    description: 'Phương trình dao động, hệ thức độc lập thời gian, bài toán thời gian.',
    position: 1,
    lessons: [
      {
        title: 'Phương trình và hệ thức độc lập',
        slug: 'dao-dong-dieu-hoa-he-thuc-doc-lap',
        summary: 'Tổng hợp công thức trọng tâm và các dạng bài thường gặp trong đề thi.',
        content: r`
## 1. Phương trình dao động

$$x = A\cos(\omega t + \varphi)$$

$$v = x' = -A\omega\sin(\omega t + \varphi) \qquad a = v' = -\omega^2 x$$

Giá trị cực đại: $v_{max} = A\omega$ (tại VTCB), $a_{max} = A\omega^2$ (tại biên).

## 2. Hệ thức độc lập với thời gian

$$A^2 = x^2 + \frac{v^2}{\omega^2} \qquad \frac{v^2}{v_{max}^2} + \frac{a^2}{a_{max}^2} = 1$$

## 3. Thời gian ngắn nhất (dùng vòng tròn lượng giác)

| Từ | Đến | Thời gian |
|---|---|---|
| $x = 0$ | $x = \pm\frac{A}{2}$ | $\frac{T}{12}$ |
| $x = \pm\frac{A}{2}$ | $x = \pm A$ | $\frac{T}{6}$ |
| $x = 0$ | $x = \pm\frac{A\sqrt{2}}{2}$ | $\frac{T}{8}$ |
| $x = 0$ | $x = \pm\frac{A\sqrt{3}}{2}$ | $\frac{T}{6}$ |

> **Mẹo:** Luôn đổi đơn vị về cùng hệ (cm, cm/s hoặc m, m/s) trước khi thay số.
`,
        questions: [
          {
            prompt: r`Vật dao động với $A = 5\ \text{cm}$, $\omega = 4\pi\ \text{rad/s}$. Tốc độ cực đại là:`,
            options: ['20 cm/s', '20π cm/s', '80π² cm/s', '5π cm/s'],
            answer: 1,
            explanation: r`$v_{max} = A\omega = 5 \cdot 4\pi = 20\pi\ \text{cm/s}$.`,
          },
          {
            prompt: r`Vật dao động với $A = 5\ \text{cm}$, $\omega = 10\ \text{rad/s}$. Khi $x = 3\ \text{cm}$, tốc độ của vật là:`,
            options: ['30 cm/s', '40 cm/s', '50 cm/s', '20 cm/s'],
            answer: 1,
            explanation: r`$|v| = \omega\sqrt{A^2 - x^2} = 10\sqrt{25 - 9} = 40\ \text{cm/s}$.`,
          },
          {
            prompt: r`Thời gian ngắn nhất vật đi từ vị trí biên $x = A$ đến $x = \frac{A}{2}$ là:`,
            options: ['T/12', 'T/8', 'T/6', 'T/4'],
            answer: 2,
            explanation: r`Trên vòng tròn lượng giác, bán kính quét góc $\frac{\pi}{3}$, ứng với $\frac{T}{6}$.`,
          },
        ],
      },
    ],
  },
  {
    level: 'dai-cuong',
    title: 'Chương 1. Dòng điện không đổi',
    description: 'Định luật Ohm, định luật Kirchhoff và công suất điện.',
    position: 1,
    lessons: [
      {
        title: 'Định luật Ohm cho toàn mạch',
        slug: 'dinh-luat-ohm-toan-mach',
        summary: 'Cường độ dòng điện trong mạch kín, ghép điện trở và công suất mạch ngoài.',
        simulation: 'circuit',
        content: r`
## 1. Định luật Ohm cho toàn mạch

Mạch kín gồm nguồn có suất điện động $\mathcal{E}$, điện trở trong $r$ và mạch ngoài có điện trở tương đương $R$:

$$I = \frac{\mathcal{E}}{R + r}$$

Hiệu điện thế mạch ngoài: $U = \mathcal{E} - Ir = IR$.

## 2. Ghép điện trở

- **Nối tiếp:** $R_{td} = R_1 + R_2 + \dots$
- **Song song:** $\dfrac{1}{R_{td}} = \dfrac{1}{R_1} + \dfrac{1}{R_2} + \dots$

## 3. Định luật Kirchhoff

1. **Định luật nút:** $\sum I_{\text{vào}} = \sum I_{\text{ra}}$ (bảo toàn điện tích).
2. **Định luật vòng:** Trong một vòng kín, $\sum \mathcal{E}_k = \sum I_k R_k$ (bảo toàn năng lượng).

## 4. Công suất

Công suất tiêu thụ trên mạch ngoài:

$$P = I^2 R = \frac{\mathcal{E}^2 R}{(R + r)^2}$$

$P$ đạt cực đại $P_{max} = \dfrac{\mathcal{E}^2}{4r}$ khi $R = r$.
`,
        questions: [
          {
            prompt: r`Nguồn $\mathcal{E} = 12\ \text{V}$, $r = 1\ \Omega$ nối với $R = 5\ \Omega$. Cường độ dòng điện là:`,
            options: ['2 A', '2,4 A', '12 A', '1 A'],
            answer: 0,
            explanation: r`$I = \frac{12}{5 + 1} = 2\ \text{A}$.`,
          },
          {
            prompt: r`Hai điện trở $R_1 = 6\ \Omega$ và $R_2 = 3\ \Omega$ mắc song song. Điện trở tương đương là:`,
            options: ['9 Ω', '4,5 Ω', '2 Ω', '18 Ω'],
            answer: 2,
            explanation: r`$R_{td} = \frac{6 \cdot 3}{6 + 3} = 2\ \Omega$.`,
          },
          {
            prompt: 'Công suất tiêu thụ trên mạch ngoài đạt cực đại khi:',
            options: ['R = 0', 'R = r', 'R = 2r', 'R rất lớn'],
            answer: 1,
            explanation: r`Theo bất đẳng thức Cô-si, $P$ lớn nhất khi $R = r$.`,
          },
        ],
      },
    ],
  },
];
