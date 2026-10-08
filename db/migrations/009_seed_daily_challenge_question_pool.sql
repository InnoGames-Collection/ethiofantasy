-- ==============================================================================
-- EthioFantasy — Migration 009: Seed Exclusive Daily Challenge Question Pool
-- High-difficulty football trivia questions for daily challenge competition
-- ==============================================================================

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_001',
  'In 1962, Ethiopia won the Africa Cup of Nations. Who was the legendary captain who lifted the trophy in Addis Ababa?',
  '["Luciano Vassalo","Mengistu Worku","Girma Tekle","Italo Vassalo"]'::jsonb,
  0,
  10,
  'Luciano Vassalo captained Ethiopia to victory in the 1962 Africa Cup of Nations and was named player of the tournament.',
  'In 1962, Ethiopia won the Africa Cup of Nations. Who was the legendary captain who lifted the trophy in Addis Ababa?',
  '["Luciano Vassalo","Mengistu Worku","Girma Tekle","Italo Vassalo"]'::jsonb,
  'ethiopian-football-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_002',
  'Mengistu Worku scored how many total goals for Ethiopia in Africa Cup of Nations tournaments, an Ethiopian record?',
  '["6 goals","8 goals","10 goals","14 goals"]'::jsonb,
  2,
  10,
  'Mengistu Worku scored 10 AFCON goals across multiple tournaments between 1959 and 1970.',
  'Mengistu Worku scored how many total goals for Ethiopia in Africa Cup of Nations tournaments, an Ethiopian record?',
  '["6 goals","8 goals","10 goals","14 goals"]'::jsonb,
  'ethiopian-football-legends',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_003',
  'Which Ethiopian football visionary was a founding father of CAF in 1957 and served as CAF President from 1972 to 1987?',
  '["Yidnekachew Tessema","Tesfaye Gebreyesus","Fikru Teferra","Seyoum Abate"]'::jsonb,
  0,
  10,
  'Yidnekachew Tessema co-founded the Confederation of African Football (CAF) in 1957 and led it with distinction.',
  'Which Ethiopian football visionary was a founding father of CAF in 1957 and served as CAF President from 1972 to 1987?',
  '["Yidnekachew Tessema","Tesfaye Gebreyesus","Fikru Teferra","Seyoum Abate"]'::jsonb,
  'ethiopian-football-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_004',
  'Saint George SC (Kidus Giorgis) was founded in which historic year as a symbol of Ethiopian resistance?',
  '["1928","1935","1944","1952"]'::jsonb,
  1,
  10,
  'Saint George Sports Club was founded in 1935 by Ayele Atnash and George Ducas in Addis Ababa.',
  'Saint George SC (Kidus Giorgis) was founded in which historic year as a symbol of Ethiopian resistance?',
  '["1928","1935","1944","1952"]'::jsonb,
  'ethiopian-premier-league',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'club'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_005',
  'Which Ethiopian striker scored crucial goals against Benin and Sudan to lead Ethiopia to AFCON 2013 qualification after 31 years?',
  '["Salhadin Said","Adane Girma","Getaneh Kebede","Shimelis Bekele"]'::jsonb,
  0,
  10,
  'Salhadin Said was the talismanic forward whose decisive goals qualified the Walia Ibex for AFCON 2013.',
  'Which Ethiopian striker scored crucial goals against Benin and Sudan to lead Ethiopia to AFCON 2013 qualification after 31 years?',
  '["Salhadin Said","Adane Girma","Getaneh Kebede","Shimelis Bekele"]'::jsonb,
  'ethiopian-football',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_006',
  'Which nation hosted the inaugural Africa Cup of Nations tournament in 1957 with only 3 participating nations?',
  '["Sudan","Egypt","Ethiopia","South Africa"]'::jsonb,
  0,
  10,
  'The 1957 Africa Cup of Nations was hosted in Khartoum, Sudan, with Egypt, Sudan, and Ethiopia taking part.',
  'Which nation hosted the inaugural Africa Cup of Nations tournament in 1957 with only 3 participating nations?',
  '["Sudan","Egypt","Ethiopia","South Africa"]'::jsonb,
  'afcon-tournament-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_007',
  'Which club won the 1997 Ethiopian Premier League and famously plays the passionate "Sheger Derby" against Saint George?',
  '["Ethiopian Coffee SC (Bunna)","Defence Force SC (Mekelakeya)","Hawassa City","Fasil Kenema"]'::jsonb,
  0,
  10,
  'Ethiopian Coffee SC (Ethiopian Bunna) contests the fiercely celebrated Sheger Derby with Saint George.',
  'Which club won the 1997 Ethiopian Premier League and famously plays the passionate "Sheger Derby" against Saint George?',
  '["Ethiopian Coffee SC (Bunna)","Defence Force SC (Mekelakeya)","Hawassa City","Fasil Kenema"]'::jsonb,
  'ethiopian-football-clubs',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'club'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_eth_008',
  'Who holds the all-time scoring record in Africa Cup of Nations history with 18 career finals goals?',
  '["Samuel Eto''o","Laurent Pokou","Rashidi Yekini","Didier Drogba"]'::jsonb,
  0,
  10,
  'Samuel Eto''o of Cameroon scored 18 goals across 6 AFCON tournaments (2000–2010).',
  'Who holds the all-time scoring record in Africa Cup of Nations history with 18 career finals goals?',
  '["Samuel Eto''o","Laurent Pokou","Rashidi Yekini","Didier Drogba"]'::jsonb,
  'afcon-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_rul_001',
  'If a player takes a direct free kick outside their own penalty box and kicks the ball directly into their OWN goal, what is the restart?',
  '["Corner kick to opponents","Goal kick to defending team","Retake the free kick","A goal is awarded"]'::jsonb,
  0,
  10,
  'Under IFAB Law 13, a team cannot score an own goal directly from any free kick; restart is a corner kick.',
  'If a player takes a direct free kick outside their own penalty box and kicks the ball directly into their OWN goal, what is the restart?',
  '["Corner kick to opponents","Goal kick to defending team","Retake the free kick","A goal is awarded"]'::jsonb,
  'ifab-laws-of-the-game',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'rules'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_rul_002',
  'During a penalty shootout, the ball hits the crossbar, bounces upward, hits the goalkeeper''s back, and enters the goal. Does it count?',
  '["Yes, valid goal","No, kick ends when hitting the bar","Retake the kick","Indirect free kick"]'::jsonb,
  0,
  10,
  'Under Law 14, the kick is complete when the ball stops moving, goes out of play, or referee stops play. Continuous rebound counts.',
  'During a penalty shootout, the ball hits the crossbar, bounces upward, hits the goalkeeper''s back, and enters the goal. Does it count?',
  '["Yes, valid goal","No, kick ends when hitting the bar","Retake the kick","Indirect free kick"]'::jsonb,
  'ifab-laws-of-the-game',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'rules'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_rul_003',
  'A penalty taker kicks the ball directly against the goalpost, and it rebounds back to the taker, who taps it into the net. What is the decision?',
  '["Indirect free kick to defending team","Goal awarded","Retake penalty","Goal kick"]'::jsonb,
  0,
  10,
  'Under Law 14, the kicker must not touch the ball again until another player touches it. Infringement is an indirect free kick.',
  'A penalty taker kicks the ball directly against the goalpost, and it rebounds back to the taker, who taps it into the net. What is the decision?',
  '["Indirect free kick to defending team","Goal awarded","Retake penalty","Goal kick"]'::jsonb,
  'ifab-laws-of-the-game',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'rules'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_rul_004',
  'Under IFAB rules, what is the minimum number of players a team must have on the pitch for a match to start or continue?',
  '["7 players","8 players","9 players","6 players"]'::jsonb,
  0,
  10,
  'Under Law 3, a match may not start or continue if either team has fewer than seven players.',
  'Under IFAB rules, what is the minimum number of players a team must have on the pitch for a match to start or continue?',
  '["7 players","8 players","9 players","6 players"]'::jsonb,
  'ifab-laws-of-the-game',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'rules'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_rul_005',
  'If a defending player deliberately heads a high ball back to their own goalkeeper, can the goalkeeper handle the ball?',
  '["Yes, legal back-pass with head","No, back-pass rule applies to all body parts","Only if outside 6-yard box","Only with referee''s explicit permission"]'::jsonb,
  0,
  10,
  'Under Law 12, back-pass restrictions apply only to deliberate kicks with feet or direct throw-ins. Heading is legal unless using trickery.',
  'If a defending player deliberately heads a high ball back to their own goalkeeper, can the goalkeeper handle the ball?',
  '["Yes, legal back-pass with head","No, back-pass rule applies to all body parts","Only if outside 6-yard box","Only with referee''s explicit permission"]'::jsonb,
  'ifab-laws-of-the-game',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'rules'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_001',
  'Which Brazilian goalkeeper scored an astonishing 131 official career goals, mostly from direct free kicks and penalties?',
  '["Rogério Ceni","José Luis Chilavert","Jorge Campos","René Higuita"]'::jsonb,
  0,
  10,
  'São Paulo legend Rogério Ceni scored 131 goals in 1,237 official club appearances.',
  'Which Brazilian goalkeeper scored an astonishing 131 official career goals, mostly from direct free kicks and penalties?',
  '["Rogério Ceni","José Luis Chilavert","Jorge Campos","René Higuita"]'::jsonb,
  'legendary-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_002',
  'Who remains the only goalkeeper in football history to win the prestigious Ballon d''Or (in 1963)?',
  '["Lev Yashin","Dino Zoff","Gordon Banks","Gianluigi Buffon"]'::jsonb,
  0,
  10,
  'Soviet goalkeeper Lev Yashin, the "Black Spider", won the Ballon d''Or in 1963.',
  'Who remains the only goalkeeper in football history to win the prestigious Ballon d''Or (in 1963)?',
  '["Lev Yashin","Dino Zoff","Gordon Banks","Gianluigi Buffon"]'::jsonb,
  'ballon-d''or-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_003',
  'What was Mario Balotelli''s solitary assist in his entire Manchester City Premier League career?',
  '["Sergio Agüero vs QPR (93:20 title winner)","Edin Džeko 6th goal vs Man United (6-1)","David Silva vs Arsenal (1-0)","Yaya Touré vs Newcastle (2-0)"]'::jsonb,
  0,
  10,
  'Balotelli provided only one assist in the Premier League for Man City: slipping the ball to Sergio Agüero in the 93:20 title-clincher in 2012.',
  'What was Mario Balotelli''s solitary assist in his entire Manchester City Premier League career?',
  '["Sergio Agüero vs QPR (93:20 title winner)","Edin Džeko 6th goal vs Man United (6-1)","David Silva vs Arsenal (1-0)","Yaya Touré vs Newcastle (2-0)"]'::jsonb,
  'premier-league-trivia',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_004',
  'Pelé was officially christened "Edson Arantes do Nascimento". Which American inventor was he named after?',
  '["Thomas Edison","Alexander Graham Bell","Nikola Tesla","Benjamin Franklin"]'::jsonb,
  0,
  10,
  'His father named him Edson in honor of Thomas Edison, as electricity had just arrived in their town.',
  'Pelé was officially christened "Edson Arantes do Nascimento". Which American inventor was he named after?',
  '["Thomas Edison","Alexander Graham Bell","Nikola Tesla","Benjamin Franklin"]'::jsonb,
  'football-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_005',
  'Which country won the Olympic Football Gold medal in both 1924 and 1928 before hosting and winning the first World Cup in 1930?',
  '["Uruguay","Argentina","Italy","Brazil"]'::jsonb,
  0,
  10,
  'Uruguay won consecutive Olympic football golds in Paris (1924) and Amsterdam (1928), then the 1930 World Cup.',
  'Which country won the Olympic Football Gold medal in both 1924 and 1928 before hosting and winning the first World Cup in 1930?',
  '["Uruguay","Argentina","Italy","Brazil"]'::jsonb,
  'international-football',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'club'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_006',
  'In 2012, Lionel Messi set the Guinness World Record for the most official goals scored in a calendar year. How many goals?',
  '["91 goals","85 goals","96 goals","88 goals"]'::jsonb,
  0,
  10,
  'Messi scored 91 goals in 2012 (79 for Barcelona, 12 for Argentina), breaking Gerd Müller''s 1972 record of 85.',
  'In 2012, Lionel Messi set the Guinness World Record for the most official goals scored in a calendar year. How many goals?',
  '["91 goals","85 goals","96 goals","88 goals"]'::jsonb,
  'world-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_007',
  'Who was the first African footballer to win the Ballon d''Or, FIFA World Player of the Year, and African Footballer of the Year in 1995?',
  '["George Weah","Roger Milla","Abedi Pele","Nwankwo Kanu"]'::jsonb,
  0,
  10,
  'George Weah of Liberia won the Ballon d''Or and FIFA World Player of the Year in 1995 while starring for PSG and AC Milan.',
  'Who was the first African footballer to win the Ballon d''Or, FIFA World Player of the Year, and African Footballer of the Year in 1995?',
  '["George Weah","Roger Milla","Abedi Pele","Nwankwo Kanu"]'::jsonb,
  'ballon-d''or-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_sta_008',
  'In which year was the historic Addis Ababa Stadium (Yidnekachew Tessema Stadium) originally inaugurated?',
  '["1940","1947","1960","1968"]'::jsonb,
  0,
  10,
  'Addis Ababa Stadium was constructed in 1940 and served as host venue for three Africa Cup of Nations tournaments (1962, 1968, 1976).',
  'In which year was the historic Addis Ababa Stadium (Yidnekachew Tessema Stadium) originally inaugurated?',
  '["1940","1947","1960","1968"]'::jsonb,
  'ethiopian-football-venues',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'stadium'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_tac_001',
  'Which pioneering Swiss coach in the 1930s invented the "verrou" (bolt) system, the tactical ancestor of Catenaccio?',
  '["Karl Rappan","Helenio Herrera","Nereo Rocco","Jimmy Hogan"]'::jsonb,
  0,
  10,
  'Karl Rappan developed the "verrou" using a sweeper (verrouilleur) behind three defenders.',
  'Which pioneering Swiss coach in the 1930s invented the "verrou" (bolt) system, the tactical ancestor of Catenaccio?',
  '["Karl Rappan","Helenio Herrera","Nereo Rocco","Jimmy Hogan"]'::jsonb,
  'tactical-innovations',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_tac_002',
  'Who was the tactical mastermind who developed "Total Football" (Totaalvoetbal) at Ajax and the Netherlands in the early 1970s?',
  '["Rinus Michels","Johan Cruyff","Stefan Kovacs","Ernst Happel"]'::jsonb,
  0,
  10,
  'Rinus Michels conceived Total Football, later named FIFA Coach of the Century in 1999.',
  'Who was the tactical mastermind who developed "Total Football" (Totaalvoetbal) at Ajax and the Netherlands in the early 1970s?',
  '["Rinus Michels","Johan Cruyff","Stefan Kovacs","Ernst Happel"]'::jsonb,
  'tactical-revolutions',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_tac_003',
  'Which Italian tactician transformed European football with AC Milan (1987-1991) using a strict zonal-marking 4-4-2 without a libero?',
  '["Arrigo Sacchi","Fabio Capello","Giovanni Trapattoni","Marcello Lippi"]'::jsonb,
  0,
  10,
  'Arrigo Sacchi revolutionized football with aggressive compact pressing, high offside line, and zonal marking.',
  'Which Italian tactician transformed European football with AC Milan (1987-1991) using a strict zonal-marking 4-4-2 without a libero?',
  '["Arrigo Sacchi","Fabio Capello","Giovanni Trapattoni","Marcello Lippi"]'::jsonb,
  'managerial-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_tac_004',
  'Arsenal manager Herbert Chapman introduced which famous formation in 1925 to counter the revised offside rule?',
  '["The WM Formation (3-2-2-3)","The Catenaccio (1-3-3-3)","The Metodo (2-3-2-3)","The 4-2-4"]'::jsonb,
  0,
  10,
  'Herbert Chapman introduced the WM formation (with a center-back stopper) and numbered player shirts.',
  'Arsenal manager Herbert Chapman introduced which famous formation in 1925 to counter the revised offside rule?',
  '["The WM Formation (3-2-2-3)","The Catenaccio (1-3-3-3)","The Metodo (2-3-2-3)","The 4-2-4"]'::jsonb,
  'football-innovation',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_tac_005',
  'Jock Stein led Celtic to the 1967 European Cup with the "Lisbon Lions". What was uniquely remarkable about the squad?',
  '["All players were born within 30 miles of Celtic Park","The entire squad was aged under 21","They played the final without a recognized striker","None of the players had ever earned an international cap"]'::jsonb,
  0,
  10,
  'All 15 players in Celtic''s 1967 European Cup-winning squad were born within 30 miles of Glasgow.',
  'Jock Stein led Celtic to the 1967 European Cup with the "Lisbon Lions". What was uniquely remarkable about the squad?',
  '["All players were born within 30 miles of Celtic Park","The entire squad was aged under 21","They played the final without a recognized striker","None of the players had ever earned an international cap"]'::jsonb,
  'managerial-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'club'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_ucl_001',
  'Who is the only footballer to have won the UEFA Champions League with three different clubs?',
  '["Clarence Seedorf","Cristiano Ronaldo","Samuel Eto''o","Zlatan Ibrahimović"]'::jsonb,
  0,
  10,
  'Clarence Seedorf won with Ajax (1995), Real Madrid (1998), and AC Milan (2003, 2007).',
  'Who is the only footballer to have won the UEFA Champions League with three different clubs?',
  '["Clarence Seedorf","Cristiano Ronaldo","Samuel Eto''o","Zlatan Ibrahimović"]'::jsonb,
  'champions-league-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_ucl_002',
  'Which player holds the all-time record for winning six European Cup/Champions League titles as a player?',
  '["Francisco Gento","Paolo Maldini","Alfredo Di Stéfano","Cristiano Ronaldo"]'::jsonb,
  0,
  10,
  'Paco Gento won 6 European Cups with Real Madrid (1956, 1957, 1958, 1959, 1960, 1966).',
  'Which player holds the all-time record for winning six European Cup/Champions League titles as a player?',
  '["Francisco Gento","Paolo Maldini","Alfredo Di Stéfano","Cristiano Ronaldo"]'::jsonb,
  'european-cup-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_ucl_003',
  'Which English football club has won more European Cups/Champions Leagues (2) than domestic league titles (1)?',
  '["Aston Villa","Nottingham Forest","Leeds United","Chelsea"]'::jsonb,
  1,
  10,
  'Nottingham Forest won the European Cup twice (1979, 1980) under Brian Clough, having won only one league title (1978).',
  'Which English football club has won more European Cups/Champions Leagues (2) than domestic league titles (1)?',
  '["Aston Villa","Nottingham Forest","Leeds United","Chelsea"]'::jsonb,
  'champions-league-trivia',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'club'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_ucl_004',
  'Who scored the fastest goal in UEFA Champions League history, timed at 10.12 seconds against Real Madrid in 2007?',
  '["Roy Makaay","Alessandro Del Piero","Clarence Seedorf","Alexandre Pato"]'::jsonb,
  0,
  10,
  'Roy Makaay scored for Bayern Munich after 10.12 seconds on March 7, 2007 against Real Madrid.',
  'Who scored the fastest goal in UEFA Champions League history, timed at 10.12 seconds against Real Madrid in 2007?',
  '["Roy Makaay","Alessandro Del Piero","Clarence Seedorf","Alexandre Pato"]'::jsonb,
  'champions-league-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'striker'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_ucl_005',
  'In the 1960 European Cup Final (Real Madrid 7-3 Eintracht Frankfurt), which two players scored all seven Madrid goals?',
  '["Di Stéfano (3) & Puskás (4)","Puskás (5) & Gento (2)","Di Stéfano (4) & Kopa (3)","Puskás (3) & Rial (4)"]'::jsonb,
  0,
  10,
  'Ferenc Puskás scored 4 goals and Alfredo Di Stéfano scored 3 at Hampden Park in front of 127,621 fans.',
  'In the 1960 European Cup Final (Real Madrid 7-3 Eintracht Frankfurt), which two players scored all seven Madrid goals?',
  '["Di Stéfano (3) & Puskás (4)","Puskás (5) & Gento (2)","Di Stéfano (4) & Kopa (3)","Puskás (3) & Rial (4)"]'::jsonb,
  'european-cup-finals',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_ucl_006',
  'Which goalkeeper holds the Champions League record for consecutive minutes without conceding a goal (995 minutes)?',
  '["Jens Lehmann","Edwin van der Sar","Keylor Navas","Gianluigi Buffon"]'::jsonb,
  0,
  10,
  'Jens Lehmann kept 10 consecutive clean sheets for Arsenal in the 2005-06 UCL campaign (995 minutes).',
  'Which goalkeeper holds the Champions League record for consecutive minutes without conceding a goal (995 minutes)?',
  '["Jens Lehmann","Edwin van der Sar","Keylor Navas","Gianluigi Buffon"]'::jsonb,
  'champions-league-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_001',
  'Who scored the very first goal in FIFA World Cup history during the 1930 tournament in Uruguay?',
  '["Lucien Laurent","Guillermo Stábile","Héctor Castro","Bert Patenaude"]'::jsonb,
  0,
  10,
  'Lucien Laurent of France scored the first World Cup goal on July 13, 1930 against Mexico.',
  'Who scored the very first goal in FIFA World Cup history during the 1930 tournament in Uruguay?',
  '["Lucien Laurent","Guillermo Stábile","Héctor Castro","Bert Patenaude"]'::jsonb,
  'world-cup-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_002',
  'Which player holds the all-time record for the most goals scored in a single FIFA World Cup tournament?',
  '["Gerd Müller (10)","Just Fontaine (13)","Sándor Kocsis (11)","Ademir (9)"]'::jsonb,
  1,
  10,
  'Just Fontaine of France scored an unmatched 13 goals in 6 matches at the 1958 World Cup in Sweden.',
  'Which player holds the all-time record for the most goals scored in a single FIFA World Cup tournament?',
  '["Gerd Müller (10)","Just Fontaine (13)","Sándor Kocsis (11)","Ademir (9)"]'::jsonb,
  'world-cup-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_003',
  'Who is the only manager to have coached five different national teams at five different FIFA World Cup finals?',
  '["Carlos Alberto Parreira","Bora Milutinović","Guus Hiddink","Henri Michel"]'::jsonb,
  1,
  10,
  'Bora Milutinović coached Mexico (1986), Costa Rica (1990), USA (1994), Nigeria (1998), and China (2002).',
  'Who is the only manager to have coached five different national teams at five different FIFA World Cup finals?',
  '["Carlos Alberto Parreira","Bora Milutinović","Guus Hiddink","Henri Michel"]'::jsonb,
  'world-cup-trivia',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_004',
  'Who scored the fastest goal in FIFA World Cup history, timed at just 10.8 seconds into the match?',
  '["Bryan Robson","Hakan Şükür","Clint Dempsey","Emilio Butragueño"]'::jsonb,
  1,
  10,
  'Hakan Şükür scored after 10.8 seconds for Turkey against South Korea in the 2002 3rd-place play-off.',
  'Who scored the fastest goal in FIFA World Cup history, timed at just 10.8 seconds into the match?',
  '["Bryan Robson","Hakan Şükür","Clint Dempsey","Emilio Butragueño"]'::jsonb,
  'world-cup-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_005',
  'Which Uruguayan forward scored in the 1930 World Cup Final despite having lost his right forearm in an accident?',
  '["José Nasazzi","Pedro Cea","Héctor Castro","Héctor Scarone"]'::jsonb,
  2,
  10,
  'Héctor Castro, nicknamed "El Manco", scored the final goal in Uruguay''s 4-2 victory over Argentina in 1930.',
  'Which Uruguayan forward scored in the 1930 World Cup Final despite having lost his right forearm in an accident?',
  '["José Nasazzi","Pedro Cea","Héctor Castro","Héctor Scarone"]'::jsonb,
  'world-cup-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'trivia'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_006',
  'Who remains the oldest goalscorer in World Cup finals history, scoring at 42 years and 39 days against Russia?',
  '["Roger Milla","Essam El-Hadary","Dino Zoff","Pat Jennings"]'::jsonb,
  0,
  10,
  'Cameroon''s Roger Milla scored against Russia at USA 1994 at the age of 42 years and 39 days.',
  'Who remains the oldest goalscorer in World Cup finals history, scoring at 42 years and 39 days against Russia?',
  '["Roger Milla","Essam El-Hadary","Dino Zoff","Pat Jennings"]'::jsonb,
  'world-cup-trivia',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'player'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_007',
  'Which nation played in three FIFA World Cup finals (1974, 1978, 2010) without ever winning the trophy?',
  '["Hungary","Netherlands","Sweden","Czechoslovakia"]'::jsonb,
  1,
  10,
  'The Netherlands reached the World Cup final in 1974, 1978, and 2010, finishing as runners-up on all three occasions.',
  'Which nation played in three FIFA World Cup finals (1974, 1978, 2010) without ever winning the trophy?',
  '["Hungary","Netherlands","Sweden","Czechoslovakia"]'::jsonb,
  'world-cup-history',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'club'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

INSERT INTO quiz_questions (id, question_text, options, correct_index, points, explanation, prompt_en, options_en, category, difficulty, is_active, pool, status, type)
VALUES (
  'dc_wc_008',
  'In which World Cup match were a record 16 yellow cards and 4 red cards issued, known as the "Battle of Nuremberg"?',
  '["Italy vs Australia (2006)","Portugal vs Netherlands (2006)","Brazil vs Chile (1962)","Argentina vs England (1998)"]'::jsonb,
  1,
  10,
  'Valentin Ivanov issued 16 yellows and 4 red cards in Portugal vs Netherlands at Germany 2006.',
  'In which World Cup match were a record 16 yellow cards and 4 red cards issued, known as the "Battle of Nuremberg"?',
  '["Italy vs Australia (2006)","Portugal vs Netherlands (2006)","Brazil vs Chile (1962)","Argentina vs England (1998)"]'::jsonb,
  'world-cup-records',
  5,
  TRUE,
  'DAILY_CHALLENGE',
  'PUBLISHED',
  'rules'
)
ON CONFLICT (id) DO UPDATE SET
  pool = EXCLUDED.pool,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation;

