

var express = require('express');
var http = require('http');
const https = require('https')

var app = express();
var server = http.createServer(app);

var path = require('path');

var firebase = require('firebase')

const port = process.env.PORT || 8000;


const SecretKeys = require('./secret.js')

// Instantiate User:
let secrets = new SecretKeys()

firebase.initializeApp(secrets.firebaseConfig)
let database = firebase.database()


app.use(express.static(path.join(__dirname, './')));
var bodyParser = require('body-parser');
const { Console } = require('console');
const { disconnect } = require('cluster');
const { send } = require('process');
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

/*app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});*/

app.get('/sendNotification', (req, res) => {
  database.ref().on('value', (snapshot) => {
    var dict = snapshot.val();
    var token = dict["fcmToken"];
    console.log(token)
    sendNotif(token)
    res.send("ok")
  });
});

app.post('/saveFcm', (req, res) => {
  saveFcm(req.query.fcmToken);
  res.send('ok')
});

function saveFcm(token) {
  database.ref().set({
    fcmToken: token
  });
}

function sendNotif(fcmToken) {
  const data = JSON.stringify({
    "to" : fcmToken,
    "notification": {
      "title": "Alarm",
        "body": "Alarminiz Caliyor"
    }
  })

  const options = {
    hostname: 'fcm.googleapis.com',
    port: 443,
    path: '/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization' : secrets.serverKey
    }
  }

  const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', d => {
      process.stdout.write(d)
    })
  })

  req.on('error', error => {
    console.error(error)
  })

  req.write(data)
  req.end()
}



server.listen(port, () => {
  console.log("App is running on port " + port);
});
