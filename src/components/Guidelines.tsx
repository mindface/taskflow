import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Guidelines() {
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
    <div className="DashBord">
      <div className="p-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
        >{content}</ReactMarkdown>
      </div>
    </div>
  );
}
