import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNotes } from "../store/note";
import ConnectLinker from "../components/ConnectLinker";

function MemoLinker() {
  const { notes, loadNotes, error } = useNotes();

  useEffect( () => {
    (async () => {
      try {
        await loadNotes();
      } catch (e) {
        console.error("init_db error", e);
      }
    })();
  }, []);

  return (
    <div className="main-box">
      <ConnectLinker noteList={notes} />
    </div>
  );
}

export default MemoLinker;
