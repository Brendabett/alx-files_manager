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

describe('AuthController', () => {
  const mockUser = {
    email: 'bob@dylan.com',
    password: 'toto1234!',
  };
  const authHeader = 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=';
  let token = '';

  before(function (done) {
    this.timeout(1000);
    dbClient.clear().then((_) => {
      const options = {
        url: `${url}/users`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockUser),
      };
      request.post(options, (_) => {
        done();
      });
    });
  });

  describe('GET /connect', () => {
    it('Fails with no "Authorization" header field', function (done) {
      this.timeout(5000);
      request.get(`${url}/connect`, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Fails for non-existent user', function (done) {
      this.timeout(5000);
      const options = {
        url: `${url}/connect`,
        headers: {
          Authorization: 'Basic eW9iQHRlc3QuY29tOnRoYWxheW95bw==',
        },
      };
      request.get(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Fails for user with valid email but invalid password', function (done) {
      this.timeout(5000);
      const options = {
        url: `${url}/connect`,
        headers: {
          Authorization: 'Basic Ym9iQGR5bGFuLmNvbToxMjM0dG90',
        },
      };
      request.get(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Fails user with an invalid email but a valid password', function (done) {
      this.timeout(5000);
      const options = {
        url: `${url}/connect`,
        headers: {
          Authorization: 'Basic Ym9iaUBkeWxhbi5jb206dG90bzEyMzQh',
        },
      };
      request.get(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Succeeds for an existing user', function (done) {
      this.timeout(5000);
      const options = {
        url: `${url}/connect`,
        headers: {
          Authorization: authHeader,
        },
      };
      request.get(options, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(200);
        expect(JSON.parse(body).token.length).to.be.greaterThan(0);
        token = JSON.parse(body).token;
        done();
      });
    });
  });

  describe('GET /disconnect', () => {
    it('Fails with no "X-Token" header field', (done) => {
      request.get(`${url}/disconnect`, (_err, res, body) => {
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Fails with a non-existent user', (done) => {
      const options = {
        url: `${url}/disconnect`,
        headers: {
          'X-Token': 'asdfghjklasdfgh',
        },
      };
      request.get(options, (_err, res, body) => {
        expect(res.statusCode).to.be.equal(401);
        expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
        done();
      });
    });

    it('Succeeds with a valid "X-Token" header', (done) => {
      const options = {
        url: `${url}/disconnect`,
        headers: {
          'X-Token': token,
        },
      };
      request.get(options, (_err, res, body) => {
        expect(res.statusCode).to.be.equal(204);
        expect(body).to.be.equal('');
        done();
      });
    });
  });
});
