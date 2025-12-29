import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Note } from "../models/Notes";
import { MemoMakerSidebar } from "../components/MemoMakerSidebar";
import "github-markdown-css/github-markdown.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/markdown.css";
import { useNotes } from "../store/note";

import { save } from "@tauri-apps/api/dialog";
import { open } from "@tauri-apps/api/dialog";

export default function MemoMaker() {
  const { loadNotes, notes } = useNotes();
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

  // async function loadNotes() {
  //   try {
  //     const res = await invoke<Note[]>("list_notes");
  //     setNotes(res || []);
  //   } catch (e) {
  //     console.error("list_notes error", e);
  //   }
  // }

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

  async function exportNotes() {
    try {
      const csvPath = await save({
        title: "CSVとしてエクスポート",
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "notes.csv"
      });

      if (!csvPath) return;
      await invoke("export_notes",{ csvPath });
    } catch (e) {
      console.error("export error", e);
    }
  }

  async function importsNotes() {
    try {
      const file = await open({
        title: "CSVを選択",
        filters: [{ name: "CSV", extensions: ["csv"] }],
        multiple: false
      });
      if (!file || Array.isArray(file)) return;
      await invoke("import_notes", {
        csvPath: file
      });
    } catch (e) {
      console.error("import error", e);
    }
  }

  const newNote = () => {
    setSelectedId(null);
    setTitle("");
    setContent("");
  }

  return (
    <div className="p-4">
      <MemoMakerSidebar
        notes={notes}
        onSelectNote={selectNote}
        onCreateNote={newNote}
        onDeleteNote={removeNote}
        onLoadNotes={loadNotes}
        onExportNotes={exportNotes}
        onImportNotes={importsNotes}
      />
      <section>
        <div className="pb-2">
          <input style={{ width: "70%" }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
          <button onClick={selectedId == null ? createNote : saveNote} >
            {selectedId == null ? "作成" : "保存"}
          </button>
        </div>
        <div className="flex">
          <div className="writer w-half p-4">
            <textarea className="p-4" value={content} onChange={(e) => setContent(e.target.value)} style={{ width: "100%", height: "60vh" }} />
          </div>
          <div className="preview w-half p-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
            >{content}</ReactMarkdown>
          </div>
        </div>
      </section>
    </div>
  );
}