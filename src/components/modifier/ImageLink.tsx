import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import CoreDialog from "../core/Dialog"
import { convertFileSrc } from "@tauri-apps/api/core"
import ImageElement from "./ImageElement"

export default function ImageLink() {

  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const directory = "taskFllow/images";

  const DialogHandler = () => {
    setIsOpen(!isOpen);
  };

  // 画像一覧取得
  const loadImages = async () => {
    try {
      const res = await invoke<string[]>("list_image_files", {
        directory
      });
      console.log(res)
      setImages(res);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      await invoke("ensure_image_dir");
      await loadImages();
    })()
  }, []);

  // 画像アップロード
  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await invoke("write_binary_file", {
      directory,
      fileName: file.name,
      data: Array.from(new Uint8Array(buffer))
    });
    loadImages();
  };

  // 削除
  const deleteImage = async (name: string) => {
    const pathArray = name.split("%2F")
    console.log(pathArray[pathArray.length-1])
    await invoke("deleting_file", {
      directory: directory,
      fileName: name
    });

    loadImages();
  };

  const imagePath = async (imageName: string) => {
    const desktop = await invoke<string>("get_desktop_path")
    const path = `${desktop}/${imageName}`
    return convertFileSrc(path);
  }

  const imageCopyPath = (imagePath: string) => {
    navigator.clipboard.writeText(imagePath);
  }

  return (
    <div className="p-4 space-y-4 max-w-md">
      <button
        onClick={DialogHandler}
        className="btn"
      >
        画像
      </button>
      <CoreDialog
        isOpen={isOpen}
        title="画像の追加"
        onClose={() => setIsOpen(false)}
      >
        <div className="space-y-4">
          <div className="pb-4">
            <input
              type="file"
              accept="image/*"
              onChange={uploadImage}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 p-8">
            {images.map((img) => {
              const path = `${directory}/${img}`;
              const src = convertFileSrc(path);
              return (
                <div key={img} className="relative">
                  <ImageElement
                    imagePath={img}
                    deleteImage={(path) => { deleteImage(path) }}
                    copyPath={(path) => { imageCopyPath(path) }}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </CoreDialog>

    </div>
  );
}