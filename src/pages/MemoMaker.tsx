import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Note, NoteData } from "../models/Notes";
import MemoMakerSidebar from "../components/MemoMakerSidebar";
import CommonModal from "../components/CommonModal";
import ReactMarkdown from "react-markdown";
import { useWindowSync } from "../hooks/useWindowSync";

import remarkGfm from "remark-gfm";
import { useNotes } from "../store/note";

import EditIcon from "../assets/edit.svg";

import "github-markdown-css/github-markdown.css";
import "../styles/markdown.css";

import { save } from "@tauri-apps/plugin-dialog";
import { open } from "@tauri-apps/plugin-dialog";

export default function MemoMaker() {
  const { loadNotes, notes } = useNotes();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteData, setNoteData] = useState<NoteData | null>(null)
  const [isOpen,isOpenSet] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { syncContent, syncNoteData, openPreview } = useWindowSync();

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
      const data = await invoke("get_note_detail", { noteId: id });
      setNoteData(data as NoteData);
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

  const modalSwitchAction = () => {
    isOpenSet(!isOpen);
  }

  const newNote = () => {
    setSelectedId(null);
    setTitle("");
    setContent("");
  }

  const togglePreview = async () => {
    if (!isPreviewOpen) {
      syncContent(title,content);
      await openPreview(false);
      setIsPreviewOpen(true);
    } else {
      setIsPreviewOpen(false);
    }
  };

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
          <input className="w-half mr-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
          <button onClick={selectedId == null ? createNote : saveNote} >
            {selectedId == null ? "作成" : "保存"}
          </button>
          <button 
            onClick={togglePreview} 
            className="ml-2"
            style={{ 
              backgroundColor: isPreviewOpen ? '#4CAF50' : '#666',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isPreviewOpen ? "プレビュー表示中" : "別ウィンドウでプレビュー"}
          </button>
        </div>
        <div className="flex p-4">
          <div className="writer w-half p-4">
            <textarea className="p-4" value={content} onChange={(e) => setContent(e.target.value)} style={{ width: "100%", height: "60vh" }} />
          </div>
          <div className="w-half p-4">
            <div className="preview">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >{content}</ReactMarkdown>
            </div>
          </div>
        </div>
        {noteData && (<div className="note-data p-4 mt-4 border-t">
          <h3 className="pb-2">Note Data</h3>
          <div>
            <h4>Concepts</h4>
            <ul>
              {noteData.concepts.map((concept) => (
                <li key={concept.id}>
                  <p>name: {concept.name} </p>
                  <div>description: {concept.description}</div>
                  <p>tag: {concept.tag}</p>
                  <div
                    className="hover inline-block shot-icon-btn"
                    onClick={modalSwitchAction}
                  >
                    <img src={EditIcon} alt="edit" style={{ width: 12, height: 12 }} />
                  </div>
                  <CommonModal
                    isOpen={isOpen}
                    onClose={modalSwitchAction}
                    title="変更と調整"
                    children={
                      <div className="content">
                        入力
                      </div>
                    }
                    />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Relations</h4>
            <ul>
              {noteData.relations.map((relation, index) => (
                <li className="flex" key={index}>
                  From Concept ID: {relation.from_concept_id} - To Concept ID: {relation.to_concept_id} (Type: {relation.relation_type})
                </li>
              ))}
            </ul>
          </div>
        </div>)}
      </section>
    </div>
  );
}