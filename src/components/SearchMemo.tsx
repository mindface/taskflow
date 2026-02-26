// src/components/VirtualDesktopView.tsx
import { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import type { ConceptView } from '../models/ConceptView';

import type { Note } from "../models/Notes";
import { useWindowSync } from "../hooks/useWindowSync";

interface SearchParams {
  name?: string;
  noteId?: number;
  tag?: string;
  role?: string;
  keyword?: string;
}

export function SearchMemo() {
  const { syncContent, syncNoteData, openPreview } = useWindowSync();
  const [concepts, setConcepts] = useState<ConceptView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // 検索内容
  const [name, setName] = useState<string>("");
  const [noteId, setNoteId] = useState<number | undefined>(1);
  const [tag, setTag] = useState<string | undefined>();
  const [role, setRole] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");

  const params: SearchParams = {
    name: undefined,
    noteId: 1,
    tag: undefined,
    role: undefined,
    keyword: undefined,
  };

  useEffect(() => {
    let cancelled = false;

    const fetchConcepts = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await invoke<ConceptView[]>(
          'search_note_concepts',
          {
            name: params.name,
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
  }, [params.name, params.noteId, params.tag, params.role, params.keyword]);

  const selectNote = async (id: number) => {
    try {
      const n = await invoke<Note>("get_note", { id });
      syncContent(n.title, n.content);
      await openPreview(true);
    } catch (e) {
      console.error("get_note error", e);
    }
  }

  const searchFetchConcepts = async () => {
    setLoading(true);
    try {
      const result = await invoke<ConceptView[]>(
        "search_note_concepts",
        {
          name: name,
          noteId,
          tag: tag ?? null,
          role: role ?? null,
          keyword: keyword || null,
        }
      );
      setConcepts(result);
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="virtual-desktop-view">
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="search-from pb-2">
        <p className="p-2">
          <input
            type="text"
            className="input pb-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </p>
        <p className="p-2">
          {/* <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value)}
          >
            <option value="note">このノート内</option>
            <option value="all">全ノート</option>
          </select> */}
        </p>
        <p className="p-2">
          <button
            className="btn"
            onClick={searchFetchConcepts}
          >set</button>
        </p>
      </div>
      <ul className="p-2">
        {concepts.map(c => (
          <li className="p-2 pb-4" key={c.id}>
            <p className="pb-2"><span className="inline-part font-size-small">コンセプトネーム: </span> {c.name}</p>
            <p className="pb-2"><span className="inline-part font-size-small">タグ</span> {c.tag}</p>
            <p className="pb-2"><span className="inline-part font-size-small">ノートタイトル </span>{c.note_title}</p>
            <button className="btn" onClick={() => {
              if(c.note_id) {
                selectNote(c.note_id)
              }
              }}>noteを表示する</button>
            {c.role && <em> ({c.role})</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}