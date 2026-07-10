import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import CoreDialog from "../core/CoreDialog";
import { AndroidSymbol } from "../../models/Symbol";

import "../../styles/sidebar.css";

const FIREBASE_USER_ID = import.meta.env.VITE_FIREBASE_USER_ID || "eH0KbeUS6hVpFBU4sAwT153lejL2";

type EditAndroidSymbol = AndroidSymbol & { _firestore_id?: string };

type Props = {
  data?: EditAndroidSymbol;
  onSaved?: (symbol: AndroidSymbol) => void;
};

const createInitialSymbol = (data?: EditAndroidSymbol): AndroidSymbol => ({
  id: data?._firestore_id || "",
  user_id: data?.user_id || FIREBASE_USER_ID,
  title: data?.title || "",
  content: data?.content || "",
  created_at: data?.created_at ? String(data.created_at) : Date.now().toString(),
  updated_at: data?.updated_at ? String(data.updated_at) : Date.now().toString(),
  symbol_type: data?.symbol_type || "",
  extension: data?.extension || "",
  language: data?.language || "",
});

export default function AndroidSymbolDialog({ data, onSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [symbol, setSymbol] = useState<AndroidSymbol>(createInitialSymbol(data));
  const [isEditing, setIsEditing] = useState(data?._firestore_id !== undefined);

  useEffect(() => {
    setSymbol(createInitialSymbol(data));
  }, [data]);

  const handleChange = (field: keyof AndroidSymbol, value: string) => {
    setSymbol((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const nowString = Date.now().toString();
      const symbol_info: AndroidSymbol = {
        ...symbol,
        _id: symbol.id,
        user_id: symbol.user_id || FIREBASE_USER_ID,
        title: symbol.title || "",
        content: symbol.content || "",
        symbol_type: symbol.symbol_type || "",
        extension: symbol.extension || "",
        language: symbol.language || "",
        updated_at: nowString,
        created_at: symbol.created_at ? String(symbol.created_at) : nowString,
      };

      const savedSymbol = symbol.id
        ? await invoke<AndroidSymbol>("andoroid_update_symbol", { symbolInfo: symbol_info })
        : await invoke<AndroidSymbol>("andoroid_create_symbol", { symbolInfo: symbol_info });

      onSaved?.(savedSymbol);
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to save symbol:", err);
    }
  };

  return (
    <>
      <div className="mb-4 flex gap-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="hover shot-icon-btn p-2 flex gap-2"
        >
          {isEditing ? "編集する" : "新規登録"}
        </button>
      </div>

      <CoreDialog
        isOpen={isOpen}
        title={isEditing ? "シンボルを編集" : "シンボルを新規登録"}
        onClose={() => setIsOpen(false)}
      >
        <div className="dialog">
          <div className="dialog-content">
            <div className="pb-2">
              <input
                className="border p-2 w-full"
                placeholder="title"
                value={symbol.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            <div className="pb-2">
              <textarea
                className="border p-2 w-full"
                placeholder="description"
                value={symbol.content || ""}
                onChange={(e) => handleChange("content", e.target.value)}
              />
            </div>
            <div className="pb-2">
              <input
                className="border p-2 w-full"
                placeholder="symbol type"
                value={symbol.symbol_type || ""}
                onChange={(e) => handleChange("symbol_type", e.target.value)}
              />
            </div>
            <div className="pb-2 grid grid-cols-2 gap-2">
              <input
                className="border p-2 w-full"
                placeholder="extension"
                value={symbol.extension || ""}
                onChange={(e) => handleChange("extension", e.target.value)}
              />
              <input
                className="border p-2 w-full"
                placeholder="language"
                value={symbol.language || ""}
                onChange={(e) => handleChange("language", e.target.value)}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setIsOpen(false)} className="btn-secondary">
                キャンセル
              </button>
              <button onClick={handleSave} className="btn-primary">
                保存
              </button>
            </div>
          </div>
        </div>
      </CoreDialog>
    </>
  );
}