import React, {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type MobileLongPressHintProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  label: string;
  children: ReactNode;
};

/** Revela uma dica curta no toque prolongado sem comprometer o toque rápido do controle. */
export const MobileLongPressHint = forwardRef<HTMLSpanElement, MobileLongPressHintProps>(
  (
    {
      label,
      children,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
      onContextMenu,
      onClickCapture,
      ...spanProps
    },
    ref
  ) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const dismiss = () => {
    clearTimer();
    setVisible(false);
  };

  useEffect(() => dismiss, []);

  return (
    <span
      {...spanProps}
      ref={ref}
      className="relative inline-flex"
      onPointerDown={event => {
        onPointerDown?.(event);
        if (event.pointerType === "mouse") return;
        longPressRef.current = false;
        clearTimer();
        timerRef.current = setTimeout(() => {
          longPressRef.current = true;
          setVisible(true);
        }, 550);
      }}
      onPointerUp={event => {
        onPointerUp?.(event);
        clearTimer();
      }}
      onPointerCancel={event => {
        onPointerCancel?.(event);
        dismiss();
      }}
      onPointerLeave={event => {
        onPointerLeave?.(event);
        clearTimer();
      }}
      onContextMenu={event => {
        onContextMenu?.(event);
        if (longPressRef.current) event.preventDefault();
      }}
      onClickCapture={event => {
        onClickCapture?.(event);
        if (longPressRef.current) {
          event.preventDefault();
          event.stopPropagation();
          longPressRef.current = false;
          dismiss();
        }
      }}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-semibold text-white shadow-lg sm:hidden"
        >
          {label}
        </span>
      )}
    </span>
  );
  }
);

MobileLongPressHint.displayName = "MobileLongPressHint";
