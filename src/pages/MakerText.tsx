import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { sendNotification } from "@tauri-apps/api/notification";
import { open } from "@tauri-apps/api/dialog";

import ReactMarkdown from "react-markdown";

export default function MakerText() {
  const [files, setFiles] = useState<string[]>([]);
  const [viewMarkDown, setViewMarkDown] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [addFileName, setAddFileName] = useState("");
  const [directoryPath, setDirectoryPath] = useState("target");

  async function fetchFiles(selectedFolder?: string) {
    try {
      const fileList = await invoke<string[]>("list_files", { directory: selectedFolder ? selectedFolder : directoryPath });
      console.log(fileList)
      setFiles(fileList);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }

  const fetchFilesAction = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "保存先フォルダを選択してください"
    });
    setDirectoryPath(selected as string);
    fetchFiles(selected as string );
  }

  async function loadFile(fileName: string) {
    const filePath = `${directoryPath}/${fileName}`;
    try {
      const content = await invoke<string>("reading_file", { filePath });
      setSelectedFile(fileName);
      setFileContent(content);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  }

  function viewMarkDownAction() {
    setViewMarkDown(!viewMarkDown)
  }

  async function saveFile() {
    if (!selectedFile) return;
    const filePath = `${directoryPath}/${selectedFile}`;
    try {
      await invoke("writing_file", { directory: directoryPath, fileName: selectedFile, content: fileContent  });
      alert("File saved successfully");
    } catch (error) {
      console.error("Failed to save file:", error);
      alert("Failed to save file");
    }
  }

  async function addFile() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "保存先フォルダを選択してください"
      });

      if (!selected) {
        alert("フォルダが選択されませんでした");
        return;
      }
      const directory = typeof selected === "string" ? selected : selected[0];
      setDirectoryPath(directory);
      const response = await invoke("add_file", {
        directory,
        fileName: addFileName,
        content: "test"
      });
      console.log(response);
      sendNotification({ title: 'ファイル追加', body: `${addFileName} を追加しました。` });
      fetchFiles();
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

  const exportPdf = async () => {
    const filePath = `target/${selectedFile}pdf.pdf`;
    const content = await invoke("export_pdf", { outputPath: filePath, text: fileContent });
    await invoke("run_mediapipe",{ input: "test" });
  }

  return (
    <div className="p-4">
      <div className="add-file-box">
        <button onClick={fetchFilesAction}>fetchFilesAction</button>
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
          <div className="input-box">
            <textarea
              cols={30}
              rows={20}
              className="w-full h-64 p-4 border rounded w-100 line-height"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
            />
          </div>
          { viewMarkDown && 
            <div className="output-box p-4 prose prose-sm max-w-none color-black">
              <ReactMarkdown>{fileContent}</ReactMarkdown>
            </div>
          }
          <div className="p-3">
            <button onClick={viewMarkDownAction} className="mt-2 p-2 bg-blue-500 text-white rounded">
              View maek down
            </button>
            <button onClick={saveFile} className="mt-2 p-2 bg-blue-500 text-white rounded">
              Save File
            </button>
            <button onClick={exportPdf} className="mt-2 p-2 bg-blue-500 text-white rounded">
              Export Pdf
            </button>
          </div>
        </div>
      )}

            <button onClick={exportPdf} className="mt-2 p-2 bg-blue-500 text-white rounded">
              Export Pdf
            </button>
    </div>
  );
}