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
