/* eslint-disable */
import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('RedisClient', () => {
  before(function (done) {
    this.timeout(1000);
    setTimeout(done, 4000);
    done();
  });

  it('Client is a live', () => {
    expect(redisClient.isAlive()).to.be.equal(true);
  });

  it('Setting and getting value', async () => {
    await redisClient.set('testKey', 345, 10);
    expect(await redisClient.get('testKey')).to.equal('345');
  });

  it('Setting and getting an expired value', async () => {
    await redisClient.set('testKey', 200, 1);
    setTimeout(() => {
      expect(redisClient.get('testKey')).to.not.equal('200');
    }, 2000);
  });

  it('Setting and getting a deleted value', async () => {
    await redisClient.set('testKey', 400, 10);
    await redisClient.del('testKey');
    setTimeout(async () => {
      expect(await redisClient.get('testKey')).to.be.null;
    }, 2000);
  });
});
