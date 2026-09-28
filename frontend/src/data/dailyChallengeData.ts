import { Question } from '../types/quiz';

/**
 * ======================================================================
 * ETHIOFANTASY — DAILY CHALLENGE EXCLUSIVE QUESTION POOL
 * ======================================================================
 * 
 * Strict architectural rule:
 * - Questions here have questionType: 'DAILY_CHALLENGE' and difficulty: 'VERY_HARD'
 * - NEVER reused in Level Games (Level Games use 'LEVEL' question pool)
 * - Tests advanced world, African, and Ethiopian football history, tactical innovations,
 *   rare IFAB rules, obscure records, and tournament statistics.
 */

export const DAILY_CHALLENGE_QUESTIONS: Question[] = [
  // ----------------------------------------------------
  // SECTION 1: WORLD CUP & INTERNATIONAL COMPETITION RECORDS
  // ----------------------------------------------------
  {
    id: 'dc_wc_001',
    categoryTitle: 'WORLD CUP HISTORY',
    questionText: 'Who scored the very first goal in FIFA World Cup history during the 1930 tournament in Uruguay?',
    type: 'trivia',
    imageType: 'striker',
    options: ['Lucien Laurent', 'Guillermo Stábile', 'Héctor Castro', 'Bert Patenaude'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Lucien Laurent of France scored the first World Cup goal on July 13, 1930 against Mexico.',
  },
  {
    id: 'dc_wc_002',
    categoryTitle: 'WORLD CUP RECORDS',
    questionText: 'Which player holds the all-time record for the most goals scored in a single FIFA World Cup tournament?',
    type: 'trivia',
    imageType: 'trophy',
    options: ['Gerd Müller (10)', 'Just Fontaine (13)', 'Sándor Kocsis (11)', 'Ademir (9)'],
    correctAnswerIndex: 1,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Just Fontaine of France scored an unmatched 13 goals in 6 matches at the 1958 World Cup in Sweden.',
  },
  {
    id: 'dc_wc_003',
    categoryTitle: 'WORLD CUP TRIVIA',
    questionText: 'Who is the only manager to have coached five different national teams at five different FIFA World Cup finals?',
    type: 'trivia',
    imageType: 'whistle',
    options: ['Carlos Alberto Parreira', 'Bora Milutinović', 'Guus Hiddink', 'Henri Michel'],
    correctAnswerIndex: 1,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Bora Milutinović coached Mexico (1986), Costa Rica (1990), USA (1994), Nigeria (1998), and China (2002).',
  },
  {
    id: 'dc_wc_004',
    categoryTitle: 'WORLD CUP RECORDS',
    questionText: 'Who scored the fastest goal in FIFA World Cup history, timed at just 10.8 seconds into the match?',
    type: 'trivia',
    imageType: 'striker',
    options: ['Bryan Robson', 'Hakan Şükür', 'Clint Dempsey', 'Emilio Butragueño'],
    correctAnswerIndex: 1,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Hakan Şükür scored after 10.8 seconds for Turkey against South Korea in the 2002 3rd-place play-off.',
  },
  {
    id: 'dc_wc_005',
    categoryTitle: 'WORLD CUP HISTORY',
    questionText: 'Which Uruguayan forward scored in the 1930 World Cup Final despite having lost his right forearm in an accident?',
    type: 'trivia',
    imageType: 'striker',
    options: ['José Nasazzi', 'Pedro Cea', 'Héctor Castro', 'Héctor Scarone'],
    correctAnswerIndex: 2,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Héctor Castro, nicknamed "El Manco", scored the final goal in Uruguay\'s 4-2 victory over Argentina in 1930.',
  },
  {
    id: 'dc_wc_006',
    categoryTitle: 'WORLD CUP TRIVIA',
    questionText: 'Who remains the oldest goalscorer in World Cup finals history, scoring at 42 years and 39 days against Russia?',
    type: 'player',
    imageType: 'lion',
    options: ['Roger Milla', 'Essam El-Hadary', 'Dino Zoff', 'Pat Jennings'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Cameroon\'s Roger Milla scored against Russia at USA 1994 at the age of 42 years and 39 days.',
  },
  {
    id: 'dc_wc_007',
    categoryTitle: 'WORLD CUP HISTORY',
    questionText: 'Which nation played in three FIFA World Cup finals (1974, 1978, 2010) without ever winning the trophy?',
    type: 'club',
    imageType: 'trophy',
    options: ['Hungary', 'Netherlands', 'Sweden', 'Czechoslovakia'],
    correctAnswerIndex: 1,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'The Netherlands reached the World Cup final in 1974, 1978, and 2010, finishing as runners-up on all three occasions.',
  },
  {
    id: 'dc_wc_008',
    categoryTitle: 'WORLD CUP RECORDS',
    questionText: 'In which World Cup match were a record 16 yellow cards and 4 red cards issued, known as the "Battle of Nuremberg"?',
    type: 'rules',
    imageType: 'card',
    options: ['Italy vs Australia (2006)', 'Portugal vs Netherlands (2006)', 'Brazil vs Chile (1962)', 'Argentina vs England (1998)'],
    correctAnswerIndex: 1,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Valentin Ivanov issued 16 yellows and 4 red cards in Portugal vs Netherlands at Germany 2006.',
  },

  // ----------------------------------------------------
  // SECTION 2: ETHIOPIAN FOOTBALL LEGENDS & AFCON HISTORY
  // ----------------------------------------------------
  {
    id: 'dc_eth_001',
    categoryTitle: 'ETHIOPIAN FOOTBALL HISTORY',
    questionText: 'In 1962, Ethiopia won the Africa Cup of Nations. Who was the legendary captain who lifted the trophy in Addis Ababa?',
    type: 'player',
    imageType: 'lion',
    options: ['Luciano Vassalo', 'Mengistu Worku', 'Girma Tekle', 'Italo Vassalo'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Luciano Vassalo captained Ethiopia to victory in the 1962 Africa Cup of Nations and was named player of the tournament.',
  },
  {
    id: 'dc_eth_002',
    categoryTitle: 'ETHIOPIAN FOOTBALL LEGENDS',
    questionText: 'Mengistu Worku scored how many total goals for Ethiopia in Africa Cup of Nations tournaments, an Ethiopian record?',
    type: 'player',
    imageType: 'striker',
    options: ['6 goals', '8 goals', '10 goals', '14 goals'],
    correctAnswerIndex: 2,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Mengistu Worku scored 10 AFCON goals across multiple tournaments between 1959 and 1970.',
  },
  {
    id: 'dc_eth_003',
    categoryTitle: 'ETHIOPIAN FOOTBALL HISTORY',
    questionText: 'Which Ethiopian football visionary was a founding father of CAF in 1957 and served as CAF President from 1972 to 1987?',
    type: 'trivia',
    imageType: 'lion',
    options: ['Yidnekachew Tessema', 'Tesfaye Gebreyesus', 'Fikru Teferra', 'Seyoum Abate'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Yidnekachew Tessema co-founded the Confederation of African Football (CAF) in 1957 and led it with distinction.',
  },
  {
    id: 'dc_eth_004',
    categoryTitle: 'ETHIOPIAN PREMIER LEAGUE',
    questionText: 'Saint George SC (Kidus Giorgis) was founded in which historic year as a symbol of Ethiopian resistance?',
    type: 'club',
    imageType: 'lion',
    options: ['1928', '1935', '1944', '1952'],
    correctAnswerIndex: 1,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Saint George Sports Club was founded in 1935 by Ayele Atnash and George Ducas in Addis Ababa.',
  },
  {
    id: 'dc_eth_005',
    categoryTitle: 'ETHIOPIAN FOOTBALL',
    questionText: 'Which Ethiopian striker scored crucial goals against Benin and Sudan to lead Ethiopia to AFCON 2013 qualification after 31 years?',
    type: 'player',
    imageType: 'striker',
    options: ['Salhadin Said', 'Adane Girma', 'Getaneh Kebede', 'Shimelis Bekele'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Salhadin Said was the talismanic forward whose decisive goals qualified the Walia Ibex for AFCON 2013.',
  },
  {
    id: 'dc_eth_006',
    categoryTitle: 'AFCON TOURNAMENT HISTORY',
    questionText: 'Which nation hosted the inaugural Africa Cup of Nations tournament in 1957 with only 3 participating nations?',
    type: 'trivia',
    imageType: 'trophy',
    options: ['Sudan', 'Egypt', 'Ethiopia', 'South Africa'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'The 1957 Africa Cup of Nations was hosted in Khartoum, Sudan, with Egypt, Sudan, and Ethiopia taking part.',
  },
  {
    id: 'dc_eth_007',
    categoryTitle: 'ETHIOPIAN FOOTBALL CLUBS',
    questionText: 'Which club won the 1997 Ethiopian Premier League and famously plays the passionate "Sheger Derby" against Saint George?',
    type: 'club',
    imageType: 'lion',
    options: ['Ethiopian Coffee SC (Bunna)', 'Defence Force SC (Mekelakeya)', 'Hawassa City', 'Fasil Kenema'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Ethiopian Coffee SC (Ethiopian Bunna) contests the fiercely celebrated Sheger Derby with Saint George.',
  },
  {
    id: 'dc_eth_008',
    categoryTitle: 'AFCON RECORDS',
    questionText: 'Who holds the all-time scoring record in Africa Cup of Nations history with 18 career finals goals?',
    type: 'player',
    imageType: 'lion',
    options: ['Samuel Eto\'o', 'Laurent Pokou', 'Rashidi Yekini', 'Didier Drogba'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Samuel Eto\'o of Cameroon scored 18 goals across 6 AFCON tournaments (2000–2010).',
  },

  // ----------------------------------------------------
  // SECTION 3: UEFA CHAMPIONS LEAGUE & EUROPEAN CUP RECORDS
  // ----------------------------------------------------
  {
    id: 'dc_ucl_001',
    categoryTitle: 'CHAMPIONS LEAGUE RECORDS',
    questionText: 'Who is the only footballer to have won the UEFA Champions League with three different clubs?',
    type: 'player',
    imageType: 'trophy',
    options: ['Clarence Seedorf', 'Cristiano Ronaldo', 'Samuel Eto\'o', 'Zlatan Ibrahimović'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Clarence Seedorf won with Ajax (1995), Real Madrid (1998), and AC Milan (2003, 2007).',
  },
  {
    id: 'dc_ucl_002',
    categoryTitle: 'EUROPEAN CUP HISTORY',
    questionText: 'Which player holds the all-time record for winning six European Cup/Champions League titles as a player?',
    type: 'player',
    imageType: 'trophy',
    options: ['Francisco Gento', 'Paolo Maldini', 'Alfredo Di Stéfano', 'Cristiano Ronaldo'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Paco Gento won 6 European Cups with Real Madrid (1956, 1957, 1958, 1959, 1960, 1966).',
  },
  {
    id: 'dc_ucl_003',
    categoryTitle: 'CHAMPIONS LEAGUE TRIVIA',
    questionText: 'Which English football club has won more European Cups/Champions Leagues (2) than domestic league titles (1)?',
    type: 'club',
    imageType: 'trophy',
    options: ['Aston Villa', 'Nottingham Forest', 'Leeds United', 'Chelsea'],
    correctAnswerIndex: 1,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Nottingham Forest won the European Cup twice (1979, 1980) under Brian Clough, having won only one league title (1978).',
  },
  {
    id: 'dc_ucl_004',
    categoryTitle: 'CHAMPIONS LEAGUE RECORDS',
    questionText: 'Who scored the fastest goal in UEFA Champions League history, timed at 10.12 seconds against Real Madrid in 2007?',
    type: 'striker',
    imageType: 'striker',
    options: ['Roy Makaay', 'Alessandro Del Piero', 'Clarence Seedorf', 'Alexandre Pato'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Roy Makaay scored for Bayern Munich after 10.12 seconds on March 7, 2007 against Real Madrid.',
  },
  {
    id: 'dc_ucl_005',
    categoryTitle: 'EUROPEAN CUP FINALS',
    questionText: 'In the 1960 European Cup Final (Real Madrid 7-3 Eintracht Frankfurt), which two players scored all seven Madrid goals?',
    type: 'trivia',
    imageType: 'striker',
    options: ['Di Stéfano (3) & Puskás (4)', 'Puskás (5) & Gento (2)', 'Di Stéfano (4) & Kopa (3)', 'Puskás (3) & Rial (4)'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Ferenc Puskás scored 4 goals and Alfredo Di Stéfano scored 3 at Hampden Park in front of 127,621 fans.',
  },
  {
    id: 'dc_ucl_006',
    categoryTitle: 'CHAMPIONS LEAGUE RECORDS',
    questionText: 'Which goalkeeper holds the Champions League record for consecutive minutes without conceding a goal (995 minutes)?',
    type: 'player',
    imageType: 'whistle',
    options: ['Jens Lehmann', 'Edwin van der Sar', 'Keylor Navas', 'Gianluigi Buffon'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Jens Lehmann kept 10 consecutive clean sheets for Arsenal in the 2005-06 UCL campaign (995 minutes).',
  },

  // ----------------------------------------------------
  // SECTION 4: TACTICAL INNOVATIONS & MANAGERIAL LEGENDS
  // ----------------------------------------------------
  {
    id: 'dc_tac_001',
    categoryTitle: 'TACTICAL INNOVATIONS',
    questionText: 'Which pioneering Swiss coach in the 1930s invented the "verrou" (bolt) system, the tactical ancestor of Catenaccio?',
    type: 'trivia',
    imageType: 'pitch',
    options: ['Karl Rappan', 'Helenio Herrera', 'Nereo Rocco', 'Jimmy Hogan'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Karl Rappan developed the "verrou" using a sweeper (verrouilleur) behind three defenders.',
  },
  {
    id: 'dc_tac_002',
    categoryTitle: 'TACTICAL REVOLUTIONS',
    questionText: 'Who was the tactical mastermind who developed "Total Football" (Totaalvoetbal) at Ajax and the Netherlands in the early 1970s?',
    type: 'trivia',
    imageType: 'pitch',
    options: ['Rinus Michels', 'Johan Cruyff', 'Stefan Kovacs', 'Ernst Happel'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Rinus Michels conceived Total Football, later named FIFA Coach of the Century in 1999.',
  },
  {
    id: 'dc_tac_003',
    categoryTitle: 'MANAGERIAL RECORDS',
    questionText: 'Which Italian tactician transformed European football with AC Milan (1987-1991) using a strict zonal-marking 4-4-2 without a libero?',
    type: 'trivia',
    imageType: 'whistle',
    options: ['Arrigo Sacchi', 'Fabio Capello', 'Giovanni Trapattoni', 'Marcello Lippi'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Arrigo Sacchi revolutionized football with aggressive compact pressing, high offside line, and zonal marking.',
  },
  {
    id: 'dc_tac_004',
    categoryTitle: 'FOOTBALL INNOVATION',
    questionText: 'Arsenal manager Herbert Chapman introduced which famous formation in 1925 to counter the revised offside rule?',
    type: 'trivia',
    imageType: 'pitch',
    options: ['The WM Formation (3-2-2-3)', 'The Catenaccio (1-3-3-3)', 'The Metodo (2-3-2-3)', 'The 4-2-4'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Herbert Chapman introduced the WM formation (with a center-back stopper) and numbered player shirts.',
  },
  {
    id: 'dc_tac_005',
    categoryTitle: 'MANAGERIAL HISTORY',
    questionText: 'Jock Stein led Celtic to the 1967 European Cup with the "Lisbon Lions". What was uniquely remarkable about the squad?',
    type: 'club',
    imageType: 'trophy',
    options: [
      'All players were born within 30 miles of Celtic Park',
      'The entire squad was aged under 21',
      'They played the final without a recognized striker',
      'None of the players had ever earned an international cap'
    ],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'All 15 players in Celtic\'s 1967 European Cup-winning squad were born within 30 miles of Glasgow.',
  },

  // ----------------------------------------------------
  // SECTION 5: RARE IFAB LAWS & OFFICIAL RULES
  // ----------------------------------------------------
  {
    id: 'dc_rul_001',
    categoryTitle: 'IFAB LAWS OF THE GAME',
    questionText: 'If a player takes a direct free kick outside their own penalty box and kicks the ball directly into their OWN goal, what is the restart?',
    type: 'rules',
    imageType: 'whistle',
    options: ['Corner kick to opponents', 'Goal kick to defending team', 'Retake the free kick', 'A goal is awarded'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Under IFAB Law 13, a team cannot score an own goal directly from any free kick; restart is a corner kick.',
  },
  {
    id: 'dc_rul_002',
    categoryTitle: 'IFAB LAWS OF THE GAME',
    questionText: 'During a penalty shootout, the ball hits the crossbar, bounces upward, hits the goalkeeper\'s back, and enters the goal. Does it count?',
    type: 'rules',
    imageType: 'ball',
    options: ['Yes, valid goal', 'No, kick ends when hitting the bar', 'Retake the kick', 'Indirect free kick'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Under Law 14, the kick is complete when the ball stops moving, goes out of play, or referee stops play. Continuous rebound counts.',
  },
  {
    id: 'dc_rul_003',
    categoryTitle: 'IFAB LAWS OF THE GAME',
    questionText: 'A penalty taker kicks the ball directly against the goalpost, and it rebounds back to the taker, who taps it into the net. What is the decision?',
    type: 'rules',
    imageType: 'whistle',
    options: ['Indirect free kick to defending team', 'Goal awarded', 'Retake penalty', 'Goal kick'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Under Law 14, the kicker must not touch the ball again until another player touches it. Infringement is an indirect free kick.',
  },
  {
    id: 'dc_rul_004',
    categoryTitle: 'IFAB LAWS OF THE GAME',
    questionText: 'Under IFAB rules, what is the minimum number of players a team must have on the pitch for a match to start or continue?',
    type: 'rules',
    imageType: 'referee',
    options: ['7 players', '8 players', '9 players', '6 players'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Under Law 3, a match may not start or continue if either team has fewer than seven players.',
  },
  {
    id: 'dc_rul_005',
    categoryTitle: 'IFAB LAWS OF THE GAME',
    questionText: 'If a defending player deliberately heads a high ball back to their own goalkeeper, can the goalkeeper handle the ball?',
    type: 'rules',
    imageType: 'referee',
    options: [
      'Yes, legal back-pass with head',
      'No, back-pass rule applies to all body parts',
      'Only if outside 6-yard box',
      'Only with referee\'s explicit permission'
    ],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Under Law 12, back-pass restrictions apply only to deliberate kicks with feet or direct throw-ins. Heading is legal unless using trickery.',
  },

  // ----------------------------------------------------
  // SECTION 6: HISTORIC STATS, BALLON D\'OR & UNUSUAL FEATS
  // ----------------------------------------------------
  {
    id: 'dc_sta_001',
    categoryTitle: 'LEGENDARY RECORDS',
    questionText: 'Which Brazilian goalkeeper scored an astonishing 131 official career goals, mostly from direct free kicks and penalties?',
    type: 'player',
    imageType: 'whistle',
    options: ['Rogério Ceni', 'José Luis Chilavert', 'Jorge Campos', 'René Higuita'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'São Paulo legend Rogério Ceni scored 131 goals in 1,237 official club appearances.',
  },
  {
    id: 'dc_sta_002',
    categoryTitle: 'BALLON D\'OR HISTORY',
    questionText: 'Who remains the only goalkeeper in football history to win the prestigious Ballon d\'Or (in 1963)?',
    type: 'player',
    imageType: 'trophy',
    options: ['Lev Yashin', 'Dino Zoff', 'Gordon Banks', 'Gianluigi Buffon'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Soviet goalkeeper Lev Yashin, the "Black Spider", won the Ballon d\'Or in 1963.',
  },
  {
    id: 'dc_sta_003',
    categoryTitle: 'PREMIER LEAGUE TRIVIA',
    questionText: 'What was Mario Balotelli\'s solitary assist in his entire Manchester City Premier League career?',
    type: 'player',
    imageType: 'striker',
    options: [
      'Sergio Agüero vs QPR (93:20 title winner)',
      'Edin Džeko 6th goal vs Man United (6-1)',
      'David Silva vs Arsenal (1-0)',
      'Yaya Touré vs Newcastle (2-0)'
    ],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Balotelli provided only one assist in the Premier League for Man City: slipping the ball to Sergio Agüero in the 93:20 title-clincher in 2012.',
  },
  {
    id: 'dc_sta_004',
    categoryTitle: 'FOOTBALL HISTORY',
    questionText: 'Pelé was officially christened "Edson Arantes do Nascimento". Which American inventor was he named after?',
    type: 'player',
    imageType: 'lion',
    options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Benjamin Franklin'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'His father named him Edson in honor of Thomas Edison, as electricity had just arrived in their town.',
  },
  {
    id: 'dc_sta_005',
    categoryTitle: 'INTERNATIONAL FOOTBALL',
    questionText: 'Which country won the Olympic Football Gold medal in both 1924 and 1928 before hosting and winning the first World Cup in 1930?',
    type: 'club',
    imageType: 'trophy',
    options: ['Uruguay', 'Argentina', 'Italy', 'Brazil'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Uruguay won consecutive Olympic football golds in Paris (1924) and Amsterdam (1928), then the 1930 World Cup.',
  },
  {
    id: 'dc_sta_006',
    categoryTitle: 'WORLD RECORDS',
    questionText: 'In 2012, Lionel Messi set the Guinness World Record for the most official goals scored in a calendar year. How many goals?',
    type: 'player',
    imageType: 'striker',
    options: ['91 goals', '85 goals', '96 goals', '88 goals'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Messi scored 91 goals in 2012 (79 for Barcelona, 12 for Argentina), breaking Gerd Müller\'s 1972 record of 85.',
  },
  {
    id: 'dc_sta_007',
    categoryTitle: 'BALLON D\'OR HISTORY',
    questionText: 'Who was the first African footballer to win the Ballon d\'Or, FIFA World Player of the Year, and African Footballer of the Year in 1995?',
    type: 'player',
    imageType: 'lion',
    options: ['George Weah', 'Roger Milla', 'Abedi Pele', 'Nwankwo Kanu'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'George Weah of Liberia won the Ballon d\'Or and FIFA World Player of the Year in 1995 while starring for PSG and AC Milan.',
  },
  {
    id: 'dc_sta_008',
    categoryTitle: 'ETHIOPIAN FOOTBALL VENUES',
    questionText: 'In which year was the historic Addis Ababa Stadium (Yidnekachew Tessema Stadium) originally inaugurated?',
    type: 'stadium',
    imageType: 'stadium',
    options: ['1940', '1947', '1960', '1968'],
    correctAnswerIndex: 0,
    questionType: 'DAILY_CHALLENGE',
    difficulty: 'VERY_HARD',
    explanation: 'Addis Ababa Stadium was constructed in 1940 and served as host venue for three Africa Cup of Nations tournaments (1962, 1968, 1976).',
  }
];

/**
 * Deterministically select exactly 10 VERY HARD competition questions for the challenge date.
 * Ensures all players receive the identical 10 questions on any given calendar day.
 */
export function getDailyChallengeQuestionsForDate(dateStr: string): Question[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const totalAvailable = DAILY_CHALLENGE_QUESTIONS.length;

  const selected: Question[] = [];
  const chosenIndices = new Set<number>();

  for (let i = 0; i < 10; i++) {
    let index = (positiveHash + i * 13) % totalAvailable;
    let attempts = 0;
    while (chosenIndices.has(index) && attempts < totalAvailable) {
      index = (index + 1) % totalAvailable;
      attempts++;
    }
    chosenIndices.add(index);
    const sourceQ = DAILY_CHALLENGE_QUESTIONS[index];
    selected.push({
      ...sourceQ,
      id: `daily_${dateStr}_q${i + 1}`,
      categoryTitle: 'DAILY CHALLENGE',
      questionType: 'DAILY_CHALLENGE',
      difficulty: 'VERY_HARD',
    });
  }

  return selected;
}
