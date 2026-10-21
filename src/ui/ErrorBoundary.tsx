import { RotateCcw, Trash2 } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearAllProgress } from '../storage/schema';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Back to a known-good screen: drop the route (it may be what crashed) and reload. */
function reloadAtHome(): void {
  window.history.replaceState(null, '', '#/');
  window.location.reload();
}

function ErrorFallback(): JSX.Element {
  function handleClear(): void {
    if (window.confirm('Xóa toàn bộ tiến độ, sao, thống kê và chuỗi ngày? Hành động này không thể hoàn tác.')) {
      clearAllProgress();
      reloadAtHome();
    }
  }

  return (
    <main role="alert" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-black">Có lỗi xảy ra</h1>
      <p className="text-base font-bold text-accent">
        Ứng dụng gặp sự cố ngoài dự kiến. Hãy thử tải lại. Nếu lỗi cứ lặp lại, dữ liệu đã lưu có thể bị hỏng, khi đó bạn có thể xóa
        dữ liệu để bắt đầu lại.
      </p>
      <button type="button" onClick={reloadAtHome} className="btn btn-primary min-h-14 w-full text-lg">
        <RotateCcw size={20} strokeWidth={3} aria-hidden="true" />
        Tải lại
      </button>
      <button type="button" onClick={handleClear} className="btn btn-soft w-full text-rose-600 dark:text-rose-300">
        <Trash2 size={20} strokeWidth={2.75} aria-hidden="true" />
        Xóa dữ liệu và tải lại
      </button>
    </main>
  );
}

/**
 * Last line of defence: without it, any error thrown while rendering unmounts the whole tree and leaves a blank
 * page that no in-app control can recover from. The fallback does not depend on anything that could be broken.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.error ? <ErrorFallback /> : this.props.children;
  }
}
