import { dailyIndex } from "@/lib/daily";
import { publicScene, getScene, ROTATION } from "@/lib/scenes";
import { TUNING } from "@/lib/tuning";
import Game from "./game";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const debugOn = sp.debug === "1";
  const start = dailyIndex();
  const scenes = ROTATION.map((id) => publicScene(getScene(id)!));
  return (
    <Game
      scenes={scenes}
      startIndex={start}
      maxAttempts={TUNING.MAX_ATTEMPTS}
      maxChars={TUNING.MAX_INPUT_CHARS}
      debugOn={debugOn}
    />
  );
}
