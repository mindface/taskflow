import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { ClipboardHistoryEntry } from "../models/ClipboardHistory";

const typeLabels: Record<ClipboardHistoryEntry["content_type"], string> = {
  text: "テキスト",
  url: "URL",
  code: "コード",
  markdown: "Markdown",
};

export default function ClipboardHistory() {
  const [entries, setEntries] = useState<ClipboardHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const result = await invoke<ClipboardHistoryEntry[]>("list_clipboard_history");
      setEntries(result ?? []);
      setError(null);
    } catch (reason) {
      console.error("list_clipboard_history error", reason);
      setError("クリップボード履歴を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    const intervalId = window.setInterval(() => void loadHistory(), 2_000);
    return () => window.clearInterval(intervalId);
  }, [loadHistory]);

  return (
    <section className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-size-title">クリップボード履歴</h2>
          <p className="text-sm text-gray-500">コピーされたテキストを新しい順に表示します。</p>
        </div>
        <button onClick={() => void loadHistory()} disabled={loading}>
          {loading ? "読み込み中..." : "再読み込み"}
        </button>
      </div>

      {error && <p className="p-2 mb-4 border rounded text-red-600">{error}</p>}

      {!loading && entries.length === 0 ? (
        <p className="p-4 border rounded">保存されたクリップボード履歴はありません。</p>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <article key={entry.id} className="p-4 border rounded bg-white">
              <div className="flex justify-between items-center pb-2">
                <span className="inline-part">{typeLabels[entry.content_type]}</span>
                <time className="text-sm text-gray-500">{entry.created_at}</time>
              </div>
              {entry.title && <h3 className="font-size-middle mb-2">{entry.title}</h3>}
              <pre className="m-0 whitespace-pre-wrap break-words font-size-base">{entry.content}</pre>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
