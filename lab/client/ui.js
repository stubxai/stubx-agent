function findEntry(id) {
  var entries = STUBX_LAB.glossary;
  for (var i = 0; i < entries.length; i += 1) {
    if (entries[i].id === id) return entries[i];
  }
  return null;
}

function textOf(value, lang) {
  if (!value) return lang === "en" ? "unknown" : "desconocido";
  return value[lang] || value.es;
}

var STATUS_LABEL = {
  verificado: { es: "verificado", en: "verified" },
  inferido: { es: "inferido", en: "inferred" },
  no_disponible: { es: "no disponible", en: "unavailable" },
  no_aplica: { es: "no aplica", en: "not applicable" },
  desconocido: { es: "desconocido", en: "unknown" },
};

var FIELD_LABEL = {
  name: { es: "Nombre on-chain", en: "On-chain name" },
  mint: { es: "Dirección del mint", en: "Mint address" },
  inRegistry: { es: "En el registro curado", en: "In the curated registry" },
  statement: { es: "Lectura de autenticidad", en: "Authenticity statement" },
  mintAuthority: { es: "Autoridad de emisión", en: "Mint authority" },
  freezeAuthority: { es: "Autoridad de congelación", en: "Freeze authority" },
  metadata: { es: "Metadatos", en: "Metadata" },
  holders: { es: "Muestra de holders", en: "Holder sample" },
  impersonation: { es: "Señal de suplantación", en: "Impersonation signal" },
  curvePresent: { es: "Cuenta de curva", en: "Curve account" },
  curveProgress: { es: "Avance de la curva clásica", en: "Classic curve progress" },
};

var META_LABEL = {
  no_mutables_en_fuentes: { es: "No mutables en las fuentes leídas", en: "Not mutable in the sources read" },
  mutables: { es: "Mutables", en: "Mutable" },
  desconocido: { es: "Desconocido", en: "Unknown" },
};

function statusLabel(status, lang) {
  return textOf(STATUS_LABEL[status] || STATUS_LABEL.desconocido, lang);
}

function factText(status, value, lang) {
  if (status !== "verificado" && status !== "inferido") return statusLabel(status, lang);
  if (!value) return statusLabel(status, lang);
  return value + " · " + statusLabel(status, lang);
}

function yesNo(value, lang) {
  if (lang === "en") return value ? "yes" : "no";
  return value ? "sí" : "no";
}

function fieldText(card, key, lang) {
  if (key === "name") return { value: factText(card.nameStatus, card.name, lang), note: null };
  if (key === "mint") return { value: card.mint, note: null };
  if (key === "inRegistry") {
    var registry = card.inRegistry === null ? null : yesNo(card.inRegistry, lang);
    return { value: factText(card.inRegistryStatus, registry, lang), note: null };
  }
  if (key === "statement") return { value: factText(card.statementStatus, card.statement, lang), note: null };
  if (key === "mintAuthority") return { value: factText(card.mintAuthority.status, card.mintAuthority.state, lang), note: null };
  if (key === "freezeAuthority") return { value: factText(card.freezeAuthority.status, card.freezeAuthority.state, lang), note: null };
  if (key === "metadata") return { value: textOf(META_LABEL[card.metadataReading], lang), note: null };
  if (key === "holders") return { value: factText(card.holdersStatus, null, lang), note: card.holdersNote };
  if (key === "impersonation") {
    if (card.impersonation === null) return { value: statusLabel("desconocido", lang), note: null };
    var label = card.impersonation
      ? (lang === "en" ? "Possible impersonation" : "Posible suplantación")
      : (lang === "en" ? "No such signal" : "Sin esa señal");
    return { value: label + (card.authenticityLevel ? " · " + card.authenticityLevel : ""), note: null };
  }
  if (key === "curvePresent") {
    var present = card.curvePresent === null ? null : yesNo(card.curvePresent, lang);
    return { value: factText(card.curvePresentStatus, present, lang), note: card.curveModuleNote };
  }
  if (key === "curveProgress") {
    var progress = card.curveProgress ? (lang === "en" ? card.curveProgress + "%" : card.curveProgress + " %") : null;
    return { value: factText(card.curveProgressStatus, progress, lang), note: card.curveProgressNote };
  }
  return { value: statusLabel("desconocido", lang), note: null };
}

function el(tag, attrs) {
  var node = document.createElement(tag);
  if (!attrs) return node;
  Object.keys(attrs).forEach(function (key) {
    if (attrs[key] != null) node.setAttribute(key, String(attrs[key]));
  });
  return node;
}

