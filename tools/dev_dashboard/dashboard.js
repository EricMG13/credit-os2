const reply = document.querySelector("#reply");
const statusText = document.querySelector("#copy-status");

for (const button of document.querySelectorAll("button[data-prompt]")) {
  button.addEventListener("click", () => {
    reply.value = button.dataset.prompt;
    statusText.textContent = "";
    reply.focus();
    reply.setSelectionRange(reply.value.length, reply.value.length);
  });
}

document.querySelector("#copy")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(reply.value);
    statusText.textContent = "Prompt copied";
  } catch {
    reply.select();
    statusText.textContent = "Press your copy shortcut to copy the selected prompt";
  }
});

const progress = document.querySelector("#run-progress");
const refreshStatus = document.querySelector("#refresh-status");
const runState = document.querySelector("#run-state");
let refreshing = false;

async function refreshProgress() {
  if (document.hidden || refreshing || progress.contains(document.activeElement)) return;
  refreshing = true;
  try {
    const response = await fetch(progress.dataset.refresh, { cache: "no-store" });
    if (!response.ok) throw Error("Progress unavailable");
    const updated = new DOMParser().parseFromString(await response.text(), "text/html");
    const next = updated.querySelector("#run-progress");
    const nextState = updated.querySelector("#run-state");
    if (!next || !nextState) throw Error("Progress unavailable");
    if (!progress.contains(document.activeElement) && next.innerHTML !== progress.innerHTML) {
      progress.replaceChildren(...next.childNodes);
    }
    runState.textContent = nextState.textContent;
    refreshStatus.textContent = "Updates every 10 seconds";
  } catch {
    refreshStatus.textContent = "Waiting for a progress update";
  } finally {
    refreshing = false;
  }
}

if (progress) setInterval(refreshProgress, 10000);
