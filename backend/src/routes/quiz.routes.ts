import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';
import { normalizeMsisdn } from '../services/dailyChallengeEngine.js';

interface UserProgressDto {
  score: number;
  stars: number;
  hearts: number;
  unlockedLevelIds: number[];
  completedLevelIds: number[];
  levelStars: Record<number, number>;
  levelScores: Record<number, number>;
  levelPercentages: Record<number, number>;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

const DEFAULT_PROGRESS: UserProgressDto = {
  score: 0,
  stars: 0,
  hearts: 5,
  unlockedLevelIds: [1],
  completedLevelIds: [],
  levelStars: {},
  levelScores: {},
  levelPercentages: {},
  soundEnabled: true,
  musicEnabled: true,
};

async function getPlayerUserProgress(norm: string): Promise<UserProgressDto> {
  const progRes = await pool.query(
    `SELECT level_id, stars, score FROM player_progress WHERE player_msisdn = $1`,
    [norm]
  );

  const levelStars: Record<number, number> = {};
  const levelScores: Record<number, number> = {};
  const levelPercentages: Record<number, number> = {};
  const completedLevelIds: number[] = [];

  for (const row of progRes.rows) {
    const lvlId = Number(row.level_id);
    const stars = Number(row.stars) || 0;
    const score = Number(row.score) || 0;
    levelStars[lvlId] = stars;
    levelScores[lvlId] = score;
    levelPercentages[lvlId] = stars === 3 ? 100 : stars === 2 ? 90 : 80;
    if (stars >= 2) {
      completedLevelIds.push(lvlId);
    }
  }

  completedLevelIds.sort((a, b) => a - b);

  // Unlocked levels: Level 1 is always unlocked. Next level unlocked if previous passed (stars >= 2)
  const unlockedSet = new Set<number>([1]);
  for (const completedId of completedLevelIds) {
    if (completedId + 1 <= 100) {
      unlockedSet.add(completedId + 1);
    }
  }
  const unlockedLevelIds = Array.from(unlockedSet).sort((a, b) => a - b);

  const totalScore = Object.values(levelScores).reduce((a, b) => a + b, 0);
  const totalStars = Object.values(levelStars).reduce((a, b) => a + b, 0);

  return {
    score: totalScore,
    stars: totalStars,
    hearts: 5,
    unlockedLevelIds,
    completedLevelIds,
    levelStars,
    levelScores,
    levelPercentages,
    soundEnabled: true,
    musicEnabled: true,
  };
}

const CATEGORY_MAP: Record<string, string[]> = {
  'FOOTBALL BASICS': ['football-history', 'football-rules', 'legendary-players', 'world-cup'],
  'LAWS OF THE GAME': ['football-rules'],
  'FIELD & DIMENSIONS': ['stadiums', 'football-rules'],
  'SCORING & GOALS': ['legendary-players', 'champions-league', 'world-cup', 'premier-league'],
  'GUESS THE FOOTBALL PLAYER': ['legendary-players', 'la-liga', 'premier-league', 'serie-a', 'bundesliga'],
  'GUESS THE CLUB': ['premier-league', 'la-liga', 'serie-a', 'bundesliga', 'caf-champions'],
  'WORLD CUP HISTORY': ['world-cup'],
  'CHAMPIONS LEAGUE': ['champions-league'],
  'PREMIER LEAGUE': ['premier-league'],
  'LA LIGA LEGENDS': ['la-liga'],
  'SERIE A & CALCIO': ['serie-a'],
  'BUNDESLIGA STARS': ['bundesliga'],
  'AFRICAN FOOTBALL': ['afcon', 'caf-champions'],
  'ETHIOPIAN FOOTBALL': ['ethiopian-premier', 'walia-ibex'],
  'WORLD STADIUMS': ['stadiums'],
  'MANAGERS & TACTICS': ['champions-league', 'premier-league', 'world-cup'],
  'DEFENSE & KEEPERS': ['legendary-players', 'world-cup', 'serie-a'],
  'RECORDS & AWARDS': ['transfer-market', 'world-cup', 'champions-league'],
  'INTERNATIONAL FOOTBALL': ['world-cup', 'afcon'],
  'EXPERT FOOTBALL QUIZ': ['champions-league', 'world-cup', 'transfer-market', 'afcon'],
};

export async function quizRoutes(fastify: FastifyInstance) {
  /**
   * 1. Get 100 Championship Levels and progress for player from PostgreSQL
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
      pointsPerQuestion: 1,
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
   * 2. Get authoritative UserProgress directly from PostgreSQL
   */
  fastify.get('/progress', async (req, reply) => {
    const rawMsisdn = (req.query as any)?.msisdn;
    if (!rawMsisdn) {
      return reply.send({ success: true, progress: DEFAULT_PROGRESS });
    }

    const norm = normalizeMsisdn(rawMsisdn);
    const progress = await getPlayerUserProgress(norm);
    return reply.send({ success: true, progress });
  });

  /**
   * 3. Get 10 dynamically randomized questions for a Championship Level from PostgreSQL
   */
  fastify.get('/level/:levelId/questions', async (req, reply) => {
    const params = req.params as { levelId: string };
    const levelId = parseInt(params.levelId, 10);
    if (isNaN(levelId) || levelId < 1 || levelId > 100) {
      return reply.status(400).send({ success: false, error: 'Invalid level ID (1-100)' });
    }

    // Lookup level category
    const lvlRes = await pool.query(`SELECT category_title, title FROM quiz_levels WHERE id = $1`, [levelId]);
    const catTitle = lvlRes.rows[0]?.category_title || 'FOOTBALL BASICS';
    const mappedCategories = CATEGORY_MAP[catTitle] || ['football-history', 'world-cup'];

    // Query 10 random questions from quiz_questions in DB
    let qRes = await pool.query(
      `SELECT id, category, question_text, prompt_en, options, options_en,
              correct_index, explanation, type, image_identifier
       FROM quiz_questions
       WHERE is_active = TRUE AND pool = 'LEVEL_BASED' AND category = ANY($1)
       ORDER BY RANDOM()
       LIMIT 10`,
      [mappedCategories]
    );

    if (qRes.rows.length < 10) {
      qRes = await pool.query(
        `SELECT id, category, question_text, prompt_en, options, options_en,
                correct_index, explanation, type, image_identifier
         FROM quiz_questions
         WHERE is_active = TRUE AND pool = 'LEVEL_BASED'
         ORDER BY RANDOM()
         LIMIT 10`
      );
    }

    const questions = qRes.rows.map((row, idx) => {
      let rawOptions: string[] = [];
      if (Array.isArray(row.options)) rawOptions = [...row.options];
      else if (Array.isArray(row.options_en)) rawOptions = [...row.options_en];
      else if (typeof row.options === 'string') {
        try { rawOptions = JSON.parse(row.options); } catch { rawOptions = []; }
      }

      if (rawOptions.length < 4) {
        rawOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      const originalCorrectIndex = typeof row.correct_index === 'number' ? row.correct_index : 0;
      const correctOptionText = rawOptions[originalCorrectIndex] || rawOptions[0];

      // Shuffle options using Fisher-Yates
      const shuffledOptions = [...rawOptions];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);

      return {
        id: `lvl_${levelId}_q_${idx + 1}_${row.id}`,
        questionText: row.question_text || row.prompt_en || `Level ${levelId} Question ${idx + 1}`,
        categoryTitle: catTitle,
        type: row.type || 'trivia',
        imageType: row.image_identifier || 'ball',
        options: shuffledOptions,
        correctAnswerIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
        explanation: row.explanation || '',
      };
    });

    return reply.send({
      success: true,
      levelId,
      categoryTitle: catTitle,
      questions,
    });
  });

  /**
   * 4. Submit completion of a level to PostgreSQL and return updated progress
   */
  fastify.post('/submit-level', async (req, reply) => {
    const { msisdn, levelId, stars, score, percentage } = req.body as {
      msisdn: string;
      levelId: number;
      stars: number;
      score: number;
      percentage?: number;
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

    // Update player's aggregate stats in PostgreSQL
    await pool.query(
      `UPDATE players 
       SET total_stars = (SELECT COALESCE(SUM(stars), 0) FROM player_progress WHERE player_msisdn = $1),
           current_level = GREATEST(current_level, $2 + 1),
           best_score = GREATEST(best_score, $3),
           last_active_at = NOW()
       WHERE msisdn = $1`,
      [norm, levelId, score]
    );

    // Fetch refreshed progress directly from PostgreSQL
    const updatedProgress = await getPlayerUserProgress(norm);

    return reply.send({
      success: true,
      progress: updatedProgress,
    });
  });
}
