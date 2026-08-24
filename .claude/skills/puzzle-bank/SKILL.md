---
name: puzzle-bank
description: Format JSON của ngân hàng màn chơi Sudoku, quy tắc seed theo index, CLI generate/verify, và cách mở rộng từ 20 lên 100 màn mỗi cấp mà không làm đổi màn cũ. Dùng skill này khi tạo hoặc sửa file public/puzzles, khi viết script tools/generate.ts hay tools/verify.ts, khi thêm màn chơi mới, hoặc khi game cần load danh sách màn theo cấp độ.
---

# Puzzle Bank

Ngân hàng màn chơi là dữ liệu tĩnh, sinh offline, commit vào repo. Game chỉ đọc.

## Format file

`public/puzzles/<level>.json`:

```json
{
  "schemaVersion": 1,
  "generatorVersion": 1,
  "level": "hard",
  "count": 20,
  "puzzles": [
    {
      "id": "hard-001",
      "index": 0,
      "puzzle": "..3.5....7......1...(81 ký tự, '.' = trống)",
      "solution": "(81 ký tự, không có '.')",
      "givens": 28,
      "symmetry": "rotational-180",
      "seed": 2748291043,
      "rating": {
        "maxCost": 20,
        "score": 418,
        "hardest": "x-wing",
        "counts": { "naked-single": 31, "hidden-single-box": 12, "pointing": 3, "x-wing": 1 }
      }
    }
  ]
}
```

`public/puzzles/manifest.json`:

```json
{
  "schemaVersion": 1,
  "generatorVersion": 1,
  "levels": [
    { "level": "beginner", "count": 20, "file": "beginner.json" },
    { "level": "easy", "count": 20, "file": "easy.json" }
  ]
}
```

Game load `manifest.json` lúc khởi động (nhẹ), rồi lazy-load file cấp độ khi người chơi mở
danh sách màn của cấp đó. 100 màn ≈ 100 × ~250 byte ≈ 25 KB/cấp — nhỏ, không cần chia nhỏ hơn.

## Quy tắc bất biến

- `id` = `` `${level}-${String(index + 1).padStart(3, '0')}` `` — dùng làm khoá localStorage,
  nên **không bao giờ đổi ý nghĩa của id** khi đã phát hành.
- `index` cố định vị trí. Seed suy ra từ `index`, nên sinh lại với `count` lớn hơn cho ra
  cùng 20 màn đầu.
- Mảng `puzzles` sắp theo `index` tăng dần. Nếu muốn hiển thị theo độ khó tăng dần trong cấp,
  **sắp lúc build** (sắp theo `rating.score` rồi mới gán index) — đừng sắp lại ở runtime,
  vì như vậy id sẽ trỏ sang màn khác giữa các phiên bản.
- Bump `generatorVersion` mỗi khi thuật toán sinh/chấm điểm đổi và puzzle cũ không còn tái tạo được.
  Game so `generatorVersion` trong manifest với giá trị lưu trong localStorage; nếu khác, cảnh
  báo người chơi rằng tiến độ của các màn cũ có thể không còn khớp (chi tiết ở skill `local-storage`).

## CLI `tools/generate.ts`

```
npm run gen -- --level <beginner|easy|medium|hard|expert|all> --count <n> [--force] [--stats] [--concurrency <n>]
```

Hành vi:

- Đọc file bank hiện có (nếu có). Với mỗi `index` từ `0` đến `count - 1`:
  - đã tồn tại và `generatorVersion` khớp và không `--force` → giữ nguyên, bỏ qua.
  - còn lại → sinh mới.
- Ghi file **nguyên tử**: ghi ra `.tmp` rồi `rename`, để Ctrl+C giữa chừng không hỏng bank.
- In tiến độ dạng `hard 37/100 (avg 210ms, fail 4)`.
- `--stats`: in phân bố `maxCost`, `score`, `givens` mỗi cấp — dùng để hiệu chỉnh ngưỡng tier.
- Kết thúc bằng cập nhật `manifest.json`.

Đây chính là cơ chế mở rộng 20 → 100: chạy lại cùng lệnh với `--count 100`. Không cần code thêm.

## CLI `tools/verify.ts`

```
npm run verify [-- --level hard]
```

Với mỗi màn trong bank, kiểm và fail nếu sai:

1. `puzzle` và `solution` đúng 81 ký tự, `solution` hợp lệ và khớp mọi ô cho sẵn của `puzzle`.
2. `countSolutions(puzzle, 2) === 1`.
3. `rate(puzzle).solved === true`.
4. `rate(puzzle).level === level` của file.
5. `givens` khớp số ô cho sẵn thực tế.
6. `id` duy nhất toàn bộ bank, `index` liên tục từ 0.

Chạy `verify` trong CI. Bank hỏng mà lọt lên production nghĩa là người chơi gặp màn không giải
được — lỗi tệ nhất của game này.

## Đọc bank trong app

```ts
// src/game/puzzleBank.ts
loadManifest(): Promise<Manifest>              // cache trong memory
loadLevel(level: Level): Promise<LevelBank>    // cache, chỉ fetch 1 lần/phiên
getPuzzle(id: string): Promise<PuzzleRecord>
```

Dùng `fetch('/puzzles/...')` thay vì `import` tĩnh, để bundle không phình và để thêm màn mới
không cần rebuild JS.

## Danh sách màn (level list)

Mỗi màn hiển thị: số thứ tự, trạng thái (chưa chơi / đang chơi / đã xong), thời gian tốt nhất.
Trạng thái đọc từ localStorage theo `id`. Không khoá màn — người chơi chọn tự do; game này không
có tiến trình tuyến tính.
