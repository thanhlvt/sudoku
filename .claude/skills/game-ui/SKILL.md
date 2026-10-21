---
name: game-ui
description: Thiết kế và cài đặt giao diện web game Sudoku - màn hình chọn cấp độ, danh sách màn, bàn cờ 9x9, nhập số, ghi chú, undo, gợi ý, đồng hồ, phím tắt và accessibility. Dùng skill này khi tạo hoặc sửa bất kỳ component React nào trong src/ui hay src/game, khi thiết kế layout/màu sắc của game, hoặc khi xử lý tương tác chuột/bàn phím/cảm ứng trên bàn cờ.
---

# Game UI

Sudoku là game người ta chơi 20 phút liên tục, nhìn chằm chằm vào một lưới. Giao diện phải
chính xác và dễ chịu: chỗ đáng đầu tư thị giác nhất là **bàn cờ** — kiểu chữ số, độ dày đường kẻ,
hệ thống highlight. Phong cách tổng thể là "3D chunky" (nút có cạnh dày bên dưới, bo tròn, font Nunito,
tím làm màu chính) — xem mục *Hệ thiết kế* và *Animation* ở cuối file.

Animation chỉ để **phản hồi hành động** (chạm, điền số, sai, xong hàng, hoàn thành), ngắn (≤ 0.4s trừ
vòng lặp CTA) và không bao giờ chạy lặp quanh bàn cờ khi người chơi đang suy nghĩ.

Đọc `/mnt/skills/public/frontend-design/SKILL.md` khi chọn palette và typography, nhưng ưu tiên
các ràng buộc dưới đây khi có xung đột.

> Ngoài ba màn chính dưới đây còn có các màn phụ — Thành tựu, Lịch thử thách, Thống kê, Học kỹ thuật (+ bài học một kỹ thuật) và `IntroSheet` hướng dẫn lần đầu. Mô tả đầy đủ ở `docs/UI_DESIGN.md` §5.6–5.10; dùng `ScreenHeader` cho màn phụ mới.

## Ba màn hình (+ màn tổng kết)

1. **Home** — chuỗi ngày + cài đặt, thẻ "Chơi tiếp", "Thử thách hôm nay", 3 ô thống kê (đã giải / sao /
   kỷ lục), 5 thẻ cấp độ kèm thanh tiến độ.
2. **Level list** — header màu theo cấp, tab nhóm 20 màn, lưới màn (xong = xanh + sao, màn kế tiếp = tím
   "CHƠI"), nút cố định "Chơi màn N". Không khoá màn nào.
3. **Play** — tim + đồng hồ, bàn cờ, 4 công cụ (Hoàn tác/Xóa/Ghi chú/Gợi ý), bàn phím số. Nút tạm dừng
   phủ lên bàn cờ và chứa "Đặt lại ván" / "In".
4. **Completion** — toàn màn hình: confetti, sao, cúp, thời gian/lỗi/gợi ý, "Màn tiếp theo". Mở lại một
   màn đã xong sẽ hiện thẳng màn này (không tính lại thống kê); "Chơi lại" mới reset.

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
- Long-press (≥ 380 ms) hoặc giữ `Shift` khi bấm số = nhập theo chế độ ngược với hiện tại, một lần (ghi chú nhanh).
- Phím tắt: `R`/`Ctrl+Y` làm lại, `Ctrl+Z` hoàn tác, `F` điền mọi ghi chú. Âm thanh/rung: xem `docs/UI_DESIGN.md` §9.1 — mọi tín hiệu phát qua `useFeedback`/`playCue`, không gọi `Audio` trực tiếp trong component.
- Mỗi số trên bàn phím hiện số ô còn lại của số đó (9 − đã điền); khi hết thì làm mờ nút.

## Luật chơi trong UI

- Không cho sửa givens.
- `autoRemoveNotes` bật: điền một số thì tự xoá số đó khỏi ghi chú của mọi peer. Thao tác này
  phải nằm trong cùng một bước undo với việc điền số.
- Đếm lỗi: số nhập khác `solution` tăng `mistakes`; khi `showMistakes` bật thì ô đó còn được tô đỏ + viền.
  Không giới hạn cứng số lỗi — game này không phạt người chơi bằng cách bắt chơi lại.
  **Tim** (`MAX_HEARTS = 3`) chỉ là cách hiển thị `mistakes`: hết tim vẫn chơi tiếp. **Sao** suy ra từ
  `mistakes` (`starsFor`: 0 lỗi = 3, mỗi lỗi −1, tối thiểu 1); gợi ý không làm mất sao. Sao không lưu
  riêng — tính lại từ `SavedGame.mistakes`.
- Gợi ý: gọi `solveLogically` trên trạng thái hiện tại, lấy step đầu tiên, hiển thị `explain`
  và highlight `cells`; bấm lần nữa mới áp dụng. Gợi ý dạy kỹ thuật chứ không chỉ tiết lộ đáp án —
  đây là lý do `Step.explain` tồn tại.
