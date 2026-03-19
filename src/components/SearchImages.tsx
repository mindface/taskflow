import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// 画像の検索コンポーネント 調査内容に関しては別の文字を考慮する
export function SearchImages() {
  const [selectImageText, setSelectImageText] = useState<string>("");

  const searchApi = async () => {}

  return (
    <div className="p-4 space-y-4 max-w-md">
      <label className="block pb-4">
        <span className="block pb-2">Concept image</span>
        <input
          className="border p-2 w-full"
          value={selectImageText}
          onChange={(e) => setSelectImageText(e.target.value)}
        />
      </label>
      <button onClick={searchApi}>searchApi</button>
    </div>
  );
}
