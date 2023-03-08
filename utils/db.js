import process from 'process';
import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    const port = process.env.DB_PORT || 27017;
    const host = process.env.DB_HOST || '127.0.0.1';
    const database = process.env.DB_DATABASE || 'files_manager';
    this.myClient = MongoClient(`mongodb://${host}:${port}/${database}`, { useUnifiedTopology: true });
    this.myClient.connect();
  }

  isAlive() {
    return this.myClient.isConnected();
  }

  async nbUsers() {
    /* returns number of documents in the collection users */
    const myDB = this.myClient.db();
    const userCollection = myDB.collection('users');
    return userCollection.countDocuments();
  }

  async nbFiles() {
    /* returns number of documents in the collection files */
    const myDB = this.myClient.db();
    const fileCollection = myDB.collection('files');
    return fileCollection.countDocuments();
  }

  async userExists(email) {
    const myDB = this.myClient.db();
    const userCollection = myDB.collection('users');
    return userCollection.findOne({ email });
  }

  async addUser(user) {
    const myDB = this.myClient.db();
    const userCollection = myDB.collection('users');
    return userCollection.insertOne(user);
  }

  async findUser(filters) {
    const myDB = this.myClient.db();
    const userCollection = myDB.collection('users');
    if ('_id' in filters) filters._id = ObjectId(filters._id);
    return userCollection.findOne(filters);
  }

  async findFile(filters) {
    const myDB = this.myClient.db();
    const fileCollection = myDB.collection('files');
    const idFilters = ['_id', 'userId', 'parentId'].filter((prop) => prop in filters && filters[prop] !== '0');
    idFilters.forEach((i) => {
      filters[i] = ObjectId(filters[i]);
    });
    return fileCollection.findOne(filters);
  }

  async addFile(file) {
    const myDB = this.myClient.db();
    const fileCollection = myDB.collection('files');
    return fileCollection.insertOne(file);
  }

  async findFiles(filters) {
    const myDB = this.myClient.db();
    const fileCollection = myDB.collection('files');
    return fileCollection.find(filters).toArray();
  }

  async updateFile(file) {
    const myDB = this.myClient.db();
    const fileCollection = myDB.collection('files');
    return fileCollection.updateOne({ _id: file._id }, { $set: { ...file } });
  }

  async insertManyUsers(users) {
    const myDB = this.myClient.db();
    const usersCollection = myDB.collection('users');
    await usersCollection.insertMany(users);
  }

  async insertManyFiles(files) {
    const myDB = this.myClient.db();
    const filesCollection = myDB.collection('files');
    await filesCollection.insertMany(files);
  }

  async clear() {
    const myDB = this.myClient.db();
    const fileCollection = myDB.collection('files');
    const userCollection = myDB.collection('users');
    await fileCollection.deleteMany({});
    await userCollection.deleteMany({});
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
