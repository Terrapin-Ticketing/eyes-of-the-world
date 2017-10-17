// initilizes "terrapinbase" wallet
let web3 = require('./web3');
let privateKey = process.env.TPK;
let wallet = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
module.exports = wallet;
