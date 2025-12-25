import { Note } from "../models/Notes";

type Props = {
  notes: Note[];
  onSelectNote: (id: number) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: number) => void;
  onLoadNotes: () => void;
}

export function MemoMakerSidebar({
  notes,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onLoadNotes
}: Props) {

  return (
    <div className="p-4">
      <aside>
        <div className="pb-2">
          <button onClick={onLoadNotes}>更新</button>
          <button onClick={onCreateNote}>新規</button>
        </div>
        <ul className="overflow-auto" style={{ maxHeight: "70vh" }}>
          {notes.map((n,index) => (
            <li key={n.id} className="p-2 border-b border-gray-200">
              <h3 className="pb-2 " onClick={() => onSelectNote(n.id)}>No{index+1}:{n.title || "(無題)"}</h3>
              <div className="flex gap-2">
                <button onClick={() => onSelectNote(n.id)}>開く</button>
                <button onClick={() => onDeleteNote(n.id)}>削除</button>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}