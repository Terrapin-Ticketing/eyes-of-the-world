const redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let client = redis.createClient();

client.on('error', (err) => {
  console.log('Redis Error ' + err);
});

module.exports = client;
