const content = await fetch("/md/homeview.md").then(r => r.text());
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

export default function Header() {

  return (
    <div className="DashBord">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      >{content}</ReactMarkdown>
    </div>
  );
}
