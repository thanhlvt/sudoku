import type { Message } from '../../message';

export const viExplain = {
  'explain.unit.row': 'hàng {n}',
  'explain.unit.col': 'cột {n}',
  'explain.unit.box': 'khối {n}',
  'explain.cell': 'hàng {row}, cột {col}',
  'explain.naked.2': 'cặp trần',
  'explain.naked.3': 'bộ ba trần',
  'explain.naked.4': 'bộ bốn trần',
  'explain.hidden.2': 'cặp ẩn',
  'explain.hidden.3': 'bộ ba ẩn',
  'explain.hidden.4': 'bộ bốn ẩn',
  'explain.fish.2': 'X-Wing',
  'explain.fish.3': 'Swordfish',
  'explain.fish.4': 'Jellyfish',

  'explain.full-house': '{unit} chỉ còn đúng 1 ô trống, nên ô đó phải là số {digit}.',
  'explain.naked-single': 'Ô {cell} chỉ còn duy nhất 1 số có thể điền: {digit}.',
  'explain.hidden-single': 'Trong {unit}, số {digit} chỉ còn nằm được ở ô {cell}.',
  'explain.pointing': 'Trong {box}, số {digit} chỉ còn nằm trên {line}, nên bị loại khỏi các ô còn lại của {line} ({targets}).',
  'explain.claiming': 'Trong {line}, số {digit} chỉ còn nằm trong {box}, nên bị loại khỏi các ô còn lại của {box} ({targets}).',
  'explain.naked-subset':
    'Trong {unit}, {size} ô ({cells}) chỉ có thể chứa các số {{digits}} — đây là một {name}, nên các số đó bị loại khỏi những ô khác trong {unit}.',
  'explain.hidden-subset':
    'Trong {unit}, các số {{digits}} chỉ còn nằm được ở {size} ô ({cells}) — đây là một {name}, nên mọi số khác bị loại khỏi các ô đó.',
  'explain.fish':
    '{name}: số {digit} trong {bases} chỉ nằm ở đúng {size} vị trí chung cột/hàng, nên bị loại khỏi các ô còn lại của những cột/hàng đó ({targets}).',
  'explain.skyscraper':
    'Skyscraper trên số {digit}: {unitA} và {unitB} mỗi hàng/cột chỉ còn 2 vị trí, chung một cột/hàng ở {anchor}, nên số {digit} bị loại khỏi ô {target}.',
  'explain.coloring-clash':
    'Xích tô màu cho số {digit}: hai ô cùng màu {cellA} và {cellB} nhìn thấy nhau nên màu đó sai, loại số {digit} khỏi {targets}.',
  'explain.coloring-both': 'Xích tô màu cho số {digit}: ô {cell} nhìn thấy cả hai màu của xích, nên số {digit} bị loại khỏi ô đó.',
  'explain.unique-rectangle':
    'Hình chữ nhật {corners} có 3 góc chỉ mang {{digits}}; nếu góc còn lại ({odd}) cũng chỉ mang 2 số đó thì bàn cờ có 2 nghiệm, nên các số đó bị loại khỏi ô {odd}.',
  'explain.w-wing':
    'W-Wing giữa {cellA} và {cellB} (cùng {{x}, {y}}), nối bởi liên kết mạnh trên số {y}: số {x} bị loại khỏi {targets}.',
  'explain.xy-wing':
    'XY-Wing quanh ô trục {pivot} ({digits}) và hai càng {claw1}, {claw2}: số {z} bị loại khỏi {targets}.',
  'explain.xyz-wing':
    'XYZ-Wing quanh ô trục {pivot} ({digits}) và hai càng {claw1}, {claw2}: số {z} bị loại khỏi {targets}.',

  'reminder.generic.1.title': 'Thử thách hôm nay đang chờ bạn',
  'reminder.generic.1.body': 'Một màn Sudoku mới, giải bằng suy luận, chỉ vài phút thôi.',
  'reminder.generic.2.title': 'Đến giờ luyện trí não',
  'reminder.generic.2.body': 'Hoàn thành thử thách hằng ngày để mở thành tựu mới.',
  'reminder.generic.3.title': 'Một màn Sudoku nhé?',
  'reminder.generic.3.body': 'Thử thách hôm nay đã sẵn sàng.',
  'reminder.waiting.title': 'Chuỗi {streak} ngày đang chờ bạn',
  'reminder.waiting.body': 'Làm thử thách hôm nay để kéo dài thành {next} ngày.',
  'reminder.keep.title': 'Giữ chuỗi {streak} ngày!',
  'reminder.keep.body': 'Làm thử thách hôm nay để chuỗi thành {next} ngày.',

  'share.title': 'Sudoku',
  'share.dailyTitle': 'Sudoku · Thử thách {date}',
  'share.level': '{level} · Màn {n} {stars}',
  'share.mistakes': '{count} lỗi',
  'share.hints': '{count} gợi ý',
  'share.streak': 'Chuỗi {count} ngày',
} satisfies Record<string, Message>;
