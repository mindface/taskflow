import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import CoreDialog from "../../core/CoreDialog"
import ImageElement from "./../ImageElement"
import ImageIcon from "../../../assets/image.svg";

export default function ImageDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState("");
  const directory = "taskFllow/images";

  const DialogHandler = () => {
    setIsOpen(!isOpen);
  };

  const loadImages = async () => {
    try {
      const res = await invoke<string[]>("list_image_files", {
        directory
      });
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

  const deleteImage = async (name: string) => {
    const pathArray = name.split("%2F")
    console.log(pathArray[pathArray.length-1])
    await invoke("deleting_file", {
      directory: directory,
      fileName: name
    });

    loadImages();
  };

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(message);
    } catch (error) {
      console.error("Failed to copy image reference:", error);
      setCopyStatus("クリップボードへのコピーに失敗しました。");
    }
  }

  const imageCopyPath = (imagePath: string) => {
    void copyToClipboard(imagePath, "画像URLをコピーしました。");
  }

  const imageCopyMarkdown = (imagePath: string, alt: string) => {
    const escapedAlt = alt.replace(/[\\[\]]/g, "\\$&");
    void copyToClipboard(
      `![${escapedAlt}](<${imagePath}>)`,
      "Markdown形式の画像リンクをコピーしました。",
    );
  }

  return (
    <div className="absolute top-0 right-0 space-y-4 max-w-md">
      <button
        onClick={DialogHandler}
        className="shot-icon-btn"
      >
        <img src={ImageIcon} alt="image" style={{ width: 12, height: 12 }} />
      </button>
      <CoreDialog
        isOpen={isOpen}
        title="画像の追加"
        onClose={() => setIsOpen(false)}
      >
        <div className="space-y-4">
          {copyStatus && (
            <p className="text-sm text-gray-600" role="status">
              {copyStatus}
            </p>
          )}
          <div className="pb-4">
            <input
              type="file"
              accept="image/*"
              onChange={uploadImage}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 p-8">
            {images.map((img) => {
              return (
                <div key={img} className="relative border border-gray-100 rounded-lg p-2">
                  <ImageElement
                    imagePath={img}
                    deleteImage={(path) => { deleteImage(path) }}
                    copyPath={(path) => { imageCopyPath(path) }}
                    copyMarkdown={(path, alt) => { imageCopyMarkdown(path, alt) }}
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