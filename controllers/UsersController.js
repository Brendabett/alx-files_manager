import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });
    const emailExists = await dbClient.userExists(email);
    if (emailExists) return res.status(400).json({ error: 'Already exist' });
    const user = { email, password: sha1(password) };
    const savedUser = await dbClient.addUser(user);
    userQueue.add({ userId: savedUser.insertedId });
    return res.status(201).json({ id: savedUser.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (userId) {
      const user = await dbClient.findUser({ _id: userId });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      return res.status(200).json({ id: userId, email: user.email });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default UsersController;
