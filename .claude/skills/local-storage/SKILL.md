---
name: local-storage
description: Schema và adapter lưu tiến độ game Sudoku bằng localStorage - ván đang chơi, ghi chú, đồng hồ, thống kê, cài đặt, versioning và migration. Dùng skill này khi viết src/storage, khi lưu hoặc khôi phục ván chơi dở, khi thêm trường dữ liệu mới cần lưu, hoặc khi xử lý lỗi quota/JSON hỏng.
---

# Local Storage

Không có backend, nên `localStorage` là nguồn sự thật duy nhất về tiến độ người chơi.
Nó có thể bị xoá bất cứ lúc nào (chế độ ẩn danh, clear site data) — code phải chịu được điều đó
mà không văng lỗi.

## Namespace & khoá

Mọi khoá bắt đầu bằng `sudoku:v1:`. Số `v1` là **schema version**, đổi khi format không tương thích.

| Khoá | Nội dung |
|---|---|
| `sudoku:v1:meta` | `{ schemaVersion, generatorVersion, createdAt, updatedAt }` |
| `sudoku:v1:settings` | cài đặt người chơi |
| `sudoku:v1:stats` | thống kê theo cấp độ |
| `sudoku:v1:game:<puzzleId>` | ván đang chơi hoặc đã xong của màn đó |
| `sudoku:v1:last` | `{ puzzleId, at }` để nút "Chơi tiếp" |

Một khoá riêng cho mỗi ván (thay vì gộp hết vào một object khổng lồ) giúp ghi nhanh và giới hạn
thiệt hại khi một bản ghi hỏng.

## Kiểu dữ liệu

```ts
interface SavedGame {
  puzzleId: string;
  board: string;          // 81 ký tự, '.' = trống — chỉ giá trị người chơi + givens
  notes: string;          // 81 nhóm bitmask hex 3 ký tự, nối liền nhau
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  status: 'in-progress' | 'completed';
  completedAt?: number;
  updatedAt: number;
}

interface Settings {
  highlightSameDigit: boolean;   // default true
  highlightPeers: boolean;       // default true
  showMistakes: boolean;         // default true
  autoRemoveNotes: boolean;      // default true
  theme: 'system' | 'light' | 'dark';
  soundEnabled: boolean;         // default false
}

interface LevelStats {
  played: number;
  completed: number;
  bestMs: number | null;
  totalMs: number;
  perfectRuns: number;           // hoàn thành với 0 lỗi và 0 gợi ý
}
type Stats = Record<Level, LevelStats>;
```

Không lưu `solution` vào localStorage — nó đã có trong bank, và lưu ra đó là mời người chơi mở
DevTools xem đáp án.

Không lưu undo stack (có thể rất dài). Undo là trạng thái trong phiên; reload thì mất, chấp nhận được.

## Adapter

```ts
// src/storage/storage.ts
readJSON<T>(key: string, fallback: T): T
writeJSON(key: string, value: unknown): boolean   // false nếu thất bại
removeKey(key: string): void
isAvailable(): boolean
```

Yêu cầu:

- Bọc mọi truy cập trong `try/catch`. Safari chế độ riêng tư ném lỗi ngay khi `setItem`.
- `readJSON` gặp JSON hỏng hoặc sai kiểu → xoá khoá đó, trả `fallback`, không ném lỗi.
- Nếu `isAvailable()` false → chạy ở chế độ memory-only, hiện banner nhẹ báo "tiến độ sẽ không
  được lưu". Game vẫn chơi được bình thường.
- Quota vượt (`QuotaExceededError`) → dọn các ván `completed` cũ nhất trước, thử lại một lần,
  rồi mới báo lỗi.

## Nhịp ghi

Ghi mỗi lần đặt số là quá nhiều I/O; ghi quá thưa thì mất tiến độ khi đóng tab.

- Debounce 500ms sau mỗi thay đổi bàn cờ/ghi chú.
- Ghi ngay (không debounce) khi: hoàn thành màn, rời màn, `visibilitychange` sang `hidden`,
  và trong `pagehide`.
- Đồng hồ: chỉ lưu `elapsedMs` tích luỹ, không lưu timestamp bắt đầu. Đồng hồ dừng khi tab ẩn.

## Migration

```ts
migrate(): void   // gọi một lần lúc khởi động, trước khi UI đọc dữ liệu
```

- Đọc `sudoku:v1:meta`. Không có → khởi tạo mặc định.
- `schemaVersion` cũ hơn → chạy các bước migration theo thứ tự. Viết mỗi bước là một hàm thuần
  `vN → vN+1` để test được.
- `generatorVersion` trong meta khác với manifest → các ván `in-progress` có thể thuộc puzzle
  đã đổi. Xử lý: khi mở một ván lưu, so `board` với givens của puzzle hiện tại; lệch thì bỏ ván
  lưu đó và bắt đầu lại, đồng thời giữ nguyên thống kê. Đừng xoá sạch mọi thứ.

## Xoá dữ liệu

Trong Settings có nút "Xoá toàn bộ tiến độ" — hỏi xác nhận, rồi xoá mọi khoá có tiền tố
`sudoku:` (kể cả version cũ). Đây là hành động không hoàn tác được nên phải nói rõ trong dialog.

## Test bắt buộc

- Ghi rồi đọc `SavedGame` round-trip đúng, kể cả notes.
- JSON hỏng trong khoá → `readJSON` trả fallback và khoá bị xoá.
- `localStorage` bị stub ném lỗi → app vẫn khởi động được.
- Migration từ meta không tồn tại → tạo mặc định, không mất stats sẵn có.
