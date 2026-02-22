// src/components/VirtualDesktopView.tsx
import { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import type { ConceptView } from '../models/ConceptView';

interface SearchParams {
  noteId: number;
  tag?: string;
  role?: string;
  keyword?: string;
}

export function SearchMemo() {
  const [concepts, setConcepts] = useState<ConceptView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params: SearchParams = {
    noteId: 1,
    tag: undefined,
    role: undefined,
    keyword: undefined,
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchConcepts() {
      setLoading(true);
      setError(null);

      try {
        const result = await invoke<ConceptView[]>(
          'search_note_concepts',
          {
            noteId: params.noteId,
            tag: params.tag ?? null,
            role: params.role ?? null,
            keyword: params.keyword ?? null,
          }
        );

        if (!cancelled) {
          setConcepts(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchConcepts();
    return () => {
      cancelled = true;
    };
  }, [params.noteId, params.tag, params.role, params.keyword]);

  return (
    <div className="virtual-desktop-view">
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <ul>
        {concepts.map(c => (
          <li key={c.id}>
            <strong>{c.name}</strong>
            <span> [{c.tag}]</span>
            {c.role && <em> ({c.role})</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}