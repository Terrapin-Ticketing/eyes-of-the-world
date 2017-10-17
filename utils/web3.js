const config = require('config');
const Web3 = require('web3');

let web3 = new Web3(new Web3.providers.HttpProvider(config.web3.httpProvider));
module.exports = web3;
