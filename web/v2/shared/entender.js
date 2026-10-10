/**
 * Enlaces fijos a la Biblioteca. El href sale de esta lista, no de la página ni de la cadena.
 */
export const ENTENDER = Object.freeze([
  { id: "permisos", href: "/aprender/#guia-permisos", es: "Permisos", en: "Permissions" },
  { id: "suministro", href: "/aprender/#autoridad-emision", es: "Suministro", en: "Supply" },
  { id: "metadatos", href: "/aprender/#metadatos-mutables", es: "Metadatos", en: "Metadata" },
  { id: "distribucion", href: "/aprender/#censo", es: "Distribución", en: "Distribution" },
]);

export function entenderNav(lang) {
  const nav = document.createElement("nav");
  nav.className = "entender-resultado";
  const titleText = lang === "en" ? "Understand this result" : "Entender este resultado";
  nav.setAttribute("aria-label", titleText);
  const title = document.createElement("p");
  title.textContent = titleText;
  nav.append(title);
  for (const item of ENTENDER) {
    const link = document.createElement("a");
    link.href = item.href;
    link.dataset.guia = item.href;
    link.textContent = lang === "en" ? item.en : item.es;
    nav.append(link);
  }
  return nav;
}
