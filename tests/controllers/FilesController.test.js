/* eslint-disable jest/no-test-callback */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-title */
/* eslint-disable jest/lowercase-name */
/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable consistent-return */
/* eslint-disable func-names */
import { expect } from 'chai';
import request from 'request';
import { tmpdir } from 'os';
import { join as pathJoin } from 'path';
import {
  existsSync,
  readdirSync,
  unlinkSync,
  statSync,
} from 'fs';
import dbClient from '../../utils/db';

const url = 'http://0.0.0.0:5000';
const DEFAULT_ROOT_FOLDER = 'files_manager';

describe('FileController', () => {
  let token = '';

  const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0 ? process.env.FOLDER_PATH.trim() : pathJoin(tmpdir(), DEFAULT_ROOT_FOLDER);

  const mockUser = {
    email: 'bob@dylan.com',
    password: 'toto1234!',
  };

  /** 3 sample files: file, folder and file for folder */
  const mockFiles = [
    {
      name: 'try.txt',
      type: 'file',
      data: [
        'An apple a day saves life',
        'A bird in and is worth 2 in the bush',
        'An early bird catches the worm',
      ].join('\n'),
      b64Data() { return Buffer.from(this.data, 'utf-8').toString('base64'); },
    },
    {
      name: 'Stuff',
      type: 'folder',
      data: '',
      b64Data() { return ''; },
    },
    {
      name: 'general.md',
      type: 'file',
      data: [
        '# The School',
        '## Teaching timetable',
        '_ `Mathematics 8:00am - 9:00am`',
        '- `Physics 10:00am - 11:00am`',
      ].join('\n'),
      b64Data() { return Buffer.from(this.data, 'utf-8').toString('base64'); },
    },
  ];

  const emptyFolder = (name) => {
    if (!existsSync(name)) return;
    for (const fileName of readdirSync(name)) {
      const filePath = pathJoin(name, fileName);
      if (statSync(filePath).isFile) {
        unlinkSync(filePath);
      } else {
        emptyFolder(filePath);
      }
    }
  };

  const emptyDatabaseCollections = async (callback) => {
    try {
      await dbClient.clear();
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  };

  const signUp = (user, callback) => {
    const newUserOptions = {
      url: `${url}/users`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockUser),
    };
    request.post(newUserOptions, (_) => {
      if (callback) callback();
    });
  };

  const signIn = (user, callback) => {
    const options = {
      url: `${url}/connect`,
      headers: {
        Authorization: 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=',
      },
    };
    request.get(options, (err, _, body) => {
      if (err && callback) return callback(err);
      token = JSON.parse(body).token;
      if (callback) callback();
    });
  };

  before(function (done) {
    this.timeout(1000);
    emptyDatabaseCollections(() => signUp(mockUser, () => signIn(mockUser, done)));
    emptyFolder(baseDir);
  });

  after(function (done) {
    this.timeout(10000);
    setTimeout(() => {
      emptyDatabaseCollections(done);
      emptyFolder(baseDir);
    });
  });

  describe('POST /files', () => {
    it('Fails with no "X-Token" header field', (done) => {
      request.post(`${url}/files`, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Fails for non-existent user', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': 'asdfghjkwerty',
        },
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Fails if name is missing', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: '{}',
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Missing name' });
        done();
      });
    });

    it('Fails if type is missing', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: '{"name": "try.txt"}',
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Missing type' });
        done();
      });
    });

    it('Fails if type is available but unrecognized', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: '{"name": "try.txt", "type":"sijui" }',
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Missing type' });
        done();
      });
    });

    it('Fails if data is missing and type is not folder', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: mockFiles[0].name, type: mockFiles[0].type }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Missing data' });
        done();
      });
    });

    it('Fails if unknown parentId is set', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: mockFiles[0].name,
          type: mockFiles[0].type,
          data: mockFiles[0].b64Data(),
          parentId: 10,
        }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Parent not found' });
        done();
      });
    });

    it('Succeeds for valid values of file', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: mockFiles[0].name,
          type: mockFiles[0].type,
          data: mockFiles[0].b64Data(),
        }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(201);
        expect(JSON.parse(body).name).to.deep.equal(mockFiles[0].name);
        expect(JSON.parse(body).type).to.deep.equal(mockFiles[0].type);
        expect(JSON.parse(body).isPublic).to.be.equal(false);
        expect(JSON.parse(body).parentId).to.be.equal(0);
        expect(JSON.parse(body).userId).to.exist;
        done();
      });
    });

    it('Succeeds for valid values of a folder', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: mockFiles[1].name,
          type: mockFiles[1].type,
          isPublic: true,
          parentId: 0,
        }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(201);
        expect(JSON.parse(body).name).to.deep.equal(mockFiles[1].name);
        expect(JSON.parse(body).type).to.deep.equal(mockFiles[1].type);
        expect(JSON.parse(body).isPublic).to.be.equal(true);
        expect(JSON.parse(body).parentId).to.be.equal(0);
        expect(JSON.parse(body).userId).to.exist;
        done();
      });
    });

    it.skip('Fails if parentId is set and is not of type folder or 0', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: mockFiles[2].name,
          type: mockFiles[2].type,
          data: mockFiles[2].b64Data(),
          parentId: mockFiles[0].id,
        }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Parent is not a folder' });
        done();
      });
    });

    it('Succeeds if parentId is set and is of folder', (done) => {
      const options = {
        url: `${url}/files`,
        headers: {
          'X-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: mockFiles[2].name,
          type: mockFiles[2].type,
          data: mockFiles[2].b64Data(),
          parentId: mockFiles[1].id,
          isPublic: false,
        }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(201);
        expect(JSON.parse(body).name).to.deep.equal(mockFiles[2].name);
        expect(JSON.parse(body).type).to.deep.equal(mockFiles[2].type);
        expect(JSON.parse(body).isPublic).to.be.equal(false);
        // expect(JSON.parse(body).parentId).to.be.equal(mockFiles[1].id);
        expect(JSON.parse(body).userId).to.exist;
        done();
      });
    });
  });
});
