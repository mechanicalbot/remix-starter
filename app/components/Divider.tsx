import { type PropsWithChildren } from "react";

import { cn } from "~/lib/cn";

export function Divider({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn(className, "relative")}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-background px-2 text-muted-foreground">
          {children}
        </span>
      </div>
    </div>
  );
}
