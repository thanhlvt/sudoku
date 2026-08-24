---
name: sudoku-rating
description: Logical solver giải Sudoku bằng kỹ thuật con người (singles, locked candidates, pairs/triples, X-Wing, Swordfish, XY-Wing, coloring, unique rectangle) và thuật toán chấm độ khó ra 5 cấp beginner/easy/medium/hard/expert. Dùng skill này khi viết solver, viết một kỹ thuật mới, kiểm tra "màn chơi có giải được bằng suy luận không", hoặc khi cần phân loại/điều chỉnh độ khó của màn chơi.
---

# Logical Solver & Difficulty Rating

Đây là bộ phận quyết định chất lượng game. Generator chỉ đào lỗ; chính solver này quyết định
màn chơi **có giải được bằng suy luận không** và **thuộc cấp độ nào**.

Bảng kỹ thuật đầy đủ (định nghĩa, cost, cách cài): `references/techniques.md`. Đọc file đó khi
cài đặt hoặc sửa một kỹ thuật cụ thể.

## Interface chung của một kỹ thuật

Mỗi kỹ thuật là một file trong `src/core/techniques/`, export một object:

```ts
export interface Step {
  technique: string;          // 'hidden-single'
  cost: number;               // lấy từ bảng cost
  placements: { idx: number; digit: number }[];   // ô được điền
  eliminations: { idx: number; digit: number }[]; // candidate bị loại
  cells: number[];            // ô liên quan, để highlight khi làm hint
  explain: string;            // câu giải thích ngắn cho hint UI
}

export interface Technique {
  name: string;
  cost: number;
  /** Trả về step ĐẦU TIÊN tìm được, hoặc null. Không được tự sửa grid/candidates. */
  find(grid: Readonly<Grid>, cands: Readonly<Candidates>): Step | null;
}
```

Quy tắc quan trọng: `find` **thuần đọc**. Việc áp dụng step do `logicalSolver` làm, nhờ đó
solver có thể ghi lại lịch sử, và UI hint có thể hiển thị step mà chưa áp dụng.

## Vòng lặp solver

```ts
solveLogically(grid, opts?: { allowed?: string[] }): {
  solved: boolean;
  grid: Grid;
  steps: Step[];
  stuckAt?: Grid;   // trạng thái khi bí, để debug
}
```

Thuật toán:

1. Tính candidates.
2. Duyệt danh sách kỹ thuật **theo cost tăng dần**, lấy kỹ thuật rẻ nhất tìm được step.
   Luôn ưu tiên kỹ thuật rẻ — nếu không, một màn dễ có thể bị chấm thành hard chỉ vì solver
   tình cờ thấy X-Wing trước Naked Single.
3. Áp dụng step: điền số, loại candidate, cập nhật candidates tăng dần (chỉ đụng peers).
4. Ghi step vào lịch sử, lặp lại.
5. Dừng khi bàn cờ đầy (`solved: true`) hoặc không kỹ thuật nào tìm được gì (`solved: false`).

**Không bao giờ fallback sang backtracking trong hàm này.** `solved: false` chính là tín hiệu
"màn này cần đoán mò" và generator dùng nó để loại màn.

Nếu `opts.allowed` được truyền, chỉ dùng các kỹ thuật có tên trong đó — dùng khi muốn kiểm
"màn này có giải nổi chỉ bằng bộ kỹ thuật của cấp beginner không".

## Chấm điểm

```ts
rate(grid: Grid): {
  solved: boolean;
  maxCost: number;      // cost của kỹ thuật khó nhất phải dùng
  score: number;        // tổng cost tất cả step
  hardest: string;      // tên kỹ thuật đó
  counts: Record<string, number>;
  level: Level | null;  // null nếu không solve được bằng logic
} 
```

- `maxCost` là tiêu chí chính: một màn chỉ khó bằng đúng bước khó nhất bắt buộc phải làm.
- `score` là tiêu chí phụ, dùng để so sánh trong cùng tier và để sắp xếp thứ tự màn trong
  một cấp độ (màn 1 dễ nhất → màn 20/100 khó nhất).

## Ngưỡng cấp độ

```ts
export const TIERS = [
  { level: 'beginner', maxCostRange: [0, 3],   givens: [40, 50] },
  { level: 'easy',     maxCostRange: [4, 4],   givens: [34, 40] },
  { level: 'medium',   maxCostRange: [5, 10],  givens: [30, 36] },
  { level: 'hard',     maxCostRange: [11, 22], givens: [26, 32] },
  { level: 'expert',   maxCostRange: [23, 40], givens: [22, 28] },
] as const;
```

`level` = tier có `maxCost` nằm trong `maxCostRange`. Vì các range liền nhau và không chồng lấn,
mỗi màn rơi vào đúng một tier, và tier `n+1` luôn đòi hỏi ít nhất một kỹ thuật mà tier `n`
không cho phép. Đó là thứ làm cho độ khó tăng thật sự chứ không phải chỉ bớt số cho sẵn.

Ràng buộc `givens` là điều kiện phụ: nếu `maxCost` đúng tier nhưng số ô cho sẵn ngoài range,
generator đào thêm hoặc bỏ màn — đừng nới ngưỡng cost để chiều số givens.

## Hiệu chỉnh ngưỡng

Ngưỡng trên là điểm khởi đầu hợp lý, không phải chân lý. Sau khi sinh xong bank đầu tiên,
in phân bố `maxCost` và `score` mỗi cấp (`npm run gen -- --stats`). Nếu một tier hiếm khi
sinh được (tỉ lệ chấp nhận < 2%) hoặc phân bố `score` trong tier quá rộng, chỉnh range rồi
sinh lại — nhưng phải bump `GENERATOR_VERSION` vì puzzle cũ sẽ đổi.

## Test bắt buộc

- Mỗi kỹ thuật: ít nhất 1 bàn cờ mẫu mà kỹ thuật đó bắn đúng, và 1 bàn mà nó phải trả `null`.
- Solver: một puzzle "escargot"-style không giải được bằng bộ kỹ thuật hiện có phải trả
  `solved: false`, không được treo vòng lặp.
- Solver có giới hạn số vòng lặp (ví dụ 500) để không lặp vô hạn nếu một kỹ thuật cài sai
  trả step rỗng.
- `rate` phải idempotent: gọi 2 lần trên cùng grid ra cùng kết quả.
