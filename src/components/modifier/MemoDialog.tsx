import { useState } from "react";
import CoreDialog from "../core/CoreDialog";
import EditIcon from "../../assets/edit.svg";
import WindowIcon from "../../assets/window.svg";
import DeleteIcon from "../../assets/delete.svg";
import { AndroidNote } from "../../models/Notes";

type Props = {
  note: AndroidNote;
}

export default function MemoMakerDialog({
  note,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const DialogHandler = () => {
    setIsOpen(!isOpen);
  };

  const reText = (text: string) => {
    return text.replace("\r\n", "\n");
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
      </div>
      <CoreDialog
        className="daialog-content-wide"
        isOpen={isOpen}
        title="memo list dialog"
        onClose={DialogHandler}
      >
          <div 
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-blue-600 mb-2">{note.title || "無題"}</h2>
            <div className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">
              {(note.content) || "内容なし"}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
              <span>ユーザー: {note.userId?.substring(0, 8) || "不明"}...</span>
              <span>作成日: {note.created_at ? new Date(note.created_at).toLocaleDateString() : "不明"}</span>
            </div>
          </div>
      </CoreDialog>
    </>
  );
}