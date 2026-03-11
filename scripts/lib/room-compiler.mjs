import {
  compileRoomManifest as compileSemanticRoomManifest,
  validateSemanticRoomState,
} from "../../shared/room-compiler-core.mjs";
import { readJson } from "./manifests.mjs";

export function compileRoomManifest(state) {
  return compileSemanticRoomManifest(state);
}

export async function loadRoomCompilerInputs(statePath = "room/source/semantic-room-state.json") {
  const state = validateSemanticRoomState(await readJson(statePath));
  return {
    state,
  };
}
