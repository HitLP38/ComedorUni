import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS = path.join(__dirname, 'screenshots');

test.describe('Login de alumno', () => {
  test('muestra la pantalla de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.auth-title')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOTS}/01-login.png`, fullPage: true });
  });

  test('muestra error con DNI inválido', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', '00000000');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: `${SCREENSHOTS}/02-login-error.png`, fullPage: true });
  });

  test('muestra error con PIN incorrecto', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', '12345671');
    await page.fill('input[type="password"]', '999999');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-msg')).toBeVisible({ timeout: 8_000 });
  });

  test('redirige a /login si intenta entrar a /home sin sesión', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Operador login', () => {
  test('muestra pantalla de login operador', async ({ page }) => {
    await page.goto('/operador/login');
    await expect(page.locator('.auth-title')).toContainText('Operador');
    await page.screenshot({ path: `${SCREENSHOTS}/03-operador-login.png`, fullPage: true });
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/operador/login');
    await page.fill('input[type="text"]', 'noexiste');
    await page.fill('input[type="password"]', 'mal');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-msg')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin login', () => {
  test('muestra pantalla de login admin', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('.auth-title')).toContainText('Admin');
    await page.screenshot({ path: `${SCREENSHOTS}/04-admin-login.png`, fullPage: true });
  });

  test('redirige a /login si accede a /admin/dashboard sin sesión', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
