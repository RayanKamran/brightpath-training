import {Test, TestingModule} from '@nestjs/testing';
import {SystemHealthController} from '../systemhealth.controller';

describe('SystemHealthController', () => {
  let controller: SystemHealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemHealthController],
    }).compile();

    controller = module.get<SystemHealthController>(SystemHealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ping', () => {
    it('should return pong', () => {
      const result: {message: string} = controller.ping();

      expect(result).toEqual({
        message: 'pong',
      });
    });
  });

  describe('serverTime', () => {
    it('should return server time as ISO string', () => {
      const result: {serverTime: string} = controller.serverTime();

      expect(result).toHaveProperty('serverTime');
      expect(typeof result.serverTime).toBe('string');
      expect(() => new Date(result.serverTime)).not.toThrow();
    });

    it('should return valid ISO 8601 timestamp', () => {
      const result: {serverTime: string} = controller.serverTime();
      const isoRegex: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      expect(result.serverTime).toMatch(isoRegex);
    });
  });
});
