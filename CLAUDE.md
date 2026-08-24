# CLAUDE.md — Sudoku Web Game

Web game Sudoku chạy hoàn toàn client-side. Không backend, không API, không tài khoản.
Tiến độ chơi lưu bằng `localStorage`. Ngân hàng màn chơi được sinh **offline** bằng script Node,
commit vào repo dưới dạng JSON tĩnh.

## Nguyên tắc bất di bất dịch

1. **Mọi màn chơi phải có đúng 1 lời giải** — kiểm bằng solver đếm nghiệm (dừng sớm ở 2).
2. **Mọi màn chơi phải giải được bằng suy luận logic thuần, không đoán mò** — logical solver
   phải giải tới hết bàn cờ chỉ bằng các kỹ thuật thuộc whitelist của cấp độ đó. Nếu phải
   brute-force/backtracking mới ra thì màn đó bị loại.
3. **Sinh màn là deterministic** — seed suy ra từ `(level, index)`. Chạy lại generator với
   `count` lớn hơn không được làm đổi các màn đã có.
4. **Không sinh màn ở runtime trong trình duyệt.** Sinh expert có thể mất hàng giây/màn;
   game chỉ đọc JSON đã build sẵn.
5. **Không thư viện sudoku bên thứ ba** cho phần core (generator/solver/rating) — tự viết,
   vì rating độ khó phụ thuộc chính xác vào bộ kỹ thuật ta định nghĩa.

## Tech stack

- Vite + React 18 + TypeScript (strict)
- TailwindCSS cho UI
- Vitest cho unit test core
- Node ≥ 20 chạy script generator qua `tsx`
- Deploy: static hosting (bất kỳ), `dist/` là toàn bộ sản phẩm

## Cấu trúc thư mục

```
src/
  core/                 # thuần logic, không phụ thuộc DOM, dùng chung cho app lẫn script
    types.ts            # Grid, Cell, Level, PuzzleRecord, Rating...
    board.ts            # encode/decode 81-char, peers, units, bitmask candidates
    solver.ts           # solveCount() brute-force đếm nghiệm (kiểm unique)
    techniques/         # mỗi kỹ thuật 1 file, cùng interface Technique
    logicalSolver.ts    # vòng lặp áp dụng technique theo thứ tự cost tăng dần
    rating.ts           # chấm điểm + map sang Level
    generator.ts        # sinh full grid + đào lỗ + retry theo target level
    rng.ts              # mulberry32 + fnv1a hash (deterministic)
  game/                 # state máy chơi: nhập số, ghi chú, undo, đồng hồ, lỗi
  storage/              # localStorage adapter, schema versioning, migration
  ui/                   # components React
  App.tsx
tools/
  generate.ts           # CLI sinh ngân hàng màn chơi
  verify.ts             # CLI kiểm tra lại toàn bộ bank đã commit
public/puzzles/
  beginner.json easy.json medium.json hard.json expert.json
  manifest.json         # tổng số màn mỗi cấp, generatorVersion
```

## Lệnh

```bash
npm run dev                                   # chạy dev server
npm run build                                 # build tĩnh
npm run test                                  # unit test core
npm run gen -- --level all --count 20         # sinh ngân hàng màn (giai đoạn 1)
npm run gen -- --level all --count 100        # mở rộng, giữ nguyên 20 màn cũ
npm run gen -- --level expert --count 100 --force   # sinh lại từ đầu (đổi puzzle!)
npm run verify                                # kiểm unique + solvable + đúng tier cho toàn bank
```

## Năm cấp độ

Độ khó xác định bằng **kỹ thuật khó nhất bắt buộc phải dùng**, không phải bằng số ô cho sẵn.
Số ô cho sẵn chỉ là ràng buộc phụ để bàn cờ nhìn hợp lý.

| Level | Kỹ thuật tối đa được phép | Bắt buộc dùng ít nhất 1 kỹ thuật có cost > | Givens |
|---|---|---|---|
| beginner | Naked/Hidden Single (trong box) | — | 40–50 |
| easy | + Hidden Single hàng/cột | 3 | 34–40 |
| medium | + Locked Candidates, Naked/Hidden Pair | 4 | 30–36 |
| hard | + Naked/Hidden Triple, Quad, X-Wing | 10 | 26–32 |
| expert | + Swordfish, XY/XYZ-Wing, W-Wing, Simple Coloring, Unique Rectangle | 22 | 22–28 |

Bảng cost chi tiết và định nghĩa từng kỹ thuật: `.claude/skills/sudoku-rating/references/techniques.md`.

## Skills

Đọc skill tương ứng **trước khi** viết code phần đó:

- `.claude/skills/sudoku-core/` — biểu diễn bàn cờ, bitmask, quy ước dùng chung
- `.claude/skills/sudoku-rating/` — logical solver, kỹ thuật, thuật toán chấm độ khó
- `.claude/skills/sudoku-generator/` — sinh full grid, đào lỗ, đối xứng, retry
- `.claude/skills/puzzle-bank/` — format JSON, seed, CLI, mở rộng 20 → 100
- `.claude/skills/local-storage/` — schema lưu tiến độ, versioning
- `.claude/skills/game-ui/` — layout, tương tác, phím tắt, accessibility

## Lộ trình

1. **Core**: types, board, solver đếm nghiệm, RNG + test.
2. **Techniques + rating**: singles → pairs/locked → triples/X-Wing → expert set. Mỗi kỹ thuật
   đi kèm unit test với bàn cờ mẫu.
3. **Generator + CLI**: sinh 20 màn/cấp, chạy `verify` xanh 100%.
4. **Game UI**: bàn cờ, nhập số, ghi chú, undo, hint, đồng hồ.
5. **Storage**: lưu/khôi phục ván dở, thống kê.
6. **Mở rộng 100 màn/cấp**, kiểm hiệu năng generator.

## Quy ước code

- Core code phải **pure**: không `window`, không `Date.now()` bên trong hàm logic (truyền vào).
  Nhờ vậy script Node và browser dùng chung một file.
- Ô trống = `0`. Bàn cờ truyền đi dạng `Uint8Array(81)` hoặc chuỗi 81 ký tự `.`/`0`–`9`.
- Candidates dùng bitmask 9 bit (`1 << (digit - 1)`), không dùng `Set<number>` trong vòng lặp nóng.
- Không `any` trong `src/core`.
- Mọi hàm core mới đều phải có test trong `*.test.ts` cạnh nó.
