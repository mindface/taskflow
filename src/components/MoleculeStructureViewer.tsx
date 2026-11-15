import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import type { GLViewer } from "3dmol";

type Props = {
  storedName: string;
  fileName: string;
};

function molecularFormat(fileName: string): "pdb" | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension === "pdb" ? extension : null;
}

export default function MoleculeStructureViewer({ storedName, fileName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const format = molecularFormat(fileName);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !format) return;
    const viewerContainer: HTMLDivElement = container;
    const viewerFormat: "pdb" = format;

    let active = true;
    let viewer: GLViewer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    setError(null);
    container.replaceChildren();

    async function renderStructure() {
      try {
        const [data, moleculeViewer] = await Promise.all([
          invoke<string>("read_uploaded_molecule", { storedName }),
          import("3dmol"),
        ]);
        if (!active) return;

        viewer = moleculeViewer.createViewer(viewerContainer, {
          backgroundColor: "white",
        });
        viewer.addModel(data, viewerFormat);
        viewer.setStyle({}, { cartoon: { color: "spectrum" }, stick: {} });
        viewer.zoomTo();
        viewer.render();
        resizeObserver = new ResizeObserver(() => {
          viewer?.resize();
        });
        resizeObserver.observe(viewerContainer);
      } catch (loadError) {
        if (active) {
          setError(`分子構造を表示できませんでした: ${String(loadError)}`);
        }
      }
    }

    void renderStructure();
    return () => {
      active = false;
      resizeObserver?.disconnect();
      viewer?.clear();
      container.replaceChildren();
    };
  }, [format, storedName]);

  if (!format) return null;

  return (
    <section className="my-4">
      <h4 className="mb-2 text-sm font-semibold">分子構造 3Dプレビュー（{format.toUpperCase()}）</h4>
      {error && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div
        ref={containerRef}
        className="relative h-[480px] w-full overflow-hidden rounded border border-gray-200 bg-white"
        aria-label={`${fileName}の3D分子構造`}
      />
      <p className="mt-1 text-xs text-gray-500">
        ドラッグで回転、スクロールで拡大・縮小できます。元のファイルは変更せず保存されています。
      </p>
    </section>
  );
}
