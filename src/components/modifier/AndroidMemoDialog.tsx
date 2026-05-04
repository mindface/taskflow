import { useState } from "react";
import BaseMakerDialog from "./base/BaseMakerDialog";
import { AndroidNote } from "../../models/Notes";

import "../../styles/sidebar.css";

import { invoke } from "@tauri-apps/api/core"

type Props = {
  note: AndroidNote;
}

export default function MemoMakerDialog({
  note
}: Props) {

  const updateAndroidNoteAction = async (data: AndroidNote, title: string, content: string) => {
    try {
      const setNote = {
        ...data,
        user_id: data.user_id || 'noid',
        title: title || data.title,
        content: content || data.content,
      }
      console.log(setNote)
      const updatedNote = await invoke<AndroidNote>("andoroid_update_note", {note: setNote});
      console.log("Updated Note:", updatedNote);
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  }

  return (
    <BaseMakerDialog<AndroidNote>
      dialogTitle="andoroidメモを確認する"
      data={note}
      onSave={(data, title, content) => {
        updateAndroidNoteAction(data, title, content);
      }}
    />
  );
}