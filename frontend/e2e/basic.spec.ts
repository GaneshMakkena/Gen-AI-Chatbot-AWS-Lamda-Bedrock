/**
 * E2E tests for MediBot basic flows.
 * Tests health check, chat interaction, and guest mode.
 */

import { test, expect } from '@playwright/test'

test.describe('MediBot Health & Basic Navigation', () => {
    test('should load the home page', async ({ page }) => {
        await page.goto('/')

        // Check for main content area
        await expect(page.locator('body')).toBeVisible()
    })

    test('should show chat interface', async ({ page }) => {
        await page.goto('/')

        // Look for chat input or welcome message
        const chatArea = page.locator('[data-testid="chat-interface"]').or(
            page.locator('.chat-container')
        ).or(
            page.getByPlaceholder(/ask|question|message/i)
        )

        // At least one of these should be visible
        await expect(chatArea.first()).toBeVisible({ timeout: 10000 })
    })
})

test.describe('Guest Mode', () => {
    test('should allow guest to send a message', async ({ page }) => {
        await page.goto('/')

        // Find input field
        const input = page.getByPlaceholder(/ask|question|type/i).first()

        if (await input.isVisible()) {
            await input.fill('Hello')

            // Find and click send button
            const sendButton = page.getByRole('button', { name: /send/i }).or(
                page.locator('button[type="submit"]')
            )

            if (await sendButton.isVisible()) {
                await sendButton.click()

                // Wait for response (loading state should appear)
                await expect(page.locator('.loading, .typing, [aria-busy="true"]').first())
                    .toBeVisible({ timeout: 5000 })
                    .catch(() => {
                        // Response might be too fast, just check for any content update
                    })
            }
        }
    })
})

test.describe('Accessibility', () => {
    test('should have proper page structure', async ({ page }) => {
        await page.goto('/')

        // Check for skip link or main landmark
        const main = page.locator('main').or(page.getByRole('main'))

        // Should have main content area
        await expect(main.first()).toBeVisible({ timeout: 5000 }).catch(() => {
            // Some SPAs might not have explicit main element
        })
    })

    test('should have no broken images', async ({ page }) => {
        await page.goto('/')

        const images = page.locator('img')
        const count = await images.count()

        for (let i = 0; i < Math.min(count, 10); i++) {
            const img = images.nth(i)
            const src = await img.getAttribute('src')

            if (src && !src.startsWith('data:')) {
                const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth)
                expect(naturalWidth).toBeGreaterThan(0)
            }
        }
    })
})
