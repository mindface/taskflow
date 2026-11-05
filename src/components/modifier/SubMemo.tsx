import { useEffect, useState } from "react";
import { useLocalStorageStore } from "../../store/localStorage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CoreDialog from "../core/CoreDialog";
import MarkdownSourceInfo from "../MarkdownSourceInfo";

type FishingLog = {
  id: string;
  date: string;
  memo: string;
};


export default function SubMemo() {
  const [content, setContent] = useState("");
  const [mdcontent, setMdContent] = useState("");
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const { values, update, remove, refresh } = useLocalStorageStore();
  const subMemoLogs = (values.subMemoLog as FishingLog[] | undefined) ?? [];

  const selectedIdAction = (id: string) => {
    const selectedLog = subMemoLogs.find((log) => log.id === id);
    if (selectedLog) {
      setContent(selectedLog.memo);
      setIsLogDialogOpen(false);
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }

  function recordMemo() {
    if (!content.trim()) {
      return;
    }
    update<FishingLog[]>("subMemoLog", (logs) => [
      ...(logs ?? []),
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        memo: content.trim(),
      },
    ]);
    setContent("");
  }

  const deleteLog = (id: string) => {
    update<FishingLog[]>("subMemoLog", (logs) => {
      return (logs ?? []).filter((log) => log.id !== id);
    });
  }

  useEffect(() => {
    const storedLogs = refresh().subMemoLog as FishingLog[] | undefined;
    if (storedLogs?.some((log) => !log.id)) {
      update<FishingLog[]>("subMemoLog", (logs) =>
        (logs ?? []).map((log) => ({
          ...log,
          id: log.id || crypto.randomUUID(),
        })),
      );
    }
    (async () => {
      try {
        const text = await fetch("/md/homeview.md").then(r => r.text());
        setMdContent(text);
      } catch (e) {
        setMdContent("## Error\nMarkdown を読み込めませんでした。");
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="SubMemo flex-1 flex-col h-full">
      <div className="p-4 bg-gray-50 min-h-screen">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">サブメモ</h2>
            <button
              type="button"
              className="mb-4 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              onClick={() => setIsLogDialogOpen(true)}
            >
              記録一覧（{subMemoLogs.length}件）
            </button>
          </div>
          
          <textarea
            className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            placeholder="ここにメモを入力（Markdown対応）..."
            value={content}
            onChange={handleContentChange}

          ></textarea>

          <div className="flex justify-end mb-4">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              onClick={recordMemo}
              disabled={!content.trim()}
            >
              記録する
            </button>
          </div>

          {/* マークダウンプレビューエリア */}
          <div className="flex-1 border border-gray-100 rounded-lg p-3 bg-gray-50 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Preview</p>
            <MarkdownSourceInfo
              sourcePath="/md/homeview.md"
              location="サブメモ画面のプレビュー"
            />
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {mdcontent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <CoreDialog
        isOpen={isLogDialogOpen}
        title={`サブメモの記録（${subMemoLogs.length}件）`}
        onClose={() => setIsLogDialogOpen(false)}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {subMemoLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">記録なし</p>
          ) : (
            <ul className="space-y-2">
              {subMemoLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left shadow-none"
                    onClick={() => selectedIdAction(log.id)}
                  >
                    <time
                      className="block text-xs text-gray-400"
                      dateTime={log.date}
                    >
                      {new Date(log.date).toLocaleString()}
                    </time>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {log.memo}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => deleteLog(log.id)}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
          <button
            type="button"
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-30"
            onClick={() => remove("subMemoLog")}
            disabled={subMemoLogs.length === 0}
          >
            全記録を削除
          </button>
        </div>
      </CoreDialog>
    </div>
  );
}
