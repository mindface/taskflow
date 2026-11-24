import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core"

type Props = {
  imagePath: string;
  copyPath?: (path: string) => void;
  copyMarkdown?: (path: string, alt: string) => void;
  deleteImage?: (path: string) => void;
}

export default function ImageElement(props: Props) {
  const { imagePath, copyPath, copyMarkdown, deleteImage } = props;
  const [imageSrc, setImageSrc] = useState("");
  const [deleteImageSrc, setdeleteImageSrc] = useState("");
  const deleteImageAction = deleteImage ? deleteImage : (() => {})
  const imageCopyPathAction = copyPath ? copyPath : (() => {})
  const imageCopyMarkdownAction = copyMarkdown ? copyMarkdown : (() => {})

  useEffect(() => {
    imagePathConverter(imagePath)
  }, [imagePath])

  const imagePathConverter = async (imageName: string) => {
    const desktop = await invoke<string>("get_desktop_path")
    const path = `${desktop}/${imageName}`
    setdeleteImageSrc(path);
    setImageSrc(convertFileSrc(path))
  }

  return (
    <div className="p-8 space-y-4 max-w-md">
      <img src={imageSrc} />
      <button
        onClick={() => deleteImageAction(deleteImageSrc)}
        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1"
      >
        x
      </button>
      <div className="absolute top-1 left-0 flex gap-2">
        <button
          onClick={() => imageCopyPathAction(imageSrc)}
          className="bg-blue-600 text-white text-xs px-1"
        >
          URL
        </button>
        <button
          onClick={() => imageCopyMarkdownAction(deleteImageSrc, imagePath)}
          className="bg-green-700 text-white text-xs px-1"
          title="Markdown形式でコピー"
          aria-label={`${imagePath}をMarkdown形式でコピー`}
        >
          MD
        </button>
      </div>
    </div>
  );
}