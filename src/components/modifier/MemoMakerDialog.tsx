import { useState } from "react";
import { Note } from "../../models/Notes";
import CoreDialog from "../core/CoreDialog";
import EditIcon from "../../assets/edit.svg";
import WindowIcon from "../../assets/window.svg";
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
}

export default function MemoMakerDialog({
  notes,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onLoadNotes,
  onExportNotes,
  onImportNotes
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { syncContent, syncNoteData, openPreview } = useWindowSync();
  const DialogHandler = () => {
    setIsOpen(!isOpen);
  };

  const onPreviewNote = async (title: string, content: string) => {
    syncContent(title, content);
    await openPreview(true);
  }

  return (
    <>
      <div className="mb-4 flex gap-4">
        <div
          onClick={DialogHandler}
          className="hover shot-icon-btn p-2 flex gap-2"
        >
          <img src={WindowIcon} className="text-white" alt="windowIcon" style={{ width: 12, height: 12 }} />
          メモを確認する
        </div>
        <button
          onClick={onCreateNote}
          className="px-1"
        >
          新規で作成する
        </button>
      </div>
      <CoreDialog
        className="daialog-content-wide"
        isOpen={isOpen}
        title="memo list dialog"
        onClose={DialogHandler}
      >
        <div className="memo-list-dialog">
          <div className="">
            <div className="p-2">
              <button className="mr-1" onClick={onLoadNotes}>リストを更新</button>
              <button onClick={onCreateNote}>新規</button>
            </div>
            <ul className="memo-list-dialog-list overflow-auto" style={{ maxHeight: "70vh" }}>
              {notes.map((n,index) => (
                <li className="memo-list-dialog-item p-2 border-b border-gray-200" key={n.id}>
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
      </CoreDialog>
    </>
  );
}