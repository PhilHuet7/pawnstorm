import clsx from "clsx";
import Link, { LinkProps } from "next/link";
import React from "react";

type LinkWrapperProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
};

const LinkWrapper = ({ children, className, ...props }: LinkWrapperProps) => {
  return (
    <Link className={clsx(className)} {...props}>
      {children}
    </Link>
  );
};

export default LinkWrapper;
