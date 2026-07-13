import React, { createContext, useReducer, useContext, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ShareNote } from "../models/Notes";

type State = {
  shareNotes: ShareNote[];
  loadingShareNotes: boolean;
  savingShareNote: boolean;
  deletingShareNoteId?: number;
  error?: string;
};

type Action =
  | { type: "SET_SHARE_NOTES"; payload: ShareNote[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload?: string };

const initialState: State = {
  shareNotes: [],
  loadingShareNotes: false,
  savingShareNote: false,
  deletingShareNoteId: undefined,
  error: undefined,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SHARE_NOTES":
      return { ...state, shareNotes: action.payload, loadingShareNotes: false, error: undefined };
    case "SET_LOADING":
      return { ...state, loadingShareNotes: action.payload };
    case "SET_ERROR":
      return { ...state, loadingShareNotes: false, error: action.payload };
    default:
      return state;
  }
}

const ShareNotesContext = createContext<
  State & {
    loadShareNotes: () => Promise<void>;
    addShareNote: (note: ShareNote) => Promise<void>;
    updateShareNote: (note: ShareNote) => Promise<void>;
    deleteShareNote: (id: number) => Promise<void>;
  }
>({
  ...initialState,
  loadShareNotes: async () => {},
  addShareNote: async () => {},
  updateShareNote: async () => {},
  deleteShareNote: async () => {},
});

export function ShareNotesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  async function loadShareNotes() {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const shareNotes = (await invoke<ShareNote[]>("turso_list_share_notes")) || [];
      dispatch({ type: "SET_SHARE_NOTES", payload: shareNotes });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  async function addShareNote(note: ShareNote) {
    try {
      await invoke("turso_insert_share_note", { note });
      await loadShareNotes();
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  async function updateShareNote(note: ShareNote) {
    try {
      await invoke("turso_update_share_note", { note });
      await loadShareNotes();
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  async function deleteShareNote(id: number) {
    try {
      await invoke("turso_delete_share_note", { id });
      await loadShareNotes();
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  return (
    <ShareNotesContext.Provider value={{ ...state, loadShareNotes, addShareNote, updateShareNote, deleteShareNote }}>
      {children}
    </ShareNotesContext.Provider>
  );
}

export const useShareNotes = () => useContext(ShareNotesContext);
