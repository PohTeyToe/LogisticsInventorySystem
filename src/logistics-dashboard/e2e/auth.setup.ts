import { test as setup } from '@playwright/test';

const TEST_USER = { email: 'e2e@test.com', password: 'E2eTestPass123' };
const API_URL = 'http://localhost:5063';

setup('authenticate', async ({ page }) => {
  // Register test user (ignore conflict if already exists)
  const res = await page.request.post(`${API_URL}/api/auth/register`, {
    data: TEST_USER,
  });

  let auth;
  if (res.ok()) {
    auth = await res.json();
  } else {
    // Already registered — login instead
    const loginRes = await page.request.post(`${API_URL}/api/auth/login`, {
      data: TEST_USER,
    });
    auth = await loginRes.json();
  }

  // Store auth in localStorage so the app picks it up
  await page.goto('http://localhost:5173/login');
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token.token);
    localStorage.setItem('auth_refresh_token', token.refreshToken);
    localStorage.setItem('auth_user', JSON.stringify({
      email: token.email,
      fullName: token.fullName,
      tenantId: token.tenantId,
    }));
  }, auth);

  // Save storage state for other tests to reuse
  await page.context().storageState({ path: 'e2e/.auth/state.json' });
});
