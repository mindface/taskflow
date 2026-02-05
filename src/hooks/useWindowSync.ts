import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useEffect, useRef, useCallback } from 'react';
import { NoteData } from '../models/Notes';

interface SyncPayload {
  content: string;
  title: string;
}

export function useWindowSync() {
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  const syncContent = useCallback(async (title: string, content: string) => {
    try {
      await invoke('sync_content_to_preview', { title, content });
    } catch (error) {
      console.error('sync_content error:', error);
    }
  }, []);

  const syncNoteData = useCallback(async (noteData: NoteData) => {
    try {
      await invoke('sync_note_data_to_preview', { noteData });
    } catch (error) {
      console.error('sync_note_data error:', error);
    }
  }, []);

  const openPreview = useCallback(async () => {
    try {
      await invoke('open_preview_window');
    } catch (error) {
      console.error('open_preview_window error:', error);
    }
  }, []);

  return { syncContent, syncNoteData, openPreview };
}

export function usePreviewListener(
  onContentUpdate: (payload: SyncPayload) => void,
  onNoteDataUpdate: (noteData: NoteData) => void
) {
  useEffect(() => {
    console.log('[usePreviewListener@@@pp] Setting up listeners');
    let contentUnlisten: UnlistenFn;
    let noteDataUnlisten: UnlistenFn;

    (async () => {
      try {
        console.log('wwwwwww');
        contentUnlisten = await listen<SyncPayload>('content-update', (event) => {
          console.log('[usePreviewListener @@] content-update event received:', event.payload);
          onContentUpdate(event.payload);
        });

        noteDataUnlisten = await listen<NoteData>('note-data-update', (event) => {
          console.log('[usePreviewListener @@] note-data-update event received:', event.payload);
          onNoteDataUpdate(event.payload);
        });
        
        console.log('[usePreviewListener] Listeners registered successfully');
      } catch (error) {
        console.error('[usePreviewListener] Error setting up listeners:', error);
      }
    })();

    return () => {
      console.log('[usePreviewListener] Cleaning up listeners');
      if (contentUnlisten) contentUnlisten();
      if (noteDataUnlisten) noteDataUnlisten();
    };
  }, [onContentUpdate, onNoteDataUpdate]);
}