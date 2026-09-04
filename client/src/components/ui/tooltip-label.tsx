import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type TooltipLabelProps = {
  label: string;
  children: React.ReactElement;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
};

/**
 * Tooltip visual padronizado para ações compactas, sem substituir o nome
 * acessível do controle filho.
 */
export function TooltipLabel({
  label,
  children,
  side = "bottom",
}: TooltipLabelProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
