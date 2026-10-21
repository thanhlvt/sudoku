import type { Message } from '../../message';

export const viCommon = {
  'common.back': 'Quay lại',
  'common.close': 'Đóng',
  'common.retry': 'Thử lại',
  'common.loading': 'Đang tải...',
  'common.play': 'Chơi',
  'common.dataLoadFailed': 'Không tải được dữ liệu màn chơi.',
  'common.puzzleNumber': 'Màn {n}',
  'common.levelPuzzle': '{level} · Màn {n}',
  'common.starsOf': '{count} trên {total} sao',
  'common.done': 'đã xong',
  'common.notDone': 'chưa làm',

  'level.beginner': 'Mới bắt đầu',
  'level.easy': 'Dễ',
  'level.medium': 'Trung bình',
  'level.hard': 'Khó',
  'level.expert': 'Chuyên gia',

  'hearts.aria': 'Còn {left} trên {max} tim',
  'timer.remaining': 'Còn lại {time}',
  'timer.elapsed': 'Thời gian {time}',
  'timer.paused': '{label}, đang tạm dừng',

  'storage.memoryOnly': 'Trình duyệt không cho lưu dữ liệu, nên tiến độ sẽ mất khi bạn đóng trang.',
  'storage.writeFailed': 'Bộ nhớ đã đầy nên tiến độ mới chưa được lưu. Hãy giải phóng dung lượng rồi chơi tiếp.',

  'confirm.clearAll': 'Xóa toàn bộ tiến độ, sao, thống kê và chuỗi ngày? Hành động này không thể hoàn tác.',
  'error.title': 'Có lỗi xảy ra',
  'error.body':
    'Ứng dụng gặp sự cố ngoài dự kiến. Hãy thử tải lại. Nếu lỗi cứ lặp lại, dữ liệu đã lưu có thể bị hỏng, khi đó bạn có thể xóa dữ liệu để bắt đầu lại.',
  'error.reload': 'Tải lại',
  'error.clearReload': 'Xóa dữ liệu và tải lại',

  'board.aria': 'Bàn cờ Sudoku',
  'board.cell.empty': 'Hàng {row}, cột {col}, trống',
  'board.cell.filled': 'Hàng {row}, cột {col}, số {value}',
  'board.cell.given': 'Hàng {row}, cột {col}, số {value}, cho sẵn',
  'board.cell.wrong': 'Hàng {row}, cột {col}, số {value}, sai',
  'pad.aria': 'Bàn phím số',
  'pad.digit': 'Số {digit}, còn {left} ô',
  'pad.digitNote': 'Số {digit}, chế độ ghi chú, còn {left} ô',
  'example.aria': 'Bàn ví dụ minh hoạ kỹ thuật. Ô nền vàng là các ô tham gia; số gạch đỏ là số bị loại.',

  'print.title': 'Sudoku — {level}',
  'print.meta': 'Màn số {n} · Mã: {id}',
  'print.solution': 'Đáp án — {id}',

  'player.levelShort': 'Cấp',
  'player.xpAria': 'Cấp {level}, {into} trên {span} kinh nghiệm',
  'player.title.1': 'Tân binh',
  'player.title.5': 'Người luyện trí',
  'player.title.10': 'Cao thủ',
  'player.title.15': 'Đại sư',
  'player.title.20': 'Huyền thoại',

  'palette.violet': 'Tím',
  'palette.ocean': 'Đại dương',
  'palette.forest': 'Rừng xanh',
  'palette.sunset': 'Hoàng hôn',
} satisfies Record<string, Message>;
