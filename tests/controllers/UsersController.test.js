/* eslint-disable jest/no-test-callback */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-title */
/* eslint-disable jest/lowercase-name */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-undef */
/*  eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable func-names */
import { expect } from 'chai';
import request from 'request';
import dbClient from '../../utils/db';

const url = 'http://0.0.0.0:5000';

describe('UsersController', () => {
  const mockUser = {
    email: 'bob@dylan.com',
    password: 'toto1234!',
  };

  before(function (done) {
    this.timeout(1000);
    dbClient.clear().then((result) => done());
  });

  describe('POST /users', () => {
    it('Fails when there\'s no email and there\'s a password', (done) => {
      const options = {
        url: `${url}/users`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'toto1234!' }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Missing email' });
        done();
      });
    });

    it('Fails when there is an email but no password', (done) => {
      const options = {
        url: `${url}/users`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'bob@dylan.com' }),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Missing password' });
        done();
      });
    });

    it('Succeeds when a new user with email and password is created in the DB', (done) => {
      const options = {
        url: `${url}/users`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockUser),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(201);
        expect(JSON.parse(body).email).to.be.equal(mockUser.email);
        expect(JSON.parse(body).id.length).to.be.greaterThan(0);
        done();
      });
    });

    it('Fails when the user already exists', (done) => {
      const options = {
        url: `${url}/users`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockUser),
      };
      request.post(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(400);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Already exist' });
        done();
      });
    });
  });

  describe('GET /users/me', () => {
    let token = '';

    before(function (done) {
      this.timeout(5000);
      const newUserOptions = {
        url: `${url}/users`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockUser),
      };
      request.post(newUserOptions, (_) => {
        const options = {
          url: `${url}/connect`,
          headers: {
            Authorization: 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=',
          },
        };
        request.get(options, (err, _, body) => {
          if (err) return done(err);
          token = JSON.parse(body).token;
          done();
        });
      });
    });

    it('Succeeds with a valid "X-Token" field', (done) => {
      const options = {
        url: `${url}/users/me`,
        headers: {
          'X-Token': token,
        },
      };
      request.get(options, (_err, res, body) => {
        expect(res.statusCode).to.be.equal(200);
        expect(JSON.parse(body).email).to.deep.equal(mockUser.email);
        expect(JSON.parse(body).id.length).to.be.greaterThan(0);
        done();
      });
    });

    it('Fails with an invalid "X-Token" field', (done) => {
      const options = {
        url: `${url}/users/me`,
        headers: {
          'X-Token': 'sdfghjkqwertyu',
        },
      };
      request.get(options, (_err, res, body) => {
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });
  });
});
