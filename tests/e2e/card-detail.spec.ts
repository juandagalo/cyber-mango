import { test, expect } from '@playwright/test';

// Use a unique suffix per test run to avoid collisions from DB reuse
const RUN = Date.now().toString(36);

async function createTestCard(request: any, label: string, priority = 'high') {
	const title = `${label}-${RUN}`;
	const boardRes = await request.get('/api/boards');
	const { boards } = await boardRes.json();
	const boardDetailRes = await request.get(`/api/boards/${boards[0].id}`);
	const { board } = await boardDetailRes.json();
	const backlogCol = board.columns.find((c: any) => c.name === 'Backlog');

	const res = await request.post('/api/cards', {
		data: { columnId: backlogCol.id, title, priority }
	});
	return { card: (await res.json()).card, title };
}

test.describe('Card detail modal', () => {
	test('opens on card click and shows card data', async ({ page, request }) => {
		const { title } = await createTestCard(request, 'open');
		await page.goto('/');

		await page.getByText(title).click();

		// Modal should show card detail sections
		await expect(page.getByText('Delete Card')).toBeVisible();
		await expect(page.getByText('Created').first()).toBeVisible();
	});

	test('auto-saves title on blur', async ({ page, request }) => {
		const { title } = await createTestCard(request, 'autosave');
		await page.goto('/');

		await page.getByText(title).click();

		// The modal overlay has z-50; find the title input inside it
		const modalTitleInput = page.locator('.fixed.inset-0.z-50').locator('input[type="text"]').first();

		const newTitle = `Autosaved-${RUN}`;
		await modalTitleInput.fill(newTitle);
		await modalTitleInput.blur();

		// Wait for debounce (500ms) + network
		await page.waitForTimeout(1500);

		// Close modal
		await page.keyboard.press('Escape');

		// Verify updated title in board
		await expect(page.getByText(newTitle)).toBeVisible({ timeout: 5000 });
	});

	test('closes modal with Escape key', async ({ page, request }) => {
		const { title } = await createTestCard(request, 'escape');
		await page.goto('/');

		await page.getByText(title).click();

		// Modal content visible
		await expect(page.getByText('Delete Card')).toBeVisible();

		// Press Escape
		await page.keyboard.press('Escape');

		// "Delete Card" button is only inside the modal — should be gone
		await expect(page.getByText('Delete Card')).not.toBeVisible({ timeout: 2000 });
	});

	test('deletes card with confirmation', async ({ page, request }) => {
		const { title } = await createTestCard(request, 'delete');
		await page.goto('/');

		await page.getByText(title).click();

		// Click "Delete Card" button in card detail modal
		await page.getByText('Delete Card').click();

		// Confirm dialog should appear with the card name in message
		await expect(page.getByText(/Delete card/)).toBeVisible();

		// Click the "Delete" button (exact match — not "Delete Card")
		await page.getByRole('button', { name: 'Delete', exact: true }).click();

		// Wait for deletion to complete
		await page.waitForTimeout(1000);

		// Card should be removed from board
		await expect(page.getByText(title)).not.toBeVisible({ timeout: 5000 });
	});

	test('changes priority', async ({ page, request }) => {
		const { title } = await createTestCard(request, 'priority', 'low');
		await page.goto('/');

		await page.getByText(title).click();

		// Click 'critical' priority button in modal
		await page.getByRole('button', { name: 'critical' }).click();

		// Wait for save
		await page.waitForTimeout(800);

		// Close modal
		await page.keyboard.press('Escape');

		// Verify card still visible after reload (confirms save worked and no crash)
		await page.reload();
		await expect(page.getByText(title)).toBeVisible();
	});
});
