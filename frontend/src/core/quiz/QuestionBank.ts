import { ApiClient } from '../../networking/api/ApiClient';
import type { Locale } from '../../networking/supabase/types';
import type { QuestionData } from '../../ui/screens/ScoreboardQuestionScreen';

export interface ExtendedQuestionData extends QuestionData {
    id?: string;
    category?: string;
    difficulty?: number;
    answerHash?: string;
    promptEn?: string;
    promptAm?: string;
    promptOm?: string;
    optionsEn?: string[];
    optionsAm?: string[];
    optionsOm?: string[];
    explanation?: string;
    fact?: string;
    learningTip?: string;
}

const OFFLINE_FALLBACK_QUESTIONS: ExtendedQuestionData[] = [
    {
        id: 'fb-1', category: 'walia-ibex', difficulty: 2,
        prompt: "Which country won the first ever African Cup of Nations (AFCON) in 1957?",
        options: ["Egypt", "Ethiopia", "Sudan", "South Africa"],
        correctIndex: 0,
        explanation: "Egypt defeated Ethiopia 4-0 in the final of the inaugural Africa Cup of Nations.",
        fact: "Only three nations participated in the first AFCON: Egypt, Ethiopia, and Sudan. South Africa was disqualified due to apartheid.",
        learningTip: "Remember '1957' as the birth year of AFCON."
    },
    {
        id: 'fb-2', category: 'walia-ibex', difficulty: 1,
        prompt: "What is the nickname of the Ethiopian National Football Team?",
        options: ["The Lions", "Walia Ibex", "The Pharoahs", "Black Stars"],
        correctIndex: 1,
        explanation: "The Walia Ibex is an endangered species of ibex found only in the Simien Mountains of Ethiopia."
    },
    {
        id: 'fb-3', category: 'ethiopian-premier', difficulty: 3,
        prompt: "Which club holds the record for the most Ethiopian Premier League titles?",
        options: ["Ethiopian Coffee SC", "Dedebit FC", "Fasil Kenema", "Saint George SC"],
        correctIndex: 3
    },
    {
        id: 'fb-4', category: 'ethiopian-premier', difficulty: 3,
        prompt: "In which year was the Ethiopian Premier League established in its current format?",
        options: ["1985", "1997", "2002", "2010"],
        correctIndex: 1
    },
    {
        id: 'fb-5', category: 'walia-ibex', difficulty: 4,
        prompt: "Who is Ethiopia's all-time top goalscorer in international football?",
        options: ["Getaneh Kebede", "Saladin Said", "Mengistu Worku", "Adane Girma"],
        correctIndex: 0
    },
    {
        id: 'fb-6', category: 'world-cup', difficulty: 1,
        prompt: "Which nation has won the most FIFA Men's World Cup titles?",
        options: ["Germany", "Brazil", "Argentina", "Italy"],
        correctIndex: 1
    },
    {
        id: 'fb-7', category: 'world-cup', difficulty: 2,
        prompt: "Who won the Golden Boot in the 2022 FIFA World Cup?",
        options: ["Lionel Messi", "Kylian Mbappé", "Julián Álvarez", "Olivier Giroud"],
        correctIndex: 1
    },
    {
        id: 'fb-8', category: 'champions-league', difficulty: 2,
        prompt: "Which player has scored the most goals in UEFA Champions League history?",
        options: ["Lionel Messi", "Robert Lewandowski", "Cristiano Ronaldo", "Karim Benzema"],
        correctIndex: 2
    },
    {
        id: 'fb-9', category: 'premier-league', difficulty: 3,
        prompt: "Which team holds the record for most points in a single English Premier League season?",
        options: ["Manchester United", "Liverpool", "Chelsea", "Manchester City"],
        correctIndex: 3
    },
    {
        id: 'fb-10', category: 'walia-ibex', difficulty: 4,
        prompt: "Ethiopia won its only African Cup of Nations title in which year?",
        options: ["1957", "1962", "1970", "1982"],
        correctIndex: 1,
        fact: "Ydnekatchew Tessema was one of the most influential figures in Ethiopian football history.",
        learningTip: "Ethiopia hosted and won the 1962 tournament, defeating Egypt 4-2 in the final after extra time."
    }
];

