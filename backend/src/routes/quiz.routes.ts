import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';
import { normalizeMsisdn } from '../services/dailyChallengeEngine.js';

export async function quizRoutes(fastify: FastifyInstance) {
  /**
   * Get 100 Championship Levels and progress for player
   */
  fastify.get('/levels', async (req, reply) => {
    const msisdn = (req.query as any)?.msisdn ? normalizeMsisdn((req.query as any).msisdn) : null;

    const levelsRes = await pool.query(
      `SELECT * FROM quiz_levels ORDER BY id ASC`
    );

    let progressMap: Record<number, { stars: number; score: number }> = {};
    if (msisdn) {
      const progRes = await pool.query(
        `SELECT level_id, stars, score FROM player_progress WHERE player_msisdn = $1`,
        [msisdn]
      );
      for (const row of progRes.rows) {
        progressMap[row.level_id] = { stars: row.stars, score: row.score };
      }
    }

    const levels = levelsRes.rows.map((lvl) => ({
      id: String(lvl.id),
      levelNumber: lvl.id,
      chapterName: lvl.chapter_name,
      categoryTitle: lvl.category_title,
      title: lvl.title,
      subtitle: lvl.subtitle,
      description: lvl.subtitle || lvl.category_title,
      iconType: lvl.icon_type,
      accentColor: lvl.accent_color,
      requiredStars: lvl.required_stars,
      requiredScore: 80,
      pointsPerQuestion: 10,
      totalQuestions: 10,
      publishedQuestionsCount: 10,
      status: 'ACTIVE',
      stars: progressMap[lvl.id]?.stars || 0,
      score: progressMap[lvl.id]?.score || 0,
    }));

    if ((req.query as any)?.wrap === 'true') {
      return reply.send({ levels });
    }

    return reply.send(levels);
  });

  /**
   * Submit completion of a level
   */
  fastify.post('/submit-level', async (req, reply) => {
    const { msisdn, levelId, stars, score } = req.body as {
      msisdn: string;
      levelId: number;
      stars: number;
      score: number;
    };

    if (!msisdn || !levelId) {
      return reply.status(400).send({ error: 'Missing msisdn or levelId' });
    }

    const norm = normalizeMsisdn(msisdn);
    await pool.query(
      `INSERT INTO player_progress (player_msisdn, level_id, stars, score, completed_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (player_msisdn, level_id) 
       DO UPDATE SET stars = GREATEST(player_progress.stars, $3),
                     score = GREATEST(player_progress.score, $4),
                     completed_at = NOW()`,
      [norm, levelId, stars, score]
    );

    // Update player's aggregate stats
    await pool.query(
      `UPDATE players 
       SET total_stars = (SELECT COALESCE(SUM(stars), 0) FROM player_progress WHERE player_msisdn = $1),
           current_level = GREATEST(current_level, $2 + 1),
           last_active_at = NOW()
       WHERE msisdn = $1`,
      [norm, levelId]
    );

    return reply.send({ success: true });
  });
}
