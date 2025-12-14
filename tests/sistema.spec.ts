import { test, expect } from '@playwright/test';

test('crear y eliminar partida dinámicamente', async ({ page }) => {
  await page.goto('/');

  // Login
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Dirección email:' }).fill('najadod273@asurad.com');
  await page.getByRole('textbox', { name: 'Password:' }).fill('2345');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  // Esperar a que el login asiente (cookie y/o mensaje de bienvenida)
  await expect.poll(async () => {
    return page.evaluate(() => document.cookie.includes('nick='));
  }).toBeTruthy();

  await expect(
    page.locator('#au').getByText('Bienvenido al sistema', { exact: false })
  ).toBeVisible();

  // Abrir sección Partidas
  await page.getByRole('link', { name: 'Partidas', exact: true }).click();

  // Esperar a que se renderice la sección de partidas
  await expect(page.locator('#cmp-crear-partida')).toBeVisible();

  // Crear partida
  const btnCrear = page.getByRole('button', { name: '+ Crear partida', exact: true });
  await expect(btnCrear).toBeEnabled();
  await btnCrear.click();

  // Capturar el código de la partida desde el mensaje "Esperando rival"
  const codigoEl = page.locator('#resCrearPartida code');
  await expect(codigoEl).toBeVisible();
  const codigoPartida = (await codigoEl.innerText()).trim();
  expect(codigoPartida.length).toBeGreaterThan(0);

  // Eliminar partida por código
  await page.getByLabel('Introduce el código de la partida:').fill(codigoPartida);
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();

  // Confirmación
  await expect(page.getByText('Partida eliminada correctamente')).toBeVisible();
});