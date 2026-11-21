import QRCode from "qrcode";
const icons = {
  qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v3m-4 4h4v-4m-7 4h1"/>',
  transfer:'<path d="M4 7h16m-5-4 5 4-5 4M20 17H4m5-4-5 4 5 4"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  import:'<path d="M12 3v12m-5-5 5 5 5-5M5 18v3h14v-3"/>',
  sparkle:'<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/>',
  erase:'<path d="m4 15 8-9a3 3 0 0 1 4 0l5 5a3 3 0 0 1 0 4l-4 4H9l-5-4zm4 4h13"/>',
  min:'<path d="M5 12h14"/>',
  max:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
  close:'<path d="M5 5l14 14M19 5 5 19"/>',
  shield:'<path d="M12 2 20 5v6c0 5-3 8-8 11-5-3-8-6-8-11V5l8-3Z"/><rect x="9" y="11" width="6" height="6" rx="1"/><path d="M10 11V9a2 2 0 1 1 4 0v2"/>'
};
function glyph(name) {
 return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
}
function toast(message) {
 const t=document.getElementById("toast");
 if(!t)return;
 t.textContent=message;t.classList.add("show");clearTimeout(t._timer);
 t._timer=setTimeout(()=>t.classList.remove("show"),1900);
}
function host(command) {window.chrome?.webview?.postMessage(command);}
function iconize(button,name,label){
 button.innerHTML=glyph(name); button.title=label;
 button.setAttribute("aria-label",label);
 button.classList.add("ce-icon-button");
 return button;
}
function validCipher(value){
 value=String(value||"").trim();
 if(!value || value.length>1800)return false;
 const p=value.split(":");
 if(![2,3].includes(p.length)||!p.every(x=>/^[a-f0-9]+$/i.test(x)))return false;
 const [salt,iv,cipher]=p.length===3?p:[null,...p];
 return (!salt||salt.length===32)&&iv.length===24&&cipher.length>=32&&cipher.length%2===0;
}
window.addEventListener("DOMContentLoaded",()=>{
 const topbar=document.querySelector(".topbar");
 const brand=document.querySelector(".brand");
 const right=document.querySelector(".topbar-right");
 if(topbar&&brand&&right){
  const mark=document.createElement("span");
  mark.className="ce-brand-mark";
  mark.innerHTML=glyph("shield");brand.prepend(mark);
  const status=document.createElement("span");
  status.className="ce-offline";status.textContent="● OFFLINE · PORTABLE";right.prepend(status);
  const buttons=document.createElement("div");buttons.className="ce-window-controls";
  for(const [command,name,label] of [
    ["minimize","min","Minimize window"],
    ["maximize","max","Maximize or restore"],
    ["close","close","Close window"]
  ]){
   const b=document.createElement("button");
   b.type="button";b.title=label;b.setAttribute("aria-label",label);
   b.innerHTML=glyph(name);b.addEventListener("click",()=>host(command));buttons.append(b);
  }
  topbar.append(buttons);
  topbar.addEventListener("pointerdown",e=>{
   if(e.button!==0||e.target.closest("button,input,textarea,a,select,[role=button]"))return;
   host("drag");
  });
  topbar.addEventListener("dblclick",e=>{if(!e.target.closest("button"))host("maximize");});
 }
 const labels=[
  ["sparkle","Generate a new encryption key"],
  ["copy","Copy encryption key"],
  ["import","Import encryption key"]
 ];
 document.querySelectorAll("#keyActions button").forEach((b,i)=>{if(labels[i])iconize(b,...labels[i]);});
 const clear=document.querySelector('button[onclick="clearInput()"]');
 if(clear)iconize(clear,"erase","Clear input");
 const output=document.querySelector("#outputText"),input=document.querySelector("#inputText");
 const row=output?.nextElementSibling;
 if(!output||!input||!row)return;
 row.classList.add("ce-desktop-controls");
 const copy=row.querySelector("button");
 if(copy)iconize(copy,"copy","Copy output");
 const qr=document.createElement("button");
 qr.id="ce-qr";qr.type="button";qr.className="btn ce-icon-button";
 iconize(qr,"qr","Show encrypted text as QR code");row.append(qr);
 const transfer=document.createElement("button");
 transfer.id="ce-transfer";transfer.type="button";transfer.className="btn ce-icon-button";
 iconize(transfer,"transfer","Use output as input");
 transfer.addEventListener("click",()=>{
   if(!output.value)return toast("Nothing to transfer");
   input.value=output.value;input.focus();toast("Output moved to input");
 });row.append(transfer);
 const overlay=document.createElement("div");overlay.className="ce-qr-overlay";overlay.hidden=true;
 overlay.innerHTML='<div class="ce-qr-dialog" role="dialog" aria-modal="true" aria-label="Encrypted QR code">'+
  '<h2>Encrypted QR</h2><p>QR contains ciphertext only. The recipient still needs the matching key or passphrase.</p>'+
  '<img alt="QR code of encrypted data"><div class="ce-qr-actions">'+
  '<a download="cyber-encryption-qr.png">Save PNG</a><button type="button">Close</button></div></div>';
 document.body.append(overlay);
 const image=overlay.querySelector("img"),save=overlay.querySelector("a"),dismiss=overlay.querySelector("button");
 const hide=()=>{overlay.hidden=true;image.removeAttribute("src");qr.focus();};
 dismiss.addEventListener("click",hide);
 overlay.addEventListener("click",e=>{if(e.target===overlay)hide();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)hide();});
 qr.addEventListener("click",async()=>{
  const value=output.value.trim();
  if(!validCipher(value))return toast("QR accepts encrypted text only (max 1,800 chars)");
  qr.disabled=true;
  try{
   const png=await QRCode.toDataURL(value,{
    errorCorrectionLevel:"L",width:320,margin:2,
    color:{dark:"#20154b",light:"#ffffff"}
   });
   image.src=png;save.href=png;overlay.hidden=false;dismiss.focus();
  }catch{toast("Ciphertext too long for QR");}
  finally{qr.disabled=false;}
 });
});


