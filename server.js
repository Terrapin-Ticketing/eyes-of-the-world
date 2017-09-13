const restify = require('restify');
const client = require('./redis');

let server = restify.createServer({
  name: 'eyes',
  version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/terrapin-station', (req, res, next) => {
  client.getAsync('terrapin-station')
    .then((reply) => {
      if (!reply) return res.send(500, { msg: 'error getting contract information' });

      let contractInfo = JSON.parse(reply);
      res.send(contractInfo);
    })
    .then(() => next());
});

server.post('/terrapin-station', (req, res, next) => {
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

server.listen(8000, () => {
  console.log('%s listening at %s', server.name, server.url);
});
