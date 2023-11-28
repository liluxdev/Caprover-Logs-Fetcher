
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;
const caproverUrl = process.env.CAPROVER_URL;
const caproverPassword = process.env.CAPROVER_PASSWORD;

app.get('/logs', async (req, res) => {
  try {
    console.log("Recuperando i log da CapRover", req.query.appName);
    // Ottenere token da CapRover
    const tokenResponse = await axios.post(`${caproverUrl}api/v2/login`, {
      password: caproverPassword
    });
    console.log("tokenResponse",tokenResponse);
    const token = tokenResponse.data.data.token;

    // Recupera i log usando l'API di CapRover
    const logsResponse = await axios.get(`${caproverUrl}api/v2/apps/appData`, {
      headers: { 'x-captain-auth': token },
      params: { appName: req.query.appName }
    });
    const logs = logsResponse.data.app.appLogs.logs;
    
    res.send(logs);
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore nel recuperare i log: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