// Native-only utilities. The root index.html stays byte-for-byte unchanged.
window.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const syncTheme = () => {
    const green = document.body.classList.contains("pink"); // old web-app state key
    document.body.classList.toggle("ce-green", green);
    if (themeLabel) themeLabel.textContent = green ? "Green" : "Dark";
    if (toggle) {
      toggle.title = green ? "Switch to Dark mode" : "Switch to Green mode";
      toggle.setAttribute("aria-label", toggle.title);
    }
  };
  // Original index.html owns toggling and persists to ce_theme; this only
  // maps the existing "pink" state to the native green color palette.
  syncTheme();
  toggle?.addEventListener("click", syncTheme);

  const right = document.querySelector(".topbar-right");
  if (right) {
    const version = document.createElement("button");
    version.type = "button";
    version.className = "ce-about-button";
    version.id = "ce-about-button";
    version.textContent = "v1.2.1";
    version.title = "About Cyber Encryption · current version";
    version.setAttribute("aria-label", "About Cyber Encryption, current version 1.2.1");
    right.prepend(version);

    const about = document.createElement("div");
    about.className = "ce-about-overlay";
    about.hidden = true;
    about.innerHTML =
      '<div class="ce-about-dialog" role="dialog" aria-modal="true" aria-labelledby="ce-about-title">'+
      '<h2 id="ce-about-title">Cyber Encryption</h2>'+
      '<p class="ce-about-meta">Version 1.2.1 · Windows Portable x64</p>'+
      '<p>Offline AES-256-GCM text and file encryption. Original CE1 files remain compatible.</p>'+
      '<p>Runs locally using the system WebView2 runtime. Free and open source under the MIT license.</p>'+
      '<p>Keep your encryption keys and passphrases safe. There is no recovery service.</p>'+
      '<div class="ce-about-actions"><button type="button">Close</button></div></div>';
    document.body.append(about);
    const close = about.querySelector("button");
    const hide = () => { about.hidden = true; version.focus(); };
    version.addEventListener("click", () => {
      about.hidden = false;
      close.focus();
    });
    close.addEventListener("click", hide);
    about.addEventListener("click", event => {
      if (event.target === about) hide();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !about.hidden) {
        event.stopImmediatePropagation();
        hide();
      }
    }, true);
  }

  const input = document.getElementById("inputText");
  const output = document.getElementById("outputText");
  if (!input || !output) return;

  // Input buttons are explicit actions; no clipboard read occurs without a click.
  const inputRow = input.nextElementSibling;
  if (inputRow) {
    inputRow.classList.add("ce-input-actions");
    const paste = document.createElement("button");
    paste.id = "ce-paste";
    paste.type = "button";
    paste.className = "btn ce-icon-button";
    iconize(paste, "import", "Paste clipboard into input");
    paste.addEventListener("click", async () => {
      try {
        const value = await navigator.clipboard.readText();
        if (!value) return toast("Clipboard is empty");
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        toast("Pasted into input");
      } catch { toast("Clipboard access is unavailable"); }
    });
    inputRow.append(paste);

    const clearBoth = document.createElement("button");
    clearBoth.id = "ce-clear-text";
    clearBoth.type = "button";
    clearBoth.className = "btn ce-icon-button";
    iconize(clearBoth, "erase", "Clear input and output text (not the key)");
    clearBoth.addEventListener("click", () => {
      input.value = "";
      output.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      toast("Both text fields cleared; key unchanged");
    });
    inputRow.append(clearBoth);
  }

  const outputRow = output.nextElementSibling;
  if (outputRow) {
    const save = document.createElement("button");
    save.id = "ce-export-text";
    save.type = "button";
    save.className = "btn ce-icon-button";
    iconize(save, "import", "Save encrypted text as TXT");
    save.addEventListener("click", () => {
      const encrypted = output.value.trim();
      if (!validCipher(encrypted)) {
        toast("Only encrypted text can be exported");
        return;
      }
      const blob = new Blob([encrypted + "\n"], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cyber-encryption-ciphertext.txt";
      a.style.display = "none";
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast("Encrypted text ready to save");
    });
    outputRow.append(save);
  }

  // Shortcuts act on explicit input focus. No automatic copying of secrets.
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" || !event.ctrlKey || event.altKey || event.metaKey)
      return;
    if (!event.target.closest("textarea, input")) return;
    event.preventDefault();
    const button = document.getElementById(event.shiftKey ? "decryptBtn" : "encryptBtn");
    if (button && !button.disabled) button.click();
  });
  document.getElementById("encryptBtn")?.setAttribute("title", "Encrypt · Ctrl+Enter");
  document.getElementById("decryptBtn")?.setAttribute("title", "Decrypt · Ctrl+Shift+Enter");
});
