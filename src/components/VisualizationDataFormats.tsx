import { useEffect, useState } from "react";

type VisualizationDataFormat = {
  type: string;
  formats: string;
  frontend: string;
  backend: string;
  status: string;
};

export function VisualizationDataFormats() {
  const [formats, setFormats] = useState<VisualizationDataFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFormats() {
      try {
        const response = await fetch("/data/visualization-data-formats.json");
        if (!response.ok) {
          throw new Error(`データ形式一覧の読み込みに失敗しました: ${response.status}`);
        }
        const data = (await response.json()) as VisualizationDataFormat[];
        if (active) {
          setFormats(data);
        }
      } catch (loadError) {
        if (active) {
          setError(String(loadError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFormats();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mt-8 rounded border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-lg font-semibold">データ形式と表示対応方針</h2>
      <p className="mb-3 text-sm text-gray-600">
        フロントエンドとバックエンド欄は候補技術です。現在の3D表示は.pdb/.stl/.glbに対応し、ほかの形式は未実装です。
      </p>
      {loading ? (
        <p className="text-sm text-gray-600">読み込み中...</p>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="border border-gray-200 p-3">データ種別</th>
                <th scope="col" className="border border-gray-200 p-3">主なフォーマット</th>
                <th scope="col" className="border border-gray-200 p-3">フロントエンド（描画・UI）</th>
                <th scope="col" className="border border-gray-200 p-3">バックエンド / パーサー（Rust / Wasm）</th>
                <th scope="col" className="border border-gray-200 p-3">実装状況</th>
              </tr>
            </thead>
            <tbody>
              {formats.map((format) => (
                <tr key={format.type} className="align-top even:bg-gray-50">
                  <th scope="row" className="border border-gray-200 p-3 font-medium">
                    {format.type}
                  </th>
                  <td className="border border-gray-200 p-3">{format.formats}</td>
                  <td className="border border-gray-200 p-3">{format.frontend}</td>
                  <td className="border border-gray-200 p-3">{format.backend}</td>
                  <td className="border border-gray-200 p-3">{format.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
