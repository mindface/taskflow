import { useState } from "react";
import { Note } from "../../models/Notes";
import EditIcon from "../../assets/edit.svg";
import DeleteIcon from "../../assets/delete.svg";

import "../../styles/sidebar.css";

import { useWindowSync } from "../../hooks/useWindowSync";

type Props = {
  notes: Note[];
  onSelectNote: (id: number) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: number) => void;
  onLoadNotes: () => void;
  onExportNotes: () => void;
  onImportNotes: () => void;
  onViewList: (type: "list" | "grid") => void;
}

export default function MemoList({
  notes,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onLoadNotes,
  onExportNotes,
  onImportNotes,
  onViewList
}: Props) {
  const { syncContent, openPreview } = useWindowSync();
  const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

  const onPreviewNote = async (title: string, content: string) => {
    syncContent(title, content);
    await openPreview(true);
  }

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => {
      const next = prev === "list" ? "grid" : "list";
      onViewList(next);
      return next;
    });
  };

  return (
    <div>
      <div className="memo-list-box">
        <div className="inner">
          <div className="p-2 flex flex-wrap gap-2 items-center">
            <button className="mr-1" onClick={onLoadNotes}>リストを更新</button>
            <button onClick={onCreateNote}>新規</button>
            <button onClick={toggleDisplayMode} className="ml-auto">
              {displayMode === "list" ? "3x3表示に切り替え" : "リスト表示に切り替え"}
            </button>
          </div>
          <ul
            className={
              displayMode === "list"
                ? "memo-list overflow-auto"
                : "memo-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            }
            style={displayMode === "list" ? { maxHeight: "70vh" } : {}}
          >
            {notes.map((n,index) => (
              <li
                className={
                  displayMode === "list"
                    ? "memo-list-item relative p-2 border-b border-gray-200"
                    : "memo-grid-item rounded border border-gray-200 p-4 bg-white shadow-sm"
                }
                key={n.id}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="inline-block mb-2 cursor-pointer font-semibold" onClick={() => onSelectNote(n.id)}>
                      No{index + 1}: {n.title || "(無題)"}
                    </h3>
                    <div className="action-items flex gap-2">
                      <div
                        className="hover shot-icon-btn"
                        onClick={() => onSelectNote(n.id)}
                      >
                        <img src={EditIcon} alt="edit" style={{ width: 12, height: 12 }} />
                      </div>
                      <div
                        className="hover shot-icon-btn"
                        onClick={() => onDeleteNote(n.id)}
                      >
                        <img src={DeleteIcon} alt="delete" style={{ width: 12, height: 12 }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button className="text-sm px-2 py-1 border rounded" onClick={() => onPreviewNote(n.title, n.content)}>
                      プレビュー表示
                    </button>
                    <span className="text-xs text-gray-500 break-all">{n.content?.slice(0, 100)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="files-actions p-4">
          <button className="mr-1" onClick={onImportNotes}>インポート</button>
          <button onClick={onExportNotes}>エクスポート</button>
        </div>
      </div>
    </div>
  );
}