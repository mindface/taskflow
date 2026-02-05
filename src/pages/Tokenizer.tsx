import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function Tokenizer() {
  const [text,textSet] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  async function loadFile() {
    try {
      const content = await invoke("read_file", { path: "target/test.txt" });
      console.log("File content:", content);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  }

  const fetchFiles = async () => {
    try {
      const result = await invoke<string[]>("list_files", { directory: "target" });
      setFiles(result);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  return (
    <div className="main-box">
      <div className="main-title">形態素解析</div>
      <main className="main">
        <a href="https://zenn.dev/furharu/articles/ece72dac5feffe">github</a>
        <input type="text"
          value={text}
          onChange={(e) => textSet(e.target.value)}
        />
        <button onClick={loadFile}>loadFile</button>
        <div className="list-box">
        <button onClick={fetchFiles}>Load Files</button>
        <ul>
          {files.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
        </div>
      </main>
    </div>
  );
}

export default Tokenizer;
