import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  children: React.ReactNode;
};

export function Container({ className, children, ...rest }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)} {...rest}>
      {children}
    </div>
  );
}
