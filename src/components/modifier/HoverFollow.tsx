import type { CSSProperties, MouseEvent, PointerEvent, PropsWithChildren, ReactNode } from "react";
import { useState } from "react";

import { useUIContext } from "../../store/ui";

type Props = PropsWithChildren<{
  className?: string;
  glowClassName?: string;
  glowContent?: ReactNode;
  onGlowClick?: () => void;
}>;

const orbSize = 40;

export default function HoverFollow(props: Props) {
  const { state, dispatch } = useUIContext();
  const { viewtype: activePath, isSidebarOpen: switcher } = state;

  const {
    children,
    className = "",
    glowClassName = "",
    glowContent = "open",
    onGlowClick,
  } = props;
  const [isActive, setIsActive] = useState(false);
  const [pointer, setPointer] = useState({
    x: 0,
    y: 0,
  });

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextPointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const insideOrbX = Math.abs(nextPointer.x - (pointer.x + orbSize)) <= orbSize;
    const insideOrbY = Math.abs(nextPointer.y - (pointer.y + orbSize)) <= orbSize;

    if (insideOrbX && insideOrbY) {
      return;
    }

    setPointer(nextPointer);
  };

  const onButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onGlowClick?.();
    dispatch({
      type: "TOGGLE_SIDEBAR",
    });
  };

  return (
    <div
      className={`hover-follow ${isActive ? "is-active" : ""} ${className}`.trim()}
      onPointerEnter={() => setIsActive(true)}
      onPointerLeave={() => setIsActive(false)}
      onPointerMove={onPointerMove}
      style={
        {
          "--hover-x": `${pointer.x + orbSize}px`,
          "--hover-y": `${pointer.y + orbSize}px`,
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className={`hover-follow__glow ${glowClassName}`.trim()}
      >
        <button
          type="button"
          className="hover-follow__button"
          onClick={onButtonClick}
        >
          {switcher ? "x" : glowContent}
        </button>
      </div>
      <div className="hover-follow__content">{children}</div>
    </div>
  );
}
