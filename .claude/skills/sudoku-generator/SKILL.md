---
name: sudoku-generator
description: Thuật toán sinh màn chơi Sudoku - tạo lời giải đầy đủ bằng backtracking có seed, đào lỗ theo mẫu đối xứng, đảm bảo nghiệm duy nhất và ép màn rơi đúng cấp độ mục tiêu. Dùng skill này khi viết hoặc sửa hàm sinh màn chơi, khi màn sinh ra sai cấp độ, khi generator quá chậm, hoặc khi cần đảm bảo màn chơi giải được không cần đoán.
---

# Generator

Mục tiêu: cho `(level, index)` → trả về một puzzle duy nhất nghiệm, giải được bằng logic thuần,
`maxCost` rơi đúng tier của `level`, và tái tạo được y hệt ở lần chạy sau.

## API

```ts
generatePuzzle(level: Level, index: number): PuzzleRecord | null
```

Trả `null` khi hết số lần thử — caller (CLI) log lại và thử `index` tiếp theo, không được ném lỗi
làm chết cả batch.

## Quy trình

### Bước 1 — Sinh lời giải đầy đủ

Backtracking điền ô theo thứ tự 0→80, tại mỗi ô thử các digit hợp lệ theo thứ tự đã shuffle bằng
`mulberry32(seed)`. Nhanh hơn cách "điền 3 box chéo rồi solve", và deterministic.

### Bước 2 — Chọn mẫu đối xứng

| Level | Mẫu | Lý do |
|---|---|---|
| beginner, easy | `rotational-180` | bàn cờ nhìn cân đối, thân thiện |
| medium | `rotational-180` hoặc `mirror-vertical` (chọn theo seed) | đa dạng thị giác |
| hard | `rotational-180` hoặc `none` | đối xứng làm hạn chế số clue tối thiểu |
| expert | `none` | cần tự do tối đa mới xuống được 22–26 givens |

Với mẫu đối xứng, ô được đào theo **cặp** (`idx` và ô đối xứng của nó); cặp chỉ được đào nếu sau
khi bỏ cả hai, puzzle vẫn duy nhất nghiệm.

### Bước 3 — Đào lỗ

```
cells = shuffle(0..80, rand)
for idx in cells:
    if givens <= tier.givens.min: break
    saved = grid[idx] (+ ô đối xứng)
    remove
    if countSolutions(grid, 2) !== 1: restore; continue
    if rate(grid).maxCost > tier.maxCostRange[1]: restore; continue   # đã vượt tier
    accept
```

Điều kiện dừng: đủ số givens mục tiêu **hoặc** duyệt hết danh sách ô.

Tối ưu bắt buộc: `countSolutions` rẻ hơn `rate` rất nhiều → luôn kiểm unique trước, chỉ `rate`
khi đã unique. Với expert có thể chỉ `rate` mỗi 3–5 lần đào thành công rồi rate lại lần cuối,
nhưng luôn `rate` đầy đủ ở bước xác nhận cuối cùng.

### Bước 4 — Xác nhận

Sau khi đào xong, chạy `rate(puzzle)` một lần đầy đủ và yêu cầu:

1. `solved === true` — giải được bằng logic thuần, **đây là điều kiện quan trọng nhất**.
2. `maxCost` nằm trong `tier.maxCostRange`.
3. `givens` nằm trong `tier.givens`.
4. `countSolutions === 1` (kiểm lại lần cuối).

Nếu trượt → retry với seed dẫn xuất `k+1`. Tối đa `MAX_ATTEMPTS`:
`beginner/easy: 50`, `medium: 100`, `hard: 200`, `expert: 400`.

### Bước 5 — Ép về đúng tier khi màn quá dễ

Trường hợp hay gặp nhất: đào hết mức mà `maxCost` vẫn dưới sàn tier (ví dụ muốn `hard` nhưng chỉ
ra `medium`). Đừng vội retry từ đầu — thử theo thứ tự:

1. Tiếp tục đào thêm cặp ô, vượt xuống dưới `givens.min` tối đa 4 ô, xem `maxCost` có lên không.
2. Nếu vẫn không, retry seed mới.

Ngược lại nếu `maxCost` vượt trần tier: khôi phục ô vừa đào (bước đào đã chặn sẵn trường hợp này),
kết thúc sớm và xác nhận.

## Hiệu năng

Chỉ tiêu tham khảo trên máy dev (Node 20, 1 core): beginner–hard < 300ms/màn, expert < 5s/màn.
Nếu chậm hơn nhiều, kiểm theo thứ tự:

1. `countSolutions` có dừng sớm ở 2 nghiệm không?
2. Có cấp phát mảng mới trong vòng lặp đệ quy không?
3. Có gọi `rate` (đắt) trước `countSolutions` (rẻ) không?
4. `computeCandidates` có bị gọi lại toàn bàn sau mỗi step thay vì cập nhật tăng dần không?

Sinh 100 màn × 5 cấp là công việc chạy một lần rồi commit kết quả — chấp nhận vài phút, nhưng
không chấp nhận hàng giờ. Nếu cần, chạy song song bằng `worker_threads` chia theo `index`
(vẫn deterministic vì seed phụ thuộc index chứ không phụ thuộc thứ tự chạy).

## Không được làm

- Không dùng `Math.random()` ở bất kỳ đâu trong generator.
- Không chấp nhận màn có `solved: false` dù nó unique — unique không có nghĩa là người chơi giải được.
- Không "sửa" độ khó bằng cách thêm/bớt givens ngẫu nhiên sau khi đã xác nhận.
- Không sinh màn trong browser.

## Test bắt buộc

- `generatePuzzle('easy', 0)` gọi 2 lần → kết quả giống hệt nhau.
- 10 màn mỗi cấp sinh thử đều thoả cả 4 điều kiện ở bước 4.
- Mẫu đối xứng `rotational-180` cho ra bàn cờ thực sự đối xứng qua tâm.
