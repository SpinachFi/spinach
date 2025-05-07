import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export default function SpiTooltip({
  trigger,
  content,
  showContent = true,
}: {
  trigger: React.ReactNode;
  content: React.ReactNode;
  showContent?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className={clsx(
            "text-right font-medium",
            showContent && "cursor-help"
          )}
        >
          {trigger}
        </TooltipTrigger>
        <TooltipContent className={clsx(!showContent && "hidden")}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
