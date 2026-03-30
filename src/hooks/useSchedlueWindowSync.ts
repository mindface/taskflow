import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useEffect, useRef, useCallback } from 'react';
import { Schedule } from '../models/Schedule';

interface SyncPayload {
  schedule: Schedule;
}

export function useScheduleWindowSync() {
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  const syncScheduleContent = useCallback(async (schedule: Schedule) => {
    try {
      await invoke('sync_schedule_to_preview', { schedule: schedule });
    } catch (error) {
      console.error('sync_schedule_content error:', error);
    }
  }, []);

  const openScheduleWindow = useCallback(async (openContinuous: boolean) => {
    try {
      await invoke('open_schedule_window', { openContinuous });
    } catch (error) {
      console.error('open_preview_window error:', error);
    }
  }, []);

  return { syncScheduleContent, openScheduleWindow };
}

export function useSchedulePreviewListener(
  onContentUpdate: (payload: SyncPayload) => void,
  onNoteDataUpdate: (scheduleData: Schedule) => void
) {
  useEffect(() => {
    console.log('[useSchedulePreviewListener] Setting up listeners');
    let contentUnlisten: UnlistenFn;
    let noteDataUnlisten: UnlistenFn;

    (async () => {
      try {
        contentUnlisten = await listen<SyncPayload>('content-update', (event) => {
          console.log('[useSchedulePreviewListener] content-update event received:', event.payload);
          onContentUpdate(event.payload);
        });

        noteDataUnlisten = await listen<Schedule>('note-data-update', (event) => {
          console.log('[useSchedulePreviewListener] note-data-update event received:', event.payload);
          onNoteDataUpdate(event.payload);
        });
        
        console.log('[useSchedulePreviewListener] Listeners registered successfully');
      } catch (error) {
        console.error('[useSchedulePreviewListener] Error setting up listeners:', error);
      }
    })();

    return () => {
      console.log('[useSchedulePreviewListener] Cleaning up listeners');
      if (contentUnlisten) contentUnlisten();
      if (noteDataUnlisten) noteDataUnlisten();
    };
  }, [onContentUpdate, onNoteDataUpdate]);
}