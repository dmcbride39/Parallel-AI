import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

interface SimulationsTable {
  id: string;
  user_name: string;
  user_age: number;
  user_personality: string;
  decision_question: string;
  path_a_title?: string;
  path_b_title?: string;
  user_photo_url?: string;
  created_at: string;
  updated_at: string;
}

interface TimelineEventsTable {
  id: string;
  simulation_id: string;
  path: string;
  year: number;
  title: string;
  description: string;
  impact_score: number;
  image_url: string | null;
  created_at: string;
}

interface DatabaseSchema {
  simulations: SimulationsTable;
  timeline_events: TimelineEventsTable;
}

const sqliteDb = new Database(path.join(dataDir, 'database.sqlite'));

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({ database: sqliteDb }),
  log: ['query', 'error']
});
