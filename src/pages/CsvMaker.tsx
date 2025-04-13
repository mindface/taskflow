import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function CsvMaker() {
  const [text,textSet] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  const sampleData = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 }
  ];

  const exportCSV = async () => {
    try {
      await invoke("export_to_csv", { data: sampleData });
      alert("CSV saved successfully!");
    } catch (error) {
      console.error("Failed to save CSV:", error);
    }
  }

  return (
    <div className="main-box text-black">
      <div className="main-title">取得情報処理</div>
      <main className="main">
        <button onClick={exportCSV}>add</button>
      </main>
    </div>
  );
}

export default CsvMaker;
