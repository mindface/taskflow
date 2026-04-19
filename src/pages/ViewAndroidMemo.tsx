import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface AndroidNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const ViewAndroidMemo: React.FC = () => {
  const [notes, setNotes] = useState<AndroidNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        // Rust側のコマンドを呼び出し
        const result = await invoke<AndroidNote[]>("list_android_notes");
        console.log("result------------")
        console.log(result)
        setNotes(result);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  if (loading) return <div className="p-4 text-center">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">エラー: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Android メモ一覧 (Firestore)</h1>
      
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
                {note.content || "内容なし"}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
                <span>ユーザー: {note.userId?.substring(0, 8) || "不明"}...</span>
                <span>作成日: {note.created_at ? new Date(note.created_at).toLocaleDateString() : "不明"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewAndroidMemo;
