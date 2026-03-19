// src/components/VirtualDesktopView.tsx
import { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import type { ConceptView } from '../models/ConceptView';

import type { Note } from "../models/Notes";
import { useWindowSync } from "../hooks/useWindowSync";
import { useConceptSearch } from "../hooks/useConceptSearch";

interface SearchParams {
  name?: string;
  noteId?: number;
  tag?: string;
  role?: string;
  keyword?: string;
}

export function SearchMemo() {
  const { syncContent, syncNoteData, openPreview } = useWindowSync();
  const {
    concepts,
    loading,
    error,
    name,
    setName,
    search,
  } = useConceptSearch()

  // 検索内容
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

    search();
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
        {/* <p className="p-2">
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value)}
          >
            <option value="note">このノート内</option>
            <option value="all">全ノート</option>
          </select>
        </p> */}
        <p className="p-2">
          <button
            className="btn"
            onClick={search}
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