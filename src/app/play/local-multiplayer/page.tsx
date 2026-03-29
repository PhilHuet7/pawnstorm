import Chessboard from "@/components/chessboard/chessboard";
import GameNotifications from "@/components/notifications/gameNotifications";

const LocalMultiplayer = () => {
  return (
    <section className="px-8 py-16 bg-pawnstorm-blue flex justify-center h-screen ml-40">
      <Chessboard />
      <GameNotifications />
    </section>
  );
};

export default LocalMultiplayer;
