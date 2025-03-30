import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function MakerText() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [addFileName, setAddFileName] = useState("");

  async function fetchFiles() {
    try {
      const fileList = await invoke<string[]>("list_files", { directory: "target" });
      setFiles(fileList);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  async function loadFile(fileName: string) {
    const filePath = `target/${fileName}`;
    try {
      const content = await invoke<string>("reading_file", { filePath });
      setSelectedFile(fileName);
      setFileContent(content);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  }

  async function saveFile() {
    if (!selectedFile) return;
    console.log(selectedFile);
    const filePath = `target/${selectedFile}`;
    try {
      await invoke("writing_file", { fileName: filePath, content: fileContent  });
      alert("File saved successfully");
    } catch (error) {
      console.error("Failed to save file:", error);
      alert("Failed to save file");
    }
  }

  async function addFile() {
    try {
      const response = await invoke("add_file", { fileName: addFileName, content: "test" });
      console.log(response);
    } catch (error) {
      console.error("Failed to add file:", error);
    }
  }

  async function deleteingFile(fileName: string) {
    try {
      const response = await invoke("deleteing_file", { fileName: fileName});
      console.log(response);
      fetchFiles();
    } catch (error) {
      console.error("Failed to add file:", error);
    }
  }

  return (
    <div className="p-4">
      <div className="add-file-box">
        <div className="flex p-4">
          <input
            type="text"
            value={addFileName}
            onChange={(e) => setAddFileName(e.target.value)}
          />
          <button onClick={addFile}>ファイルの追加</button>
        </div>
      </div>
      <ul className="mb-4">
        {files.map((file,index) => (
          <li
            key={`file${index}`}
            className="cursor-pointer p-4 color-black"
            
          >
            <span onClick={() => loadFile(file)}>{file}</span>
            <button onClick={() => deleteingFile(file)}>削除</button>
          </li>
        ))}
      </ul>
      {selectedFile && (
        <div>
          <textarea
            cols={30}
            rows={20}
            className="w-full h-64 p-4 border rounded w-100 "
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
          />
          <button onClick={saveFile} className="mt-2 p-2 bg-blue-500 text-white rounded">
            Save File
          </button>
        </div>
      )}
    </div>
  );
}