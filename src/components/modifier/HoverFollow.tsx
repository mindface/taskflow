import type { CSSProperties, MouseEvent, PointerEvent, PropsWithChildren, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { useUIContext } from "../../store/ui";
import { useRouterActions } from "../../hooks/useRouterActions";

type Props = PropsWithChildren<{
  className?: string;
  glowClassName?: string;
  glowContent?: ReactNode;
  onGlowClick?: () => void;
}>;

const orbSize = 40;

export default function HoverFollow(props: Props) {
  const { state, dispatch } = useUIContext();
  const { viewtype: activePath, isSidebarOpen: switcher, uiSelection } = state;
  const { toggleSidebar } = useRouterActions();
  const [isMover, setIsMover] = useState(false);

  const isMoverFromSelection = uiSelection?.moveUi === "2";

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
    if(!isMover && !isMoverFromSelection) {
      const setX = window.innerWidth /2 - orbSize;
      if(setX === pointer.x ) return;
      const nextPointer = {
        x: setX,
        y: window.innerHeight - 160,
      }
      setPointer(nextPointer);
      return;
    }
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
    toggleSidebar();
  };

  const onTapToggle = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
  // if (e.touches.length === 2) {
  //   console.log("2本指タップ");
  // }
    console.log("tap toggle");
    // onGlowClick?.();
    // toggleSidebar();
    setIsMover(isMover => !isMover);
  };

  const handleKeyDown = useCallback((event: globalThis.KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "m") {
      event.preventDefault();
      toggleSidebar();
    }
    if (key === "escape") {
      event.preventDefault();
      toggleSidebar();
    }
  }, [toggleSidebar]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className={`hover-follow ${isActive ? "is-active" : ""} ${className}`.trim()}
      onPointerEnter={() => setIsActive(true)}
      onPointerLeave={() => setIsActive(false)}
      onPointerMove={onPointerMove}
      onDoubleClick={onTapToggle}
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
