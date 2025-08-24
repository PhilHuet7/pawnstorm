import clsx from "clsx";
import React, { HTMLAttributes } from "react";

type ButtonProps = HTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children: React.ReactNode;
};

const Button = ({ className, children, ...props }: ButtonProps) => {
  return (
    <button
      className={clsx(
        "bg-pawnstorm-gold text-pawnstorm-blue font-bold py-2 px-3 rounded-md transition-all duration-300 cursor-pointer hover:bg-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
