import { AccessTokenGuard } from './access-token.guard';

describe('AccesstokenGuard', () => {
  it('should be defined', () => {
    expect(new AccessTokenGuard()).toBeDefined();
  });
});
