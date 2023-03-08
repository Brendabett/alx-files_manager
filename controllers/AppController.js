import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    const redis = await redisClient.isAlive();
    const db = dbClient.isAlive();
    res.set('Content-Type', 'application/json');
    return res.status(200).json({ redis, db }).end();
  }

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.set('Content-Type', 'application/json');
    return res.status(200).json({ users, files }).end();
  }
}

export default AppController;
