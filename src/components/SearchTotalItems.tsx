import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AndroidNote, ShareNote } from "../models/Notes";
import type { AndroidSymbol } from "../models/Symbol";
import type { ClipboardHistoryEntry } from "../models/ClipboardHistory";
import ListSearch from "./core/ListSearch";
import { useConceptSearch } from "../hooks/useConceptSearch";


type CommonSearchItem = {
  source: "note" | "llm_memo";
  id: number;
  title?: string;
  content?: string;
  tag?: string | null;
  role?: string | null;
  updated_at?: string;
};

const defaultSearchValues = {
  keyword: "",
  title: "",
  content: "",
  tag: "",
  role: "",
  userId: "",
};

export function SearchTotalItems() {
  const {
    concepts,
    loading: conceptLoading,
    error: conceptError,
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
    search: searchConcepts,
  } = useConceptSearch();

  const [searchValues, setSearchValues] = useState(defaultSearchValues);
  const [commonItems, setCommonItems] = useState<CommonSearchItem[]>([]);
  const [androidNotes, setAndroidNotes] = useState<AndroidNote[]>([]);
  const [androidSymbols, setAndroidSymbols] = useState<AndroidSymbol[]>([]);
  const [shareNotes, setShareNotes] = useState<ShareNote[]>([]);
  const [clipboardEntries, setClipboardEntries] = useState<ClipboardHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalize = (value?: string | null) => String(value ?? "").toLowerCase();

  const matches = (query: string, value?: string | null) => {
    const normalizedQuery = query?.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }
    return normalize(value).includes(normalizedQuery);
  };

  const filterAndroidNotes = (notes: AndroidNote[], values: typeof defaultSearchValues) => {
    return notes.filter((note) => {
      const titleMatches = matches(values.title, note.title ?? "");
      const contentMatches = matches(values.content, note.content ?? "");
      const keywordMatches = matches(values.keyword, note.title ?? "") || matches(values.keyword, note.content ?? "");
      const userMatches = matches(values.userId, note.user_id ?? "");
      return titleMatches && contentMatches && keywordMatches && userMatches;
    });
  };

  const filterAndroidSymbols = (symbols: AndroidSymbol[], values: typeof defaultSearchValues) => {
    return symbols.filter((symbol) => {
      const titleMatches = matches(values.title, symbol.title ?? "");
      const contentMatches = matches(values.content, symbol.content ?? "");
      const keywordMatches = matches(values.keyword, symbol.title ?? "") || matches(values.keyword, symbol.content ?? "");
      const userMatches = matches(values.userId, symbol.user_id ?? "");
      return titleMatches && contentMatches && keywordMatches && userMatches;
    });
  };

  const filterShareNotes = (notes: ShareNote[], values: typeof defaultSearchValues) => {
    return notes.filter((note) => {
      const titleMatches = matches(values.title, note.title);
      const contentMatches = matches(values.content, note.content);
      const keywordMatches = matches(values.keyword, note.title) || matches(values.keyword, note.content);
      return titleMatches && contentMatches && keywordMatches;
    });
  };

  const filterClipboardEntries = (entries: ClipboardHistoryEntry[], values: typeof defaultSearchValues) => {
    return entries.filter((entry) => {
      const titleMatches = matches(values.title, entry.title ?? "");
      const contentMatches = matches(values.content, entry.content);
      const keywordMatches = matches(values.keyword, entry.title ?? "") || matches(values.keyword, entry.content);
      return titleMatches && contentMatches && keywordMatches;
    });
  };

  const searchAllItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const [commonResult, androidResult, symbolResult, clipboardResult, shareResult] = await Promise.all([
        invoke<CommonSearchItem[]>("search_common_items", {
          keyword: searchValues.keyword || null,
          title: searchValues.title || null,
          content: searchValues.content || null,
          tag: searchValues.tag || null,
          role: searchValues.role || null,
          limit: 200,
        }),
        invoke<AndroidNote[]>("andoroid_list_note", { user_id: null }),
        invoke<AndroidSymbol[]>("andoroid_list_symbol", { user_id: null }),
        invoke<ClipboardHistoryEntry[]>("list_clipboard_history"),
        invoke<ShareNote[]>("turso_list_share_notes"),
      ]);

      setCommonItems(commonResult ?? []);
      setAndroidNotes(filterAndroidNotes(androidResult ?? [], searchValues));
      setAndroidSymbols(filterAndroidSymbols(symbolResult ?? [], searchValues));
      setClipboardEntries(filterClipboardEntries(clipboardResult ?? [], searchValues));
      setShareNotes(filterShareNotes(shareResult ?? [], searchValues));
      await searchConcepts();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "keyword", label: "共通キーワード", placeholder: "検索ワードを入力", value: searchValues.keyword },
    { key: "title", label: "タイトル", placeholder: "タイトル検索", value: searchValues.title },
    { key: "content", label: "本文", placeholder: "本文検索", value: searchValues.content },
    { key: "tag", label: "タグ", placeholder: "タグ検索", value: searchValues.tag },
    { key: "role", label: "ロール", placeholder: "ロール検索", value: searchValues.role },
    { key: "userId", label: "ユーザーID", placeholder: "Android で絞り込み", value: searchValues.userId },
  ];

  return (
    <div className="virtual-desktop-view p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-3">全体検索</h2>
        <ListSearch
          fields={fields}
          onFieldChange={(key, value) => setSearchValues((prev) => ({ ...prev, [key]: value }))}
          onSearch={searchAllItems}
        />
      </div>

      {error && <div className="mb-4 text-red-600">エラー: {error}</div>}
      {loading && <div className="mb-4 text-gray-600">検索中...</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-gray-200 p-4 bg-white">
          <h3 className="font-semibold mb-2">Note / LlmMemo</h3>
          {commonItems.length === 0 ? (
            <p className="text-gray-500">検索結果がありません</p>
          ) : (
            <ul className="space-y-3">
              {commonItems.map((item) => (
                <li key={`${item.source}-${item.id}`} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.source === "note" ? "Note" : "LLM Memo"}</span>
                    <small className="text-xs text-gray-500">{item.updated_at || ""}</small>
                  </div>
                  <div className="pt-2">
                    <strong>{item.title || "(無題)"}</strong>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{item.content || "本文なし"}</p>
                    {(item.tag || item.role) && (
                      <div className="mt-2 text-xs text-gray-500">{item.tag ? `tag: ${item.tag}` : ""} {item.role ? `role: ${item.role}` : ""}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-gray-200 p-4 bg-white">
          <h3 className="font-semibold mb-2">Android Notes</h3>
          {androidNotes.length === 0 ? (
            <p className="text-gray-500">検索結果がありません</p>
          ) : (
            <ul className="space-y-3">
              {androidNotes.map((note) => (
                <li key={note.id} className="rounded border p-3">
                  <div className="font-medium">{note.title || "(無題)"}</div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{note.content || "本文なし"}</p>
                  <div className="text-xs text-gray-500 mt-2">{note.user_id ? `user: ${note.user_id}` : "userなし"}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-gray-200 p-4 bg-white">
          <h3 className="font-semibold mb-2">Android Symbols</h3>
          {androidSymbols.length === 0 ? (
            <p className="text-gray-500">検索結果がありません</p>
          ) : (
            <ul className="space-y-3">
              {androidSymbols.map((symbol) => (
                <li key={symbol.id} className="rounded border p-3">
                  <div className="font-medium">{symbol.title || "(無題)"}</div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{symbol.content || "本文なし"}</p>
                  <div className="text-xs text-gray-500 mt-2">{symbol.user_id ? `user: ${symbol.user_id}` : "userなし"}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-gray-200 p-4 bg-white">
          <h3 className="font-semibold mb-2">Share Notes</h3>
          {shareNotes.length === 0 ? (
            <p className="text-gray-500">検索結果がありません</p>
          ) : (
            <ul className="space-y-3">
              {shareNotes.map((note) => (
                <li key={note.id} className="rounded border p-3">
                  <div className="font-medium">{note.title}</div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{note.content || "本文なし"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-gray-200 p-4 bg-white">
          <h3 className="font-semibold mb-2">Clipboard History</h3>
          {clipboardEntries.length === 0 ? (
            <p className="text-gray-500">検索結果がありません</p>
          ) : (
            <ul className="space-y-3">
              {clipboardEntries.map((entry) => (
                <li key={entry.id} className="rounded border p-3">
                  <div className="font-medium">{entry.title || "(無題)"}</div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{entry.content}</p>
                  <div className="text-xs text-gray-500 mt-2">{entry.content_type}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-gray-200 p-4 bg-white">
          <h3 className="font-semibold mb-2">Concepts</h3>
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="border border-gray-300 rounded px-3 py-2"
                type="text"
                placeholder="Concept name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                className="border border-gray-300 rounded px-3 py-2"
                type="number"
                placeholder="Note ID"
                value={noteId ?? ""}
                onChange={(event) => setNoteId(event.target.value ? Number(event.target.value) : undefined)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="tag"
                value={tag ?? ""}
                onChange={(event) => setTag(event.target.value || undefined)}
              />
              <input
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="role"
                value={role ?? ""}
                onChange={(event) => setRole(event.target.value || undefined)}
              />
            </div>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Concept keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button type="button" className="btn" onClick={searchConcepts}>
              Concepts を検索
            </button>
          </div>
          {conceptLoading ? (
            <p className="text-gray-600">検索中...</p>
          ) : conceptError ? (
            <p className="text-red-600">{conceptError}</p>
          ) : concepts.length === 0 ? (
            <p className="text-gray-500">結果なし</p>
          ) : (
            <ul className="space-y-3">
              {concepts.map((concept) => (
                <li key={concept.id} className="rounded border p-3">
                  <div className="font-medium">{concept.name}</div>
                  <div className="text-sm text-gray-600">{concept.tag}</div>
                  <p className="text-sm text-gray-500">{concept.description || "説明なし"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
