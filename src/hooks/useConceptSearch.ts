import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ConceptView } from "../models/ConceptView";

interface SearchParams {
  name?: string;
  noteId?: number;
  tag?: string;
  role?: string;
  keyword?: string;
}

export function useConceptSearch() {
  const [concepts, setConcepts] = useState<ConceptView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [noteId, setNoteId] = useState<number | undefined>(1);
  const [tag, setTag] = useState<string | undefined>();
  const [role, setRole] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");

  const search = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await invoke<ConceptView[]>(
        "search_note_concepts",
        {
          name,
          noteId,
          tag: tag ?? null,
          role: role ?? null,
          keyword: keyword || null,
        }
      );

      setConcepts(result);

    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return {
    concepts,
    loading,
    error,

    name,
    setName,

    noteId,
    setNoteId,

    tag,
    setTag,

    role,
    setRole,

    keyword,
    setKeyword,

    search,
  };
}