import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { convertFileSrc } from "@tauri-apps/api/core";

type Props = {
  children: string;
};

function resolveImageSource(source: string | undefined) {
  if (!source) return undefined;
  if (/^(https?:|data:|asset:|tauri:)/i.test(source)) return source;
  if (source.startsWith("/") || /^[A-Za-z]:[\\/]/.test(source)) {
    return convertFileSrc(source);
  }
  return source;
}

export default function MarkdownRenderer({ children }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, ...props }) => (
          <img {...props} src={resolveImageSource(src)} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
