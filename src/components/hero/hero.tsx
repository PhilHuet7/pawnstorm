import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex h-[calc(100svh-5rem)] z-0">
      <video
        src="/images/PawnstormHeroVideoCompressed.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-10"
      />
      <div className="absolute inset-0 bg-black/30 z-20" />
      <div className="flex flex-col gap-8 mx-auto my-auto animate-fadeIn z-30">
        <Image
          src="/images/PawnstormGoldLogo.png"
          alt="Gold Pawnstorm Logo"
          width={606}
          height={435}
          className="h-48 w-auto z-30 grow-0 object-contain"
        />
        <h1 className="text-white font-bold text-3xl z-30">
          Play Chess. Track Progress. Unleash the Storm.
        </h1>
        <p className="text-pawnstorm-gold font-normal text-xl italic z-30">
          No ads. No fluff. Just the game — with lightning-fast play and sleek
          analytics.
        </p>
        <Link
          href="/play"
          className="bg-pawnstorm-gold text-pawnstorm-blue font-bold text-2xl py-2 px-3 rounded-md z-30 mx-auto transition-all duration-300 hover:bg-white"
        >
          Play Now
        </Link>
      </div>
    </section>
  );
}
