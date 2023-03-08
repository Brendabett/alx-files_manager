import sha1 from 'sha1';
import { Buffer } from 'buffer';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res, next) {
    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader) return res.status(401).json({ error: 'Unauthorized' });
    const encodedToken = authorizationHeader.split(' ')[1];
    const decodedToken = Buffer.from(encodedToken, 'base64').toString().split(':');
    const email = decodedToken[0];
    const password = sha1(decodedToken[1]);
    const user = await dbClient.findUser({ email, password });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const token = v4();
    const redisUserId = `auth_${token}`;
    await redisClient.set(redisUserId, user._id.toString(), 60 * 60 * 24);
    res.set('X-Token', token.toString());
    res.status(200).json({ token });
    return next();
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const user = await redisClient.get(`auth_${token}`);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}

export default AuthController;
