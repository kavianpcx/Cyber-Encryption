// This script is bundled into an isolated, sandboxed Electron preload.
// It augments the existing index.html DOM; it does not modify the web version.
import QRCode from "qrcode";
import format from "./format.cjs";
const { isEncryptedText } = format;

window.addEventListener("DOMContentLoaded", () => {
  const output = document.getElementById("outputText");
  const input = document.getElementById("inputText");
  const row = output?.nextElementSibling;
  const topbar = document.querySelector(".topbar-right");
  if (!output || !input || !row || !topbar) return;

  const css = document.createElement("style");
  css.textContent = `
    .ce-portable-pill{border:1px solid #3b9a84;border-radius:999px;padding:7px 11px;
      color:#8ef4cd;white-space:nowrap;font:600 11px system-ui;letter-spacing:.075em}
    .ce-desktop-controls{flex-wrap:wrap}
    .ce-qr-backdrop{position:fixed;inset:0;z-index:3000;background:rgba(3,8,17,.84);
      display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)}
    .ce-qr-backdrop[hidden]{display:none}
    .ce-qr-dialog{background:#161d2e;color:#eef4ff;border:1px solid #34445d;
      border-radius:22px;max-width:430px;width:100%;padding:25px;text-align:center;
      box-shadow:0 30px 80px #0009;font:14px system-ui}
    .ce-qr-dialog h2{font-size:23px;margin:0 0 8px}
    .ce-qr-dialog p{line-height:1.55;color:#bac9d9;margin:0 0 18px}
    .ce-qr-dialog img{display:block;width:min(100%,320px);height:auto;margin:0 auto 18px;
      border-radius:14px;background:white;padding:8px}
    .ce-qr-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
    .ce-qr-actions button,.ce-qr-actions a{border-radius:11px;border:1px solid #53617a;
      padding:10px 16px;background:#25344c;color:#fff;text-decoration:none;
      cursor:pointer;font:600 13px system-ui}
    .ce-qr-actions a{background:#236c58;border-color:#236c58}
    .ce-qr-actions button:focus-visible,.ce-qr-actions a:focus-visible{
      outline:3px solid #93e6cb;outline-offset:2px}
    @media(max-width:900px){.ce-portable-pill{display:none}}
  `;
  document.head.appendChild(css);

  const pill = document.createElement("span");
  pill.className = "ce-portable-pill";
  pill.textContent = "● OFFLINE · PORTABLE";
  topbar.prepend(pill);

  row.classList.add("ce-desktop-controls");
  const qrButton = document.createElement("button");
  qrButton.type = "button";
  qrButton.className = "btn btn-ghost btn-wide";
  qrButton.textContent = "Show encrypted QR";
  qrButton.title = "Show an offline QR code for encrypted text only";
  row.appendChild(qrButton);

  const reuseButton = document.createElement("button");
  reuseButton.type = "button";
  reuseButton.className = "btn btn-ghost btn-wide";
  reuseButton.textContent = "Use output as input";
  reuseButton.addEventListener("click", () => {
    if (!output.value) return window.showToast?.("No output to use");
    input.value = output.value;
    input.focus();
    window.showToast?.("Output moved into input");
  });
  row.appendChild(reuseButton);

  const overlay = document.createElement("div");
  overlay.className = "ce-qr-backdrop";
  overlay.hidden = true;
  overlay.setAttribute("role", "presentation");
  const dialog = document.createElement("div");
  dialog.className = "ce-qr-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Encrypted text QR code");
  const title = document.createElement("h2");
  title.textContent = "Encrypted QR";
  const note = document.createElement("p");
  note.textContent = "Contains ciphertext only. The receiver still needs the matching key or passphrase. Never share keys by QR.";
  const picture = document.createElement("img");
  picture.alt = "QR code containing encrypted text";
  const controls = document.createElement("div");
  controls.className = "ce-qr-actions";
  const save = document.createElement("a");
  save.download = "cyber-encryption-qr.png";
  save.textContent = "Save PNG";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  controls.append(save, close);
  dialog.append(title, note, picture, controls);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  function hide() { overlay.hidden = true; picture.removeAttribute("src"); qrButton.focus(); }
  close.addEventListener("click", hide);
  overlay.addEventListener("click", event => { if (event.target === overlay) hide(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) hide();
  });

  qrButton.addEventListener("click", async () => {
    const value = output.value.trim();
    if (!isEncryptedText(value)) {
      window.showToast?.("QR needs encrypted hex text (max 1800 chars)");
      return;
    }
    qrButton.disabled = true;
    try {
      const png = await QRCode.toDataURL(value, {
        errorCorrectionLevel: "L",
        margin: 2,
        width: 320,
        color: { dark: "#182238", light: "#ffffff" }
      });
      picture.src = png;
      save.href = png;
      overlay.hidden = false;
      close.focus();
    } catch {
      window.showToast?.("Ciphertext too long for a QR code");
    } finally {
      qrButton.disabled = false;
    }
  });
});
