const broadcast = require('./broadcast');
const payment = require('./payment');

module.exports = (app) => {
  broadcast(app);
  payment(app);
};
