// initilizes "terrapinbase" wallet
let web3 = require('./web3');
let privateKey = process.env.TPK;
if (!privateKey) throw ('Error. process.env.TPK not set!');
let wallet = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
module.exports = wallet;
