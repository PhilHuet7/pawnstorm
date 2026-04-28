import ChessboardWrapper from "@/components/chessboard/chessboardWrapper";
import GameNotifications from "@/components/notifications/gameNotifications";

const LocalMultiplayer = () => {
  return (
    <section className="px-8 py-16 bg-pawnstorm-blue flex justify-center h-screen ml-40">
      <ChessboardWrapper />
      <GameNotifications />
    </section>
  );
};

export default LocalMultiplayer;
