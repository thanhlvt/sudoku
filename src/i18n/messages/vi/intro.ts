import type { Message } from '../../message';

export const viIntro = {
  'intro.title': 'Cách chơi',
  'intro.pagesAria': 'Trang hướng dẫn',
  'intro.page': 'Trang {n}',
  'intro.skip': 'Bỏ qua',
  'intro.back': 'Quay lại',
  'intro.next': 'Tiếp',
  'intro.start': 'Bắt đầu chơi',
  'intro.rules.title': 'Luật chơi',
  'intro.rules.body': 'Điền các số từ 1 đến 9 vào lưới sao cho mỗi hàng, mỗi cột và mỗi khối 3×3 đều có đủ chín số, không lặp.',
  'intro.rules.detail': 'Chạm một ô rồi chạm số ở bàn phím bên dưới. Số sai sẽ bị tô đỏ.',
  'intro.notes.title': 'Ghi chú',
  'intro.notes.body': 'Bật “Ghi chú” để ghi các số có thể điền vào một ô. Ghi chú giúp bạn thấy khi nào chỉ còn một khả năng.',
  'intro.notes.detail': 'Nhấn giữ một số để ghi nhanh. “Ghi hết” điền sẵn mọi khả năng cho bạn.',
  'intro.logic.title': 'Không cần đoán',
  'intro.logic.body': 'Mọi màn đều giải được bằng suy luận thuần, không phải thử và sai.',
  'intro.logic.detail': 'Bí rồi? Bấm “Gợi ý”: lần đầu giải thích kỹ thuật cần dùng, lần hai mới điền giúp.',
  'intro.daily.title': 'Quay lại mỗi ngày',
  'intro.daily.body': 'Mỗi ngày có một thử thách riêng. Hoàn thành liên tiếp để tăng chuỗi và mở khoá thành tựu, bảng màu mới.',
  'intro.daily.detail': 'Muốn giỏi hơn? Vào “Học” để xem từng kỹ thuật kèm ví dụ thật.',
} satisfies Record<string, Message>;
