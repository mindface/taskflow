
export const inputSaved = () => {

  const basedInputEvent = (
    e: React.SyntheticEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    type: "blur" | "focus" | "input" | "change",
    exec: () => void
  ) => {
    const target = e.currentTarget;

    target.addEventListener(type, exec);

    // 必要なら解除関数を返す
    return () => {
      target.removeEventListener(type, exec);
    };
  };
  return {
    basedInputEvent
  };
};
