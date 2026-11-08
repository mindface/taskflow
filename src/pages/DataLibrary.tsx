import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import CadModelViewer from "../components/CadModelViewer";
import MoleculeStructureViewer from "../components/MoleculeStructureViewer";
import { VisualizationDataFormats } from "../components/VisualizationDataFormats";
import { useLocalStorageStore } from "../store/localStorage";

type DataFileCategory = "molecular" | "cad" | "dicom" | "timeseries" | "other";

type StoredDataRecord = {
  id: string;
  storedName: string;
  fileName: string;
  sizeBytes: number;
  category: DataFileCategory;
  description: string;
  addedAt: string;
};

type StoredDataFile = {
  storedName: string;
  fileName: string;
  sizeBytes: number;
};

type DataFilePreview = {
  text: string | null;
  isBinary: boolean;
  isTruncated: boolean;
};

type CadProcessStep = {
  id: string;
  description: string;
  snapshotPath: string;
  createdAt: string;
};

const DATA_RECORDS_KEY = "uploadedDataFiles";
const CAD_PROCESSES_KEY = "cadInspectionProcesses";

const categoryLabels: Record<DataFileCategory, string> = {
  molecular: "分子構造",
  cad: "CAD / 3Dモデル",
  dicom: "医療・解剖学",
  timeseries: "行動・時系列データ",
  other: "その他",
};

function categoryFromFileName(fileName: string): DataFileCategory {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdb" || extension === "cif") return "molecular";
  if (["glb", "gltf", "stl", "step", "stp"].includes(extension ?? "")) return "cad";
  if (["dcm", "dicom"].includes(extension ?? "")) return "dicom";
  if (["json", "csv", "parquet", "tsv"].includes(extension ?? "")) return "timeseries";
  return "other";
}

