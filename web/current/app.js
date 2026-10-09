/* STUBX — único script de la web (mismo origen, sin dependencias).
 * Anti-scam: solo se puede copiar la CA oficial exacta de Pump.fun.
 * Cualquier otro valor en data-copy (vacío o una dirección de phishing inyectada) queda bloqueado. */
const OFFICIAL_CA = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";

for (const btn of document.querySelectorAll("[data-copy]")) {
  const label = btn.querySelector("[data-copy-label]");
  const status = btn.parentElement && btn.parentElement.querySelector("[data-copy-status]");
  const original = label ? label.textContent : btn.textContent;
  let timer;
  const say = (msg, state) => {
    if (label) label.textContent = msg; else btn.textContent = msg;
    if (status) status.textContent = msg;
    if (state) btn.setAttribute("data-state", state); else btn.removeAttribute("data-state");
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (label) label.textContent = original; else btn.textContent = original;
      btn.removeAttribute("data-state");
    }, 2500);
  };
  btn.addEventListener("click", async () => {
    const value = (btn.getAttribute("data-copy") || "").trim();
    if (value !== OFFICIAL_CA) {
      say(value ? "Copia bloqueada" : "Vacío", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(OFFICIAL_CA);
      say("Copiada", "ok");
    } catch {
      say("No se pudo copiar", "error");
    }
  });
}

/* Menú móvil: se cierra al elegir un enlace o con Escape. */
const menu = document.querySelector("details.menu");
if (menu) {
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) menu.removeAttribute("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.hasAttribute("open")) {
      menu.removeAttribute("open");
      const s = menu.querySelector("summary");
      if (s) s.focus();
    }
  });
}
