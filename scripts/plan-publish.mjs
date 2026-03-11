import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  hashJsonValue,
  readJson,
  rootDir,
  validatePublishBridgeContract,
  validateRoomManifest,
} from "./lib/manifests.mjs";

async function fileSize(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const buffer = await readFile(absolutePath);
  return buffer.byteLength;
}

async function main() {
  const contract = await readJson("contracts/publish-bridge.example.json");
  const roomManifest = await readJson("room/data/room.json");
  const validatedRoom = validateRoomManifest(roomManifest);
  validatePublishBridgeContract(contract);

  const assetsManifest = {
    schema: "treefort-assets",
    schemaVersion: 1,
    roomId: validatedRoom.roomId,
    assets: validatedRoom.assets,
  };

  const writes = contract.writes.map((write) => {
    if (write.path === "data/room.json") {
      return {
        ...write,
        bytes: fileSize("room/data/room.json"),
        sha256: hashJsonValue(validatedRoom),
      };
    }

    if (write.path === "data/assets.json") {
      return {
        ...write,
        bytes: Buffer.byteLength(`${JSON.stringify(assetsManifest, null, 2)}\n`, "utf8"),
        sha256: hashJsonValue(assetsManifest),
      };
    }

    return write;
  });

  const resolvedWrites = [];
  for (const write of writes) {
    resolvedWrites.push({
      ...write,
      bytes: write.bytes instanceof Promise ? await write.bytes : write.bytes,
    });
  }

  const plan = {
    generatedAt: "2026-03-09",
    requestId: contract.requestId,
    roomId: contract.roomId,
    target: contract.target,
    commit: contract.commit,
    writes: resolvedWrites,
    deletes: contract.deletes,
    notes: [
      "This is a dry-run publish plan only.",
      "Runtime files are excluded by contract.",
      "Imported scene, prop, and pet assets should appear under assets/imports/icy/ in a real bridge run.",
    ],
  };

  await mkdir(path.join(rootDir, "build"), { recursive: true });
  const outputPath = path.join(rootDir, "build", "publish-plan.example.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  console.log(`Wrote dry-run publish plan to ${outputPath}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
