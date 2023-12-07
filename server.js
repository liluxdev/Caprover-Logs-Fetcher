const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 3000;
const caproverUrl = process.env.CAPROVER_URL;
const caproverPassword = process.env.CAPROVER_PASSWORD;
const allowedApps = process.env.ALLOWED_APPS.split(",");
const SECRTET = process.env.SECRET;
const MAX_LOG_CHARS = process.env.MAX_LOG_CHARS || 29 * 1000;
app.use(express.static("./static/"));

app.get("/logs", (req, res) => {
  res.sendFile(__dirname + "/static/index.html");
});

app.get("/api", async (req, res) => {
  res.set("Content-Type", "application/json"); // Set JSON response header
  try {
    //check secret
    const secret = req.query.secret;
    if (!secret) {
      // return res.status(400).send('Il parametro "secret" è obbligatorio');
      return res
        .status(400)
        .send(
          JSON.stringify({ error: 'Il parametro "secret" è obbligatorio' })
        );
    }
    if (secret !== SECRTET) {
      //  return res.status(400).send('Il parametro "secret" non è valido');
      return res
        .status(400)
        .send(JSON.stringify({ error: 'Il parametro "secret" non è valido' }));
    }
    const appName = req.query.appName;
    if (!appName) {
      return res
        .status(400)
        .send(
          JSON.stringify({ error: 'Il parametro "appName" è obbligatorio' })
        );
    }
    if (!allowedApps.includes(appName)) {
      return res
        .status(400)
        .send(JSON.stringify({ error: 'Il parametro "appName" non è valido' }));
    }
    console.log("Recuperando i log da CapRover", appName);
    // Ottenere token da CapRover
    const tokenResponse = await axios.post(
      `${caproverUrl}api/v2/login`,
      {
        password: caproverPassword,
      },
      {
        timeout: 2000, // Timeout impostato a 5000 millisecondi
      }
    );
    const token = tokenResponse.data.data.token;

    // Recupera i log usando l'API di CapRover
    const logsResponse = await axios.get(
      `${caproverUrl}api/v2/user/apps/appData/${appName}/logs?encoding=hex&limit=1000`,
      {
        headers: { "x-captain-auth": token },
      //  encoding: "hex",
      },
      {
        timeout: 2000, // Timeout impostato a 5000 millisecondi
      }
    );

    console.log("logsResponse", JSON.stringify(Object.keys(logsResponse.data).length));
    let logs = logsResponse.data.data.logs;
    let originalLogLen = logs.length;
    logs = logs.length > MAX_LOG_CHARS ? logs.slice(-MAX_LOG_CHARS) : logs;
    let responseLogLen = logs.length;

    console.log("hex logs", logs.length, logs);

    let buffer = Buffer.from(logs, 'hex');

// Convertire il Buffer in una stringa UTF-8
    let utf8String = buffer.toString('utf8');

    console.log(
      "utf8String",
       utf8String.length
    );
    console.log(
      "logsResponse",
      JSON.stringify(Object.keys(logsResponse.data).length)
    );

    // Get build logs from CapRover API
    const buildLogsResponse = await axios.get(
      `${caproverUrl}api/v2/user/apps/appData/${appName}`,
      {
        headers: { "x-captain-auth": token },
      //  encoding: "hex",
      },
      {
        timeout: 2000, // Timeout impostato a 5000 millisecondi
      }
    );
    console.log(
      "buildLogsResponse",
      JSON.stringify(Object.keys(buildLogsResponse.data).length)
    );
    const { data } = buildLogsResponse.data;
    const response = {
      isAppBuilding: data.isAppBuilding,
      logs: logs,//.split("\n").slice(-27).join("\n"),
      buildLogs: data.logs.lines.slice(-27).join("\n"),
     // appData: data,
      allowedApps,
      isBuildFailed: data.isBuildFailed,
      originalLogLen,
      responseLogLen,
    };

/*     console.log(
      "response",
      JSON.stringify(response)
    ); */

    console.log(
      "sending response for " + appName,
      JSON.stringify(Object.keys(response).length),
    //  response
    );
    res.send(response);
    //console.log("sending response json",response);
  } catch (error) {
    console.trace(error);
    res
      .status(500)
      .send(
        JSON.stringify({
          error: "Errore nel recuperare i log: " + error.message,
        })
      );
  }
});

//const compression = require('compression');
//app.use(compression());

const server = app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
server.timeout = 500000; // Imposta un timeout personalizzato, es. 500000 ms (500 secondi)
