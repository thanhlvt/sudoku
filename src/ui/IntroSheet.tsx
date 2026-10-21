import { CalendarDays, Grid3x3, Lightbulb, PencilLine, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from './Sheet';

interface Page {
  icon: LucideIcon;
  title: string;
  body: string;
  detail: string;
}

const PAGES: readonly Page[] = [
  {
    icon: Grid3x3,
    title: 'Luật chơi',
    body: 'Điền các số từ 1 đến 9 vào lưới sao cho mỗi hàng, mỗi cột và mỗi khối 3×3 đều có đủ chín số, không lặp.',
    detail: 'Chạm một ô rồi chạm số ở bàn phím bên dưới. Số sai sẽ bị tô đỏ.',
  },
  {
    icon: PencilLine,
    title: 'Ghi chú',
    body: 'Bật “Ghi chú” để ghi các số có thể điền vào một ô. Ghi chú giúp bạn thấy khi nào chỉ còn một khả năng.',
    detail: 'Nhấn giữ một số để ghi nhanh. “Ghi hết” điền sẵn mọi khả năng cho bạn.',
  },
  {
    icon: Lightbulb,
    title: 'Không cần đoán',
    body: 'Mọi màn đều giải được bằng suy luận thuần, không phải thử và sai.',
    detail: 'Bí rồi? Bấm “Gợi ý”: lần đầu giải thích kỹ thuật cần dùng, lần hai mới điền giúp.',
  },
  {
    icon: CalendarDays,
    title: 'Quay lại mỗi ngày',
    body: 'Mỗi ngày có một thử thách riêng. Hoàn thành liên tiếp để tăng chuỗi và mở khoá thành tựu, bảng màu mới.',
    detail: 'Muốn giỏi hơn? Vào “Học” để xem từng kỹ thuật kèm ví dụ thật.',
  },
];

interface IntroSheetProps {
  onClose: () => void;
}

/** A four-page "how to play" shown on the first visit and from Settings. */
export function IntroSheet({ onClose }: IntroSheetProps): JSX.Element {
  const [page, setPage] = useState(0);
  const { icon: Icon, title, body, detail } = PAGES[page]!;
  const last = page === PAGES.length - 1;

  return (
    <Sheet title="Cách chơi" onClose={onClose}>
      <div key={page} className="flex animate-screen-in flex-col items-center gap-4 px-1 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white shadow-[0_5px_0_0_#5B21B6]">
          <Icon size={40} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h3 className="text-2xl font-black">{title}</h3>
        <p className="text-lg font-bold leading-snug">{body}</p>
        <p className="rounded-2xl bg-soft px-4 py-3 text-base font-bold leading-snug text-accent">{detail}</p>
      </div>

      <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Trang hướng dẫn">
        {PAGES.map((_, i) => (
          <span
            key={i}
            role="tab"
            aria-selected={i === page}
            aria-label={`Trang ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${i === page ? 'w-6 bg-primary' : 'w-2.5 bg-soft'}`}
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => (page === 0 ? onClose() : setPage(page - 1))}
          className="btn btn-soft min-h-14 text-base"
        >
          {page === 0 ? 'Bỏ qua' : 'Quay lại'}
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => (last ? onClose() : setPage(page + 1))}
          className="btn btn-primary min-h-14 text-base"
        >
          {last ? 'Bắt đầu chơi' : 'Tiếp'}
        </button>
      </div>
    </Sheet>
  );
}
