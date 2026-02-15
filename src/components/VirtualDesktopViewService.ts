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
    console.log('[WindowManagerService] Calling get_all_windows...');
    try {
      const result = await invoke<WindowInfo[]>('get_all_windows');
      console.log('[WindowManagerService] Received windows:', result.length);
      console.log('[WindowManagerService] Windows:', result);
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
    console.log('[WindowManagerService] Calling get_all_windows_with_thumbnails...');
    console.log('[WindowManagerService] Params:', { thumbnailWidth, thumbnailHeight });
    
    try {
      const result = await invoke<WindowInfo[]>('get_all_windows_with_thumbnails', {
        thumbnailWidth,
        thumbnailHeight,
      });
      
      console.log('[WindowManagerService] Received windows:', result.length);
      console.log('[WindowManagerService] First window:', result[0]);

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
