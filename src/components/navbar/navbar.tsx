import Navlink from "@/components/navbar/navlink";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="h-28 bg-pawnstorm-blue flex items-center justify-between px-6 sticky top-0 left-0 w-full">
      <Link href="/">
        <Image
          src="/images/PawnstormGoldLogo.png"
          alt="Gold Pawnstorm Logo"
          width={606}
          height={435}
          className="h-20 w-auto"
        />
      </Link>
      <div className="flex gap-8">
        <Navlink href="/">Play</Navlink>
        <Navlink href="/">Account</Navlink>
        <Navlink href="/">Donate</Navlink>
      </div>
      <Link
        href="/"
        className="w-28 h-28 text-pawnstorm-gold mt-4 transition-all duration-300 hover:cursor-pointer hover:text-pawnstorm-gold-hov"
      >
        <div className="ml-auto flex gap-1 items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 ml-auto"
          >
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="w-content">Sign In</p>
        </div>
      </Link>
    </nav>
  );
};

export default Navbar;
