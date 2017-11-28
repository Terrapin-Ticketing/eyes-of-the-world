const client = require('../utils/redis');
const config = require('config');

module.exports = (app) => {
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
    // security check
    // if (config.env === 'development') {
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
    // }
  });
};
