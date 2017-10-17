let config = require('config');
let EthereumTx = require('ethereumjs-tx');

let client = require('../utils/redis');
let web3 = require('../utils/web3');
let wallet = require('../utils/wallet');

const { secretKey } = config.stripe;
const stripe = require('stripe')(secretKey);

const gwei = 1000000000;

module.exports = (app) => {
  app.post('/buy-ticket', async(req, res, next) => {
    let { token, ticketAddress, walletAddress: userWallet } = req.body;
    token = JSON.parse(token);

    console.log('userWallet', userWallet);

    // REDIS: get contract abies
    let contractInfo;
    try {
      let reply = await client.getAsync('terrapin-station');
      contractInfo = JSON.parse(JSON.parse(reply).abis);
    } catch (e) {
      console.error('Redis GET failed', e);
    }

    // STRIPE: charge
    try {
      await stripe.charges.create({
        amount: 2000,
        currency: 'usd',
        source: 'tok_visa', // token.card
        description: 'Charge for ethan.robinson@example.com'
      });
    } catch (e) {
      console.error('Stripe Charge Failed', e);
    }

    // ETHEREUM: set new owner
    try {
      let ticketInstance = new web3.eth.Contract(contractInfo.ticket.abi, ticketAddress);

      let oldOwner = await ticketInstance.methods.owner().call();
      console.log('oldOwner:', oldOwner);

      let nonce = await web3.eth.getTransactionCount(wallet.address);
      let chainId = await web3.eth.net.getId();
      let gas = `0x${(4700000).toString(16)}`;
      let gasPrice = `0x${(gwei * 20).toString(16)}`;

      // let ticketPrice = parseInt(await ticketInstance.methods.price().call());

      let encodedAbi = ticketInstance.methods.setOwner(userWallet).encodeABI();
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

      console.log('sending signed tx');
      // console.log(await ticketInstance.methods.master().call());
      // console.log(wallet.address);
      await web3.eth.sendSignedTransaction(`0x${serializedTx.toString('hex')}`);

      let newOwner = await ticketInstance.methods.owner().call();
      console.log('newOwner:', newOwner);

    } catch (e) {
      console.log('Setting Owner failed', e);
    }

    // return
    res.send('success');
    next();
  });
};
