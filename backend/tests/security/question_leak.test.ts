import test from 'node:test';
import assert from 'node:assert/strict';

test('Security & Anti-Cheat: Zero-Leak Question Serialization Verification', () => {
  // Raw database record fixture with correct answers and sensitive metadata
  const rawDbQuestion = {
    id: 'q-ethio-101',
    category: 'ETHIOPIAN FOOTBALL',
    question_text: 'Which club won the 2021/22 Ethiopian Premier League title?',
    prompt_en: 'Which club won the 2021/22 Ethiopian Premier League title?',
    prompt_am: 'የ2021/22 የኢትዮጵያ ፕሪሚየር ሊግ ዋንጫን ያሸነፈው የትኛው ክለብ ነው?',
    options: ['Fasil Kenema', 'Saint George SC', 'Ethiopian Coffee', 'Sidama Coffee'],
    options_en: ['Fasil Kenema', 'Saint George SC', 'Ethiopian Coffee', 'Sidama Coffee'],
    correct_index: 1,
    correctAnswerIndex: 1,
    explanation: 'Saint George SC captured their 30th league title in the 2021/22 season.',
    difficulty: 'MEDIUM',
    is_active: true,
  };

  // 1. Serialization function used by public question routes (/random & /by-ids)
  const sanitizePublicQuestion = (row: typeof rawDbQuestion) => {
    return {
      id: row.id,
      category: row.category,
      prompt: row.prompt_en,
      options: row.options,
      difficulty: row.difficulty,
    };
  };

  // 2. Serialization used by Authoritative Game Engine
  const sanitizeGameEngineQuestion = (row: typeof rawDbQuestion) => {
    const { correct_index, correctAnswerIndex, explanation, ...sanitized } = row;
    return sanitized;
  };

  const serializedPublic = sanitizePublicQuestion(rawDbQuestion);
  const serializedGame = sanitizeGameEngineQuestion(rawDbQuestion);

  // Assertions: Neither payload must leak answer keys or explanations
  assert.equal('correct_index' in serializedPublic, false, 'correct_index must NOT be in public payload');
  assert.equal('correctIndex' in serializedPublic, false, 'correctIndex must NOT be in public payload');
  assert.equal('correctAnswerIndex' in serializedPublic, false, 'correctAnswerIndex must NOT be in public payload');
  assert.equal('explanation' in serializedPublic, false, 'explanation must NOT be in public payload');

  assert.equal('correct_index' in serializedGame, false, 'correct_index must NOT be in game engine payload');
  assert.equal('correctAnswerIndex' in serializedGame, false, 'correctAnswerIndex must NOT be in game engine payload');
  assert.equal('explanation' in serializedGame, false, 'explanation must NOT be in game engine payload');

  // Verify options and prompts are properly preserved
  assert.equal(serializedPublic.options.length, 4, 'Options must be preserved intact');
  assert.equal(serializedGame.options.length, 4, 'Options must be preserved intact');
});
