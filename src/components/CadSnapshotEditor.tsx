import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import type { Canvas as FabricCanvas } from "fabric";

type Props = {
  storedName: string;
  snapshotId: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function CadSnapshotEditor({
  storedName,
  snapshotId,
  onClose,
  onSaved,
}: Props) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let canvas: FabricCanvas | null = null;

    async function initialize() {
      try {
        const imageDataUrl = await invoke<string>("read_cad_process_snapshot", {
          storedName,
          snapshotId,
        });
        if (!active || !elementRef.current) return;

        const { Canvas, FabricImage } = await import("fabric");
        const image = await FabricImage.fromURL(imageDataUrl);
        if (!active || !elementRef.current) return;
        canvas = new Canvas(elementRef.current, {
          selection: true,
          preserveObjectStacking: true,
        });
        const imageWidth = image.width ?? 1;
        const imageHeight = image.height ?? 1;
        canvas.setDimensions({
          width: imageWidth,
          height: imageHeight,
        });
        image.set({
          left: imageWidth / 2,
          top: imageHeight / 2,
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
          excludeFromExport: false,
        });
        canvas.add(image);
        canvas.sendObjectToBack(image);
        canvasRef.current = canvas;
      } catch (loadError) {
        if (active) {
          setError(`画像を開けませんでした: ${String(loadError)}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();
    return () => {
      active = false;
      canvasRef.current = null;
      if (canvas) void canvas.dispose();
    };
  }, [snapshotId, storedName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = drawing;
    if (drawing) {
      void import("fabric")
        .then(({ PencilBrush }) => {
          if (canvasRef.current !== canvas || !drawing) return;
          const brush = new PencilBrush(canvas);
          brush.color = "#e11d48";
          brush.width = 4;
          canvas.freeDrawingBrush = brush;
        })
        .catch((loadError: unknown) => {
          setError(`描画機能を読み込めませんでした: ${String(loadError)}`);
        });
    }
  }, [drawing, loading]);

  function addText() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void import("fabric").then(({ Textbox }) => {
      if (canvasRef.current !== canvas) return;
      const textWidth = Math.max(1, Math.min(480, canvas.getWidth() - 40));
      const text = new Textbox("確認箇所", {
        left: Math.max(0, (canvas.getWidth() - textWidth) / 2),
        top: Math.max(20, canvas.getHeight() / 2 - 20),
        width: textWidth,
        fill: "#dc2626",
        fontSize: Math.max(20, Math.round(canvas.getWidth() / 35)),
        fontWeight: "bold",
        lineHeight: 1.25,
        splitByGrapheme: true,
        backgroundColor: "rgba(255,255,255,0.75)",
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
      setDrawing(false);
    }).catch((loadError: unknown) => {
      setError(`テキスト機能を読み込めませんでした: ${String(loadError)}`);
    });
  }

  function deleteSelected() {
    const canvas = canvasRef.current;
    const selected = canvas?.getActiveObject();
    if (!canvas || !selected) return;
    canvas.remove(selected);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  async function saveImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setError(null);
    try {
      await invoke("save_cad_process_snapshot", {
        storedName,
        snapshotId,
        imageDataUrl: canvas.toDataURL({ format: "png", multiplier: 1 }),
      });
      onSaved();
    } catch (saveError) {
      setError(`加工画像を保存できませんでした: ${String(saveError)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDrawing((current) => !current)}
          disabled={loading || saving}
        >
          {drawing ? "描画を終了" : "フリーハンド描画"}
        </button>
        <button type="button" onClick={addText} disabled={loading || saving}>
          テキストを追加
        </button>
        <button type="button" onClick={deleteSelected} disabled={loading || saving}>
          選択項目を削除
        </button>
        <button
          type="button"
          onClick={() => void saveImage()}
          disabled={loading || saving}
        >
          {saving ? "保存中..." : "加工内容を保存"}
        </button>
        <button type="button" onClick={onClose} disabled={saving}>
          閉じる
        </button>
      </div>
      <p className="mb-2 text-xs text-gray-600">
        描画またはテキストを追加し、選択した注釈はドラッグで移動・サイズ調整できます。保存すると工程画像を加工後の内容に置き換えます。
      </p>
      {loading && <p className="text-sm text-gray-600">画像を読み込み中...</p>}
      {error && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="max-w-full overflow-auto rounded border border-gray-200 bg-white">
        <canvas ref={elementRef} />
      </div>
    </section>
  );
}
