import { test, expect } from '@playwright/test';

test.describe('Board view', () => {
	test('loads with default columns via SSR', async ({ page }) => {
		await page.goto('/');

		// Board header visible
		await expect(page.locator('text=CYBER::MANGO').first()).toBeVisible();

		// Default columns present
		for (const name of ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']) {
			await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
		}
	});

	test('card created via REST API appears after refresh', async ({ page, request }) => {
		await page.goto('/');

		// Get the board to find a column ID
		const boardRes = await request.get('/api/boards');
		const { boards } = await boardRes.json();
		const boardId = boards[0].id;

		const boardDetailRes = await request.get(`/api/boards/${boardId}`);
		const { board } = await boardDetailRes.json();
		const backlogColumn = board.columns.find((c: any) => c.name === 'Backlog');

		// Create a card via REST API (simulates MCP / plugin creating a task)
		const createRes = await request.post('/api/cards', {
			data: { columnId: backlogColumn.id, title: 'API-created task' }
		});
		expect(createRes.ok()).toBeTruthy();

		// Refresh and verify it appears
		await page.reload();
		await expect(page.getByText('API-created task')).toBeVisible();
	});

	test('card moved via REST API reflects in UI after refresh', async ({ page, request }) => {
		await page.goto('/');

		// Get board structure
		const boardRes = await request.get('/api/boards');
		const { boards } = await boardRes.json();
		const boardDetailRes = await request.get(`/api/boards/${boards[0].id}`);
		const { board } = await boardDetailRes.json();

		const backlogCol = board.columns.find((c: any) => c.name === 'Backlog');
		const inProgressCol = board.columns.find((c: any) => c.name === 'In Progress');

		// Create a card in Backlog
		const createRes = await request.post('/api/cards', {
			data: { columnId: backlogCol.id, title: 'Move-me task' }
		});
		const { card } = await createRes.json();

		// Move it to In Progress via API
		const moveRes = await request.post(`/api/cards/${card.id}/move`, {
			data: { columnId: inProgressCol.id, position: 1000 }
		});
		expect(moveRes.ok()).toBeTruthy();

		// Refresh and verify card is in In Progress column
		await page.reload();
		await expect(page.getByText('Move-me task')).toBeVisible();

		// Verify it's NOT in Backlog anymore — find the In Progress column container
		// and check the card is there
		const boardDetail2 = await request.get(`/api/boards/${boards[0].id}`);
		const { board: updated } = await boardDetail2.json();
		const movedCard = updated.columns
			.find((c: any) => c.name === 'In Progress')
			.cards.find((c: any) => c.title === 'Move-me task');
		expect(movedCard).toBeTruthy();
	});

	test('quick add card via UI input', async ({ page }) => {
		await page.goto('/');

		// Find the first QuickAdd input (in first column)
		const quickAddInput = page.getByPlaceholder('+ Add card...').first();
		await quickAddInput.fill('UI-created card');
		await quickAddInput.press('Enter');

		// Card should appear in the column
		await expect(page.getByText('UI-created card')).toBeVisible({ timeout: 5000 });
	});
});
