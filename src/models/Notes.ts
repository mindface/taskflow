import { ConceptView } from "./ConceptView";
import { RelationView } from "./RelationView";

export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type NoteData = {
  note: Note;
  concepts: ConceptView[];
  relations: RelationView[];
}
