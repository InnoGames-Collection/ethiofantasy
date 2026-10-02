export interface CategoryMeta {
    id: string;
    nameEn: string;
    nameAm: string;
    nameOm: string;
    badge: string;
    description: string;
}

export const QUESTION_CATEGORIES: Record<string, CategoryMeta> = {
    'world-cup': {
        id: 'world-cup',
        nameEn: 'FIFA World Cup',
        nameAm: 'የዓለም ዋንጫ',
        nameOm: 'Waancaa Addunyaa FIFA',
        badge: '🏆',
        description: 'World Cup history, records, hosts, and legend moments'
    },
    'champions-league': {
        id: 'champions-league',
        nameEn: 'UEFA Champions League',
        nameAm: 'UEFA ቻምፒየንስ ሊግ',
        nameOm: 'Liigii Chaampiyoonsii UEFA',
        badge: '⭐',
        description: 'European club football, iconic finals, and top scorers'
    },
    'caf-champions': {
        id: 'caf-champions',
        nameEn: 'CAF Champions League',
        nameAm: 'የCAF ሻምፒዮንስ ሊግ',
        nameOm: 'Liigii Chaampiyoonsii CAF',
        badge: '🌍',
        description: 'African club football and continental showdowns'
    },
    'afcon': {
        id: 'afcon',
        nameEn: 'Africa Cup of Nations (AFCON)',
        nameAm: 'የአፍሪካ ዋንጫ (AFCON)',
        nameOm: 'Waancaa Afriikaa (AFCON)',
        badge: '🦁',
        description: 'Africa\'s flagship national team championship'
    },
    'ethiopian-premier': {
        id: 'ethiopian-premier',
        nameEn: 'Ethiopian Premier League',
        nameAm: 'የኢትዮጵያ ፕሪሚየር ሊግ',
        nameOm: 'Liigii Piriimeraa Itoophiyaa',
        badge: '🇪🇹',
        description: 'Ethiopian club teams, derbies, and domestic history'
    },
    'walia-ibex': {
        id: 'walia-ibex',
        nameEn: 'Walia Ibex (National Team)',
        nameAm: 'ዋሊያ ኢቤክስ (ብሔራዊ ቡድን)',
        nameOm: 'Waaliyaa Ibeks (Garaa Guutuu)',
        badge: '🐐',
        description: 'Ethiopian national team milestones and heroes'
    },
    'premier-league': {
        id: 'premier-league',
        nameEn: 'English Premier League',
        nameAm: 'የእንግሊዝ ፕሪሚየር ሊግ',
        nameOm: 'Liigii Piriimeraa Ingilaand',
        badge: '🦁',
        description: 'EPL clubs, managers, top scorers, and records'
    },
    'la-liga': {
        id: 'la-liga',
        nameEn: 'Spanish La Liga',
        nameAm: 'የስፔን ላ ሊጋ',
        nameOm: 'Laa Liigaa Ispeen',
        badge: '🇪🇸',
        description: 'El Clásico, Spanish giants, and title races'
    },
    'serie-a': {
        id: 'serie-a',
        nameEn: 'Italian Serie A',
        nameAm: 'የጣሊያን ሰሪ ኤ',
        nameOm: 'Seeriyee A Xaaliyaanii',
        badge: '🇮🇹',
        description: 'Calcio history, tactical legends, and Italian clubs'
    },
    'bundesliga': {
        id: 'bundesliga',
        nameEn: 'German Bundesliga',
        nameAm: 'የጀርመን ቡንደስሊጋ',
        nameOm: 'Buundesliigaa Jarmaan',
        badge: '🇩🇪',
        description: 'German football powerhouses and records'
    },
    'legendary-players': {
        id: 'legendary-players',
        nameEn: 'Legendary Players',
        nameAm: 'አፈ ታሪክ ተጫዋቾች',
        nameOm: 'Taphattootaa Seenaa',
        badge: '👟',
        description: 'All-time greats, Ballon d\'Or winners, and icons'
    },
    'football-rules': {
        id: 'football-rules',
        nameEn: 'Football Rules & Laws',
        nameAm: 'የእግር ኳስ ሕግጋት',
        nameOm: 'Seera Kubbaa Miilaa',
        badge: '📏',
        description: 'Laws of the game, offside rule, VAR, and refereeing'
    },
    'transfer-market': {
        id: 'transfer-market',
        nameEn: 'Transfer Market & Fees',
        nameAm: 'የዝውውር ገበያ',
        nameOm: 'Gabaa Dabarsaa',
        badge: '💰',
        description: 'Record transfer fees, contracts, and market moves'
    },
    'stadiums': {
        id: 'stadiums',
        nameEn: 'Stadiums & Venues',
        nameAm: 'ስታዲየሞች',
        nameOm: 'Istaadiyeemota',
        badge: '🏟️',
        description: 'Iconic football grounds, capacities, and host cities'
    },
    'football-history': {
        id: 'football-history',
        nameEn: 'Football History',
        nameAm: 'የእግር ኳስ ታሪክ',
        nameOm: 'Seenaa Kubbaa Miilaa',
        badge: '📜',
        description: 'Origins, historic matches, and global football lore'
    }
};
