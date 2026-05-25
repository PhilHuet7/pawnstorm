import cn from "@/components/ui/cnHelper";
import React from "react";

type ComponentProps = React.ComponentProps<"span"> & {
  className?: string;
  children: React.ReactNode;
};

export default function PlayerColumnHeader({
  className,
  children,
  ...props
}: ComponentProps) {
  return (
    <span
      className={cn("text-gray-600 font-bold w-fit mb-2 uppercase", className)}
      {...props}
    >
      {children}
    </span>
  );
}
