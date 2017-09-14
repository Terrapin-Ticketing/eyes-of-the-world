const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const client = require('./redis');

let app = express();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '3mb'}));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'Authorization, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
  next();
});


app.get('/terrapin-station', (req, res, next) => {
  client.getAsync('terrapin-station')
    .then((reply) => {
      if (!reply) return res.send(500, { msg: 'error getting contract information' });
      let contractInfo = JSON.parse(reply);
      res.send(contractInfo);
    })
    .then(() => next());
});

app.post('/terrapin-station', (req, res, next) => {
  let { abis, terrapinAddress } = req.body;
  client.setAsync('terrapin-station', JSON.stringify({
    abis,
    terrapinAddress
  }))
    .then(() => {
      res.send({ success: true });
      return next();
    });
});

app.listen(8000, () => {
  console.log('%s listening at %s', 'Shakedown Street', '8080');
});


//
// const client = require('./redis');
//
// let server = restify.createServer({
//   name: 'eyes',
//   version: '1.0.0'
// });
//
// server.use(restify.plugins.acceptParser(server.acceptable));
// server.use(restify.plugins.queryParser());
// server.use(restify.plugins.bodyParser());
//
// server.use(restify.CORS({
//
//   // Defaults to ['*'].
//   origins: ['*']
//
//   // Defaults to false.
//   // credentials: true
//
//   // Sets expose-headers.
//   // headers: ['x-foo']
// }));
//
//
//
// server.listen(8000, () => {
//   console.log('%s listening at %s', server.name, server.url);
// });
