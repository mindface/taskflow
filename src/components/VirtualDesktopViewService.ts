// src/services/windowManager.ts
import { invoke } from '@tauri-apps/api/core';

export interface WindowInfo {
  handle: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  is_visible: boolean;
  is_minimized: boolean;
  thumbnail?: string;
}

export class WindowManagerService {
  static async getAllWindows(): Promise<WindowInfo[]> {
    try {
      const result = await invoke<WindowInfo[]>('get_all_windows');
      return result;
    } catch (error) {
      console.error('[WindowManagerService] Error:', error);
      throw error;
    }
  }

  static async getAllWindowsWithThumbnails(
    thumbnailWidth: number = 320,
    thumbnailHeight: number = 180
  ): Promise<WindowInfo[]> {
    try {
      const result = await invoke<WindowInfo[]>('get_all_windows_with_thumbnails', {
        thumbnailWidth,
        thumbnailHeight,
      });

      return result;
    } catch (error) {
      console.error('[WindowManagerService] Error:', error);
      throw error;
    }
  }
  static async focusWindow(handle: number): Promise<void> {
    console.log(`[WindowManagerService] Focusing window with handle: ${handle}`);
    return await invoke('focus_window', { handle });
  }
}
