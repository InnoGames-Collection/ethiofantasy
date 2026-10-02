import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const potentialPaths = [
    path.resolve(__dirname, '../../../../football-quiz/questions.json'),
    path.resolve(__dirname, '../../../football-quiz/questions.json'),
    path.resolve(process.cwd(), '../football-quiz/questions.json'),
    path.resolve(process.cwd(), 'football-quiz/questions.json'),
    path.resolve(process.cwd(), 'questions.json'),
  ];

  let jsonPath = '';
  for (const p of potentialPaths) {
    if (fs.existsSync(p)) {
      jsonPath = p;
      break;
    }
  }

  if (!jsonPath) {
    console.error('❌ Could not find questions.json in any expected locations.');
    process.exit(1);
  }

  console.log(`📖 Reading questions from ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const questions = JSON.parse(rawData);
  console.log(`Found ${questions.length} questions to import...`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    const batchSize = 100;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      for (const [idx, q] of batch.entries()) {
        const globalIdx = i + idx + 1;
        const qId = `q_${globalIdx}`;
        await client.query(
          `INSERT INTO quiz_questions (
            id, category, prompt_en, prompt_am, prompt_om,
            options_en, options_am, options_om,
            correct_index, difficulty, question_text, options, points, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            prompt_en = EXCLUDED.prompt_en,
            prompt_am = EXCLUDED.prompt_am,
            prompt_om = EXCLUDED.prompt_om,
            options_en = EXCLUDED.options_en,
            options_am = EXCLUDED.options_am,
            options_om = EXCLUDED.options_om,
            correct_index = EXCLUDED.correct_index,
            difficulty = EXCLUDED.difficulty,
            question_text = EXCLUDED.question_text,
            options = EXCLUDED.options,
            is_active = TRUE`,
          [
            qId,
            q.category || 'world-cup',
            q.prompt_en || '',
            q.prompt_am || '',
            q.prompt_om || '',
            JSON.stringify(q.options_en || []),
            JSON.stringify(q.options_am || []),
            JSON.stringify(q.options_om || []),
            typeof q.correct_index === 'number' ? q.correct_index : 0,
            q.difficulty || 1,
            q.prompt_en || '',
            JSON.stringify(q.options_en || []),
            10,
            true,
          ]
        );
        inserted++;
      }
      console.log(`[Import] Progress: ${inserted}/${questions.length} questions processed...`);
    }
    await client.query('COMMIT');
    console.log(`✅ Successfully imported ${inserted} questions into quiz_questions table.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Ingestion failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
