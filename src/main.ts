import Plyr from "plyr";

const DEFAULT_PLAY_DELAY = 5000;

const timestamps = [
  { time: 0, label: "Abschnitt 1" },
  { time: 8, label: "Abschnitt 2" },
  { time: 12.8, label: "Abschnitt 3" },
  { time: 17.25, label: "Abschnitt 4" },
  { time: 20.5, label: "Abschnitt 5" },
  { time: 24.6, label: "Abschnitt 6" },
  { time: 27.25, label: "Abschnitt 7" },
  { time: 30.75, label: "Abschnitt 8" },
  { time: 33, label: "Abschnitt 9" },
  { time: 35.9, label: "Abschnitt 10" },
  { time: 39, label: "Abschnitt 11" },
  { time: 40.5, label: "Abschnitt 12" },
  { time: 43.25, label: "Abschnitt 13" },
  { time: 45.25, label: "Abschnitt 14" },
  { time: 47.4, label: "Abschnitt 15" },
  { time: 50.15, label: "Abschnitt 16" },
  { time: 55.2, label: "Abschnitt 17" },
  { time: 57.25, label: "Abschnitt 18" },
  { time: 60, label: "Abschnitt 19" },
  { time: 63, label: "Abschnitt 20" },
  { time: 66.1, label: "Abschnitt 21" },
  { time: 70.75, label: "Abschnitt 22" },
  { time: 74.5, label: "Abschnitt 23" },
  { time: 77.75, label: "Abschnitt 24" },
  { time: 82, label: "Abschnitt 25" },
  { time: 86, label: "Abschnitt 26" },
  { time: 86, label: "Abschnitt 27" },
  { time: 90, label: "Abschnitt 28" },
  { time: 96, label: "Abschnitt 29" },
  { time: 101.5, label: "Abschnitt 30" },
  { time: 107.3, label: "Abschnitt 31" },
  { time: 112.5, label: "Abschnitt 32" },
  { time: 115.5, label: "Abschnitt 33" },
  { time: 119.5, label: "Abschnitt 34" },
  { time: 122.25, label: "Abschnitt 35" },
  { time: 125.25, label: "Abschnitt 36" },
  { time: 129.25, label: "Abschnitt 37" },
];

const player = new Plyr("#player", {
  controls: ["play-large", "play", "progress", "settings", "current-time"],
  settings: ["speed"],
  markers: { enabled: true, points: timestamps },
  keyboard: { global: true },
  speed: {
    selected: 1,
    options: [0.25, 0.5, 0.75, 1],
  },
});

declare global {
  interface Window {
    player: Plyr;
  }
}

window.player = player;

let currentLoop: { from: number; to: number | null } | null = null;
let loopIntervalId: number | null = null;
let delayTimeoutId: number | null = null;
let loopBackTimeoutId: number | null = null;

const getEndTime = (index: number) => {
  return index < timestamps.length - 1 ? timestamps[index + 1].time : undefined;
};

const AbschnittatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

function populateTimestampsList() {
  const timestampsList = document.getElementById("timestamps-list");
  if (!timestampsList) return;

  timestamps.forEach((timestamp, index) => {
    const listItem = document.createElement("li");
    const endTime = getEndTime(index);

    listItem.innerHTML = `
      <div class="timestamp-item p-2 rounded cursor-pointer hover:bg-gray-200" data-index="${
        index + 1
      }">
        <div class="font-medium">${timestamp.label}</div>
        <div class="text-sm text-gray-600">
          ${AbschnittatTime(timestamp.time)} ${
      endTime ? `- ${AbschnittatTime(endTime)}` : "- End"
    }
        </div>
      </div>
    `;

    listItem.querySelector(".timestamp-item")?.addEventListener("click", () => {
      player.stop();

      const listItemElement = listItem.querySelector(
        ".timestamp-item"
      ) as HTMLElement;
      const index = parseInt(listItemElement?.dataset.index || "0", 10);

      clearAllTimers();
      clearHighlights();
      highlightTimestamps(index, null);
      playSection(index, null);
      focusPlayer();
    });

    timestampsList.appendChild(listItem);
  });
}

const shouldHighlight = (idx: number, from: number, to: number | null) => {
  if (to === null) return idx === from;
  return idx >= from && idx <= to;
};

function highlightTimestamps(from: number, to: number | null) {
  const items = document.querySelectorAll(".timestamp-item");
  items.forEach((i, idx) => {
    if (shouldHighlight(idx + 1, from, to)) i.classList.add("bg-blue-200");
    else i.classList.remove("bg-blue-200");
  });
}

