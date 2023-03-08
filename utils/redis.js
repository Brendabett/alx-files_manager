import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.myClient = createClient();
    this.myClient.on('error', (error) => console.log(error));
  }

  isAlive() {
    return this.myClient.connected;
  }

  async get(key) {
    return promisify(this.myClient.GET).bind(this.myClient)(key);
  }

  async set(key, val, time) {
    return promisify(this.myClient.SET).bind(this.myClient)(key, val, 'EX', time);
  }

  async del(key) {
    return promisify(this.myClient.DEL).bind(this.myClient)(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
