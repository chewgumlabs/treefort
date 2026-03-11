import { writeJson } from "./lib/manifests.mjs";
import { compileRoomManifest, loadRoomCompilerInputs } from "./lib/room-compiler.mjs";

async function main() {
  const statePath = process.argv[2] || "room/source/semantic-room-state.json";
  const outputPath = process.argv[3] || "room/data/room.json";
  const { state } = await loadRoomCompilerInputs(statePath);
  const manifest = compileRoomManifest(state);

  await writeJson(outputPath, manifest);
  console.log(`Compiled semantic room ${state.roomId} from ${statePath} into ${outputPath}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