function bootLab() {
  var root = document.getElementById("mision-app");
  if (!root) return;
  var mission = STUBX_LAB.mission;
  var lang = document.documentElement.getAttribute("data-lang") === "en" ? "en" : "es";
  var stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    stored = null;
  }
  var progress = parseProgress(stored, mission) || initialProgress(mission, lang);
  progress = withLang(progress, lang);
  var banner = null;
  var focusBanner = false;
  var saveError = false;
  var reviewId = null;

  function liveStep() {
    return currentStep(mission, progress);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      saveError = false;
    } catch (error) {
      saveError = true;
    }
  }

  function openHelp(id) {
    var entry = findEntry(id);
    var dialog = document.getElementById("ayuda");
    var anchor = document.getElementById("termino-" + id);
    if (!entry || !dialog || typeof dialog.showModal !== "function") {
      if (anchor) anchor.scrollIntoView();
      return;
    }
    var title = document.getElementById("ayuda-titulo");
    var body = document.getElementById("ayuda-cuerpo");
    var closeBtn = document.getElementById("ayuda-cerrar");
    if (!title || !body) return;
    title.textContent = entry.term[lang];
    body.replaceChildren();
    ["means", "example", "doesNotConclude"].forEach(function (key) {
      var paragraph = el("p");
      paragraph.textContent = entry[key][lang];
      body.append(paragraph);
    });
    var stay = el("p");
    stay.textContent = lang === "en"
      ? "Opening help does not change local progress."
      : "Abrir la ayuda no cambia el progreso local.";
    body.append(stay);
    if (closeBtn) closeBtn.textContent = lang === "en" ? "Close" : "Cerrar";
    dialog.returnFocus = document.activeElement;
    dialog.showModal();
  }

  var dialogNode = document.getElementById("ayuda");
  if (dialogNode) {
    dialogNode.addEventListener("close", function () {
      var back = dialogNode.returnFocus;
      if (back && back.focus) back.focus();
    });
  }

  function cardNode(card, fields) {
    var article = el("article", { class: "ficha" });
    var heading = el("h3");
    heading.textContent = card.name || card.mint;
    var role = el("p", { class: "rol" });
    role.textContent = card.roleNote[lang];
    var mint = el("p");
    var code = el("code", { class: "mint" });
    code.textContent = card.mint;
    mint.append(code);
    var list = el("dl");
    fields.forEach(function (key) {
      var item = fieldText(card, key, lang);
      var term = el("dt");
      term.textContent = textOf(FIELD_LABEL[key], lang);
      var detail = el("dd");
      detail.textContent = item.value;
      if (item.note) {
        var note = el("p", { class: "muted" });
        note.textContent = item.note;
        detail.append(note);
      }
      list.append(term, detail);
    });
    article.append(heading, role, mint, list);
    return article;
  }

  function helpButton(step) {
    var id = step.glossary[0];
    if (!id) return null;
    var button = el("button", { type: "button", class: "secondary" });
    button.textContent = lang === "en" ? "What does this word mean?" : "¿Qué significa esta palabra?";
    button.addEventListener("click", function () { openHelp(id); });
    return button;
  }

  function resetButton() {
    var button = el("button", { type: "button", class: "secondary" });
    button.textContent = lang === "en" ? "Delete local progress" : "Borrar progreso local";
    button.addEventListener("click", function () {
      var question = lang === "en"
        ? "Delete the local progress of this mission in this browser?"
        : "¿Borrar el progreso local de esta misión en este navegador?";
      if (!window.confirm(question)) return;
      progress = resetProgress(mission, lang);
      banner = null;
      reviewId = null;
      save();
      render();
    });
    return button;
  }

  function render() {
    root.replaceChildren();
    var total = mission.steps.length;
    var nav = el("ol", { class: "pasos" });
    mission.steps.forEach(function (step, index) {
      var item = el("li");
      var button = el("button", { type: "button", class: "secondary" });
      var solved = progress.solved.indexOf(step.id) !== -1;
      var active = liveStep();
      var isLive = Boolean(active && active.id === step.id);
      var showing = reviewId ? reviewId === step.id : isLive;
      var label = String(index + 1);
      button.textContent = label;
      if (!solved && !isLive) button.disabled = true;
      if (showing) button.setAttribute("aria-current", "step");
      button.addEventListener("click", function () {
        reviewId = solved && !isLive ? step.id : null;
        banner = null;
        render();
      });
      item.append(button);
      nav.append(item);
    });
    if (progress.completed) {
      var resultButton = el("button", { type: "button" });
      resultButton.textContent = lang === "en" ? "Result" : "Resultado";
      if (reviewId === null) resultButton.setAttribute("aria-current", "step");
      resultButton.addEventListener("click", function () {
        reviewId = null;
        banner = null;
        render();
      });
      var resultItem = el("li");
      resultItem.append(resultButton);
      nav.append(resultItem);
    }
    root.append(nav);

    if (saveError) {
      var warn = el("p", { class: "nota" });
      warn.textContent = lang === "en"
        ? "This browser did not store the progress. It will disappear when the page closes."
        : "Este navegador no guardó el progreso. Se pierde al cerrar la página.";
      root.append(warn);
    }

    if (banner) {
      var feedback = el("div", { class: banner.correct ? "feedback encaja" : "feedback no-encaja", role: "status", tabindex: "-1" });
      var feedbackTitle = el("h2");
      feedbackTitle.textContent = banner.correct
        ? (lang === "en" ? "That answer fits" : "Esa respuesta encaja")
        : (lang === "en" ? "That answer does not fit" : "Esa respuesta no encaja");
      var feedbackBody = el("p");
      feedbackBody.textContent = banner.explanation[lang];
      var again = el("p");
      again.textContent = banner.correct
        ? (lang === "en" ? "You can continue. There is no score and no penalty." : "Puedes seguir. No hay puntuación ni penalización.")
        : (lang === "en" ? "You can choose another answer. There is no penalty." : "Puedes elegir otra respuesta. No hay penalización.");
      feedback.append(feedbackTitle, feedbackBody, again);
      root.append(feedback);
    }

    var showingResult = progress.completed && reviewId === null;
    if (showingResult) {
      var done = el("section");
      var doneTitle = el("h2");
      doneTitle.textContent = lang === "en" ? "Result" : "Resultado";
      done.append(doneTitle);
      mission.steps.forEach(function (step, index) {
        var block = el("article", { class: "ficha" });
        var name = el("h3");
        name.textContent = (step.kind === "check" ? (index + 1) + ". " : "") + step.prompt[lang];
        var line = el("p");
        line.textContent = step.whyRight[lang];
        block.append(name, line);
        done.append(block);
      });
      var close = el("p");
      close.textContent = mission.closing[lang];
      var dated = el("p");
      dated.textContent = lang === "en"
        ? "The cards are from " + STUBX_LAB.cardDate + ". Unknown is not the same as verified."
        : "Las fichas son del " + STUBX_LAB.cardDate + ". Lo desconocido no es lo mismo que lo comprobado.";
      done.append(close, dated, resetButton());
      root.append(done);
    } else {
      var stepId = reviewId || (liveStep() ? liveStep().id : mission.steps[0].id);
      var step = null;
      for (var i = 0; i < mission.steps.length; i += 1) {
        if (mission.steps[i].id === stepId) step = mission.steps[i];
      }
      if (!step) return;
      var section = el("section");
      var heading = el("h2");
      var position = mission.steps.indexOf(step);
      heading.textContent = lang === "en"
        ? "Step " + (position + 1) + " of " + total
        : "Paso " + (position + 1) + " de " + total;
      var guide = el("p", { class: "apoyo" });
      guide.textContent = step.guide[lang];
      section.append(heading, guide);
      var word = helpButton(step);
      if (word) section.append(word);
      if (step.cards.length > 0) {
        var fold = el("details", { class: "tecnico" });
        var summary = el("summary");
        summary.textContent = lang === "en" ? "See the cards" : "Ver las fichas";
        fold.append(summary);
        step.cards.forEach(function (mint) {
          var card = STUBX_LAB.cards[mint];
          if (card) fold.append(cardNode(card, step.fields));
        });
        section.append(fold);
      }
      var prompt = el("h3");
      prompt.textContent = step.prompt[lang];
      section.append(prompt);
      var solved = progress.solved.indexOf(step.id) !== -1;
      if (solved) {
        var lesson = el("p");
        lesson.textContent = step.whyRight[lang];
        var locked = el("p", { class: "muted" });
        locked.textContent = lang === "en"
          ? "This check is already done. To try it again, delete the local progress."
          : "Esta comprobación ya está hecha. Para repetirla, borra el progreso local.";
        section.append(lesson, locked);
      } else {
        var options = el("div", { class: "opciones", role: "group" });
        options.setAttribute("aria-labelledby", "pregunta-actual");
        prompt.id = "pregunta-actual";
        step.options.forEach(function (option) {
          var button = el("button", { type: "button" });
          button.textContent = option.label[lang];
          button.addEventListener("click", function () {
            var grade = answer(mission, progress, step.id, option.id);
            if (!grade.applied) return;
            progress = grade.progress;
            banner = { correct: grade.correct, explanation: grade.explanation };
            focusBanner = true;
            if (grade.correct) reviewId = null;
            save();
            render();
          });
          options.append(button);
        });
        section.append(options);
      }
      section.append(resetButton());
      root.append(section);
    }

    if (focusBanner) {
      var region = root.querySelector(".feedback");
      if (region) region.focus();
      focusBanner = false;
    }
  }

  document.addEventListener("stubx-lang", function (event) {
    lang = event.detail === "en" ? "en" : "es";
    progress = withLang(progress, lang);
    save();
    render();
  });

  save();
  render();
}
