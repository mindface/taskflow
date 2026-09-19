// src/services/windowManager.ts
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

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
  page_path?: string | null;
  label?: string | null;
}

export interface AppWindowsPayload {
  count: number;
  windows: WindowInfo[];
}

export class ManageWindowService {
  static async listAppWindows(): Promise<AppWindowsPayload> {
    return await invoke<AppWindowsPayload>('list_app_windows');
  }

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

  static async focusWindow(window: WindowInfo): Promise<void> {
    if (window.label) {
      return await invoke('focus_app_window', { label: window.label });
    }
    console.log(`[WindowManagerService] Focusing window with handle: ${window.handle}`);
    return await invoke('focus_window', { handle: window.handle });
  }

  static async removeWindow(handle: number, title?: string): Promise<void> {
    console.log(`[WindowManagerService] Removing window with handle: ${handle}, title: ${title ?? 'unknown'}`);
    return await invoke('remove_window', { handle, title });
  }

  static onAppWindowsUpdated(
    handler: (payload: AppWindowsPayload) => void
  ): Promise<UnlistenFn> {
    return listen<AppWindowsPayload>('app-windows-updated', (event) => {
      handler(event.payload);
    });
  }
}
