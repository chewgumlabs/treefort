/**
 * Guest room export — bundles all room data into a downloadable .room.zip
 *
 * Uses JSZip-compatible manual ZIP builder (no dependencies).
 * Called from the room editor when a guest's stay expires.
 */

function collectRoomData() {
  const data = {};

  // Gather everything from localStorage that belongs to this room
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("room-") || key.startsWith("icy-") || key === "room-draft") {
      data[key] = localStorage.getItem(key);
    }
  }

  return data;
}

function buildRoomBundle() {
  const roomData = collectRoomData();

  const bundle = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: roomData,
  };

  return JSON.stringify(bundle, null, 2);
}

function downloadBundle(filename) {
  const json = buildRoomBundle();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "my-room.treefort";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Expose globally for the room editor
window.TreefortExport = { collectRoomData, buildRoomBundle, downloadBundle };
