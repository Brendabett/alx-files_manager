/* eslint-disable */
import { promises as fs } from 'fs';
import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

fileQueue.process(async (job, done) => {
  console.log('Processing...');
  const { fileId, userId } = job.data;
  if (!fileId) done(new Error('Missing fileId'));
  if (!userId) done(new Error('Missing userId'));
  const file = await dbClient.findFile({ _id: fileId, userId });
  if (!file) done(new Error('File not found'));

  try {
    const thumbnail500 = await imageThumbnail(file.localPath, { width: 500 });
    const thumbnail250 = await imageThumbnail(file.localPath, { width: 250 });
    const thumbnail100 = await imageThumbnail(file.localPath, { width: 100 });
    await fs.writeFile(`${file.localPath}_500`, thumbnail500);
    await fs.writeFile(`${file.localPath}_250`, thumbnail250);
    await fs.writeFile(`${file.localPath}_100`, thumbnail100);
    done();
  } catch (err) {
    done(err.message);
  }
});

userQueue.process(async (job, done) => {
  const { userId } = job.data;
  if (!userId) return done(new Error('Missing userId'));
  const user = await dbClient.findUser({ _id: userId });
  if (!user) return done(new Error('User not found'));
  console.log(`Welcome ${user.email}!`);
});
