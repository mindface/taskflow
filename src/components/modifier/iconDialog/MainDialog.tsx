
import Window from "../../../assets/window.svg";
import { useWindowSync } from "../../../hooks/useWindowSync";

export default function MainDialog() {
  const { openMainWindow } = useWindowSync();

  const openMainAction = () => {
    openMainWindow();
  }

  return (
    <div className="absolute top-0 right-12 space-y-4 max-w-md">
      <button
        onClick={openMainAction}
        className="shot-icon-btn"
      >
        <img src={Window} alt="image" style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}