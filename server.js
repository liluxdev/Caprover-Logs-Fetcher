const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');
const axios = require('axios');
const path = require('path');
const compress = require('koa-compress');


const app = new Koa();
const router = new Router();
const port = process.env.PORT || 3000;
const caproverUrl = process.env.CAPROVER_URL;
const caproverPassword = process.env.CAPROVER_PASSWORD;
const allowedApps = process.env.ALLOWED_APPS.split(",");
const SECRET = process.env.SECRET;
const MAX_LOG_CHARS = process.env.MAX_LOG_CHARS || 18 * 1000;


// Configurazione della compressione
app.use(compress({
  filter(content_type) {
    return /text/i.test(content_type)
  },
  threshold: 2048,
  gzip: {
    flush: require('zlib').constants.Z_SYNC_FLUSH
  },
  deflate: {
    flush: require('zlib').constants.Z_SYNC_FLUSH,
  },
  br: false // disabilita brotli
}));

app.use(serve("./static/"));

router.get('/logs', async (ctx) => {
  ctx.sendFile(path.join(__dirname, "/static/index.html"));
});

router.get('/api', async (ctx) => {
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
    const tokenResponse = await axios.post(`${caproverUrl}api/v2/login`, { password: caproverPassword }, { timeout: 2000 });
    const token = tokenResponse.data.data.token;

    const logsResponse = await axios.get(`${caproverUrl}api/v2/user/apps/appData/${appName}/logs?encoding=hex&limit=1000`, { headers: { "x-captain-auth": token }, timeout: 2000 });
    let logs = logsResponse.data.data.logs;
    let originalLogLen = logs.length;
    logs = logs.length > MAX_LOG_CHARS ? logs.slice(-MAX_LOG_CHARS) : logs;
    let responseLogLen = logs.length;

    let buffer = Buffer.from(logs, 'hex');
    let utf8String = buffer.toString('utf8');

    const buildLogsResponse = await axios.get(`${caproverUrl}api/v2/user/apps/appData/${appName}`, { headers: { "x-captain-auth": token }, timeout: 2000 });
    const { data } = buildLogsResponse.data;

    ctx.body = {
      isAppBuilding: data.isAppBuilding,
      logs: utf8String,
      buildLogs: data.logs.lines.slice(-27).join("\n"),
      allowedApps,
      isBuildFailed: data.isBuildFailed,
      originalLogLen,
      responseLogLen,
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
