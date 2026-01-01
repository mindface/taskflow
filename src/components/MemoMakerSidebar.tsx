import { useState } from "react";
import { Note } from "../models/Notes";
import EditIcon from "../assets/edit.svg";
import DeleteIcon from "../assets/delete.svg";

import "../styles/sidebar.css";

type Props = {
  notes: Note[];
  onSelectNote: (id: number) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: number) => void;
  onLoadNotes: () => void;
  onExportNotes: () => void;
  onImportNotes: () => void;
}

export function MemoMakerSidebar({
  notes,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onLoadNotes,
  onExportNotes,
  onImportNotes
}: Props) {
  const [switcher,setSwitcher] = useState(false)

  const switcherAction = () => {
    setSwitcher(!switcher);
  }

  return (
    <div className={ switcher ? "sidebar sidebar-on p-4" : "sidebar p-4" }>
      <aside>
        <div className="sidebar-btn">
          <button onClick={switcherAction}>{switcher?"open":"close"}</button>
        </div>
        <div className="pb-2">
          <button className="mr-1" onClick={onLoadNotes}>更新</button>
          <button onClick={onCreateNote}>新規</button>
        </div>
        <ul className="overflow-auto" style={{ maxHeight: "70vh" }}>
          {notes.map((n,index) => (
            <li key={n.id} className="sidebar-item p-2 border-b border-gray-200">
              <h3 className="pb-2" onClick={() => onSelectNote(n.id)}>No{index+1}:{n.title || "(無題)"}</h3>
              <div className="action-items flex gap-2">
                <div
                  className="hover icon-btn"
                  onClick={() => onSelectNote(n.id)}
                >
                  <img src={EditIcon} alt="edit" style={{ width: 16, height: 16 }} />
                </div>
                <div
                  className="hover icon-btn"
                  onClick={() => onDeleteNote(n.id)}
                >
                  <img src={DeleteIcon} alt="delete" style={{ width: 16, height: 16 }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <div className="files-actions p-4">
        <button className="mr-1" onClick={onImportNotes}>インポート</button>
        <button onClick={onExportNotes}>エクスポート</button>
      </div>
    </div>
  );
}