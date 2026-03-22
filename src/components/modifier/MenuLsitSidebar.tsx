import paths from "../../json/path.json";
import { useState } from "react";
import ImageDialog from "./ImageDialog";

type Props = {
  activePath: string;
  nextPageAction: (path: string) => void
}

export default function MenuLsitDialog(props: Props) {
  const { nextPageAction, activePath } = props
  const [switcher,setSwitcher] = useState(false);
  const pageAction = nextPageAction ?? (() => {})
  const switcherAction = () => {
    setSwitcher(!switcher);
  }

  return (
    <div className={ switcher ? "sidebar-outer sidebar-on p-4" : "sidebar-outer p-4" }>
      <div className="sidebar-on-overlay"></div>
      <div className="sidebar relative">
        <div>
          <div className="sidebar-btn">
            <button
              className="box-shadow"
              onClick={switcherAction}>
                {switcher?"close":"open"}
            </button>
          </div>
          <ul className="list">
            {paths.map((item,k) => <li
                key={k}
                className={`block cursor-pointer p-2 transition-all text-left
                  ${activePath === item.name ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}
                `}
                onClick={() => pageAction(`${item.name}`)}>{item.name}
              </li>
            )}
          </ul>
          <div className="absolute left-0 bottom-0">
            <ImageDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
