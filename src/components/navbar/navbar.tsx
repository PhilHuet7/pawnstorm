import Navlink from "@/components/navbar/navlink";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="h-screen bg-pawnstorm-gold flex flex-col items-center justify-start gap-10 px-4 py-6 fixed top-0 left-0 w-40 z-50">
      <Link
        href="/"
        className="text-pawnstorm-blue transition-all duration-300 hover:cursor-pointer hover:text-white"
      >
        <div className="flex gap-1 items-center">
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
          <p className="w-content font-semibold">Sign In</p>
        </div>
      </Link>
      <Link href="/">
        <Image
          src="/images/PawnstormDarkBlueLogo.png"
          alt="Dark Blue Pawnstorm Logo"
          width={606}
          height={435}
          className="h-auto w-full"
        />
      </Link>
      <div className="flex flex-col gap-6">
        <Navlink href="/">About</Navlink>
        <Navlink href="/play">Play</Navlink>
        <Navlink href="/">Account</Navlink>
        <Navlink href="/">Donate</Navlink>
      </div>
    </nav>
  );
};

export default Navbar;
