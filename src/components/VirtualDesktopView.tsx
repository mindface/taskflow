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

  const handleWindowClick = async (window: WindowInfo) => {
    setSelectedWindow(window);
    try {
      await ManageWindowService.focusWindow(window);
    } catch (error) {
      console.error('Failed to focus window:', error);
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

      <div className="windows-grid">
        {windows.map((window) => (
          <div
            key={window.label ?? window.handle}
            className={`window-card ${
              selectedWindow?.handle === window.handle ? 'selected' : ''
            }`}
            onClick={() => handleWindowClick(window)}
          >
            <div className="thumbnail-container">
              {window.thumbnail ? (
                <img
                  src={window.thumbnail}
                  alt={window.title}
                  className="thumbnail"
                />
              ) : (
                <div className="thumbnail-placeholder">
                  <span>📄</span>
                  <p>{window.label || 'Taskflow'}</p>
                </div>
              )}
            </div>

            <div className="window-info">
              <h3 className="window-title" title={window.title}>
                {window.title}
              </h3>
              <div className="window-details">
                <span className="window-size">
                  {window.width} × {window.height}
                </span>
                <span className="window-position">
                  ({window.x}, {window.y})
                </span>
              </div>
              <div className="window-path text-slate-500 p-2 break-all">
                {(window.page_path === '/' ? "home" : window.page_path) || "ページ: 未取得"}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemoveWindow(window);
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
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
