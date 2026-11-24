import { useEffect, useState } from "react";
import MarkdownSourceInfo from "./MarkdownSourceInfo";
import MarkdownRenderer from "./MarkdownRenderer";

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
      <div className="mb-4 p-4 preview">
        <MarkdownSourceInfo
          sourcePath="/md/homeview.md"
          location="ホーム画面のガイドライン"
        />
        <MarkdownRenderer>{content}</MarkdownRenderer>
      </div>
    </div>
  );
}
