/* Guarda la dirección escrita en Verify para volver desde la biblioteca. */
(function () {
  var KEY = "stubx-verify-draft";
  var input = document.getElementById("direccion-token");
  if (!input) return;

  function read() {
    try {
      return sessionStorage.getItem(KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function store() {
    try {
      sessionStorage.setItem(KEY, input.value);
    } catch (error) {
      /* La página sigue usable aunque el navegador no guarde la sesión. */
    }
  }

  if (!input.value && read()) input.value = read();
  input.addEventListener("input", store);
  window.addEventListener("pagehide", store);
  document.querySelectorAll('a[href^="/aprender/"]').forEach(function (link) {
    link.addEventListener("click", store);
  });
})();
