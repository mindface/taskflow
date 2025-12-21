import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

import ReactMarkdown from "react-markdown";

export default function MemoMaker() {

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await invoke("init_db");
        await loadNotes();
      } catch (e) {
        console.error("init_db error", e);
      }
    })();
  }, []);

  async function loadNotes() {
    try {
      const res = await invoke<Note[]>("list_notes");
      setNotes(res || []);
    } catch (e) {
      console.error("list_notes error", e);
    }
  }

  async function selectNote(id: number) {
    try {
      const n = await invoke<Note>("get_note", { id });
      setSelectedId(n.id);
      setTitle(n.title);
      setContent(n.content);
    } catch (e) {
      console.error("get_note error", e);
    }
  }

  async function createNote() {
    try {
      const newId = await invoke<number>("add_note", { title: title || "untitled", content: content || "" });
      await loadNotes();
      selectNote(newId);
    } catch (e) {
      console.error("add_note error", e);
    }
  }

  async function saveNote() {
    if (selectedId == null) return;
    try {
      await invoke("update_note", { id: selectedId, title, content });
      await loadNotes();
    } catch (e) {
      console.error("update_note error", e);
    }
  }

  async function removeNote(id: number) {
    if (!confirm("削除してよろしいですか？")) return;
    try {
      await invoke("delete_note", { id });
      setSelectedId(null);
      setTitle("");
      setContent("");
      await loadNotes();
    } catch (e) {
      console.error("delete_note error", e);
    }
  }

  const newNote = () => {
    setSelectedId(null);
    setTitle("");
    setContent("");
  }

  return (
    <div className="p-4">
      <aside>
        <div className="pb-2">
          <button onClick={loadNotes}>更新</button>
          <button onClick={newNote}>新規</button>
        </div>
        <ul className="overflow-auto" style={{ maxHeight: "70vh" }}>
          {notes.map((n,index) => (
            <li key={n.id} className="p-2 border-b border-gray-200">
              <h3 className="pb-2 " onClick={() => selectNote(n.id)}>No{index+1}:{n.title || "(無題)"}</h3>
              <div className="flex gap-2">
                <button onClick={() => selectNote(n.id)}>開く</button>
                <button onClick={() => removeNote(n.id)}>削除</button>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        <div className="pb-2">
          <input style={{ width: "70%" }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
          <button onClick={selectedId == null ? createNote : saveNote} >
            {selectedId == null ? "作成" : "保存"}
          </button>
        </div>
        <textarea className="p-4" value={content} onChange={(e) => setContent(e.target.value)} style={{ width: "100%", height: "60vh" }} />
      </section>
    </div>
  );
}