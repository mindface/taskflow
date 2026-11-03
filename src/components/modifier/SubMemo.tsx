import { useEffect, useState } from "react";
import { useLocalStorageStore } from "../../store/localStorage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type FishingLog = {
  id: string;
  date: string;
  memo: string;
};


export default function SubMemo() {
  const [content, setContent] = useState("");
  const [mdcontent, setMdContent] = useState("");
  const { values, update, remove, refresh } = useLocalStorageStore();
  const subMemoLogs = (values.subMemoLog as FishingLog[] | undefined) ?? [];

  const selectedIdAction = (id: string) => {
    const selectedLog = subMemoLogs.find((log) => log.id === id);
    if (selectedLog) {
      setContent(selectedLog.memo);
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
      <div className="p-4 grid grid-cols-1 md:grid-cols-[30%_70%] gap-6 bg-gray-50 min-h-screen">
  
        {/* 左カラム：ログ一覧（幅 30%） */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-between">
            <span className="inline-block pb-2">ログ</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {subMemoLogs.length}件
            </span>
          </h2>

          <div className="flex-1 space-y-2 pr-1">
            {subMemoLogs.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">記録なし</p>
            ) : (
              subMemoLogs.map((log) => (
                /* 高さを固定して、ホバー時に絶対配置で横幅が伸びるコンテナ */
                <div
                  key={log.id}
                  onClick={() => selectedIdAction(log.id)}
                  className="group relative h-16 rounded-lg cursor-pointer mb-4"
                >
                  {/* 【通常時】30%の幅におさまる表示 */}
                  <div className="absolute inset-0 p-3 rounded-lg border border-gray-100 bg-white flex items-center justify-between gap-2 transition-all group-hover:opacity-0">
                    <div className="min-w-0 flex-1">
                      <time className="block text-[10px] text-gray-400 mb-0.5" dateTime={log.date}>
                        {new Date(log.date).toLocaleString()}
                      </time>
                      <p className="text-sm text-gray-700 truncate">{log.memo}</p>
                    </div>
                  </div>

                  {/* 【ホバー時】左端を起点に右側へグッと横幅が広がるカード */}
                  <div className="absolute left-0 top-0 h-full w-[240%] bg-white border border-blue-300 rounded-lg shadow-xl p-3 hidden group-hover:flex items-center justify-between gap-3 z-30 transition-all">
                    <div className="min-w-0 flex-1 space-y-2">
                      <time className="block text-[10px] text-gray-400 mb-0.5" dateTime={log.date}>
                        {new Date(log.date).toLocaleString()}
                      </time>
                      <p className="text-sm text-gray-700 truncate">{log.memo}</p>
                    </div>
                    
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded shrink-0 transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteLog(log.id);
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 全記録削除ボタン */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30"
              onClick={() => remove("subMemoLog")}
              disabled={subMemoLogs.length === 0}
            >
              全記録を削除
            </button>
          </div>
        </div>

        {/* 右カラム：サブメモ入力 ＆ プレビュー（幅 70%） */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <h2 className="text-lg font-bold text-gray-800 mb-3 inline-block pb-2">サブメモ</h2>
          
          <textarea
            className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-4"
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {mdcontent}
            </ReactMarkdown>
          </div>
        </div>

      </div>
    </div>
  );
}
