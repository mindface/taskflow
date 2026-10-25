import { useEffect, useState } from "react";
import { useLocalStorageStore } from "../../store/localStorage";

type FishingLog = {
  id: string;
  date: string;
  memo: string;
};


export default function SubMemo() {
  const [content, setContent] = useState("");
  const [mdcontent, setMdContent] = useState("");
  const { values, update, remove, refresh } = useLocalStorageStore();
  const fishingLogs = (values.fishingLog as FishingLog[] | undefined) ?? [];

  const selectedIdAction = (id: string) => {
    const selectedLog = fishingLogs.find((log) => log.id === id);
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
    update<FishingLog[]>("fishingLog", (logs) => [
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
    update<FishingLog[]>("fishingLog", (logs) => {
      return (logs ?? []).filter((log) => log.id !== id);
    });
  }

  useEffect(() => {
    const storedLogs = refresh().fishingLog as FishingLog[] | undefined;
    if (storedLogs?.some((log) => !log.id)) {
      update<FishingLog[]>("fishingLog", (logs) =>
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
      <div className="h-full p-4">
        <div className="list-box">
          <ul className="list">
            {fishingLogs.map((log) => (
              <li className="list-item" key={log.id} onClick={() => selectedIdAction(log.id)}>
                <time dateTime={log.date}>{new Date(log.date).toLocaleString()}</time>
                <p>{log.memo}</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteLog(log.id);
                  }}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">サブメモ</h2>
        </div>
        <div className="flex justify-between items-center mb-2">
        </div>
        <textarea
          className="w-full h-40"
          value={content}
          onChange={handleContentChange}
        ></textarea>
        <div className="flex gap-2 my-2">
          <button type="button" onClick={recordMemo} disabled={!content.trim()}>
            記録
          </button>
          <button
            type="button"
            onClick={() => remove("fishingLog")}
            disabled={fishingLogs.length === 0}
          >
            全記録を削除
          </button>
        </div>
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: mdcontent }}></div>
      </div>
    </div>
  );
}
