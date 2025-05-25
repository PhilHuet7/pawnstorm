import clsx from "clsx";
import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

interface NavlinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export default function Navlink({
  children,
  className = "",
  ...props
}: NavlinkProps) {
  return (
    <Link
      className={clsx(
        "text-pawnstorm-gold text-2xl font-semibold transition-all duration-300 hover:cursor-pointer hover:text-pawnstorm-gold-hov",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
