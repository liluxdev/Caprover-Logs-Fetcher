const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 3000;
const caproverUrl = process.env.CAPROVER_URL;
const caproverPassword = process.env.CAPROVER_PASSWORD;
const allowedApps = process.env.ALLOWED_APPS.split(",");
const SECRTET = process.env.SECRET;

app.use(express.static("."));

app.get("/logs", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/api", async (req, res) => {
  try {
    //check secret
    const secret = req.query.secret;
    if (!secret) {
     // return res.status(400).send('Il parametro "secret" è obbligatorio');
      return res.status(400).send(JSON.stringify({error:'Il parametro "secret" è obbligatorio'}));

    }
    if (secret !== SECRTET) {
    //  return res.status(400).send('Il parametro "secret" non è valido');
      return res.status(400).send(JSON.stringify({error:'Il parametro "secret" non è valido'}));
    }
    const appName = req.query.appName;
    if (!appName) {
      return res.status(400).send(JSON.stringify({error:'Il parametro "appName" è obbligatorio'}));
    }
    if (!allowedApps.includes(appName)) {
      return res.status(400).send(JSON.stringify({error:'Il parametro "appName" non è valido'}));
    }
    console.log("Recuperando i log da CapRover", appName);
    // Ottenere token da CapRover
    const tokenResponse = await axios.post(`${caproverUrl}api/v2/login`, {
      password: caproverPassword,
    });
    const token = tokenResponse.data.data.token;

    // Recupera i log usando l'API di CapRover
    const logsResponse = await axios.get(
      `${caproverUrl}api/v2/user/apps/appData/${appName}/logs`,
      {
        headers: { "x-captain-auth": token },
        encoding: "utf8",
      }
    );
    console.log("logResponse", JSON.stringify(logsResponse.data));
    const logs = logsResponse.data.data.logs;

    // Get build logs from CapRover API
    const buildLogsResponse = await axios.get(
      `${caproverUrl}api/v2/user/apps/appData/${appName}`,
      {
        headers: { "x-captain-auth": token },
        encoding: "utf8",
      }
    );
    console.log("buildLogsResponse", JSON.stringify(buildLogsResponse.data));
    const {data} = buildLogsResponse.data;

    res.send(JSON.stringify({ isAppBuilding: data.isAppBuilding, logs, buildLogs: data.logs, appData: data,allowedApps }));
  } catch (error) {
    console.error(error.message);
    res.status(500).send(JSON.stringify({error:"Errore nel recuperare i log: " + error.message}));
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
