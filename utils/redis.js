import { createClient } from 'redis';
import { promisify } from 'util';

// class to define methods for commonly used redis commands
class RedisClient {
  constructor() {
    this.myClient = createClient();
    this.myClient.on('error', (error) => console.log(`Redis client not connected to server: ${error}`));
  }

  // check connection status and report
  isAlive() {
    return this.myClient.connected;
  }

  // get value for given key from redis server
  async get(key) {
    return promisify(this.myClient.GET).bind(this.myClient)(key);
  }

  async set(key, val, time) {
    return promisify(this.myClient.SET).bind(this.myClient)(key, val, 'EX', time);
  }

  // del key vale pair from redis server
  async del(key) {
    return promisify(this.myClient.DEL).bind(this.myClient)(key);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
