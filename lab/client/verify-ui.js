function verifyEl(tag, attrs) {
  var node = document.createElement(tag);
  if (!attrs) return node;
  Object.keys(attrs).forEach(function (key) {
    if (attrs[key] != null) node.setAttribute(key, String(attrs[key]));
  });
  return node;
}

function verifyLang() {
  return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "es";
}

function legendItem(light, text) {
  var item = verifyEl("li", { "data-luz": light });
  item.textContent = text;
  return item;
}

function paintVerify(out, view) {
  var lang = verifyLang();
  out.replaceChildren();
  out.setAttribute("data-state", view.kind);
  out.setAttribute("data-luz", view.light);
  out.setAttribute("aria-busy", view.kind === "comprobando" ? "true" : "false");
  if (view.kind === "vacio") {
    var emptyTitle = verifyEl("h2");
    emptyTitle.textContent = view.title[lang];
    var emptySupport = verifyEl("p", { class: "apoyo" });
    emptySupport.textContent = view.support[lang];
    var list = verifyEl("ul", { class: "leyenda" });
    list.append(
      legendItem("ok", lang === "en" ? "Looks like the official STUBX" : "Parece el STUBX oficial"),
      legendItem("riesgo", lang === "en" ? "Careful: possible copy" : "Cuidado: posible copia"),
      legendItem("neutro", lang === "en" ? "Could not be checked" : "No se pudo comprobar"),
    );
    out.append(emptyTitle, emptySupport, list);
    return;
  }
  var flag = verifyEl("p", { class: "semaforo" });
  var dot = verifyEl("span", { class: "luz", "aria-hidden": "true" });
  var name = verifyEl("span");
  name.textContent = view.lightLabel[lang];
  flag.append(dot, name);
  var title = verifyEl("h2");
  title.textContent = view.title[lang];
  var support = verifyEl("p", { class: "apoyo" });
  support.textContent = view.support[lang];
  out.append(flag, title, support);
  if (view.mint) {
    var mint = verifyEl("p", { class: "mint" });
    mint.textContent = view.mint;
    out.append(mint);
  }
  if (view.partialNote) {
    var note = verifyEl("p", { class: "nota" });
    note.textContent = view.partialNote[lang];
    out.append(note);
  }
  if (view.rows.length > 0) {
    var details = verifyEl("details", { class: "tecnico" });
    var summary = verifyEl("summary");
    summary.textContent = lang === "en" ? "Technical details" : "Detalles técnicos";
    var rows = verifyEl("dl");
    view.rows.forEach(function (row) {
      var term = verifyEl("dt");
      term.textContent = row.label[lang];
      var detail = verifyEl("dd");
      detail.textContent = row.value[lang];
      rows.append(term, detail);
    });
    details.append(summary, rows);
    out.append(details);
  }
}

function bootVerify() {
  var out = document.getElementById("resultado");
  var form = document.getElementById("consulta");
  var input = document.getElementById("direccion-token");
  if (!out || !form || !input || typeof STUBX_VERIFY === "undefined") return;
  var cards = STUBX_VERIFY.cards || [];
  var evm = STUBX_VERIFY.evm || [];
  var source = cards.length > 0 ? "lista" : "caida";

  var last = emptyView();

  function apply(view) {
    last = view;
    paintVerify(out, view);
    input.setAttribute("aria-invalid", view.kind === "invalida" ? "true" : "false");
    if (view.kind !== "vacio" && view.kind !== "comprobando") {
      var narrow = window.matchMedia("(max-width: 48rem)").matches;
      out.scrollIntoView({ block: narrow ? "start" : "nearest", inline: "nearest" });
    }
  }

  function run() {
    var value = input.value;
    apply(pendingView(value));
    window.requestAnimationFrame(function () {
      try {
        apply(classifyAddress(value, cards, source, evm));
      } catch (error) {
        apply(classifyAddress(value, [], "caida", evm));
      }
    });
  }

  apply(emptyView());
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    run();
  });
  document.addEventListener("stubx-lang", function () {
    apply(last);
  });
  document.addEventListener("stubx-verify-preview", function (event) {
    var detail = event.detail || {};
    if (detail.kind === "comprobando") apply(pendingView(detail.raw || ""));
    if (detail.kind === "lectura_caida") apply(classifyAddress(detail.raw || "So11111111111111111111111111111111111111112", cards, "caida"));
  });
}
