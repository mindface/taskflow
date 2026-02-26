const content = await fetch("/md/d.md").then(r => r.text());
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
