import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';

export async function questionsRoutes(fastify: FastifyInstance) {
  /**
   * Fetch random questions filtered by category and locale
   */
  fastify.get('/random', async (req, reply) => {
    const {
      category,
      count = '10',
      locale = 'en',
      excludeIds,
    } = req.query as {
      category?: string;
      count?: string;
      locale?: 'en' | 'am' | 'om';
      excludeIds?: string;
    };

    const limit = Math.min(Math.max(parseInt(count, 10) || 10, 1), 50);
    const excludeList = excludeIds ? excludeIds.split(',').filter(Boolean) : [];

    let queryText = `SELECT id, category, prompt_en, prompt_am, prompt_om,
                            options_en, options_am, options_om,
                            correct_index, difficulty, fact, learning_tip
                     FROM quiz_questions
                     WHERE is_active = TRUE`;
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (excludeList.length > 0) {
      params.push(excludeList);
      queryText += ` AND NOT (id = ANY($${params.length}))`;
    }

    queryText += ` ORDER BY RANDOM() LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(queryText, params);

    const questions = result.rows.map((row) => {
      let prompt = row.prompt_en;
      let options = row.options_en;

      if (locale === 'am' && row.prompt_am && row.options_am?.length) {
        prompt = row.prompt_am;
        options = row.options_am;
      } else if (locale === 'om' && row.prompt_om && row.options_om?.length) {
        prompt = row.prompt_om;
        options = row.options_om;
      }

      return {
        id: row.id,
        category: row.category,
        prompt: prompt || row.prompt_en,
        options: options || row.options_en || [],
        correctIndex: row.correct_index,
        difficulty: row.difficulty,
        fact: row.fact,
        learningTip: row.learning_tip,
        promptEn: row.prompt_en,
        promptAm: row.prompt_am,
        promptOm: row.prompt_om,
        optionsEn: row.options_en,
        optionsAm: row.options_am,
        optionsOm: row.options_om,
      };
    });

    return reply.send({ success: true, questions });
  });

  /**
   * Fetch specific questions by IDs
   */
  fastify.post('/by-ids', async (req, reply) => {
    const { ids, locale = 'en' } = req.body as {
      ids: string[];
      locale?: 'en' | 'am' | 'om';
    };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.send({ success: true, questions: [] });
    }

    const result = await pool.query(
      `SELECT id, category, prompt_en, prompt_am, prompt_om,
              options_en, options_am, options_om,
              correct_index, difficulty, fact, learning_tip
       FROM quiz_questions
       WHERE id = ANY($1)`,
      [ids]
    );

    const rowMap = new Map<string, any>();
    for (const row of result.rows) {
      rowMap.set(row.id, row);
    }

    // Preserve the requested ordering
    const questions = ids
      .map((id) => rowMap.get(id))
      .filter(Boolean)
      .map((row) => {
        let prompt = row.prompt_en;
        let options = row.options_en;

        if (locale === 'am' && row.prompt_am && row.options_am?.length) {
          prompt = row.prompt_am;
          options = row.options_am;
        } else if (locale === 'om' && row.prompt_om && row.options_om?.length) {
          prompt = row.prompt_om;
          options = row.options_om;
        }

        return {
          id: row.id,
          category: row.category,
          prompt: prompt || row.prompt_en,
          options: options || row.options_en || [],
          correctIndex: row.correct_index,
          difficulty: row.difficulty,
          fact: row.fact,
          learningTip: row.learning_tip,
          promptEn: row.prompt_en,
          promptAm: row.prompt_am,
          promptOm: row.prompt_om,
          optionsEn: row.options_en,
          optionsAm: row.options_am,
          optionsOm: row.options_om,
        };
      });

    return reply.send({ success: true, questions });
  });
}
