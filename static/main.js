window.isAppNamesPopulated = false;
window.enabledAutoRefresh = true;
window.oldConsole = "";
window.oldBuild = "";
function populateAllowedApps(allowedApps) {
  if (isAppNamesPopulated) {
    return;
  }
  isAppNamesPopulated = true;
  // Supponendo che allowedApps sia un array di stringhe
  const appNameSelect = document.getElementById("appNameSelect");

  const urlParams = new URLSearchParams(window.location.search);
  let appName = urlParams.get("appName");

  allowedApps.forEach((app) => {
    let option = new Option(app, app);
    if (app === appName) {
      option.selected = true;
    }
    appNameSelect.add(option);
  });
}
window.bttRefreshLabel = "Aggiorna Log";
async function fetchLogs() {
  if (!document.querySelector("#bttRefresh").classList.contains("standby")) {
    toastr.error(
      "Attendere il completamento del caricamento dei log",
      "Errore",
      {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-bottom-right",
        timeOut: 3000,
      }
    );
    setTimeout(
      () => document.querySelector("#bttRefresh").classList.add("standby"),
      3000
    );
    return;
  }
  document.querySelector("#bttRefresh").innerHTML = "Aggiornando...";
  // document.querySelector("#bttRefresh").classList.remove("standby");

  try {
    // Estrai i parametri di ricerca dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    let appName = urlParams.get("appName");
    const secret = urlParams.get("secret");

    // Se appName non è nei parametri di ricerca, prendilo dalla select
    const appNameSelected = document.getElementById("appNameSelect").value;
    if (appNameSelected) {
      if (appNameSelected !== "0") {
        appName = appNameSelected;
      }
    }

    const fetchUrl = new URL("/api", window.location.href);
    fetchUrl.searchParams.set("appName", appName);
    fetchUrl.searchParams.set("secret", secret);

    const selfUrl = new URL("/", window.location.href);
    selfUrl.searchParams.set("appName", appName);
    selfUrl.searchParams.set("secret", secret);
    history.pushState({}, null, selfUrl);
    // Aggiungi qui la logica per recuperare i log dalla console e i log di build
    // Ad esempio, una richiesta GET al tuo server Express
    const respCheck = await fetch(fetchUrl);

    const respText = await respCheck.text();
    console.log({ respText });
    // Controlla se la risposta è vuota
    if (!respCheck.ok || respCheck.status !== 200 || respText.trim === "") {
      toastr.error("Errore del server o risposta vuota", "Errore", {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-bottom-right",
        timeOut: 5000,
      });
      return;
    }

    // Continua solo se la risposta contiene dati
    const resp = JSON.parse(respText);

    let { error } = resp;
    if (error) {
      toastr.error(error, "Errore", {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-bottom-right",
        timeOut: 5000,
      });
      return;
    }
    let {
      logs: consoleLogs,
      buildLogs,
      isAppBuilding,
      isBuildFailed,
      allowedApps,
      appUrl,
      appDefinition,
      responseLogLen,
      originalLogLen,
    } = resp;
    console.log({
      consoleLogs,
      buildLogs,
      isAppBuilding,
      isBuildFailed,
      allowedApps,
      appUrl,
      appDefinition,
    });

    function hexStringToByte(str) {
      if (!str) {
        return new Uint8Array(0);
      }

      var byteArray = [];
      for (var i = 0; i < str.length; i += 2) {
        byteArray.push(parseInt(str.substr(i, 2), 16));
      }

      return new Uint8Array(byteArray);
    }

    // La tua stringa esadecimale

    // Convertire la stringa hex in un array di byte
    let bytes = hexStringToByte(consoleLogs);

    // Utilizzare TextDecoder per convertire in stringa UTF-8
    let utf8String = new TextDecoder("utf-8").decode(bytes);

    consoleLogs = utf8String;

    console.warn({ consoleLogs });

    document.querySelector("#char-limit-info").innerHTML =
      "| <strong>Console log:</strong> mostrando ultimi " +
      responseLogLen / 1000 +
      "k caratteri su " +
      originalLogLen / 1000 +
      "k totali";

    populateAllowedApps(allowedApps);

    //buildLogs = buildLogs.lines.join("\n");

    let consoleLogsUpdated = false,
      buildLogsUpdated = false;

    const newLogs = `<pre>${
      consoleLogs.trim() !== ""
        ? consoleLogs
        : "Nessun log di console disponibile"
    }</pre>`;
    //  const oldHtmlConsole = document.querySelector(".console-logs").innerHTML.trim();
    // console.log({oldHtmlConsole, newLogs, equals: oldHtmlConsole === newLogs.trim()});

    const diffLogs = "disabled-diffing"; //Diff.diffChars(oldConsole, newLogs);

    if (oldConsole == "" || oldConsole !== newLogs) {
      if (
        document.querySelector(".console-logs:hover") !== null &&
        oldConsole != ""
      ) {
        console.warn(
          "Update prevented by hover state",
          document.querySelector(".console-logs:hover")
        );
        toastr.info(
          "Sei in hover sulla console, per vedere i nuovi log esci dall'hover",
          "Console non aggiornata",
          {
            closeButton: true,
            progressBar: true,
            positionClass: "toast-bottom-right",
            timeOut: 3000,
          }
        );
      } else {
        document.querySelector(".console-logs").innerHTML = newLogs;
        oldConsole = newLogs;
        console.warn("Console logs updated", {
          a: oldConsole,
          b: newLogs,
          equals: oldConsole === newLogs,
          diffLogs,
        });
      }

      consoleLogsUpdated = true;
    }

    const newBuildLogs = `<pre>${
      buildLogs.trim() !== "" ? buildLogs : "Nessun log di build disponibile"
    }</pre>`;
    const diffBuild = "diffing-disabled"; //Diff.diffChars(oldBuild, newBuildLogs);

    // const oldHtmlBuild = document.querySelector(".build-logs").innerHTML.trim();
    // console.log({oldHtmlBuild, newLogs, equals: oldHtmlBuild === newBuildLogs.trim()});

    if (oldBuild == "" || oldBuild !== newBuildLogs) {
      oldBuild = newBuildLogs;
      if (
        document.querySelector(".build-logs:hover") !== null &&
        oldBuild != ""
      ) {
        console.warn(
          "Update prevented by hover state",
          document.querySelector(".build-logs:hover")
        );
        toastr.info(
          "Sei in hover sulla console di build, per vedere i nuovi log esci dall'hover",
          "Console di build non aggiornata",
          {
            closeButton: true,
            progressBar: true,
            positionClass: "toast-bottom-right",
            timeOut: 3000,
          }
        );
      } else {
        document.querySelector(".build-logs").innerHTML = newBuildLogs;
        oldBuild = newBuildLogs;
        console.warn("Build logs updated", {
          a: oldBuild,
          b: newBuildLogs,
          equals: oldBuild === newBuildLogs,
          diffBuild,
        });
      }

      buildLogsUpdated = true;
    }

    const statusIcon = document.getElementById("status-icon");
    if (isAppBuilding) {
      statusIcon.className = "fas fa-cog fa-spin";
    } else {
      statusIcon.className = "fas fa-check";
    }

    //if appDefinition.appUrl show a link with globe icon to it in new window
    if (appUrl) {
      const appUrlLink = document.createElement("a");
      appUrlLink.href = appUrl;
      appUrlLink.target = "_blank";
      appUrlLink.rel = "noopener noreferrer";
      appUrlLink.className = "app-url-link";
      appUrlLink.innerHTML = `<i class="fas fa-globe"></i> ${appUrl}`;
      document.querySelector(".app-url-container").innerHTML= appUrlLink.outerHTML;

      //if appDefinition.notExposeAsWebApp show the internal srv-captain--appname:port
      if (appDefinition.notExposeAsWebApp) {
        const appUrlInternalLink = document.createElement("a");
        const internalName = "srv-captain--"+appDefinition.appName;
        appUrlInternalLink.href = internalName;
        appUrlInternalLink.target = "_blank";
        appUrlInternalLink.rel = "noopener noreferrer";
        appUrlInternalLink.className = "app-url-link";
        appUrlInternalLink.innerHTML = `<i class="fas fa-server"></i> <pre style="display:inline-block;">${internalName}</pre>`;
        document.querySelector(".app-url-container").innerHTML= appUrlInternalLink.outerHTML;
      }
    }

    //   const isBuildFailed = isBuildFailed;

    if (isBuildFailed) {
      statusIcon.className = "fas fa-times";
    }

    document.querySelector(".console-logs").scrollTop =
      document.querySelector(".console-logs").scrollHeight;
    document.querySelector(".build-logs").scrollTop =
      document.querySelector(".build-logs").scrollHeight;
    // Assicurati che i contenitori dei log abbiano un elemento interno <pre>
    function smoothScrollTo(element, target) {
      const startPosition = element.scrollTop;
      const distance = target - startPosition;
      const duration = 500; // Durata dello scroll in millisecondi
      let startTime = null;

      function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const nextScrollPosition = ease(
          timeElapsed,
          startPosition,
          distance,
          duration
        );
        element.scrollTop = nextScrollPosition;
        if (timeElapsed < duration) requestAnimationFrame(animation);
      }

      function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
      }

      requestAnimationFrame(animation);
    }

    const consoleLogsContainer = document.querySelector(".console-logs pre");
    const buildLogsContainer = document.querySelector(".build-logs pre");

    if (consoleLogsContainer && buildLogsContainer) {
      const consoleScrollTarget =
        consoleLogsContainer.scrollHeight - consoleLogsContainer.clientHeight;
      const buildScrollTarget =
        buildLogsContainer.scrollHeight - buildLogsContainer.clientHeight;
      if (
        consoleLogsUpdated &&
        document.querySelector(".console-logs:hover") === null
      ) {
        smoothScrollTo(consoleLogsContainer, consoleScrollTarget);
      }
      if (
        buildLogsUpdated &&
        document.querySelector(".build-logs:hover") === null
      ) {
        smoothScrollTo(buildLogsContainer, buildScrollTarget);
      }
    }

    // initSplitPane();

    // Mostra un messaggio toast dopo l'aggiornamento dei log
    if (consoleLogsUpdated) {
      toastr.success("Ci sono nuovi log in console", "Aggiornamento", {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-bottom-right",
        timeOut: 3000,
      });
    }
    if (buildLogsUpdated) {
      toastr.warning("Ci sono nuovi log di build", "Build", {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-bottom-right",
        timeOut: 3000,
      });
    }
  } catch (error) {
    console.error("Errore nel recupero dei log:", error);
    toastr.error("Errore nel recupero dei log" + error, "Errore", {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-bottom-right",
      timeOut: 5000,
    });
  }
  document.querySelector("#bttRefresh").classList.add("standby");
  document.querySelector("#bttRefresh").innerHTML = bttRefreshLabel;
}

// Chiamare fetchLogs al caricamento della pagina
window.onload = fetchLogs;

if (enabledAutoRefresh) {
  setInterval(() => fetchLogs(), 5000);
}
