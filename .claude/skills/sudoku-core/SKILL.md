---
name: sudoku-core
description: Quy ước biểu diễn bàn cờ Sudoku, bitmask candidates, units/peers, encode/decode chuỗi 81 ký tự, solver đếm nghiệm và RNG deterministic. Bắt buộc đọc trước khi viết hoặc sửa bất kỳ file nào trong src/core, và trước khi viết generator, solver, rating hay bất kỳ hàm nào đụng tới cấu trúc dữ liệu bàn cờ.
---

# Sudoku Core

Nền tảng dùng chung cho generator (chạy trong Node) và game (chạy trong browser).
Mọi thứ trong `src/core` phải pure và không phụ thuộc môi trường.

## Biểu diễn

- Bàn cờ: `Uint8Array(81)`, index `r * 9 + c`, giá trị `0` = trống, `1..9` = số.
- Chuỗi lưu trữ: 81 ký tự, ô trống là `.`. Hàm `toString` xuất `.`, hàm `parse` chấp nhận cả `.`, `0`, khoảng trắng bị bỏ qua.
- Candidates: bitmask 9 bit trong `Uint16Array(81)`. Digit `d` ↔ bit `1 << (d - 1)`.
  Dùng `popcount`, `lowestBit`, `bitToDigit` thay vì loop 1..9 khi có thể.

```ts
export type Grid = Uint8Array;          // 81, 0 = empty
export type Candidates = Uint16Array;   // 81, bitmask 9 bit
export type Level = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
export type Unit = readonly number[];   // 9 index
```

## Units & peers — tính sẵn một lần

Tạo tại module scope, freeze, tái sử dụng. Không tính lại trong vòng lặp:

- `ROWS[9]`, `COLS[9]`, `BOXES[9]` — mỗi cái là mảng 9 index.
- `UNITS: readonly Unit[]` — 27 unit.
- `UNITS_OF[81]` — 3 unit chứa ô đó.
- `PEERS[81]` — 20 ô cùng hàng/cột/box, đã loại trùng, dạng `Uint8Array(20)`.

## API tối thiểu của `board.ts`

```ts
parseGrid(s: string): Grid
gridToString(g: Grid, empty?: '.' | '0'): string
cloneGrid(g: Grid): Grid
computeCandidates(g: Grid): Candidates   // 0 cho ô đã điền
isValidPlacement(g: Grid, idx: number, d: number): boolean
isComplete(g: Grid): boolean
findConflicts(g: Grid): Set<number>      // dùng cho UI tô đỏ, không dùng trong core solver
```

`computeCandidates` trả `0` cho ô đã điền. Ô trống có candidates `0` nghĩa là bàn cờ mâu thuẫn —
caller phải xử lý, không được nuốt lỗi.

## Solver đếm nghiệm (`solver.ts`)

Chỉ phục vụ **kiểm tính duy nhất**, không phục vụ chấm độ khó.

```ts
countSolutions(g: Grid, limit = 2): number
solveFirst(g: Grid): Grid | null
```

Yêu cầu:
- Backtracking + constraint propagation nhẹ: luôn chọn ô trống có ít candidates nhất (MRV).
- Dừng ngay khi đếm đủ `limit` — đây là hàm bị gọi hàng chục nghìn lần lúc đào lỗ, tốc độ quan trọng hơn sự tinh vi.
- Không cấp phát mảng mới trong đệ quy; dùng một `Uint8Array` làm việc và undo khi backtrack.

## RNG deterministic (`rng.ts`)

Puzzle phải tái tạo được, nên không bao giờ dùng `Math.random()` trong generator.

```ts
fnv1a(s: string): number             // hash 32-bit không dấu
mulberry32(seed: number): () => number
shuffleInPlace<T>(arr: T[], rand: () => number): T[]   // Fisher-Yates
```

Seed của một màn: `fnv1a(`${level}#${index}#${GENERATOR_VERSION}`)`. Khi retry lần thứ `k`,
seed dẫn xuất là `fnv1a(`${level}#${index}#${GENERATOR_VERSION}#${k}`)` — vẫn deterministic.

## Test bắt buộc

- Round-trip `parseGrid ↔ gridToString`.
- `PEERS[0]` có đúng 20 phần tử, không chứa `0`.
- `countSolutions` trả `1` cho một puzzle chuẩn, `> 1` cho bàn cờ thiếu clue, `0` cho bàn mâu thuẫn.
- Cùng seed → cùng chuỗi số ngẫu nhiên và cùng puzzle.
