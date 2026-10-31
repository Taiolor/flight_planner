(function () {
  var splash = document.getElementById("pwa-startup-splash");
  var status = document.getElementById("pwa-splash-status");
  var retry = document.getElementById("pwa-splash-retry");
  var logo = document.getElementById("pwa-splash-logo");
  var finished = false;
  var timer;
  function useLogoFallback() {
    if (logo && !logo.dataset.fallbackUsed) {
      logo.dataset.fallbackUsed = "true";
      logo.src = logo.dataset.fallbackSrc;
    }
  }
  if (logo) {
    logo.addEventListener("error", useLogoFallback, { once: true });
    if (logo.complete && !logo.naturalWidth) useLogoFallback();
  }
  function showStartupError() {
    if (finished || !splash || !splash.isConnected || splash.dataset.ready === "true") return;
    splash.dataset.startupError = "true";
    if (status) status.textContent = "Não foi possível concluir a inicialização. Verifique sua conexão e tente novamente.";
    if (retry) retry.hidden = false;
  }
  function handleEntryError(event) {
    if (event.target && event.target.id === "app-entry") showStartupError();
  }
  function finish() {
    finished = true;
    window.clearTimeout(timer);
    window.removeEventListener("error", handleEntryError, true);
    if (retry) retry.hidden = true;
    if (splash) delete splash.dataset.startupError;
  }
  window.addEventListener("error", handleEntryError, true);
  window.addEventListener("smartfly:startup-ready", finish, { once: true });
  if (retry) retry.addEventListener("click", function () { window.location.reload(); });
  timer = window.setTimeout(showStartupError, 12000);
})();
