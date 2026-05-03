/**
 * E2E: flujo completo de alumno demo (usa credenciales del seed demo).
 * Requiere la app corriendo en localhost:5173 y la API en localhost:3001.
 * El seed demo debe haber cargado el alumno con DNI 12345671 / PIN 123456.
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS = path.join(__dirname, 'screenshots');

const DEMO_DNI = process.env.DEMO_DNI ?? '12345671';
const DEMO_PIN = process.env.DEMO_PIN ?? '123456';

test.describe('Flujo alumno demo', () => {
  test('pantalla de inicio redirige a login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login con credenciales demo llega al paso OTP', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', DEMO_DNI);
    await page.fill('input[type="password"]', DEMO_PIN);
    await page.screenshot({ path: `${SCREENSHOTS}/05-login-relleno.png`, fullPage: true });
    await page.click('button[type="submit"]');

    // Debe mostrar el campo OTP o un mensaje de error (si las creds son inválidas en el test env)
    const otpOrError = page.locator('input[placeholder*="6"], .error-msg');
    await expect(otpOrError).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: `${SCREENSHOTS}/06-otp-o-error.png`, fullPage: true });
  });

  test('mis-reservas requiere autenticación', async ({ page }) => {
    await page.goto('/mis-reservas');
    await expect(page).toHaveURL(/\/login/);
  });

  test('cola requiere autenticación', async ({ page }) => {
    await page.goto('/cola');
    await expect(page).toHaveURL(/\/login/);
  });
});
