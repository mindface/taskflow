import { useEffect, useState } from "react";

export default function SubMemo() {
  const [content, setContent] = useState("")
  useEffect(() => {
    (async () => {
      try {
        const text = await fetch("/md/homeview.md").then(r => r.text());
        setContent(text);
      } catch (e) {
        setContent("## Error\nMarkdown を読み込めませんでした。");
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="SubMemo flex-1 flex-col h-full">
      <div className="h-full p-4">
        <textarea
          className="w-full h-full"
          value={content}
          onChange={e => setContent(e.target.value)}
        ></textarea>
      </div>
    </div>
  );
}
