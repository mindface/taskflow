import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import CoreDialog from "../components/core/CoreDialog";
import type { ShareNote } from "../models/Notes";
import { useShareNotes } from "../store/shareNote";
import { useUIContext } from "../store/ui";

const emptyForm = { title: "", content: "", links: "" };

function linksFromText(value: string) {
  return value
    .split("\n")
    .map((link) => link.trim())
    .filter(Boolean);
}

function linksToText(links: string[]) {
  return links.join("\n");
}

export default function ShareNotes() {
  const { shareNotes, loadingShareNotes, error, loadShareNotes, addShareNote, updateShareNote, deleteShareNote } = useShareNotes();
  const { dispatch } = useUIContext();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState(emptyForm.title);
  const [content, setContent] = useState(emptyForm.content);
  const [links, setLinks] = useState(emptyForm.links);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ShareNote | null>(null);

  useEffect(() => {
    void loadShareNotes();
  }, []);

  useEffect(() => {
    dispatch({
      type: "SET_INPUT_CHECK_VALUE",
      payload: { value: `${title}${content}${links}`, label: "共有メモの入力値" },
    });
    return () => dispatch({ type: "CLEAR_INPUT_CHECK_VALUE" });
  }, [content, dispatch, links, title]);

  function resetForm() {
    setSelectedId(null);
    setTitle(emptyForm.title);
    setContent(emptyForm.content);
    setLinks(emptyForm.links);
  }

  async function selectNote(id: number) {
    try {
      const note = await invoke<ShareNote | null>("turso_get_share_note", { id });
      if (!note) {
        await loadShareNotes();
        resetForm();
        return;
      }
      setSelectedId(note.id);
      setTitle(note.title);
      setContent(note.content);
      setLinks(linksToText(note.links));
    } catch (selectError) {
      console.error("turso_get_share_note error", selectError);
    }
  }

  async function saveNote() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setSaving(true);
    try {
      if (selectedId == null) {
        const note = await addShareNote({ title: trimmedTitle, content, links: linksFromText(links) });
        setSelectedId(note.id);
      } else {
        const current = shareNotes.find((note) => note.id === selectedId);
        if (!current) return;
        await updateShareNote({
          ...current,
          title: trimmedTitle,
          content,
          links: linksFromText(links),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (saveError) {
      console.error("turso share note save error", saveError);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteShareNote(deleting.id);
      if (selectedId === deleting.id) resetForm();
      setDeleting(null);
    } catch (deleteError) {
      console.error("turso share note delete error", deleteError);
    }
  }

  return (
    <div className="p-4">
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-size-title">共有メモ</h2>
            <p className="pt-2 text-sm text-gray-500">Turso に保存される共有用のメモです。</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void loadShareNotes()} disabled={loadingShareNotes}>再読み込み</button>
            <button type="button" onClick={resetForm}>新規</button>
          </div>
        </div>

        {error && <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
        <div className="flex gap-4 max-lg:flex-col">
          <div className="w-1/2 rounded border bg-white p-4 max-lg:w-full">
            <div className="pb-2">
              <label className="block pb-2" htmlFor="share-note-title">タイトル</label>
              <input id="share-note-title" className="w-full" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="タイトル" />
            </div>
            <div className="pb-2">
              <label className="block pb-2" htmlFor="share-note-content">本文</label>
              <textarea id="share-note-content" className="w-full p-3" value={content} onChange={(event) => setContent(event.target.value)} placeholder="共有メモの本文" style={{ minHeight: "34vh" }} />
            </div>
            <div className="pb-2">
              <label className="block pb-2" htmlFor="share-note-links">関連リンク（1行に1件）</label>
              <textarea id="share-note-links" className="w-full p-3" value={links} onChange={(event) => setLinks(event.target.value)} placeholder="https://example.com" style={{ minHeight: "8vh" }} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => void saveNote()} disabled={saving || !title.trim()}>
                {saving ? "保存中..." : selectedId == null ? "作成" : "保存"}
              </button>
              {selectedId != null && <button type="button" onClick={() => setDeleting(shareNotes.find((note) => note.id === selectedId) ?? null)}>削除</button>}
            </div>
          </div>

          <div className="w-1/2 rounded border bg-white p-4 max-lg:w-full">
            <h3 className="pb-3 font-size-middle">一覧</h3>
            {loadingShareNotes && <p>読み込み中...</p>}
            {!loadingShareNotes && shareNotes.length === 0 && <p className="rounded border p-3 text-gray-500">共有メモはまだありません。</p>}
            <ul className="space-y-3">
              {shareNotes.map((note) => (
                <li key={note.id} className={`rounded border p-3 ${selectedId === note.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                  <button type="button" className="w-full text-left shadow-none" onClick={() => void selectNote(note.id)}>
                    <div className="flex items-center justify-between gap-3">
                      <strong>{note.title}</strong>
                      <small className="text-gray-500">{new Date(note.updated_at).toLocaleString()}</small>
                    </div>
                    <p className="pt-2 text-sm text-gray-600">{note.content.slice(0, 120) || "本文なし"}</p>
                    {note.links.length > 0 && <p className="pt-2 text-xs text-gray-500">リンク {note.links.length} 件</p>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <CoreDialog isOpen={deleting != null} title="共有メモを削除" onClose={() => setDeleting(null)}>
        <p className="pb-4">{deleting?.title} を削除してよろしいですか？</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => void confirmDelete()}>削除する</button>
          <button type="button" onClick={() => setDeleting(null)}>キャンセル</button>
        </div>
      </CoreDialog>
    </div>
  );
}
