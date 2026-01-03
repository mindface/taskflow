import React, { createContext, useReducer, useContext, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Note } from "../models/Notes";

type State = {
  notes: Note[];
  loadingNotes: boolean;
  savingNote: boolean;
  deletingNoteId?: number;
  error?: string
};
type Action =
  | { type: "SET_NOTES"; payload: Note[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload?: string };

const initialState: State = {
  notes: [],
  loadingNotes: false,
  savingNote: false,
  deletingNoteId: undefined,
  error: undefined
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_NOTES":
      return { ...state, notes: action.payload, loadingNotes: false, error: undefined };
    case "SET_LOADING":
      return { ...state, loadingNotes: action.payload };
    case "SET_ERROR":
      return { ...state, loadingNotes: false, error: action.payload };
    default:
      return state;
  }
}

const NotesContext = createContext<
  State & {
    loadNotes: () => Promise<void>;
    addNote: (title: string, content: string) => Promise<number | undefined>;
    updateNote: (id: number, title: string, content: string) => Promise<void>;
    deleteNote: (id: number) => Promise<void>;
  }
>({
  ...initialState,
  loadNotes: async () => {},
  addNote: async () => undefined,
  updateNote: async () => {},
  deleteNote: async () => {}
});

export function NotesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  async function loadNotes() {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const notes = (await invoke<Note[]>("list_notes")) || [];
      dispatch({ type: "SET_NOTES", payload: notes });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  async function addNote(title: string, content: string) {
    try {
      const id = await invoke<number>("add_note", { title, content });
      await loadNotes();
      return id;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  async function updateNote(id: number, title: string, content: string) {
    try {
      await invoke("update_note", { id, title, content });
      await loadNotes();
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  async function deleteNote(id: number) {
    try {
      await invoke("delete_note", { id });
      await loadNotes();
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  return (
    <NotesContext.Provider value={{ ...state, loadNotes, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);