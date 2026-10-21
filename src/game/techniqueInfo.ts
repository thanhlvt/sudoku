/** Player-facing names and lessons for the logical techniques (`Technique.name` in src/core/techniques). */
export interface TechniqueInfo {
  /** The technique's `name` in the solver, which is also what `PuzzleRecord.rating` refers to. */
  id: string;
  label: string;
  group: string;
  /** One sentence: what the technique lets you conclude. */
  summary: string;
  /** How to spot it, step by step. */
  steps: readonly string[];
  /** A short rule of thumb. */
  tip: string;
}

export const TECHNIQUE_INFO: readonly TechniqueInfo[] = [
  {
    id: 'full-house',
    label: 'Ô cuối cùng',
    group: 'Số đơn',
    summary: 'Một hàng, cột hoặc khối chỉ còn đúng một ô trống thì số còn thiếu phải nằm ở đó.',
    steps: ['Tìm hàng, cột hoặc khối đã đầy 8 ô.', 'Xem 8 số đã có, số nào trong 1–9 chưa xuất hiện.', 'Điền số đó vào ô trống còn lại.'],
    tip: 'Quét nhanh các hàng/cột/khối gần đầy trước khi tìm kỹ thuật phức tạp.',
  },
  {
    id: 'naked-single',
    label: 'Số duy nhất trong ô',
    group: 'Số đơn',
    summary: 'Một ô mà mọi số khác đều đã bị hàng, cột hoặc khối của nó chiếm thì chỉ còn một số điền được.',
    steps: ['Chọn một ô trống.', 'Gạch các số đã có trong hàng, cột và khối chứa ô đó.', 'Nếu chỉ còn đúng một số, điền nó.'],
    tip: 'Bật ghi chú và để ô nào chỉ còn một ghi chú thì điền ngay.',
  },
  {
    id: 'hidden-single-box',
    label: 'Số ẩn trong khối',
    group: 'Số đơn',
    summary: 'Trong một khối 3×3, nếu một số chỉ đặt được vào một ô thì số đó phải nằm ở ô ấy.',
    steps: ['Chọn một khối và một số chưa có trong khối.', 'Dùng các số cùng số đó ở hàng/cột lân cận để loại các ô không đặt được.', 'Nếu chỉ còn một ô, điền số vào đó.'],
    tip: 'Nhấn một số trên bàn phím để tô mọi ô cùng số, rồi nhìn xem khối nào chỉ còn một chỗ.',
  },
  {
    id: 'hidden-single-line',
    label: 'Số ẩn trong hàng/cột',
    group: 'Số đơn',
    summary: 'Trong một hàng hoặc cột, nếu một số chỉ đặt được vào một ô thì số đó phải nằm ở ô ấy.',
    steps: ['Chọn một hàng (hoặc cột) và một số còn thiếu.', 'Loại các ô bị khối hoặc cột/hàng khác chặn số đó.', 'Nếu chỉ còn một ô, điền số vào đó.'],
    tip: 'Khó thấy hơn số ẩn trong khối vì phải nhìn xuyên qua ba khối.',
  },
  {
    id: 'pointing',
    label: 'Số chỉ hướng',
    group: 'Số bị khoá',
    summary: 'Nếu trong một khối, một số chỉ có thể nằm trên một hàng (hoặc cột) thì số đó bị loại khỏi phần còn lại của hàng (cột) bên ngoài khối.',
    steps: ['Chọn một khối và một số còn chưa điền.', 'Nhìn các ô còn nhận được số đó trong khối: chúng thẳng hàng?', 'Nếu có, loại số đó khỏi các ô khác trên cùng đường thẳng, nằm ngoài khối.'],
    tip: 'Khối "chỉ tay" ra ngoài: số chắc chắn nằm trên đường thẳng đó, nên nơi khác trên đường đó không thể có nó.',
  },
  {
    id: 'claiming',
    label: 'Số chiếm khối',
    group: 'Số bị khoá',
    summary: 'Nếu trong một hàng (hoặc cột), một số chỉ có thể nằm trong một khối thì số đó bị loại khỏi các ô khác của khối ấy.',
    steps: ['Chọn một hàng/cột và một số chưa điền.', 'Nhìn các ô còn nhận được số đó: chúng cùng nằm trong một khối?', 'Nếu có, loại số đó khỏi các ô của khối nằm ngoài hàng/cột này.'],
    tip: 'Ngược với số chỉ hướng: đường thẳng "chiếm" quyền đặt số trong khối.',
  },
  {
    id: 'naked-pair',
    label: 'Cặp số trần',
    group: 'Nhóm số',
    summary: 'Hai ô trong cùng một hàng/cột/khối cùng chỉ còn hai số như nhau thì hai số đó bị loại khỏi các ô còn lại của vùng ấy.',
    steps: ['Tìm hai ô cùng vùng, mỗi ô có đúng hai ghi chú, giống hệt nhau (ví dụ 3 và 7).', 'Hai số này phải chia nhau hai ô đó.', 'Xoá 3 và 7 khỏi mọi ô khác trong vùng.'],
    tip: 'Cần bật ghi chú đầy đủ; nút "Ghi hết" giúp bạn có đủ ghi chú để tìm.',
  },
  {
    id: 'hidden-pair',
    label: 'Cặp số ẩn',
    group: 'Nhóm số',
    summary: 'Nếu hai số chỉ xuất hiện trong cùng hai ô của một vùng thì hai ô đó chỉ được chứa hai số này.',
    steps: ['Trong một vùng, tìm hai số mà chỗ đặt được chỉ là cùng hai ô.', 'Hai ô đó thuộc về hai số này.', 'Xoá mọi ghi chú khác khỏi hai ô.'],
    tip: 'Cặp ẩn khó thấy vì hai ô còn lẫn nhiều ghi chú khác.',
  },
  {
    id: 'naked-triple',
    label: 'Bộ ba số trần',
    group: 'Nhóm số',
    summary: 'Ba ô cùng vùng mà tất cả ghi chú gộp lại chỉ gồm ba số thì ba số đó bị loại khỏi các ô khác của vùng.',
    steps: ['Tìm ba ô cùng vùng, ghi chú của chúng gộp lại chỉ có 3 số (ví dụ {1,2}, {2,3}, {1,3}).', 'Ba số này nằm hết trong ba ô đó.', 'Xoá chúng khỏi mọi ô khác trong vùng.'],
    tip: 'Mỗi ô không cần đủ cả ba số; chỉ cần tập hợp chung đúng ba số.',
  },
  {
    id: 'hidden-triple',
    label: 'Bộ ba số ẩn',
    group: 'Nhóm số',
    summary: 'Nếu ba số chỉ xuất hiện trong cùng ba ô của một vùng thì ba ô đó chỉ được chứa ba số này.',
    steps: ['Trong một vùng, tìm ba số mà chỗ đặt được chỉ nằm trong cùng ba ô.', 'Ba ô đó thuộc về ba số này.', 'Xoá mọi ghi chú khác khỏi ba ô.'],
    tip: 'Hiếm gặp; thường chỉ lộ ra sau khi đã dùng hết các kỹ thuật dễ hơn.',
  },
  {
    id: 'x-wing',
    label: 'X-Wing',
    group: 'Cá (Fish)',
    summary: 'Nếu một số chỉ đặt được ở đúng hai cột trong hai hàng khác nhau (cùng hai cột đó) thì số đó bị loại khỏi hai cột ấy ở mọi hàng còn lại.',
    steps: ['Chọn một số. Tìm hai hàng mà số đó chỉ còn hai vị trí.', 'Hai vị trí ở cả hai hàng nằm trên cùng hai cột: tạo thành hình chữ nhật.', 'Số này phải chiếm hai góc chéo nhau, nên xoá nó khỏi hai cột đó ở các hàng khác.'],
    tip: 'Cũng dùng được theo chiều ngược lại (hai cột, loại khỏi các hàng).',
  },
  {
    id: 'naked-quad',
    label: 'Bộ bốn số trần',
    group: 'Nhóm số',
    summary: 'Bốn ô cùng vùng mà ghi chú gộp lại chỉ gồm bốn số thì bốn số đó bị loại khỏi các ô khác của vùng.',
    steps: ['Tìm bốn ô cùng vùng có ghi chú gộp lại đúng 4 số.', 'Bốn số này nằm hết trong bốn ô đó.', 'Xoá chúng khỏi các ô còn lại của vùng.'],
    tip: 'Rất hiếm; nếu có bộ bốn trần thì phần còn lại của vùng cũng là một bộ bốn ẩn.',
  },
  {
    id: 'hidden-quad',
    label: 'Bộ bốn số ẩn',
    group: 'Nhóm số',
    summary: 'Nếu bốn số chỉ xuất hiện trong cùng bốn ô của một vùng thì bốn ô đó chỉ được chứa bốn số này.',
    steps: ['Tìm bốn số mà chỗ đặt được chỉ nằm trong cùng bốn ô của vùng.', 'Xoá mọi ghi chú khác khỏi bốn ô đó.'],
    tip: 'Thường dễ hơn nếu tìm bộ bốn trần của phần còn lại.',
  },
  {
    id: 'skyscraper',
    label: 'Skyscraper (Nhà chọc trời)',
    group: 'Chuỗi một số',
    summary: 'Hai hàng mỗi hàng chỉ còn hai vị trí của một số, chung đúng một cột, thì mọi ô nhìn thấy cả hai đầu còn lại không thể chứa số đó.',
    steps: ['Chọn một số. Tìm hai hàng mà mỗi hàng chỉ còn đúng hai ô đặt được.', 'Hai hàng có chung một cột (hai ô "chân" cùng cột), còn hai ô kia là "đỉnh".', 'Một trong hai đỉnh chắc chắn mang số đó, nên loại số khỏi ô nhìn thấy cả hai đỉnh.'],
    tip: 'Hình dung hai toà nhà chung một tầng đáy, hai tầng thượng là đỉnh.',
  },
  {
    id: 'swordfish',
    label: 'Swordfish (Cá kiếm)',
    group: 'Cá (Fish)',
    summary: 'Mở rộng X-Wing sang ba hàng và ba cột: số bị loại khỏi ba cột ở các hàng còn lại.',
    steps: ['Chọn một số. Tìm ba hàng, mỗi hàng chỉ còn 2–3 vị trí cho số đó.', 'Tất cả các vị trí cùng nằm trong đúng ba cột.', 'Xoá số khỏi ba cột đó ở các hàng khác.'],
    tip: 'Mỗi hàng không cần đủ cả ba cột.',
  },
  {
    id: 'xy-wing',
    label: 'XY-Wing',
    group: 'Cánh (Wing)',
    summary: 'Một ô gốc {X,Y} và hai ô cánh {X,Z}, {Y,Z} nhìn thấy gốc: mọi ô nhìn thấy cả hai cánh đều không thể là Z.',
    steps: ['Tìm ô gốc có đúng hai ghi chú, ví dụ {1,2}.', 'Tìm hai ô cánh nhìn thấy gốc: một ô {1,3}, một ô {2,3}.', 'Dù gốc là 1 hay 2, một trong hai cánh cũng thành 3 nên loại 3 khỏi các ô nhìn thấy cả hai cánh.'],
    tip: 'Chỉ dùng ô có đúng hai ghi chú: dễ tìm trên bàn đã ghi chú đầy đủ.',
  },
  {
    id: 'xyz-wing',
    label: 'XYZ-Wing',
    group: 'Cánh (Wing)',
    summary: 'Ô gốc {X,Y,Z} với hai cánh {X,Z}, {Y,Z}: mọi ô nhìn thấy cả ba ô đều không thể là Z.',
    steps: ['Tìm ô gốc có ba ghi chú, ví dụ {1,2,3}.', 'Tìm hai cánh nhìn thấy gốc: {1,3} và {2,3}.', 'Số 3 chắc chắn nằm ở một trong ba ô, nên loại 3 khỏi ô nhìn thấy cả ba.'],
    tip: 'Khác XY-Wing ở chỗ phải nhìn thấy cả ô gốc.',
  },
  {
    id: 'w-wing',
    label: 'W-Wing',
    group: 'Cánh (Wing)',
    summary: 'Hai ô cùng ghi chú {X,Y}, không nhìn thấy nhau, nối bằng một liên kết mạnh trên Y: mọi ô nhìn thấy cả hai không thể là X.',
    steps: ['Tìm hai ô cùng có ghi chú {X,Y} nhưng không cùng vùng.', 'Tìm một vùng mà Y chỉ còn hai vị trí, mỗi vị trí nhìn thấy một trong hai ô.', 'Loại X khỏi các ô nhìn thấy cả hai ô {X,Y}.'],
    tip: 'Liên kết mạnh = vùng mà số chỉ còn đúng hai chỗ.',
  },
  {
    id: 'simple-coloring',
    label: 'Tô màu đơn',
    group: 'Chuỗi một số',
    summary: 'Tô xen kẽ hai màu theo chuỗi liên kết mạnh của một số: màu nào mâu thuẫn thì loại số khỏi mọi ô màu đó.',
    steps: ['Chọn một số và nối các cặp ô là hai vị trí duy nhất của nó trong một vùng.', 'Tô các ô trong chuỗi xen kẽ hai màu A, B (một màu đúng, một màu sai).', 'Nếu hai ô cùng màu nhìn thấy nhau, hoặc một ô ngoài chuỗi nhìn thấy cả hai màu thì loại số ở đó.'],
    tip: 'Dùng bút hoặc ghi chú khác màu để theo dõi khi giải trên giấy.',
  },
  {
    id: 'unique-rectangle-1',
    label: 'Hình chữ nhật duy nhất',
    group: 'Duy nhất',
    summary: 'Bốn ô tạo hình chữ nhật trong hai khối, ba ô chỉ có {X,Y}: ô thứ tư không thể là X hay Y, nếu không bàn cờ sẽ có hai nghiệm.',
    steps: ['Tìm bốn ô ở hai hàng, hai cột, trải trên đúng hai khối.', 'Ba ô có ghi chú chỉ {X,Y}; ô còn lại có thêm số khác.', 'Loại X và Y khỏi ô thứ tư (vì nếu không, có thể đổi X↔Y để ra nghiệm thứ hai).'],
    tip: 'Dựa trên việc màn chơi có nghiệm duy nhất, điều luôn đúng ở trò này.',
  },
  {
    id: 'jellyfish',
    label: 'Jellyfish (Cá sứa)',
    group: 'Cá (Fish)',
    summary: 'Mở rộng X-Wing lên bốn hàng và bốn cột.',
    steps: ['Chọn một số. Tìm bốn hàng mà số đó chỉ nằm trong cùng bốn cột.', 'Xoá số khỏi bốn cột đó ở các hàng khác.'],
    tip: 'Rất hiếm khi cần đến.',
  },
];

const BY_ID = new Map(TECHNIQUE_INFO.map((t) => [t.id, t]));

export function techniqueInfo(id: string): TechniqueInfo | undefined {
  return BY_ID.get(id);
}

/** Display name; an unknown id is shown as it is so a newer bank never breaks the screen. */
export function techniqueLabel(id: string): string {
  return BY_ID.get(id)?.label ?? id;
}

export function isTechniqueId(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id);
}
