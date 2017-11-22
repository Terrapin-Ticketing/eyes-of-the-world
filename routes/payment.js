let config = require('config');
let EthereumTx = require('ethereumjs-tx');
let pasync = require('pasync');

let client = require('../utils/redis');
let web3 = require('../utils/web3');
let wallet = require('../utils/wallet');

const { secretKey } = config.stripe;
const stripe = require('stripe')(secretKey);

const gwei = 1000000000;

module.exports = (app) => {
  // app.post('/buy-ticket/:id')
  app.post('/buy-ticket', async(req, res, next) => {
    try {
      let { token, walletAddress: userWallet, fees, qty, eventAddress } = req.body;
      token = JSON.parse(token);

      // REDIS: get contract abies
      let contractInfo;
      let reply = await client.getAsync('terrapin-station');
      contractInfo = JSON.parse(JSON.parse(reply).abis);

      let eventInstance = new web3.eth.Contract(contractInfo.event.abi, eventAddress);

      // ensure there are still tickets available
      let remainigTickets = await eventInstance.methods.getRemainingTickets().call();
      if (qty > remainigTickets) throw new Error('No enough remaining tickets');

      let price = parseInt(await eventInstance.methods.baseUSDPrice().call()) * qty;
      let total = price + fees;

      // STRIPE: charge
      await stripe.charges.create({
        amount: total,
        currency: 'usd',
        source: 'tok_visa', // token.card
        description: 'Charge for ethan.robinson@example.com'
      });

      // if payment is Successful
      let encodedAbi = eventInstance.methods.printTicket(userWallet, web3.utils.fromAscii('GA')).encodeABI();
      let nonce = await web3.eth.getTransactionCount(wallet.address);
      let chainId = await web3.eth.net.getId();
      let gas = `0x${(4700000).toString(16)}`;
      let gasPrice = `0x${(gwei * 1).toString(16)}`;
      // save ethereum tx hash
      let transactionsList = [];
      // Print tickets
      await pasync.eachSeries(Array(qty), async() => {
        let txParams = {
          nonce: nonce++,
          chainId,
          to: eventInstance.options.address,
          value: 0,
          gas,
          gasPrice,
          data: encodedAbi
        };

        let tx = new EthereumTx(txParams);
        let privateKeyBuffer = new Buffer(Buffer.from(wallet.privateKey.substring(2), 'hex'));
        tx.sign(privateKeyBuffer);
        let serializedTx = tx.serialize();

        let transaction = await web3.eth.sendSignedTransaction(`0x${serializedTx.toString('hex')}`);
        transactionsList.push(transaction);
      });
      res.send(transactionsList);
    } catch (e) {
      console.log(e);
      res.status(500).send(e);
    }
    next();
  });
};
