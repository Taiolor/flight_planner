import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const TOOLTIP_DELAY_MS = 350;
export const TOOLTIP_SIDE_OFFSET = 6;
export const TOOLTIP_COLLISION_PADDING = 8;

export type TooltipLabelProps = {
  label: string;
  children: React.ReactElement;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  sideOffset?: number;
  collisionPadding?: number;
  delayDuration?: number;
  avoidCollisions?: boolean;
  sticky?: React.ComponentProps<typeof TooltipContent>["sticky"];
  hideWhenDetached?: boolean;
};

/**
 * Tooltip visual padronizado para ações compactas, sem substituir o nome
 * acessível do controle filho.
 */
export function TooltipLabel({
  label,
  children,
  side = "bottom",
  sideOffset = TOOLTIP_SIDE_OFFSET,
  collisionPadding = TOOLTIP_COLLISION_PADDING,
  delayDuration = TOOLTIP_DELAY_MS,
  avoidCollisions = true,
  sticky = "always",
  hideWhenDetached = true,
}: TooltipLabelProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        avoidCollisions={avoidCollisions}
        sticky={sticky}
        hideWhenDetached={hideWhenDetached}
        className="max-w-[min(18rem,calc(100vw-1rem))] break-words"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
