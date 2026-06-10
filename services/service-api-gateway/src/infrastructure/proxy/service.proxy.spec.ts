import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServiceProxy } from './service.proxy';

describe('ServiceProxy', () => {
  let proxy: ServiceProxy;
  let http: { request: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    http = {
      request: vi.fn().mockReturnValue(of({ data: { id: 'user-1' } })),
    };
    proxy = new ServiceProxy(http as never);
  });

  it('should forward Authorization header on auth profile requests', async () => {
    const token = 'Bearer eyJ.test.token';

    await proxy.forwardAuth('/auth/profile', 'GET', undefined, token);

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/auth/profile'),
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: token,
        }),
      }),
    );
  });

  it('should prefix Bearer when token is provided without scheme', async () => {
    await proxy.forwardAuth('/auth/profile', 'GET', undefined, 'raw-token');

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer raw-token',
        }),
      }),
    );
  });
});
