import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core"

type Props = {
  imagePath: string;
  copyPath?: (path: string) => void;
  deleteImage?: (path: string) => void;
}

export default function ImageElement(props: Props) {
  const { imagePath, copyPath, deleteImage } = props;
  const [imageSrc, setImageSrc] = useState("");
  const [deleteImageSrc, setdeleteImageSrc] = useState("");
  const deleteImageAction = deleteImage ? deleteImage : (() => {})
  const imageCopyPathAction = copyPath ? copyPath : (() => {})

  useEffect(() => {
    imagePathConverter(imagePath)
  },[])

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
      <button
        onClick={() => imageCopyPathAction(imageSrc)}
        className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1"
      >
        copy
      </button>
    </div>
  );
}