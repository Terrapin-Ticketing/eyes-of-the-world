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
  app.post('/buy-ticket', async(req, res, next) => {
    try {
      let { token, ticketAddresses, walletAddress: userWallet, fees } = req.body;
      token = JSON.parse(token);

      console.log('ticketAddresses', ticketAddresses);

      // REDIS: get contract abies
      let contractInfo;
      let reply = await client.getAsync('terrapin-station');
      contractInfo = JSON.parse(JSON.parse(reply).abis);

      let total = 0 + fees;
      for (let i = 0; i < ticketAddresses.length; i++) {
        let ticketAddress = ticketAddresses[i];
        let ticketInstance = new web3.eth.Contract(contractInfo.ticket.abi, ticketAddress);
        if (await ticketInstance.method.isForSale().call()) throw Error('one or more of these tickets is not for sale');
        let price = parseInt(await ticketInstance.method.usdPrice().call());
        total += price;
      }

      // STRIPE: charge
      await stripe.charges.create({
        amount: total,
        currency: 'usd',
        source: 'tok_visa', // token.card
        description: 'Charge for ethan.robinson@example.com'
      });

      await pasync.eachSeries(ticketAddresses, async(ticketAddress) => {
        // ETHEREUM: set new owner
        let ticketInstance = new web3.eth.Contract(contractInfo.ticket.abi, ticketAddress);

        let oldOwner = await ticketInstance.methods.owner().call();
        console.log('oldOwner:', oldOwner);

        let nonce = await web3.eth.getTransactionCount(wallet.address);
        let chainId = await web3.eth.net.getId();
        let gas = `0x${(4700000).toString(16)}`;
        let gasPrice = `0x${(gwei * 20).toString(16)}`;

        let encodedAbi = ticketInstance.methods.masterBuy(userWallet).encodeABI();
        let txParams = {
          nonce,
          chainId,
          to: ticketInstance.options.address,
          value: 0,
          gas,
          gasPrice,
          data: encodedAbi
        };

        let tx = new EthereumTx(txParams);
        let privateKeyBuffer = new Buffer(Buffer.from(wallet.privateKey.substring(2), 'hex'));
        tx.sign(privateKeyBuffer);
        let serializedTx = tx.serialize();

        await web3.eth.sendSignedTransaction(`0x${serializedTx.toString('hex')}`);

        let newOwner = await ticketInstance.methods.owner().call();
        console.log('newOwner:', newOwner);
        // return
      });
      res.send('success');
    } catch (e) {
      console.log('Setting Owner failed', e);
      res.send('failed');
    }
    next();
  });
};
