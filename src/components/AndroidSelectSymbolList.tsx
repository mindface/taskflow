import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AndroidSymbol } from "../models/Symbol";
import AndroidSymbolDialog from "./modifier/AndroidSymbolDialog";

const AndroidSelectSymbolList = () => {
  const [symbols, setSymbols] = useState<(AndroidSymbol & { _firestore_id?: string })[]>([]);
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

  const upsertSymbol = (symbol: AndroidSymbol) => {
    // fetchSymbols();
    // return;
    setSymbols((prevSymbols) => {
      const existingIndex = prevSymbols.findIndex((item) => item.id === symbol.id);
      // if (existingIndex >= 0) {
      //   const nextSymbols = [...prevSymbols];
      //   nextSymbols[existingIndex] = symbol;
      //   return nextSymbols;
      // }
      console.log("Adding new symbol:", symbol);
      console.log("Previous symbols:", prevSymbols);
      return prevSymbols.map(item =>
        item._firestore_id === symbol.id
          ? { ...symbol }
          : { ...item }
      );
    });
  };

  const textSettngs = (text?: string) => {
    const normalized = text || "";
    if (normalized.length > 100) {
      return normalized.substring(0, 100) + "...";
    }
    return normalized;
  }

  useEffect(() => {
    fetchSymbols();
  }, []);

  if (loading) return <div className="p-4 text-center">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">エラー: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Android シンボル一覧 (Firestore)</h3>
        <AndroidSymbolDialog onSaved={upsertSymbol} />
      </div>
      {symbols.length === 0 ? (
        <p className="text-gray-500">シンボルが見つかりませんでした。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbols.map((symbol,index) => (
            <div 
              key={`symbol-${index}-${symbol._id}`} 
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-blue-600 mb-2">{symbol.title || "無題"}</h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {textSettngs(symbol.content) || "内容なし"}
              </p>
              <AndroidSymbolDialog
                data={symbol}
                onSaved={upsertSymbol}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AndroidSelectSymbolList;
