import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ColumnInfo {
  name: string;
  dtype: string;
  notnull: boolean;
  pk: boolean;
}

interface TableStats {
  name: string;
  count: number;
  columns: ColumnInfo[];
}

interface DbInfo {
  path: string;
  version: number;
  status: "connected" | "disconnected" | "error";
  tables: TableStats[];
}

export default function DbInspector() {
  const [info, setInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbStats = async () => {
    setLoading(true);
    try {
      // Rust側のコマンド（想定）からDB情報を取得
      // 実際の実装に合わせてコマンド名は調整してください
      const stats = await invoke<DbInfo>("get_db_stats");
      setInfo(stats);
    } catch (error) {
      console.error("Failed to fetch DB stats:", error);
      setInfo({
        version: 0,
        path: "unknown",
        status: "error",
        tables: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbStats();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            info?.status === "connected" ? "bg-green-500 animate-pulse" : 
            info?.status === "error" ? "bg-red-500" : 
            "bg-gray-400"
          }`}></span>
          Database Inspector
        </h3>
        <button 
          onClick={fetchDbStats}
          disabled={loading}
          className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-1.5 rounded-md transition-all font-medium border border-gray-200"
        >
          {loading ? "更新中..." : "再読み込み"}
        </button>
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <div className="text-xs text-gray-500 font-mono break-all">
          <span className="font-bold text-gray-700">Path:</span> {info?.path || "Loading..."}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          <span className="font-bold text-gray-700">Schema Version:</span> {info?.version ?? "N/A"}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-center py-8 text-gray-400">Checking database structure...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {info?.tables.map((table) => (
            <div 
              key={table.name} 
              className="bg-gray-50 border border-gray-100 p-4 rounded-lg hover:border-blue-200 transition-colors group"
            >
              <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
                <div className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {table.name}
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-blue-600 leading-none">
                    {table.count.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase">records</div>
                </div>
              </div>
              
              <div className="space-y-1">
                {table.columns.map(col => (
                  <div key={col.name} className="flex justify-between text-[11px] font-mono">
                    <span className={`${col.pk ? 'text-amber-600 font-bold' : 'text-gray-600'}`}>
                      {col.pk && '🔑 '}{col.name}
                    </span>
                    <span className="text-gray-400">{col.dtype}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {info?.tables.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-400 py-2">テーブルが見つかりません</div>
          )}
        </div>
      )}
    </div>
  );
}