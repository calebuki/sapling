"use client";
import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/island/ui/tooltip";

type Props = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "children"
> & {
  sv: string;
  en: string;
  children?: ReactNode;
  action?: () => void;
  onReveal?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
};
/** A real button, so vocabulary can also be reached by keyboard. No nested controls. */
export default function Vocab({
  sv,
  en,
  children,
  action,
  onReveal,
  buttonRef,
  className = "",
  onPointerDown,
  disabled,
  ...props
}: Props) {
  const [open, setOpen] = useState(false),
    touch = useRef(false);
  const reveal = (value: boolean) => {
    setOpen(value);
    if (value) onReveal?.();
  };
  return (
    <Tooltip open={open} onOpenChange={reveal}>
      <TooltipTrigger
        {...props}
        render={
          <button disabled={disabled} aria-label={props["aria-label"] ?? sv} />
        }
        disabled={disabled}
        ref={buttonRef}
        className={`vocab-trigger ${action ? "vocab-action" : "vocab-only"} ${className}`}
        lang="sv"
        closeOnClick={false}
        delay={120}
        onPointerDown={(event) => {
          touch.current = event.pointerType === "touch" && !open;
          onPointerDown?.(event);
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (touch.current) {
            reveal(true);
            touch.current = false;
            return;
          }
          if (action) {
            setOpen(false);
            action();
          } else reveal(!open);
        }}
      >
        {children ?? <span className="vocab-text">{sv}</span>}
      </TooltipTrigger>
      <TooltipContent className="translation-popup" sideOffset={8}>
        <span lang="en">{en}</span>
      </TooltipContent>
    </Tooltip>
  );
}
