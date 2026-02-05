import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import type { Note } from "../models/Notes";

type Props = {
  noteList: Note[];
};

function ConnectLinker({ noteList }: Props) {
  const [noteId, setNoteId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("explains");

  const submit = async () => {
    if (!noteId || !name || !tag) return;

    try {
      await invoke("add_concept_to_note", {
        noteId,
        name,
        tag,
        description: description,
        infolink: "none",
        role,
      });

      // reset
      setName("");
      setTag("");
      setDescription("");
      setRole("explains");
    } catch (e) {
      console.error("add_concept_to_note error", e);
    }
  };

  useEffect(() => {
    (async () => {
      const res = await invoke("list_concepts")
    })();
  }, [noteList]);

  return (
    <div className="p-4 space-y-4 max-w-md">
      {/* Note selector */}
      <label className="block pb-4">
        <span className="block pb-2">Target Note</span>
        <select
          className="border p-2 w-full"
          value={noteId ?? ""}
          onChange={(e) => setNoteId(Number(e.target.value))}
        >
          <option value="">Select note</option>
          {noteList.map((note) => (
            <option key={note.id} value={note.id}>
              {note.title}
            </option>
          ))}
        </select>
      </label>

      <label className="block pb-4">
        <span className="block pb-2">Concept Name</span>
        <input
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block pb-4">
        <span className="block pb-2">Tag</span>
        <input
          className="border p-2 w-full"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
      </label>

      <label className="block pb-4">
        <span className="block pb-2">Role</span>
        <select
          className="border p-2 w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="explains">Explains</option>
          <option value="example_of">Example Of</option>
          <option value="uses">Uses</option>
          <option value="related">Related</option>
        </select>
      </label>

      <label className="block pb-4">
        <span className="block pb-2">Description</span>
        <textarea
          className="border p-2 w-full"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        >
        </textarea>
      </label>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={submit}
        disabled={!noteId || !name || !tag}
      >
        Add Concept
      </button>
    </div>
  );
}


export default ConnectLinker;