function clearHighlights() {
  document.querySelectorAll(".timestamp-item").forEach((i) => {
    i.classList.remove("bg-blue-200");
  });
}

const playWithDelay = (
  fromTime: number,
  toTime: number,
  delay = DEFAULT_PLAY_DELAY
) => {
  return window.setTimeout(() => {
    player.play();
    setupLoopCheck(fromTime, toTime);
  }, delay);
};

function playSection(fromIndex: number, toIndex: number | null) {
  clearAllTimers();

  const fromTime = timestamps[fromIndex - 1]?.time || 0;
  const toTime =
    toIndex !== null
      ? timestamps[toIndex]?.time || player.duration
      : timestamps[fromIndex]?.time || player.duration;

  currentLoop = { from: fromIndex, to: toIndex };
  player.currentTime = fromTime;
  delayTimeoutId = playWithDelay(fromTime, toTime);
}

function clearAllTimers() {
  if (loopIntervalId !== null) {
    window.clearInterval(loopIntervalId);
    loopIntervalId = null;
  }

  if (delayTimeoutId !== null) {
    window.clearTimeout(delayTimeoutId);
    delayTimeoutId = null;
  }

  if (loopBackTimeoutId !== null) {
    window.clearTimeout(loopBackTimeoutId);
    loopBackTimeoutId = null;
  }
}

function setupLoopCheck(fromTime: number, toTime: number) {
  if (loopIntervalId !== null) {
    window.clearInterval(loopIntervalId);
    loopIntervalId = null;
  }

  // Check if we're at the end of the section every 100ms
  loopIntervalId = window.setInterval(() => {
    if (player.currentTime >= toTime) {
      player.pause();

      // Clear the current interval since we've reached the end
      if (loopIntervalId !== null) {
        window.clearInterval(loopIntervalId);
        loopIntervalId = null;
      }

      // Clear any existing loop back timeout
      if (loopBackTimeoutId !== null) {
        window.clearTimeout(loopBackTimeoutId);
      }

      // Wait 1 second before looping back
      loopBackTimeoutId = window.setTimeout(() => {
        if (currentLoop !== null) {
          player.currentTime = fromTime;
          player.play();
        }
        loopBackTimeoutId = null;
      }, 1000);
    }
  }, 100);
}

// Function to handle section input
function handleSectionInput(event: KeyboardEvent) {
  if (event.key !== "Enter") return;

  const input = document.getElementById("section-input") as HTMLInputElement;
  const value = input.value.trim();

  clearAllTimers();
  clearHighlights();

  if (!value) {
    currentLoop = null;
    focusPlayer();
    return;
  }

  // Parse input in Abschnittat n or n-m
  const match = value.match(/^(\d+)(?:-(\d+))?$/);

  if (!match) {
    input.classList.add("border-red-500");
    setTimeout(() => input.classList.remove("border-red-500"), 2000);
    focusPlayer();
    return;
  }

  input.classList.remove("border-red-500");

  const fromIndex = parseInt(match[1], 10);
  const toIndex = match[2] ? parseInt(match[2], 10) : null;

  // Validate indices
  if (
    fromIndex < 1 ||
    fromIndex > timestamps.length ||
    (toIndex !== null && (toIndex < fromIndex || toIndex > timestamps.length))
  ) {
    input.classList.add("border-red-500");
    setTimeout(() => input.classList.remove("border-red-500"), 2000);
    focusPlayer();
    return;
  }

  highlightTimestamps(fromIndex, toIndex);
  playSection(fromIndex, toIndex);
  focusPlayer();
}

function focusPlayer() {
  const inputElement = document.getElementById(
    "section-input"
  ) as HTMLInputElement;
  if (inputElement) {
    inputElement.blur();
  }

  const playerElement = document.getElementById("player");
  if (playerElement) setTimeout(() => playerElement.focus(), 10);
}

function init() {
  populateTimestampsList();

  const input = document.getElementById("section-input") as HTMLInputElement;
  if (input) {
    input.addEventListener("keydown", handleSectionInput);
  }

  player.on("play", () => {
    // Clear delay timer when user manually presses play
    if (delayTimeoutId !== null) {
      window.clearTimeout(delayTimeoutId);
      delayTimeoutId = null;
    }

    if (currentLoop && !loopIntervalId) {
      const fromTime = timestamps[currentLoop.from - 1]?.time || 0;
      const toTime =
        currentLoop.to !== null
          ? timestamps[currentLoop.to]?.time || player.duration
          : timestamps[currentLoop.from]?.time || player.duration;

      setupLoopCheck(fromTime, toTime);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
