import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Note, NoteData } from "../models/Notes";
import MemoList from "../components/modifier/MemoGridList";

import Dialog from "../components/core/CoreDialog";
import { useWindowSync } from "../hooks/useWindowSync";

import { useNotes } from "../store/note";
import { useUIContext } from "../store/ui";
import { inputSaved } from "../utils/inputSave";

import EditIcon from "../assets/edit.svg";
import PreviewIcon from "../assets/preview.svg";

import "github-markdown-css/github-markdown.css";
import "../styles/markdown.css";

import { save } from "@tauri-apps/plugin-dialog";
import { open } from "@tauri-apps/plugin-dialog";

export default function MemoMaker() {
  const { loadNotes, notes } = useNotes();
  const { state, dispatch } = useUIContext();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewType, setViewType] = useState("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteData, setNoteData] = useState<NoteData | null>(null)
  const [isOpen,isOpenSet] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { syncContent, syncNoteData, openPreview } = useWindowSync();
  const { basedInputEvent } = inputSaved();

  const voiceInputEnabled = state.uiSelection?.voiceInputEnabled === true;

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("お使いの環境は音声認識をサポートしていません。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result: any) => result[0]?.transcript || "")
        .join("");
      setContent((prev) => (prev ? `${prev}\n${transcript}` : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      alert("音声認識でエラーが発生しました。");
      setIsVoiceListening(false);
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsVoiceListening(true);
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsVoiceListening(false);
  };

  const disableVoiceInput = () => {
    stopVoiceInput();
    dispatch({
      type: "SET_UI_SELECTION",
      payload: {
        ...state.uiSelection,
        voiceInputEnabled: false,
      },
    });
  };

  useEffect(() => {
    dispatch({
      type: "SET_INPUT_CHECK_VALUE",
      payload: {
        value: `${title}${content}`,
        label: "メモのタイトルまたは本文",
      },
    });
  }, [content, dispatch, title]);

  useEffect(() => {
    return () => {
      dispatch({ type: "CLEAR_INPUT_CHECK_VALUE" });
    };
  }, [dispatch]);

  useEffect(() => {
    loadNotes();
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
      alert(`CSVが正常に保存されました: ${csvPath}`);
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

  const dialogSwitchAction = () => {
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
    <div className="memo-maker">
      <section>
        <div className="flex">
          <div className={viewType === "list" ? "w-[300px] flex-none" : "w-full"}>
            <MemoList
              notes={notes}
              onSelectNote={selectNote}
              onCreateNote={newNote}
              onDeleteNote={removeNote}
              onLoadNotes={loadNotes}
              onExportNotes={exportNotes}
              onImportNotes={importsNotes}
              onViewList={(type) => { setViewType(type) }}
            />
          </div>
          { viewType === "list" && <>
            <div className="writer flex-1 p-4">
              <div className="pb-2">
                <div className="pb-2 flex gap-4 items-center">
                  <span className="flex-1 inline-block">
                    <input
                      className="w-100 mr-1"
                      value={title}
                      onKeyDown={(e) => basedInputEvent(e, "blur", () => {
                        if (selectedId != null) {
                          saveNote();
                        }
                      })}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="タイトル"
                    />
                  </span>
                  <button onClick={selectedId == null ? createNote : saveNote}>
                    {selectedId == null ? "作成" : "保存"}
                  </button>
                  {voiceInputEnabled && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={isVoiceListening ? stopVoiceInput : startVoiceInput}
                        className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100"
                      >
                        {isVoiceListening ? "音声入力停止" : "音声入力開始"}
                      </button>
                      <button
                        type="button"
                        onClick={disableVoiceInput}
                        className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
                      >
                        やめる
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p>{selectedId} | {title}</p>
              <textarea
                className="p-4 mb-4" value={content}
                onKeyDown={(e) => basedInputEvent(e, "blur", () => {
                  if (selectedId != null) {
                    saveNote();
                  }
                })}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: "100%", height: "60vh" }}
              />
              {voiceInputEnabled && (
                <div className="mb-3 text-sm text-gray-500">
                  音声入力が有効になっています。マイクで話すと、認識結果が本文に追加されます。
                </div>
              )}
              <button 
                onClick={togglePreview} 
                className="ml-2"
                style={{ 
                  backgroundColor: isPreviewOpen ? '#4CAF50' : '#fff',
                  color: '#333',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {isPreviewOpen ? 
                  "プレビュー表示中" : <span className="flex inline-block">
                    <span
                      className="inline-block pl-4"
                    >
                      プレビュー画面
                    </span>
                    <img
                      src={PreviewIcon}
                      className="inline-block"
                      alt="image"
                      style={{ width: 16, height: 16 }}
                    />
                  </span>}
              </button>
            </div>
            {noteData && (
              <div className="note-data p-4 mt-4 border-t">
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
                        onClick={dialogSwitchAction}
                      >
                        <img src={EditIcon} alt="edit" style={{ width: 12, height: 12 }} />
                      </div>
                      <Dialog
                        isOpen={isOpen}
                        onClose={dialogSwitchAction}
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
          </>}
        </div>
      </section>
    </div>
  );
}
