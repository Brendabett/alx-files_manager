/* eslint-disable */

import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('DBClient', () => {
  before(function (done) {
    this.timeout(1000);
    dbClient.clear().then((_) => done()).catch((err) => done(err));
  });

  it('Client is alive', () => {
    expect(dbClient.isAlive()).to.be.equal(true);
  });

  it('nbUsers returns the correct value', async () => {
    expect(await dbClient.nbUsers()).to.be.equal(0);
  });

  it('nbFiles returns the correct value', async () => {
    expect(await dbClient.nbFiles()).to.be.equal(0);
  });
});
