import BaseMakerDialog from "./base/BaseMakerDialog";
import { AndroidNote } from "../../models/Notes";
import { AndroidSymbol } from "../../models/Symbol";

import "../../styles/sidebar.css";

import { invoke } from "@tauri-apps/api/core"

type AndroidData = AndroidNote | AndroidSymbol;

type Props = {
  data: AndroidData;
}

export default function MemoMakerDialog({
  data
}: Props) {

  const updateAndroidNoteAction = async (data: AndroidData, title: string, content: string) => {
    try {
      const setNote = {
        ...data,
        user_id: "user_id" in data ? data.user_id || 'noid' : 'noid',
        title: title || data.title || '',
        content: content || data.content || '',
      } as AndroidData;

      if ("symbol_type" in setNote || "extension" in setNote || "language" in setNote) {
        await invoke<AndroidSymbol>("andoroid_update_symbol", { symbol: setNote });
      } else {
        await invoke<AndroidNote>("andoroid_update_note", { note: setNote });
      }
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  }

  return (
    <BaseMakerDialog<AndroidData>
      dialogTitle="andoroidメモを確認する"
      data={data}
      onSave={(data, title, content) => {
        updateAndroidNoteAction(data, title, content);
      }}
    />
  );
}