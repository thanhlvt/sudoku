# Bảng kỹ thuật & cost

Thứ tự trong bảng cũng là thứ tự solver thử. Cài theo nhóm, mỗi nhóm xong thì test rồi mới sang nhóm sau.

| # | Kỹ thuật | Tên (`name`) | Cost | Cấp mở khoá |
|---|---|---|---|---|
| 1 | Full House / Last Digit | `full-house` | 1 | beginner |
| 2 | Naked Single | `naked-single` | 2 | beginner |
| 3 | Hidden Single (trong box) | `hidden-single-box` | 3 | beginner |
| 4 | Hidden Single (hàng/cột) | `hidden-single-line` | 4 | easy |
| 5 | Locked Candidates — Pointing | `pointing` | 6 | medium |
| 6 | Locked Candidates — Claiming | `claiming` | 7 | medium |
| 7 | Naked Pair | `naked-pair` | 8 | medium |
| 8 | Hidden Pair | `hidden-pair` | 10 | medium |
| 9 | Naked Triple | `naked-triple` | 14 | hard |
| 10 | Hidden Triple | `hidden-triple` | 16 | hard |
| 11 | X-Wing | `x-wing` | 20 | hard |
| 12 | Naked Quad | `naked-quad` | 21 | hard |
| 13 | Hidden Quad | `hidden-quad` | 22 | hard |
| 14 | Skyscraper | `skyscraper` | 26 | expert |
| 15 | Swordfish | `swordfish` | 28 | expert |
| 16 | XY-Wing | `xy-wing` | 30 | expert |
| 17 | XYZ-Wing | `xyz-wing` | 32 | expert |
| 18 | W-Wing | `w-wing` | 33 | expert |
| 19 | Simple Coloring (Single Chain) | `simple-coloring` | 34 | expert |
| 20 | Unique Rectangle type 1 | `unique-rectangle-1` | 36 | expert |
| 21 | Jellyfish | `jellyfish` | 40 | expert |

Không thêm kỹ thuật có cost > 40 (Forcing Chain, ALS, Nishio...). Chúng biến "suy luận" thành
"thử và loại", tức là đoán mò trá hình — đúng thứ mà nguyên tắc số 2 trong CLAUDE.md cấm.

---

## Nhóm 1 — Singles

**Full House**: một unit chỉ còn đúng 1 ô trống → điền số còn thiếu.

**Naked Single**: ô có `popcount(cands[idx]) === 1` → điền số đó.

**Hidden Single**: trong một unit, digit `d` chỉ còn xuất hiện ở đúng 1 ô → điền `d` vào ô đó.
Tách làm 2 kỹ thuật vì box dễ nhìn hơn line rõ rệt với người mới: nếu ô đó tìm được khi quét box
thì tính `hidden-single-box` (cost 3), nếu chỉ tìm được khi quét hàng/cột thì `hidden-single-line` (cost 4).
Cài: quét BOXES trước, chỉ khi không thấy gì mới quét ROWS/COLS.

## Nhóm 2 — Locked Candidates

**Pointing** (box → line): trong 1 box, tất cả ô còn candidate `d` đều nằm trên cùng 1 hàng (hoặc cột)
→ loại `d` khỏi các ô còn lại của hàng/cột đó nằm ngoài box.

**Claiming** (line → box): trong 1 hàng/cột, tất cả ô còn candidate `d` đều nằm trong cùng 1 box
→ loại `d` khỏi các ô còn lại của box đó.

Cả hai chỉ tính là step nếu **thực sự loại được ít nhất 1 candidate**. Step không loại được gì
làm solver lặp vô hạn — đây là bug hay gặp nhất ở nhóm này.

## Nhóm 3 — Subsets

**Naked Subset (pair/triple/quad)**: trong 1 unit, `k` ô mà hợp các candidate của chúng có đúng
`k` digit → loại `k` digit đó khỏi mọi ô khác trong unit.
Cài tổng quát theo `k`, duyệt tổ hợp `k` ô trong 9 ô của unit; chỉ xét ô trống có `popcount ≥ 2`.

