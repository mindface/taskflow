import { useState } from "react";
import { Note } from "../models/Notes";
import EditIcon from "../assets/edit.svg";
import DeleteIcon from "../assets/delete.svg";

import "../styles/sidebar.css";

import { useWindowSync } from "../hooks/useWindowSync";

type Props = {
  notes: Note[];
  onSelectNote: (id: number) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: number) => void;
  onLoadNotes: () => void;
  onExportNotes: () => void;
  onImportNotes: () => void;
}

export default function MemoMakerSidebar({
  notes,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onLoadNotes,
  onExportNotes,
  onImportNotes
}: Props) {
  const [switcher,setSwitcher] = useState(false);
  const { syncContent, syncNoteData, openPreview } = useWindowSync();

  const switcherAction = () => {
    setSwitcher(!switcher);
  }

  const onPreviewNote = async (title: string, content: string) => {
    syncContent(title, content);
    await openPreview(true);
  }

  return (
    <div className={ switcher ? "sidebar-outer sidebar-on p-4" : "sidebar-outer p-4" }>
      <div className="sidebar-on-overlay"></div>
      <div className="sidebar">
        <div>
          <div className="sidebar-btn">
            <button className="box-shadow" onClick={switcherAction}>{switcher?"close":"open"}</button>
          </div>
          <div className="p-2">
            <button className="mr-1" onClick={onLoadNotes}>情報をロード</button>
            <button onClick={onCreateNote}>新規</button>
          </div>
          <ul className="overflow-auto" style={{ maxHeight: "70vh" }}>
            {notes.map((n,index) => (
              <li className="sidebar-item p-2 border-b border-gray-200" key={n.id}>
                <h3 className="inline-block mb-2" onClick={() => onSelectNote(n.id)}>No{index+1}:{n.title || "(無題)"}</h3>
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
                  <div
                    className="hover shot-icon-btn"
                    onClick={() => onPreviewNote(n.title, n.content)}
                  >
                    プレビュー表示
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