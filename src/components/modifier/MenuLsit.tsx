import paths from "../../json/path.json";
import ImageDialog from "./ImageDialog";
import { useUIContext } from "../../store/ui";
import { useRouterActions } from "../../hooks/useRouterActions";

export default function MenuLsitDialog() {
  const { state } = useUIContext();
  const { requestViewtypeChange, toggleSidebar } = useRouterActions();
  const { viewtype: activePath, isSidebarOpen: switcher } = state;

  const pageAction = (path: string) => {
    const shouldConfirm =
      activePath !== path &&
      (!state.isSaveConfirmOpen ||
        (state.inputCheckEnabled && state.inputCheckValue.trim() !== ""));

    requestViewtypeChange(path, shouldConfirm);
  };

  return (
    <div className={ switcher ? "mainbar-outer mainbar-on p-4" : "sidebar-outer p-4" }>
      <div className="mainbar-on-overlay"></div>
      <div className="mainbar relative rounded-lg bg-white shadow-lg p-4">
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
          <div className="absolute left-0 bottom-5 w-full">
            <ImageDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
