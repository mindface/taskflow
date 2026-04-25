import paths from "../../json/path.json";
import ImageDialog from "./ImageDialog";
import { useUIContext } from "../../store/ui";

export default function MenuLsitDialog() {
  const { state, dispatch } = useUIContext();
  const { viewtype: activePath, isSidebarOpen: switcher } = state;

  const switcherAction = () => {
    dispatch({
      type: "TOGGLE_SIDEBAR",
    });
  };

  const pageAction = (path: string) => {
    dispatch({
      type: "SET_VIEWTYPE",
      payload: path,
    });
  };

  return (
    <div className={ switcher ? "mainbar-outer mainbar-on p-4" : "sidebar-outer p-4" }>
      <div className="mainbar-on-overlay"></div>
      <div className="mainbar relative">
        <div>
          <ul className="list">
            {paths.map((item,k) => <li
                key={k}
                className={`block cursor-pointer p-2 transition-all text-left
                  ${activePath === item.name ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}
                `}
                onClick={() => pageAction(item.name)}>{item.name}
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
