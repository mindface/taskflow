import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import type {
  BufferGeometry,
  Material,
  Object3D,
  WebGLRenderer,
} from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Props = {
  storedName: string;
  fileName: string;
  onCapture: (imageDataUrl: string) => void;
  captureDisabled?: boolean;
};

function modelFormat(fileName: string): "stl" | "glb" | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension === "stl" || extension === "glb" ? extension : null;
}

function isDisposableTexture(value: unknown): value is { isTexture: true; dispose: () => void } {
  return (
    typeof value === "object" &&
    value !== null &&
    "isTexture" in value &&
    value.isTexture === true &&
    "dispose" in value &&
    typeof value.dispose === "function"
  );
}

function disposeObject(object: Object3D) {
  object.traverse((child) => {
    const mesh = child as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (isDisposableTexture(value)) value.dispose();
      });
      material.dispose();
    });
  });
}

export default function CadModelViewer({
  storedName,
  fileName,
  onCapture,
  captureDisabled = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const format = modelFormat(fileName);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !format) return;
    const viewerContainer = container;
    const viewerFormat = format;

    let active = true;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let model: Object3D | null = null;
    setError(null);
    setReady(false);
    container.replaceChildren();

    async function renderModel() {
      try {
        const [
          path,
          THREE,
          { OrbitControls: OrbitControlsClass },
          { STLLoader },
          { GLTFLoader },
        ] = await Promise.all([
          invoke<string>("get_uploaded_3d_model_path", { storedName }),
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("three/examples/jsm/loaders/STLLoader.js"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
        ]);
        if (!active) return;

        const assetUrl = convertFileSrc(path);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
        camera.position.set(4, 3, 5);
        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        viewerContainer.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2));
        const keyLight = new THREE.DirectionalLight(0xffffff, 2);
        keyLight.position.set(5, 8, 6);
        scene.add(keyLight);

        controls = new OrbitControlsClass(camera, renderer.domElement);
        controls.enableDamping = true;

        const loadedModel = await new Promise<Object3D>((resolve, reject) => {
          if (viewerFormat === "stl") {
            new STLLoader().load(
              assetUrl,
              (geometry) => {
                geometry.computeVertexNormals();
                resolve(
                  new THREE.Mesh(
                    geometry,
                    new THREE.MeshStandardMaterial({
                      color: 0x94a3b8,
                      metalness: 0.15,
                      roughness: 0.65,
                    }),
                  ),
                );
              },
              undefined,
              reject,
            );
          } else {
            new GLTFLoader().load(
              assetUrl,
              (gltf) => resolve(gltf.scene),
              undefined,
              reject,
            );
          }
        });
        if (!active) {
          disposeObject(loadedModel);
          renderer.dispose();
          return;
        }

        model = loadedModel;
        scene.add(model);
        const bounds = new THREE.Box3().setFromObject(model);
        if (bounds.isEmpty()) {
          throw new Error("モデルに表示可能な形状がありません");
        }
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
          throw new Error("モデルの寸法を読み取れません");
        }
        model.position.sub(center);
        camera.position.set(maxDimension * 1.8, maxDimension * 1.4, maxDimension * 2.2);
        camera.near = Math.max(maxDimension / 1000, 0.001);
        camera.far = maxDimension * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();

        const resize = () => {
          if (!renderer) return;
          const width = Math.max(viewerContainer.clientWidth/2, 1);
          const height = Math.max(viewerContainer.clientHeight/2, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(viewerContainer);

        const animate = () => {
          if (!active || !renderer) return;
          animationFrame = requestAnimationFrame(animate);
          controls?.update();
          renderer.render(scene, camera);
        };
        animate();
        setReady(true);
      } catch (loadError) {
        if (active) {
          setError(`3Dモデルを表示できませんでした: ${String(loadError)}`);
        }
        setReady(false);
        resizeObserver?.disconnect();
        if (model) disposeObject(model);
        model = null;
        controls?.dispose();
        controls = null;
        renderer?.dispose();
        renderer?.domElement.remove();
        renderer = null;
      }
    }

    void renderModel();
    return () => {
      active = false;
      setReady(false);
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      controls?.dispose();
      if (model) disposeObject(model);
      renderer?.dispose();
      renderer?.domElement.remove();
      viewerContainer.replaceChildren();
    };
  }, [format, storedName]);

  if (!format) return null;

  return (
    <section className="my-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">CAD / 3Dモデル 3Dプレビュー（{format.toUpperCase()}）</h4>
        <button
          type="button"
          onClick={() => {
            try {
              const canvas = containerRef.current?.querySelector("canvas");
              if (!canvas) {
                throw new Error("表示画像がありません");
              }
              onCapture(canvas.toDataURL("image/png"));
            } catch (captureError) {
              setError(`表示画像を取得できませんでした: ${String(captureError)}`);
            }
          }}
          disabled={!ready || captureDisabled}
        >
          現在の表示を工程として記録
        </button>
      </div>
      {error && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="l">
        <div
          ref={containerRef}
          className="relative h-[480px] w-full overflow-hidden rounded border border-gray-200 bg-white"
          aria-label={`${fileName}の3Dモデル`}
        />
      </div>
      <p className="p-2 text-xs text-gray-500">
        ドラッグで回転、スクロールで拡大・縮小できます。元のファイルは変更せず保存されています。
      </p>
    </section>
  );
}