- Hoàn thành: bàn đầy và khớp `solution` → dừng đồng hồ, ghi `completed`, cập nhật stats,
  hiện tổng kết (thời gian, lỗi, gợi ý, có phải kỷ lục mới không) + nút "Màn tiếp theo".
- Thử thách hôm nay: `dailyPuzzle(ngày)` chọn màn xác định theo ngày (`src/game/daily.ts`); hoàn thành đúng màn
  đó thì `completeDaily` tăng chuỗi. Chuỗi còn sống nếu hôm qua hoặc hôm nay đã xong, hoặc (còn đóng băng) hôm kia.
  Cứ 7 ngày liên tiếp nhận 1 đóng băng (tối đa 2); đóng băng bù đúng một ngày lỡ. Làm bù ngày cũ từ Lịch không tính chuỗi.
- Phần thưởng khi vừa hoàn thành (XP, lên cấp, thành tựu mới, mốc chuỗi) tính **một lần** ở effect hoàn thành của `PlaySession`; mở lại màn đã xong không có phần thưởng.

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

Undo một `Move` phải hoàn tác luôn `autoNoteChanges`. Có redo (`GameSession.redo`): nước vừa undo đi sang redo stack, mọi nước mới xoá stack này. Undo/redo không hoàn/tính lại `mistakes` và `hintsUsed`. Nước `fill-notes` (nút "Ghi hết") có `idx: -1` và chỉ mang `autoNoteChanges`.

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

## Hệ thiết kế

- **Token màu** là biến CSS dạng RGB (`--c-*` giao diện, `--b-*` bàn cờ) trong `src/index.css`, có bản sáng và
  tối (theo `settings.theme`: `data-theme` trên `<html>`, nếu `system` thì theo `prefers-color-scheme`). Component
  dùng class Tailwind map tới token (`bg-card`, `text-ink`, `bg-board-sel`...), **không** viết `dark:` cho màu nền
  hay chữ chính. Màu cấp độ (`lv1`–`lv5`) và tím chính cố định ở cả hai theme.
- **Nút 3D**: class `.btn` + biến thể (`btn-primary`, `btn-orange`, `btn-white`, `btn-soft`, `btn-tile`, `btn-sky`,
  `btn-amber`, `btn-icon`). Face phẳng + `box-shadow: 0 4px 0` màu cạnh; nhấn = dịch xuống 4px. Màu đặt qua
  `--btn-bg/--btn-edge/--btn-fg` (dùng `style` cho màu động như màu cấp). `.card` là bề mặt trắng có cạnh.
- Font Nunito (`@fontsource-variable/nunito`, đóng gói sẵn để chạy offline trong APK). Icon: `lucide-react`.
- Chữ số bàn cờ cỡ theo container query (`.board`, `.cell-digit`, `.cell-note`) kèm fallback theo `vw`.
- Cỡ chạm: nút công cụ 60px, phím số cao 64px (rộng ~35px trên màn 390px, theo thiết kế).

## Animation

Khai báo trong `tailwind.config.js` (keyframes + `animate-*`), vòng lặp CTA trong `src/index.css`.

| Hiệu ứng | Ở đâu | Cách kích hoạt |
|---|---|---|
| Nhấn/hover 3D | mọi `.btn` | CSS `:active` / `:hover` (chỉ pointer có hover) |
| `cta-ring`, `cta-shine` | CTA chính (Chơi tiếp, Chơi màn N, Màn tiếp theo, Chơi) | luôn chạy, tắt khi đang nhấn |
| `screen-in`, `pop-in` (stagger) | chuyển màn, thẻ Home, lưới màn | mount; `key` theo route để phát lại |
| `bar-grow` | thanh tiến độ | mount |
| `digit-pop` / `shake` | số điền vào ô / số sai | `<span key={value}>` trong `Cell`, chỉ sau khi ô đã mount (ván khôi phục không nhảy) |
| `wave` | hàng/cột/ô 3×3 vừa hoàn thành | `completedUnitCells` → `Board` → `Cell` (delay theo khoảng cách) |
| `hint-glow`, `wiggle` | ô gợi ý, bóng đèn khi chờ "Áp dụng" | khi có `hintPreview` |
| `heart-lost` | tim vừa mất | `Hearts` so `mistakes` với lần trước |
| `star-pop`, `trophy-drop`, `badge-wobble`, confetti | màn Completion | mount, trễ theo thứ tự |
| `sheet-up`, `fade-in` | Settings, Completion, overlay tạm dừng | mount |

Quy tắc khi thêm animation:
- Entrance dùng `animation-fill-mode: backwards` (không `both`/`forwards`), nếu không keyframe cuối sẽ giữ
  `transform` và đè lên hiệu ứng nhấn của `.btn`.
- Không phát animation cho thứ đã có sẵn lúc mount (givens, ván khôi phục).
- `prefers-reduced-motion` đã tắt mọi animation/transition và ẩn confetti trong `index.css` — không thêm ngoại lệ.
- Đồng hồ cập nhật mỗi giây nên đừng gắn animation vào thứ render lại theo `version` mà không có điều kiện.
