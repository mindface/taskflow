
import SubMemo from "../../../assets/subMemo.svg";
import { useWindowSync } from "../../../hooks/useWindowSync";

export default function SubMemoDialog() {
  const { openSubmemo } = useWindowSync();

  const openSubmemoAction = () => {
    openSubmemo(true);
  }

  return (
    <div className="absolute top-0 right-6 space-y-4 max-w-md">
      <button
        onClick={openSubmemoAction}
        className="shot-icon-btn"
      >
        <img src={SubMemo} alt="image" style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}