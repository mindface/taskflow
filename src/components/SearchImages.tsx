import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";


export function SearchImages() {
  const [selectImageText, setSelectImageText] = useState<string>("");

  const searchApi = async () => {
    try {
      const res = await fetch("https://www.googleapis.com/customsearch/v1?key=AIzaSyDFwqNX4wFmKZ6hxOYF-KUoANk2YOGUc2w&cx=017484227221447008033:vgneaiity80&q=cats&searchType=image",{method:"GET"})
      const data = await res.json()
      console.log(data)
      // curl -G "https://customsearch.googleapis.com/customsearch/v1" \
      //      --data-urlencode "key=AIzaSyDFwqNX4wFmKZ6hxOYF-KUoANk2YOGUc2w" \
      //      --data-urlencode "cx=017484227221447008033:vgneaiity80" \
      //      --data-urlencode "q=cats" \
      //      --data-urlencode "searchType=image"
    } catch (error) {
      console.log(error)
    }
  }

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
