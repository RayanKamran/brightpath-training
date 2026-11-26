import axios, {AxiosError} from 'axios';

describe('Authentication and Authorization', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  describe('Unauthenticated Access', () => {
    it('should allow access to public ping endpoint without authentication', async () => {
      const res = await axios.get(`${API_URL}/api/SystemHealth/ping`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('message', 'pong');
    });

    it('should allow access to public serverTime endpoint without authentication', async () => {
      const res = await axios.get(`${API_URL}/api/SystemHealth/server-time`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('serverTime');
      expect(typeof res.data.serverTime).toBe('string');
    });

    it('should allow access to user registration without authentication', async () => {
      // This test just verifies the endpoint is accessible, not that registration works
      try {
        await axios.post(`${API_URL}/api/user/register`, {
          email: 'test@example.com',
          password: 'invalid',
        });
      } catch (error) {
        // We expect this to fail with a 4xx error (validation, conflict, etc.)
        // but NOT with 401 Unauthorized
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).not.toBe(401);
      }
    });

    it('should return 401 when accessing location list without authentication', async () => {
      try {
        await axios.get(`${API_URL}/api/locations`);
        expect.fail('Expected request to fail with 401');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
        expect(axiosError.response?.data).toHaveProperty('type');
        expect(axiosError.response?.data).toHaveProperty('title', 'Unauthorized');
        expect(axiosError.response?.data).toHaveProperty('detail');
      }
    });

    it('should return 401 when accessing location details without authentication', async () => {
      try {
        await axios.get(`${API_URL}/api/locations/123`);
        expect.fail('Expected request to fail with 401');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
        expect(axiosError.response?.data).toHaveProperty('type');
        expect(axiosError.response?.data).toHaveProperty('title', 'Unauthorized');
        expect(axiosError.response?.data).toHaveProperty('detail');
      }
    });

    it('should return 401 when creating location without authentication', async () => {
      try {
        await axios.post(`${API_URL}/api/locations/db`, {
          name: 'Test Location',
        });
        expect.fail('Expected request to fail with 401');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
        expect(axiosError.response?.data).toHaveProperty('type');
        expect(axiosError.response?.data).toHaveProperty('title', 'Unauthorized');
        expect(axiosError.response?.data).toHaveProperty('detail');
      }
    });

    it('should return 401 when updating location without authentication', async () => {
      try {
        await axios.patch(`${API_URL}/api/locations/db/123`, {
          name: 'Updated Location',
        });
        expect.fail('Expected request to fail with 401');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
        expect(axiosError.response?.data).toHaveProperty('type');
        expect(axiosError.response?.data).toHaveProperty('title', 'Unauthorized');
        expect(axiosError.response?.data).toHaveProperty('detail');
      }
    });

    it('should return 401 when deleting location without authentication', async () => {
      try {
        await axios.delete(`${API_URL}/api/locations/db/123`);
        expect.fail('Expected request to fail with 401');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
        expect(axiosError.response?.data).toHaveProperty('type');
        expect(axiosError.response?.data).toHaveProperty('title', 'Unauthorized');
        expect(axiosError.response?.data).toHaveProperty('detail');
      }
    });
  });

  describe('Invalid Token Access', () => {
    it('should return 401 with invalid Bearer token', async () => {
      try {
        await axios.get(`${API_URL}/api/locations`, {
          headers: {
            Authorization: 'Bearer invalid-token-12345',
          },
        });
        expect.fail('Expected request to fail with 401');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
      }
    });

    it('should return 401 with malformed Authorization header', async () => {
      try {
        await axios.get(`${API_URL}/api/locations`, {
          headers: {
            Authorization: 'NotBearer invalid-token',
          },
        });
        expect.fail('Expected request to fail with 401');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
      }
    });
  });
});
