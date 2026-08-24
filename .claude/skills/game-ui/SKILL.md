---
name: game-ui
description: Thiết kế và cài đặt giao diện web game Sudoku - màn hình chọn cấp độ, danh sách màn, bàn cờ 9x9, nhập số, ghi chú, undo, gợi ý, đồng hồ, phím tắt và accessibility. Dùng skill này khi tạo hoặc sửa bất kỳ component React nào trong src/ui hay src/game, khi thiết kế layout/màu sắc của game, hoặc khi xử lý tương tác chuột/bàn phím/cảm ứng trên bàn cờ.
---

# Game UI

Sudoku là game người ta chơi 20 phút liên tục, nhìn chằm chằm vào một lưới. Giao diện phải
im lặng và chính xác: không animation thừa, không màu chói, không gì nhảy nhót khi đang tính toán.
Chỗ duy nhất đáng đầu tư thị giác là **bàn cờ** — kiểu chữ số, độ dày đường kẻ, hệ thống highlight.

Đọc `/mnt/skills/public/frontend-design/SKILL.md` khi chọn palette và typography, nhưng ưu tiên
các ràng buộc dưới đây khi có xung đột.

## Ba màn hình

1. **Home** — chọn cấp độ (5 thẻ, kèm tiến độ `12/20 đã xong`), nút "Chơi tiếp" nếu có ván dở.
2. **Level list** — lưới các màn của một cấp: số thứ tự, trạng thái, thời gian tốt nhất.
   Không khoá màn nào.
3. **Play** — bàn cờ + thanh công cụ + bàn phím số.

Routing: hash-based (`#/`, `#/level/hard`, `#/play/hard-007`) để deploy static ở bất kỳ đâu
mà không cần cấu hình rewrite.

## Bàn cờ

- Lưới CSS `grid` 9×9, ô vuông, `aspect-ratio: 1`. Kích thước bàn cờ = `min(92vw, 60vh, 560px)`.
- Đường kẻ: 1px cho ô, 2–3px cho biên box 3×3. Dùng `box-shadow`/`border` chứ đừng vẽ SVG
  chồng lên, vì cần ô nhận được sự kiện chuột trực tiếp.
- Số cho sẵn (givens) và số người chơi nhập phải phân biệt rõ: givens đậm/tối, số nhập nhạt hơn
  hoặc khác màu. Người chơi cần biết ngay ô nào là bất biến.
- Ghi chú: 3×3 mini-grid trong ô, cỡ chữ ~28% ô.
- Chữ số dùng font có `tabular-nums` và chữ số dễ phân biệt (1/7, 6/8). Font hệ thống là đủ;
  nếu chọn webfont, chỉ nạp subset chữ số.

### Hệ thống highlight (theo thứ tự ưu tiên khi chồng nhau)

1. Ô đang chọn — nền đậm nhất.
2. Ô sai (nếu bật `showMistakes`) — nền đỏ nhạt, chữ đỏ.
3. Ô cùng giá trị với ô đang chọn — nền nhấn.
4. Peers (cùng hàng/cột/box) — nền rất nhạt.

Đừng dùng màu để mã hoá thông tin duy nhất — phải kèm khác biệt về độ đậm hoặc viền, cho người
mù màu và cho màn hình chói.

## Tương tác

- Click/tap ô → chọn. Click lại số đã có trên bàn phím → xoá.
- Bàn phím: `1–9` điền, `0`/`Backspace`/`Delete` xoá, mũi tên di chuyển, `N` bật/tắt chế độ ghi chú,
  `U` undo, `H` gợi ý, `Space` tạm dừng.
- Mobile: bàn phím số cố định dưới màn hình, nút to tối thiểu 44×44px, có nút toggle ghi chú
  ngay cạnh. Không dùng `<input>` để tránh bàn phím hệ thống bật lên.
- Long-press hoặc giữ `Shift` khi bấm số = nhập ghi chú nhanh.
- Mỗi số trên bàn phím hiện số ô còn lại của số đó (9 − đã điền); khi hết thì làm mờ nút.

## Luật chơi trong UI

- Không cho sửa givens.
- `autoRemoveNotes` bật: điền một số thì tự xoá số đó khỏi ghi chú của mọi peer. Thao tác này
  phải nằm trong cùng một bước undo với việc điền số.
- Đếm lỗi: khi `showMistakes` bật, số nhập khác `solution` được đánh dấu ngay và tăng `mistakes`.
  Không giới hạn cứng số lỗi — game này không phạt người chơi bằng cách bắt chơi lại.
- Gợi ý: gọi `solveLogically` trên trạng thái hiện tại, lấy step đầu tiên, hiển thị `explain`
  và highlight `cells`; bấm lần nữa mới áp dụng. Gợi ý dạy kỹ thuật chứ không chỉ tiết lộ đáp án —
  đây là lý do `Step.explain` tồn tại.
- Hoàn thành: bàn đầy và khớp `solution` → dừng đồng hồ, ghi `completed`, cập nhật stats,
  hiện tổng kết (thời gian, lỗi, gợi ý, có phải kỷ lục mới không) + nút "Màn tiếp theo".

## Undo

Stack trong bộ nhớ, mỗi entry là một `Move`:

```ts
interface Move {
  type: 'set' | 'erase' | 'note';
  idx: number;
  before: { value: number; notes: number };
  after: { value: number; notes: number };
  autoNoteChanges?: { idx: number; before: number; after: number }[];
}
```

Undo một `Move` phải hoàn tác luôn `autoNoteChanges`. Không có redo (hiếm ai dùng trong Sudoku).

## Accessibility

- Bàn cờ là `role="grid"`, mỗi ô `role="gridcell"` với `aria-label` kiểu `"Hàng 3, cột 5, trống"`
  hoặc `"Hàng 3, cột 5, số 7, cho sẵn"`.
- Điều hướng bàn phím đầy đủ, focus ring nhìn thấy được, không bẫy focus.
- Tôn trọng `prefers-reduced-motion`: tắt mọi transition khi bật.
- Tương phản chữ/nền ≥ 4.5:1 ở cả light và dark.

## Hiệu năng

- Bàn cờ 81 ô re-render mỗi lần gõ phím. Memo hoá từng ô theo `(value, notes, highlightState)`
  để không render lại cả 81 ô cho một thay đổi.
- Đồng hồ cập nhật mỗi giây phải nằm trong component riêng, không kéo cả bàn cờ render theo.
- Không chạy `solveLogically` trong render — chỉ chạy khi người chơi bấm gợi ý.
