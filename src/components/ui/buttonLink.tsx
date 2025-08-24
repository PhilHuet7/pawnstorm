import clsx from "clsx";
import Link, { LinkProps } from "next/link";
import React from "react";

type ButtonLinkProps = LinkProps & {
  className?: string;
  children: React.ReactNode;
};

const ButtonLink = ({ className, children, ...props }: ButtonLinkProps) => {
  return (
    <Link
      className={clsx(
        "bg-pawnstorm-gold text-pawnstorm-blue font-bold py-2 px-3 rounded-md transition-all duration-300 hover:bg-white",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
};

export default ButtonLink;
