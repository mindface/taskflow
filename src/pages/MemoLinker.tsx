import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useNotes } from "../store/note";

function MemoLinker() {
  const { notes, loadNotes, error } = useNotes();

  useEffect( () => {
    (async () => {
      try {
        await loadNotes();
        console.log("notes loaded", notes);
      } catch (e) {
        console.error("init_db error", e);
      }
    })();
  }, []);

  useEffect(() => {
    console.log("notes11", notes);
  }, [notes]);

  return (
    <div className="main-box">
      {notes.length === 0 && <p>No notes available.</p>}
      {notes.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  );
}

export default MemoLinker;
