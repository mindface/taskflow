// src/components/VirtualDesktopView.tsx
import { useState, useEffect } from 'react';
import { ManageWindowService, WindowInfo } from '../service/ManageWindowService';
import '../styles/virtualDesktop.css';

/*
function startWindowListTimer(onTick: () => void, intervalMs = 5000): () => void {
  const intervalId = window.setInterval(onTick, intervalMs);
  return () => window.clearInterval(intervalId);
}
*/

export default function VirtualDesktopView() {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWindow, setSelectedWindow] = useState<WindowInfo | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const applyWindows = (nextWindows: WindowInfo[]) => {
      const validWindows = nextWindows.filter(
        (item) => item.is_visible && !item.is_minimized && item.width > 0 && item.height > 0
      );
      setWindows(validWindows);
    };

    const loadWindows = async () => {
      try {
        const snapshot = await ManageWindowService.listAppWindows();
        if (!cancelled) {
          applyWindows(snapshot.windows);
        }
      } catch (error) {
        console.error('[VirtualDesktopView] Failed to load windows:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWindows();
    void ManageWindowService.onAppWindowsUpdated((payload) => {
      if (!cancelled) {
        applyWindows(payload.windows);
        setLoading(false);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    // 定期取得が必要な場合は下のコメントを外す
    // const stopWindowListTimer = startWindowListTimer(() => {
    //   void loadWindows();
    // });

    return () => {
      cancelled = true;
      unlisten?.();
      // stopWindowListTimer();
    };
  }, []);

  const handleWindowSelect = (window: WindowInfo) => {
    setSelectedWindow(window);
  };

  const handleFocusWindow = async (window: WindowInfo) => {
    try {
      await ManageWindowService.focusWindow(window);
    } catch (error) {
      console.error('Failed to focus window:', error);
    }
  };

  const handleAlwaysOnTop = async (window: WindowInfo) => {
    try {
      await ManageWindowService.setAlwaysOnTop(window);
    } catch (error) {
      console.error('Failed to set window always on top:', error);
    }
  };

  const handleRemoveWindow = async (window: WindowInfo) => {
    try {
      await ManageWindowService.removeWindow(window.handle, window.title);
      setWindows((current) => current.filter((item) => item.handle !== window.handle));
      if (selectedWindow?.handle === window.handle) {
        setSelectedWindow(null);
      }
    } catch (error) {
      console.error('Failed to remove window:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      const snapshot = await ManageWindowService.listAppWindows();
      setWindows(
        snapshot.windows.filter(
          (item) => item.is_visible && !item.is_minimized && item.width > 0 && item.height > 0
        )
      );
    } catch (error) {
      console.error('[VirtualDesktopView] Failed to refresh windows:', error);
    }
  };

  if (loading && windows.length === 0) {
    return (
      <div className="virtual-desktop-view loading">
        <div className="spinner"></div>
        <p>ウィンドウを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="virtual-desktop-view">
      <div className="header">
        <h1>開いているウィンドウ ({windows.length})</h1>
        <button onClick={handleRefresh} className="btn">
          🔄 更新
        </button>
      </div>

      <div className="window-browser">
        <ol className="window-numbered-list" aria-label="開いているウィンドウ一覧">
          {windows.map((window, index) => (
            <li key={window.label ?? window.handle}>
              <button
                type="button"
                className={`window-numbered-item ${
                  selectedWindow?.handle === window.handle ? 'selected' : ''
                }`}
                aria-pressed={selectedWindow?.handle === window.handle}
                onClick={() => handleWindowSelect(window)}
              >
                <span className="window-number">{index + 1}</span>
                <span className="window-list-title">{window.title}</span>
              </button>
            </li>
          ))}
        </ol>

        {selectedWindow && (
          <section className="window-selected-details" aria-live="polite">
            <div className="thumbnail-container">
              {selectedWindow.thumbnail ? (
                <img src={selectedWindow.thumbnail} alt={selectedWindow.title} className="thumbnail" />
              ) : (
                <div className="thumbnail-placeholder">
                  <span>📄</span>
                  <p>{selectedWindow.label || 'Taskflow'}</p>
                </div>
              )}
            </div>
            <div className="window-info">
              <h3 className="window-title">{selectedWindow.title}</h3>
              <dl className="window-selected-meta">
                <dt>ページ</dt>
                <dd>{(selectedWindow.page_path === '/' ? 'home' : selectedWindow.page_path) || '未取得'}</dd>
                <dt>サイズ</dt>
                <dd>{selectedWindow.width} × {selectedWindow.height}</dd>
                <dt>位置</dt>
                <dd>({selectedWindow.x}, {selectedWindow.y})</dd>
                <dt>ラベル</dt>
                <dd>{selectedWindow.label || '不明'}</dd>
              </dl>
              <div className="window-detail-actions">
                <button type="button" onClick={() => void handleFocusWindow(selectedWindow)}>
                  ウィンドウを前面に表示
                </button>
                <button
                  type="button"
                  disabled={!selectedWindow.label}
                  onClick={() => void handleAlwaysOnTop(selectedWindow)}
                >
                  最前面に固定
                </button>
                <button type="button" onClick={() => void handleRemoveWindow(selectedWindow)}>
                  削除
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {windows.length === 0 && !loading && (
        <div className="empty-state">
          <p>表示可能なウィンドウがありません</p>
          <button onClick={handleRefresh}>再読み込み</button>
        </div>
      )}
    </div>
  );
}
