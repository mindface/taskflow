// src/components/VirtualDesktopView.tsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { WindowManagerService, WindowInfo } from './VirtualDesktopViewService';
import '../styles/WindowVirtual.css';

export default function VirtualDesktopView() {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWindow, setSelectedWindow] = useState<WindowInfo | null>(null);

  useEffect(() => {
    loadWindows();

    // 定期的に更新
    const interval = setInterval(loadWindows, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadWindows = async () => {
    try {
      console.log('[VirtualDesktopView] Loading windows...');
      setLoading(true);

      const windowsData = await WindowManagerService.getAllWindowsWithThumbnails(320, 180);
      console.log('[VirtualDesktopView] Received data:', windowsData);
      console.log('[VirtualDesktopView] Total windows:', windowsData.length);

      // フィルタリング前のログ
      console.log('[VirtualDesktopView] Windows before filter:', 
        windowsData.map(w => ({
          title: w.title,
          minimized: w.is_minimized,
          width: w.width,
          height: w.height
        }))
      );

      const validWindows = windowsData.filter(
        (w: any) => !w.is_minimized && w.width > 0 && w.height > 0
      );

      console.log('[VirtualDesktopView] Valid windows after filter:', validWindows.length);
      console.log('[VirtualDesktopView] Valid windows:', validWindows);

      setWindows(validWindows);
    } catch (error) {
      console.error('[VirtualDesktopView] Failed to load windows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWindowClick = async (window: WindowInfo) => {
    setSelectedWindow(window);
    try {
      await WindowManagerService.focusWindow(window.handle);
    } catch (error) {
      console.error('Failed to focus window:', error);
    }
  };

  const handleRefresh = async () => {
    loadWindows();
    const result = await invoke('test_enum_windows');
    console.log(result);
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
        <button onClick={handleRefresh} className="refresh-button">
          🔄 更新
        </button>
      </div>

      <div className="windows-grid">
        {windows.map((window) => (
          <div
            key={window.handle}
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
                  <p>サムネイル取得失敗</p>
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