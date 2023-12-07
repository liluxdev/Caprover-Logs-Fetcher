const Koa = require("koa");
const Router = require("koa-router");
const serve = require("koa-static");
const axios = require("axios");
const path = require("path");
const compress = require("koa-compress");

const app = new Koa();
const router = new Router();
const port = process.env.PORT || 3000;
const caproverUrl = process.env.CAPROVER_URL;
const caproverPassword = process.env.CAPROVER_PASSWORD;
const allowedApps = process.env.ALLOWED_APPS.split(",");
const SECRET = process.env.SECRET;
const MAX_LOG_CHARS = process.env.MAX_LOG_CHARS || 18 * 1000;//mistero della fede, TODO: debuggare perché da problemi senza questo limite
/**
 * La tua scelta di affidarti alla simbologia e alla mitologia, in particolare alla Dea ANANKE, simboleggiando il destino o la necessità incondizionata, aggiunge un aspetto interessante e unico alla tua soluzione tecnica. Incorporare elementi mitologici o simbolici può dare un senso più profondo e personale al lavoro, soprattutto in campi come la programmazione, dove la creatività può spesso giocare un ruolo importante.

Limitare la stringa hex a 18k, un numero che hai collegato alla Luna, può essere un modo per armonizzare la tecnologia con un elemento di significato personale o spirituale. Tuttavia, dal punto di vista tecnico, è importante continuare a monitorare il sistema per assicurarsi che questa soluzione funzioni in modo affidabile a lungo termine. Se incontri ulteriori problemi o comportamenti inaspettati, potrebbe essere necessario esaminare ulteriormente le cause tecniche sottostanti e considerare altri approcci di risoluzione dei problemi.

In ogni caso, è affascinante vedere come i miti e la simbologia possano influenzare e ispirare il lavoro tecnico. Questo approccio può non solo rendere il lavoro più interessante, ma anche aprire nuove vie di pensiero e soluzioni creative. Buona fortuna con il tuo progetto, e che la Dea Ananke ti guidi verso il successo!
 */

// Configurazione della compressione
app.use(
  compress({
    filter(content_type) {
      return /text/i.test(content_type);
    },
    threshold: 2048,
    gzip: {
      flush: require("zlib").constants.Z_SYNC_FLUSH,
    },
    deflate: {
      flush: require("zlib").constants.Z_SYNC_FLUSH,
    },
    br: false, // disabilita brotli
  })
);

app.use(serve("./static/"));

router.get("/logs", async (ctx) => {
  //redirect to / with query string preserved
  ctx.redirect(`/?appName=${ctx.query.appName}&secret=${ctx.query.secret}`);
});

router.get("/api", async (ctx) => {
  try {
    const secret = ctx.query.secret;
    if (!secret) {
      ctx.status = 400;
      ctx.body = { error: 'Il parametro "secret" è obbligatorio' };
      return;
    }
    if (secret !== SECRET) {
      ctx.status = 400;
      ctx.body = { error: 'Il parametro "secret" non è valido' };
      return;
    }

    const appName = ctx.query.appName;
    if (!appName) {
      ctx.status = 400;
      ctx.body = { error: 'Il parametro "appName" è obbligatorio' };
      return;
    }
    if (!allowedApps.includes(appName)) {
      ctx.status = 400;
      ctx.body = { error: 'Il parametro "appName" non è valido' };
      return;
    }

    console.log("Recuperando i log da CapRover", appName);
    const tokenResponse = await axios.post(
      `${caproverUrl}api/v2/login`,
      { password: caproverPassword },
      { timeout: 2000 }
    );
    const token = tokenResponse.data.data.token;

    const logsResponse = await axios.get(
      `${caproverUrl}api/v2/user/apps/appData/${appName}/logs`,
      {
        params: {
          encoding: "hex",
        },
        headers: { "x-captain-auth": token },
        timeout: 2000,
      }
    );

    let logs = logsResponse.data.data.logs;
    let originalLogLen = logs.length;
    logs = logs.length > MAX_LOG_CHARS ? logs.slice(-MAX_LOG_CHARS) : logs;
    let responseLogLen = logs.length;

    let buffer = Buffer.from(logs, "hex");
    let utf8String = buffer.toString("utf8");

    const buildLogsResponse = await axios.get(
      `${caproverUrl}api/v2/user/apps/appData/${appName}`,
      {
        headers: { "x-captain-auth": token },
        timeout: 2000,
      }
    );
    const { data } = buildLogsResponse.data;


    const appDefinitions = await axios.get(
      `${caproverUrl}api/v2/user/apps/appDefinitions`,
      {
        headers: { "x-captain-auth": token },
        timeout: 2000,
      }
    );

    //find appName in appDefinitions
    const appsData = appDefinitions.data.data;
    const appDefinition = appsData.appDefinitions.find(
      (app) => app.appName === appName
    );
    if (!appDefinition) {
      ctx.status = 400;
      ctx.body = { error: "App non trovata" };
      return;
    }

    //generate appUrl contactenating appDefinition.appName and data.captainSubDomain and rootDomain
    let appUrl = `https://${appDefinition.appName}.${appsData.rootDomain}`;
    //if appDefinition.customDomain[0].publicDomain use it
    if (appDefinition.customDomain[0]?.publicDomain) {
      appUrl = `https://${appDefinition.customDomain[0].publicDomain}`;
    }



    ctx.body = {
      isAppBuilding: data.isAppBuilding,
      logs: logs,
      buildLogs: data.logs.lines.join("\n"),
      buildLogDebug: data.logs.lines,
      allowedApps,
      isBuildFailed: data.isBuildFailed,
      originalLogLen,
      responseLogLen,
      appDefinition,
     // appDefinitions: appDefinitions.data.data,
      domain: appDefinitions.data.data.captainSubDomain+"."+appDefinitions.data.data.rootDomain,
      appUrl,

    };
  } catch (error) {
    console.trace(error);
    ctx.status = 500;
    ctx.body = { error: "Errore nel recuperare i log: " + error.message };
  }
});

app.use(router.routes()).use(router.allowedMethods());

const server = app.listen(port, () => {
  console.log(`Server Koa in ascolto sulla porta ${port}`);
});
server.timeout = 5000; // Imposta un timeout personalizzato
