import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AndroidNote } from "../models/Notes";
import AndroidMemoDialog from "./modifier/AndroidMemoDialog";

const AndroidMemoList = () => {
  const [notes, setNotes] = useState<AndroidNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      // Rust側のコマンドを呼び出し
      const result = await invoke<AndroidNote[]>("andoroid_list_note");
      setNotes(result);
      console.log("Fetched Notes:", result);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const updateNote = (updatedNote: AndroidNote) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    );
  }

  const updateNoteAction = async (note: AndroidNote) => {
    try {
      const updatedNote = await invoke<AndroidNote>("update_android_note", {
        id: note.id,
        title: note.title,
        content: note.content,
      });
      updateNote(updatedNote);
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  }

  const textSettngs = (text: string) => {
    if (text.length > 100) {
      return text.substring(0, 100) + "...";
    }
    return text;
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading) return <div className="p-4 text-center">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">エラー: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Android メモ一覧 (Firestore)</h3>
      {notes.length === 0 ? (
        <p className="text-gray-500">メモが見つかりませんでした。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-blue-600 mb-2">{note.title || "無題"}</h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {textSettngs(note.content) || "内容なし"}
              </p>
              <AndroidMemoDialog
                note={note}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AndroidMemoList;
