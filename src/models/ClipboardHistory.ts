export type ClipboardHistoryEntry = {
  id: number;
  title: string | null;
  content: string;
  content_type: "text" | "url" | "code" | "markdown";
  created_at: string;
};