function formatImplementationStatus(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (["pdb", "glb", "stl"].includes(extension ?? "")) return "3D表示対応";
  if (["cif", "gltf", "step", "stp", "dcm", "dicom", "parquet"].includes(extension ?? "")) {
    return "専用表示は未実装";
  }
  if (["json", "csv", "tsv"].includes(extension ?? "")) {
    return "テキスト表示対応・グラフは未実装";
  }
  return "専用表示は未実装";
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataLibrary() {
  const { values, update } = useLocalStorageStore();
  const records = (values[DATA_RECORDS_KEY] as StoredDataRecord[] | undefined) ?? [];
  const processes =
    (values[CAD_PROCESSES_KEY] as Record<string, CadProcessStep[]> | undefined) ?? {};
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [category, setCategory] = useState<DataFileCategory>("other");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DataFilePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processDescription, setProcessDescription] = useState("");
  const [savingProcess, setSavingProcess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = records.find((record) => record.id === selectedId);
  const selectedProcessSteps = selectedRecord ? processes[selectedRecord.id] ?? [] : [];
  const selectedExtension = selectedRecord?.fileName.split(".").pop()?.toLowerCase();
  const supportsCadProcess =
    selectedRecord?.category === "cad" &&
    (selectedExtension === "stl" || selectedExtension === "glb");

  useEffect(() => {
    if (!selectedRecord) {
      setPreview(null);
      return;
    }

    let active = true;
    setPreview(null);
    setLoadingPreview(true);
    setError(null);
    invoke<DataFilePreview>("read_uploaded_data_file_preview", {
      storedName: selectedRecord.storedName,
    })
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch((previewError) => {
        if (active) setError(`ファイルのプレビューに失敗しました: ${String(previewError)}`);
      })
      .finally(() => {
        if (active) setLoadingPreview(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRecord?.id, selectedRecord?.storedName]);

  async function chooseFile() {
    setError(null);
    try {
      const selected = await open({
        multiple: false,
        title: "登録するデータファイルを選択",
      });
      if (typeof selected !== "string") return;

      const fileName = selected.split(/[\\/]/).pop() ?? selected;
      setSelectedPath(selected);
      setSelectedFileName(fileName);
      setCategory(categoryFromFileName(fileName));
    } catch (selectionError) {
      setError(`ファイル選択に失敗しました: ${String(selectionError)}`);
    }
  }

  async function saveFile() {
    if (!selectedPath) return;
    setSaving(true);
    setError(null);
    let storedFile: StoredDataFile | undefined;
    try {
      storedFile = await invoke<StoredDataFile>("store_uploaded_data_file", {
        sourcePath: selectedPath,
      });
      const record: StoredDataRecord = {
        id: storedFile.storedName,
        storedName: storedFile.storedName,
        fileName: storedFile.fileName,
        sizeBytes: storedFile.sizeBytes,
        category,
        description: description.trim(),
        addedAt: new Date().toISOString(),
      };

      try {
        update<StoredDataRecord[]>(DATA_RECORDS_KEY, (current) => [
          ...(current ?? []),
          record,
        ]);
      } catch (storageError) {
        await invoke("delete_uploaded_data_file", {
          storedName: storedFile.storedName,
        });
        throw storageError;
      }

      setSelectedId(record.id);
      setSelectedPath("");
      setSelectedFileName("");
      setDescription("");
    } catch (saveError) {
      setError(`ファイルの登録に失敗しました: ${String(saveError)}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(record: StoredDataRecord) {
    setError(null);
    try {
      await invoke("delete_uploaded_data_file", {
        storedName: record.storedName,
      });
      update<StoredDataRecord[]>(DATA_RECORDS_KEY, (current) =>
        (current ?? []).filter((item) => item.id !== record.id),
      );
      update<Record<string, CadProcessStep[]>>(CAD_PROCESSES_KEY, (current) => {
        const next = { ...(current ?? {}) };
        delete next[record.id];
        return next;
      });
      if (selectedId === record.id) setSelectedId(null);
    } catch (deleteError) {
      setError(`ファイルの削除に失敗しました: ${String(deleteError)}`);
    }
  }

  async function saveProcessStep(imageDataUrl: string) {
    if (!selectedRecord || !processDescription.trim()) {
      setError("工程の説明を入力してください。");
      return;
    }

    const id = crypto.randomUUID();
    setSavingProcess(true);
    setError(null);
    try {
      const snapshotPath = await invoke<string>("save_cad_process_snapshot", {
        storedName: selectedRecord.storedName,
        snapshotId: id,
        imageDataUrl,
      });
      const step: CadProcessStep = {
        id,
        description: processDescription.trim(),
        snapshotPath,
        createdAt: new Date().toISOString(),
      };
      try {
        update<Record<string, CadProcessStep[]>>(CAD_PROCESSES_KEY, (current) => ({
          ...(current ?? {}),
          [selectedRecord.id]: [...(current?.[selectedRecord.id] ?? []), step],
        }));
      } catch (storageError) {
        await invoke("delete_cad_process_snapshot", {
          storedName: selectedRecord.storedName,
          snapshotId: id,
        });
        throw storageError;
      }
      setProcessDescription("");
    } catch (processError) {
      setError(`工程情報の保存に失敗しました: ${String(processError)}`);
    } finally {
      setSavingProcess(false);
    }
  }

  async function deleteProcessStep(step: CadProcessStep) {
    if (!selectedRecord) return;
    setError(null);
    try {
      await invoke("delete_cad_process_snapshot", {
        storedName: selectedRecord.storedName,
        snapshotId: step.id,
      });
      update<Record<string, CadProcessStep[]>>(CAD_PROCESSES_KEY, (current) => ({
        ...(current ?? {}),
        [selectedRecord.id]: (current?.[selectedRecord.id] ?? []).filter(
          (item) => item.id !== step.id,
        ),
      }));
    } catch (deleteError) {
      setError(`工程情報の削除に失敗しました: ${String(deleteError)}`);
    }
  }

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="text-2xl font-bold">データ管理</h1>
        <p className="mt-1 text-sm text-gray-600">
          ファイルをアプリ内に登録し、内容のプレビューと説明を記録できます。.pdb/.stl/.glbの3D表示に対応しています。
        </p>
      </header>

      <section className="rounded border border-gray-200 bg-white mb-4 p-4">
        <h2 className="mb-4 text-lg font-semibold">データファイルを追加</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void chooseFile()}>
            ファイルを選択
          </button>
          <span className="break-all text-sm text-gray-600">
            {selectedFileName || "ファイルが選択されていません"}
          </span>
        </div>
        {selectedPath && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              データ種別
              <select
                className="mt-1 block w-full rounded border border-gray-300 p-2"
                value={category}
                onChange={(event) => setCategory(event.target.value as DataFileCategory)}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              記録メモ
              <textarea
                className="mt-1 block w-full rounded border border-gray-300 p-2"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="このファイルについての説明や関連情報"
              />
            </label>
            <div className="sm:col-span-2">
              <button type="button" onClick={() => void saveFile()} disabled={saving}>
                {saving ? "登録中..." : "ファイルを登録"}
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
      </section>

      <section className="mb-4 grid gap-6 lg:grid-cols-[minmax(16rem,1fr)_2fr]">
        <div className="rounded border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold">登録済みファイル（{records.length}件）</h2>
          {records.length === 0 ? (
            <p className="text-sm text-gray-500">登録されたファイルはありません。</p>
          ) : (
            <ul className="space-y-2">
              {records.map((record) => (
                <li
                  key={record.id}
                  className={`rounded border p-3 ${selectedId === record.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left shadow-none"
                      onClick={() => setSelectedId(record.id)}
                    >
                      <strong className="block break-all">{record.fileName}</strong>
                      <span className="mt-1 block text-xs text-gray-500">
                        {categoryLabels[record.category]} · {formatFileSize(record.sizeBytes)}
                      </span>
                      <span className={`mt-1 block text-xs ${formatImplementationStatus(record.fileName) === "3D表示対応" ? "text-green-700" : "text-amber-700"}`}>
                        {formatImplementationStatus(record.fileName)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => void deleteRecord(record)}
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-h-64 rounded border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">データ表示</h2>
          {!selectedRecord ? (
            <p className="text-sm text-gray-500">一覧からファイルを選択してください。</p>
          ) : (
            <>
              <h3 className="break-all font-medium">{selectedRecord.fileName}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {categoryLabels[selectedRecord.category]} · {formatFileSize(selectedRecord.sizeBytes)} ·{" "}
                {new Date(selectedRecord.addedAt).toLocaleString()}
              </p>
              <p className={`mt-2 text-sm font-medium ${formatImplementationStatus(selectedRecord.fileName) === "3D表示対応" ? "text-green-700" : "text-amber-700"}`}>
                {formatImplementationStatus(selectedRecord.fileName)}
                {formatImplementationStatus(selectedRecord.fileName) !== "3D表示対応" &&
                  "。ファイル自体は保存され、対応可能な場合はテキストプレビューを表示します。"}
              </p>
              {selectedRecord.description && (
                <p className="my-3 whitespace-pre-wrap text-sm">{selectedRecord.description}</p>
              )}
              {selectedRecord.category === "molecular" && (
                <MoleculeStructureViewer
                  storedName={selectedRecord.storedName}
                  fileName={selectedRecord.fileName}
                />
              )}
              {supportsCadProcess && (
                <section className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold">確認プロセス（{selectedProcessSteps.length}工程）</h4>
                  <label className="mt-3 block text-sm">
                    この表示で確認すること・作業内容
                    <textarea
                      className="mt-1 block w-full rounded border border-gray-300 p-2"
                      rows={3}
                      value={processDescription}
                      onChange={(event) => setProcessDescription(event.target.value)}
                      placeholder="例：コネクタ周辺の干渉がないことを確認する"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    説明を入力してからビューアーの「現在の表示を工程として記録」を押してください。
                  </p>
                  {savingProcess && <p className="mt-2 text-sm text-gray-600">工程を保存中...</p>}
                </section>
              )}
              {supportsCadProcess && (
                <CadModelViewer
                  storedName={selectedRecord.storedName}
                  fileName={selectedRecord.fileName}
                  onCapture={(imageDataUrl) => void saveProcessStep(imageDataUrl)}
                  captureDisabled={savingProcess}
                />
              )}
              {supportsCadProcess && (
                <section className="mt-4 border-t border-gray-200 pt-4">
                  {selectedProcessSteps.length > 0 && (
                    <ol className="mt-4 space-y-3">
                      {selectedProcessSteps.map((step, index) => (
                        <li key={step.id} className="rounded border border-gray-200 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">工程 {index + 1}</p>
                              <time className="text-xs text-gray-500" dateTime={step.createdAt}>
                                {new Date(step.createdAt).toLocaleString()}
                              </time>
                            </div>
                            <button
                              type="button"
                              className="text-xs text-red-600"
                              onClick={() => void deleteProcessStep(step)}
                            >
                              削除
                            </button>
                          </div>
                          <p className="my-2 whitespace-pre-wrap text-sm">{step.description}</p>
                          <img
                            className="max-h-80 max-w-full rounded border border-gray-100 object-contain"
                            src={convertFileSrc(step.snapshotPath)}
                            alt={`工程 ${index + 1} の3D表示スナップショット`}
                          />
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}
              <div className="mt-4 max-h-[60vh] overflow-auto rounded bg-gray-50 p-3">
                {loadingPreview ? (
                  <p className="text-sm text-gray-500">読み込み中...</p>
                ) : selectedRecord.category === "molecular" && preview?.text ? (
                  <details>
                    <summary className="cursor-pointer text-sm text-gray-600">
                      元データのテキストを表示（先頭256KB）
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                      {preview.text}
                    </pre>
                  </details>
                ) : preview?.isBinary ? (
                  <p className="text-sm text-gray-600">
                    バイナリ形式のため、内容のプレビューには専用ビューアーが必要です。ファイル情報と記録メモを確認できます。
                  </p>
                ) : preview ? (
                  <>
                    {preview.isTruncated && (
                      <p className="mb-2 text-xs text-amber-700">
                        先頭256KBを表示しています。
                      </p>
                    )}
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
                      {preview.text}
                    </pre>
                  </>
                ) : error ? (
                  <p className="text-sm text-red-600" role="alert">{error}</p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      <VisualizationDataFormats />
    </div>
  );
}