**Hidden Subset (pair/triple/quad)**: trong 1 unit, `k` digit mà tập ô chứa chúng có đúng `k` ô
→ loại mọi digit khác khỏi `k` ô đó.

Với `k = 3, 4` không yêu cầu mỗi ô phải có đủ `k` candidate — chỉ cần hợp/giao đúng kích thước.
Đây là lỗi cài đặt kinh điển, nhớ viết test cho trường hợp triple dạng `{1,2} {2,3} {1,3}`.

## Nhóm 4 — Fish

**X-Wing**: digit `d`, 2 hàng mà `d` chỉ xuất hiện ở đúng 2 cột giống nhau → loại `d` khỏi 2 cột đó
ở các hàng khác. Và đối xứng cho cột↔hàng.

**Swordfish**: như trên với 3 hàng / 3 cột, mỗi hàng có 2 hoặc 3 vị trí, hợp lại đúng 3 cột.

**Jellyfish**: 4×4.

Cài một hàm `findFish(size, digit, base)` dùng chung cho cả ba, tránh copy-paste ba lần.

## Nhóm 5 — Wings & chains

**Skyscraper**: digit `d`, 2 hàng mỗi hàng chỉ có 2 vị trí của `d`, chia sẻ đúng 1 cột chung
→ 2 đầu còn lại "nhìn thấy" ô nào thì loại `d` ở ô đó.

**XY-Wing**: pivot có candidates `{x,y}`, hai pincer `{x,z}` và `{y,z}` đều là peer của pivot
→ loại `z` khỏi mọi ô là peer chung của cả hai pincer.

**XYZ-Wing**: pivot `{x,y,z}`, hai pincer `{x,z}`, `{y,z}` là peer của pivot → loại `z` khỏi ô
nhìn thấy cả ba.

**W-Wing**: hai ô cùng candidates `{x,y}` không nhìn thấy nhau, nối bởi một strong link trên `y`
→ loại `x` khỏi peer chung.

**Simple Coloring**: xây đồ thị strong link của digit `d` (unit chỉ còn 2 vị trí của `d`),
tô 2 màu xen kẽ. Hai kết luận dùng được: (a) hai ô cùng màu nhìn thấy nhau → màu đó sai, loại `d`
khỏi toàn bộ ô màu đó; (b) ô ngoài chuỗi nhìn thấy cả hai màu → loại `d` khỏi ô đó.

## Nhóm 6 — Uniqueness

**Unique Rectangle type 1**: 4 ô tạo hình chữ nhật nằm trong đúng 2 box, 3 ô có candidates chính xác
`{x,y}`, ô thứ 4 có `{x,y}` cộng thêm digit khác → loại `x`, `y` khỏi ô thứ 4.

Kỹ thuật này dựa trên giả định puzzle có nghiệm duy nhất. Điều đó luôn đúng với puzzle của ta
(generator đã kiểm), nhưng nghĩa là **không được dùng nó trong `countSolutions`** — chỉ dùng trong
logical solver.

---

## Checklist khi thêm một kỹ thuật mới

1. Thêm entry vào bảng cost ở trên và vào `TECHNIQUE_ORDER` trong `logicalSolver.ts`.
2. `find` chỉ trả step khi có ít nhất 1 placement hoặc 1 elimination thực sự.
3. Viết `explain` bằng tiếng Việt, ngắn, nêu đúng lý do — chuỗi này hiện lên UI khi người chơi bấm gợi ý.
   Ví dụ: `"Trong khối giữa, số 7 chỉ còn nằm được ở hàng 5 nên bị loại khỏi các ô khác của hàng 5."`
4. Test: 1 bàn positive, 1 bàn negative.
5. Chạy lại `npm run verify` — thêm kỹ thuật có thể làm một số màn cũ tụt tier.
   Nếu tụt, hoặc bump `GENERATOR_VERSION` và sinh lại, hoặc pin bank cũ và chỉ áp dụng cho màn mới.
