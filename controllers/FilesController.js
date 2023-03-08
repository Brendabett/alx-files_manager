import fs from 'fs';
import Queue from 'bull';
import { contentType } from 'mime-types';
import { ObjectID } from 'mongodb';
import { v4 } from 'uuid';
import { env } from 'process';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const maxFilesPerPage = 20;
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

const getUser = async (req) => {
  const token = req.header('X-Token');
  if (!token) return null;
  const userId = await redisClient.get(`auth_${token}`);
  if (userId) {
    const user = await dbClient.findUser({ _id: userId });
    if (!user) return null;
    return user;
  }
  return null;
};

class FilesController {
  static async postUpload(req, res) {
    const user = await getUser(req);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name,
      type,
      parentId,
      data,
    } = req.body;

    const isPublic = req.body.isPublic || false;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });

    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (parentId) {
      const folder = await dbClient.findFile({ _id: parentId });
      if (!folder) return res.status(400).json({ error: 'Parent not found' });
      if (folder.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const folder = await dbClient.addFile({
        userId: ObjectID(user._id),
        name,
        type,
        parentId: parentId || 0,
        isPublic,
      });
      const savedFolder = { ...folder.ops[0], id: folder.insertedId };
      delete savedFolder._id;
      return res.status(201).json(savedFolder);
    }

    const filePath = env.FOLDER_PATH || '/tmp/files_manager';
    const fileName = `${filePath}/${v4()}`;
    const buff = Buffer.from(data, 'base64');

    try {
      try {
        await fs.mkdir(filePath, () => {
          // console.log('Path already exists');
        });
      } catch (err) {
        // console.log(err);
      }
      await fs.writeFile(fileName, buff, () => console.log());
    } catch (err) {
      console.log(err.message);
    }

    const file = await dbClient.addFile({
      userId: ObjectID(user._id),
      name,
      type,
      parentId: parentId || 0,
      isPublic,
      localPath: fileName,
    });

    const savedFile = { ...file.ops[0], id: file.insertedId };
    delete savedFile._id;

    if (type === 'image') {
      fileQueue.add({ userId: user._id, fileId: savedFile.id });
    }

    return res.status(201).json(savedFile);
  }

  static async getShow(req, res) {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const file = await dbClient.findFile({ _id: id, userId: user._id });
    if (!file) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { parentId, page } = req.query;
    const pageNum = page || 0;

    let queryFilter;
    if (!parentId) {
      queryFilter = { userId: user._id };
    } else {
      queryFilter = { userId: user._id, parentId };
    }

    const filesList = await dbClient.findFiles({ ...queryFilter }, pageNum, maxFilesPerPage);

    return res.status(200).json(filesList);
  }

  static async putPublish(req, res) {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const file = await dbClient.findFile({ _id: id, userId: user._id });
    if (!file) return res.status(404).json({ error: 'Not found' });
    await dbClient.updateFile({ ...file, isPublic: true });
    file.id = file._id;
    delete file._id;
    return res.status(200).json({ ...file, isPublic: true });
  }

  static async putUnpublish(req, res) {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const file = await dbClient.findFile({ _id: id, userId: user._id });
    if (!file) return res.status(404).json({ error: 'Not found' });
    await dbClient.updateFile({ ...file, isPublic: false });
    file.id = file._id;
    delete file._id;
    return res.status(200).json({ ...file, isPublic: false });
  }

  // eslint-disable-next-line consistent-return
  static async getFile(req, res) {
    const user = await getUser(req);
    const { id } = req.params;
    const { size } = req.query;
    const file = await dbClient.findFile({ _id: id });
    if (!file) return res.status(404).json({ error: 'Not found' });
    if (!file.isPublic && (!user || String(file.userId) !== String(user._id))) return res.status(404).json({ error: 'Not found' });
    if (file.type === 'folder') return res.status(400).json({ error: 'A folder doesn\'t have content' });
    if (!file.localPath) return res.status(404).json({ error: 'Not found' });

    try {
      let fileName = file.localPath;
      if (size && ['500', '250', '100'].includes(size)) fileName = `${fileName}_${size}`;
      fs.readFile(fileName, (err, data) => {
        const header = { 'Content-Type': contentType(file.name) };
        return res.set(header).status(200).send(data);
      });
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
