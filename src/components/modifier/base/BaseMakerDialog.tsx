import { useEffect, useState } from "react";
import CoreDialog from "../../core/CoreDialog";

type CommonData = {
  title: string;
  content: string;
}

type MakerDialogProps<T extends CommonData> = {
  dialogTitle: string;
  btnText?: string;
  data: T;
  onSave: (data: T, title: string, content: string) => void;
};

const BaseMakerDialog = <T extends CommonData>({ data, onSave, dialogTitle, btnText }: MakerDialogProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogHandler = () => {
    setIsOpen(!isOpen);
  };
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTitle(data.title || "");
    setDescription(data.content || "");
  }, [data]);

  const handleChange = (value: string, type: "title" | "description") => {
    if (type === "title") {
      setTitle(value);
    } else {
      setDescription(value);
    }
  };

  const handleSave = () => {
    onSave(data, title, description);
    dialogHandler();
  };

  return (
    <>
      <div className="mb-4 flex gap-4">
        <div
          onClick={dialogHandler}
          className="hover shot-icon-btn p-2 flex gap-2"
        >
          {btnText ? btnText : "を確認する"}
        </div>
      </div>
      <CoreDialog
        isOpen={isOpen}
        title={dialogTitle}
        onClose={() => {}}
      >
        <div className="dialog">
          <div className="dialog-content">
            <div className="pb-2">
              <input
                className="border p-2 w-full"
                placeholder="title"
                value={title}
                required
                onChange={(e)=>handleChange(e.target.value, "title")}
              />
            </div> 
            <div className="pb-2">
              <textarea
                className="border p-2 w-full"
                placeholder="description"
                value={description}
                required
                onChange={(e)=>handleChange(e.target.value, "description")}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={dialogHandler} className="btn-secondary">
                キャンセル
              </button>
              <button onClick={handleSave} className="btn-primary">
                保存
              </button>
            </div>
          </div>
        </div>
      </CoreDialog>
    </>
  );
};

export default BaseMakerDialog;