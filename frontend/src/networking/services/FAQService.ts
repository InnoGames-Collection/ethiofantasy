import type { FaqItemRow } from '../supabase/types';

const STATIC_FAQS: FaqItemRow[] = [
    {
        id: 'faq-1',
        category: 'Gameplay',
        question_en: 'How do I play the Football Quiz League?',
        question_am: 'የእግር ኳስ የፈተና ውድድርን እንዴት መጫወት እችላለሁ?',
        question_om: 'Liigii Gaaffii Kubbaa Miilaa akkamitti taphadha?',
        answer_en: 'Choose any championship category or enter the Daily Challenge. Answer 10 questions as quickly as possible to score maximum points!',
        answer_am: 'የሻምፒዮና ምድብ ይምረጡ ወይም የዕለቱን ተግዳሮት ይቀላቀሉ። ከፍተኛ ነጥብ ለማግኘት 10 ጥያቄዎችን በፍጥነት ይመልሱ!',
        answer_om: 'Kutaa chaampiyoonii kamiyyuu filadhaa yookaan Qormaata Guyyaa seenaa. Qabxii olaanaa argachuuf gaaffii 10 dafaa deebisaa!',
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'faq-2',
        category: 'Subscription',
        question_en: 'How much does the subscription cost?',
        question_am: 'የደንበኝነት ምዝገባው ምን ያህል ያስከፍላል?',
        question_om: 'Kaffaltiin tajaajilaa maamilaa meeqa?',
        answer_en: 'EthioFantasy Daily pass is only 2 Birr/day deducted directly from your Ethio Telecom airtime balance.',
        answer_am: 'የኢትዮ ፋንታሲ የቀን ፓስ በቀን 2 ብር ብቻ በቀጥታ ከኢትዮ ቴሌኮም የአየር ሰዓት ሂሳብዎ ይቀነሳል።',
        answer_om: 'Tajaajilli guyyaa EthioFantasy guyyaatti Birrii 2 qofa kallattiin herrega yeroo qilleensaa Itooyyo Telekoom keessaa hir\'ifama.',
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'faq-3',
        category: 'Prizes',
        question_en: 'How are weekly prizes distributed?',
        question_am: 'ሳምንታዊ ሽልማቶች እንዴት ይሰጣሉ?',
        question_om: 'Badhaasni torbanii akkamitti qoodama?',
        answer_en: 'The top 10 players on the weekly leaderboard share a 50,000 ETB prize pool, transferred directly via Telebirr or airtime.',
        answer_am: 'በሳምንቱ የደረጃ ሰንጠረዥ ውስጥ ከፍተኛ 10 ተጫዋቾች 50,000 ብር የሽልማት ፈንድ በቴሌብር ወይም በአየር ሰዓት በቀጥታ ይካፈላሉ።',
        answer_om: 'Taphataan 10n sadarkaa torbaniitiin olaanoo ta\'an badhaasa Birrii 50,000 kallattiin karaa Telebirr ykn qilleensaan argatu.',
        sort_order: 3,
        is_active: true,
        created_at: new Date().toISOString()
    }
];

export class FAQService {
    private static _instance: FAQService | null = null;

    private constructor() {}

    public static getInstance(): FAQService {
        if (!FAQService._instance) {
            FAQService._instance = new FAQService();
        }
        return FAQService._instance;
    }

    public async getCategories(): Promise<string[]> {
        return Array.from(new Set(STATIC_FAQS.map(f => f.category)));
    }

    public async getFAQsByCategory(category: string): Promise<FaqItemRow[]> {
        return STATIC_FAQS.filter(f => f.category === category);
    }
}
