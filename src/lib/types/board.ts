export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Board {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Column {
	id: string;
	boardId: string;
	name: string;
	color: string | null;
	wipLimit: number | null;
	position: number;
	createdAt: string;
	updatedAt: string;
}

export interface Card {
	id: string;
	columnId: string;
	title: string;
	description: string | null;
	priority: Priority;
	position: number;
	createdAt: string;
	updatedAt: string;
}

export interface Tag {
	id: string;
	boardId: string;
	name: string;
	color: string;
	createdAt: string;
}

export interface CardWithTags extends Card {
	tags: Tag[];
}

export interface ColumnWithCards extends Column {
	cards: CardWithTags[];
}

export interface BoardWithColumns extends Board {
	columns: ColumnWithCards[];
}

export interface BoardSummary {
	boardId: string;
	boardName: string;
	totalCards: number;
	cardsByColumn: { columnId: string; columnName: string; count: number; wipLimit: number | null }[];
	cardsByPriority: { priority: Priority; count: number }[];
	totalTags: number;
}
