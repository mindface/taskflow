import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AndroidSymbol } from "../models/Symbol";
import AndroidMemoDialog from "./modifier/AndroidMemoDialog";

const AndroidSelectSymbolList = () => {
  const [symbols, setSymbols] = useState<AndroidSymbol[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSymbols = async () => {
    try {
      setLoading(true);
      const result = await invoke<AndroidSymbol[]>("andoroid_list_symbol");
      setSymbols(result);
      console.log("Fetched Symbols:", result);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch symbols:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const updateSymbol = (updatedSymbol: AndroidSymbol) => {
    setSymbols((prevSymbols) =>
      prevSymbols.map((symbol) => (symbol.id === updatedSymbol.id ? updatedSymbol : symbol))
    );
  }

  const updateSymbolAction = async (symbol: AndroidSymbol) => {
    try {
      const updatedSymbol = await invoke<AndroidSymbol>("update_android_symbol", {
        id: symbol.id,
        title: symbol.title,
        content: symbol.content,
      });
      updateSymbol(updatedSymbol);
    } catch (err) {
      console.error("Failed to update symbol:", err);
    }
  }

  const textSettngs = (text: string) => {
    if (text.length > 100) {
      return text.substring(0, 100) + "...";
    }
    return text;
  }

  useEffect(() => {
    fetchSymbols();
  }, []);

  if (loading) return <div className="p-4 text-center">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">エラー: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Android シンボル一覧 (Firestore)</h3>
      {symbols.length === 0 ? (
        <p className="text-gray-500">シンボルが見つかりませんでした。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbols.map((symbol) => (
            <div 
              key={symbol.id} 
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-blue-600 mb-2">{symbol.title || "無題"}</h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {textSettngs(symbol.content) || "内容なし"}
              </p>
              <AndroidMemoDialog
                note={symbol}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AndroidSelectSymbolList;
