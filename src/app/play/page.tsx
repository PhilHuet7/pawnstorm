import LinkWrapper from "@/components/ui/linkWrapper";
import Image from "next/image";

type GameModeObj = {
  mode: string;
  imgSrc: string;
  imgAlt: string;
  description: string;
  width: number;
  height: number;
  href: string;
};

const gameModes: GameModeObj[] = [
  {
    mode: "Play Local Single-Player",
    imgSrc: "/images/PawnstormLocalSinglePlayer.webp",
    description:
      "Go head-to-head against a powerful AI opponent powered by Stockfish. No account needed — just a browser and your best moves.",
    imgAlt: "",
    width: 1024,
    height: 1024,
    href: "/",
  },
  {
    mode: "Play Local Multiplayer",
    imgSrc: "/images/PawnstormLocalMultiplayer.webp",
    description:
      "Take turns on the same device in classic local multiplayer mode. Great for couch battles, friendly rivalries, or sharpening your own strategy.",
    imgAlt: "",
    width: 1024,
    height: 1024,
    href: "/play/local-multiplayer",
  },
  {
    mode: "Play Online Multiplayer",
    imgSrc: "/images/PawnstormOnlineMultiplayer.webp",
    description:
      "Challenge friends online in real time. Whether you’re across the room or across the world, Pawnstorm keeps the connection strong.",
    imgAlt: "",
    width: 1024,
    height: 1024,
    href: "/",
  },
];

const Play = () => {
  return (
    <section className="bg-pawnstorm-blue min-h-[calc(100svh-5rem)] px-8 py-16">
      <div className="flex flex-row gap-8 justify-center flex-wrap animate-fadeIn">
        {gameModes.map((mode) => (
          <LinkWrapper
            key={mode.mode}
            href={mode.href}
            className=" w-76 h-auto rounded-xl overflow-hidden transition-all duration-300 hover:gold-shadow hover:cursor-pointer"
          >
            <Image
              width={mode.width}
              height={mode.height}
              src={mode.imgSrc}
              alt={mode.imgAlt}
            />
            <div className="flex flex-col h-48 items-center justify-center bg-gray-200">
              <p className="text-xl font-bold text-pawnstorm-blue px-4 pt-8 pb-4 text-center uppercase">
                {mode.mode}
              </p>
              <p className="text-base text-pawnstorm-blue pb-8 px-4 text-center">
                {mode.description}
              </p>
            </div>
          </LinkWrapper>
        ))}
      </div>
    </section>
  );
};

export default Play;
