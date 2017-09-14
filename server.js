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
      console.log('Upload Successful');
      res.send({ success: true });
      return next();
    });
});

app.listen(8000, () => {
  console.log('%s listening at %s', 'Eyes Of The World', '8000');
});