export class QuestionBank {
    private static _instance: QuestionBank | null = null;
    private _askedQuestionIds: Set<string> = new Set();
    private _apiClient: ApiClient;

    private constructor() {
        this._apiClient = ApiClient.getInstance();
    }

    public static getInstance(): QuestionBank {
        if (!QuestionBank._instance) {
            QuestionBank._instance = new QuestionBank();
        }
        return QuestionBank._instance;
    }

    /**
     * Fetch questions from Fastify REST API (/api/questions/random).
     * Includes an offline local fallback so the game never breaks.
     */
    public async fetchQuestions(
        competitionId?: string,
        count: number = 10,
        locale: Locale = 'en',
        excludeIds: string[] = [],
        _usageType: 'casual' | 'tournament' = 'casual'
    ): Promise<ExtendedQuestionData[]> {
        try {
            const res = await this._apiClient.get('/questions/random', {
                category: competitionId && competitionId !== 'all' ? competitionId : undefined,
                count,
                locale,
                excludeIds: excludeIds.join(',')
            });

            if (res && res.success && res.questions && Array.isArray(res.questions) && res.questions.length > 0) {
                const mapped = res.questions.map((q: any) => this._mapQuestionData(q, true));
                return this._selectQuestions(mapped, count);
            }
        } catch (e) {
            console.warn('[QuestionBank] Fastify question query failed, serving offline bank:', e);
        }

        // Local Fallback Data
        let pool = OFFLINE_FALLBACK_QUESTIONS;
        if (competitionId && competitionId !== 'all') {
            const filtered = pool.filter(q => q.category === competitionId);
            if (filtered.length >= Math.min(count, 5)) {
                pool = filtered;
            }
        }
        if (excludeIds && excludeIds.length > 0) {
            pool = pool.filter(q => !excludeIds.includes(q.id as string));
        }
        return this._selectQuestions(pool, count);
    }

    /**
     * Fetch specific questions by exact IDs for deterministic modes like Daily Challenge.
     */
    public async fetchQuestionsByIds(
        ids: string[],
        locale: Locale = 'en'
    ): Promise<ExtendedQuestionData[]> {
        if (ids && ids.length > 0) {
            try {
                const res = await this._apiClient.post('/questions/by-ids', { ids, locale });
                if (res && res.success && res.questions && Array.isArray(res.questions) && res.questions.length > 0) {
                    return res.questions.map((q: any) => this._mapQuestionData(q, false));
                }
            } catch (err) {
                console.warn('[QuestionBank] fetchQuestionsByIds failed:', err);
            }
        }

        return this.fetchQuestions(undefined, ids.length, locale);
    }

    private _mapQuestionData(data: any, shuffleOptions: boolean = true): ExtendedQuestionData {
        let options = [...(data.options || [])];
        let correctIndex = typeof data.correctIndex === 'number' ? data.correctIndex : 0;

        if (shuffleOptions && options.length > 1) {
            const correctOption = options[correctIndex];
            const indices = options.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            options = indices.map(i => options[i]);
            correctIndex = options.indexOf(correctOption);
        }

        return {
            id: data.id,
            category: data.category,
            difficulty: data.difficulty,
            prompt: data.prompt,
            options,
            correctIndex,
            fact: data.fact,
            learningTip: data.learningTip,
            explanation: data.explanation
        };
    }

    private _selectQuestions(pool: ExtendedQuestionData[], count: number): ExtendedQuestionData[] {
        let unasked = pool.filter(q => q.id && !this._askedQuestionIds.has(q.id));
        
        if (unasked.length < count) {
            this._askedQuestionIds.clear();
            unasked = pool;
        }

        const chosenPool = unasked.length >= count ? unasked : pool;

        const shuffled = [...chosenPool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selected = shuffled.slice(0, count);
        selected.forEach(q => {
            if (q.id) this._askedQuestionIds.add(q.id);
        });

        while (selected.length < count && pool.length > 0) {
            selected.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        return selected;
    }
}
