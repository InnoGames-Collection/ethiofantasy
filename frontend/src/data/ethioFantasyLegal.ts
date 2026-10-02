export interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

export interface TermsSection {
  title: string;
  content: string;
}

export const OFFICIAL_FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Service',
    question: 'What is EthioFantasy?',
    answer:
      'EthioFantasy is the official mobile football quiz, trivia, and weekly prize competition digital service for registered Ethio Telecom mobile customers.',
  },
  {
    category: 'Subscription',
    question: 'How do I subscribe to EthioFantasy?',
    answer:
      'To subscribe, simply send an SMS containing "OK" to shortcode 900 from your Ethio Telecom line, or enter your mobile number on the login page.',
  },
  {
    category: 'Subscription',
    question: 'What is the subscription cost?',
    answer:
      'The subscription costs 2.00 ETB per day. Daily renewal is automatic for active prepaid and postpaid Ethio Telecom subscribers.',
  },
  {
    category: 'Subscription',
    question: 'How do I cancel or stop my subscription?',
    answer:
      'You can cancel at any time with no penalty by sending an SMS containing "STOP" to shortcode 900 from your Ethio Telecom mobile line.',
  },
  {
    category: 'Gameplay',
    question: 'How do I play the Football Quiz?',
    answer:
      'Enter the Football Quiz in the GAME tab. There are 100 progressive championship levels. Answer all 10 questions in a level within the timer to earn points, stars, and unlock subsequent levels.',
  },
  {
    category: 'Daily Challenge',
    question: 'What is the Daily Challenge and how often can I play?',
    answer:
      'The Daily Challenge consists of 10 special football questions updated every day. Each customer is permitted exactly 1 official play per calendar day to ensure a fair competition.',
  },
  {
    category: 'Competition',
    question: 'How does the 7-Day Competition Leaderboard work?',
    answer:
      'Your points earned from daily challenges accumulate across the 7-day competition cycle. The public leaderboard ranks the top 10 competitors strictly by total cumulative points.',
  },
  {
    category: 'Prizes',
    question: 'Who qualifies for competition prizes?',
    answer:
      'The highest-scoring eligible players on the 7-day leaderboard at the conclusion of each weekly promotional cycle qualify for prizes according to official Ethio Telecom promotion rules.',
  },
  {
    category: 'Privacy',
    question: 'Why is my mobile number masked on the leaderboard?',
    answer:
      'To strictly safeguard customer privacy and security, all mobile numbers are displayed in masked format (e.g. 251*******22) showing only 5 digits. Personal identities are never revealed publicly.',
  },
  {
    category: 'Support',
    question: 'Who can I contact for customer support?',
    answer:
      'For service assistance, billing inquiries, or general support, you can contact Ethio Telecom customer service by dialing 994, or through official Ethio Telecom digital service centers.',
  },
];

export const OFFICIAL_TERMS_SECTIONS: TermsSection[] = [
  {
    title: '1. Service Overview & Eligibility',
    content:
      'EthioFantasy is a digital sports entertainment and football trivia service provided in partnership with Ethio Telecom. The service is available exclusively to active prepaid and postpaid Ethio Telecom mobile customers located within Ethiopia. Participation requires an active SIM card and standard SMS capabilities.',
  },
  {
    title: '2. Subscription, Billing & Charges',
    content:
      'Subscription to EthioFantasy is billed at a daily tariff of 2.00 ETB (two Ethiopian Birr) per day, inclusive of all applicable statutory telecom taxes and service fees. Charges are automatically deducted from the subscriber\'s airtime balance upon daily renewal. Subscribers must maintain adequate balance for continuous service access.',
  },
  {
    title: '3. Unsubscription & Cancellation Policy',
    content:
      'Subscribers may cancel their subscription at any time without penalty or cancellation fees. To unsubscribe, send the keyword "STOP" via SMS to shortcode 900. Upon cancellation, access to daily challenges and prize eligibility will terminate at the end of the current paid billing period.',
  },
  {
    title: '4. Daily Challenge & Competition Rules',
    content:
      'The 7-Day Competition operates on a continuous 7-day cycle. Each registered subscriber is granted exactly one (1) attempt per calendar day in the Daily Challenge. Scores obtained from each daily attempt are verified and added to the subscriber\'s 7-day cumulative total.',
  },
  {
    title: '5. Leaderboard Ranking & Prize Allocation',
    content:
      'Leaderboard rankings are determined strictly by verified cumulative points accumulated within the active 7-day promotional cycle. In the event of a tie in points, the subscriber with the faster average response time across the cycle will be ranked higher. Prize distribution is subject to verification of subscriber identity and compliance with these Terms.',
  },
  {
    title: '6. Customer Data Privacy & Masking',
    content:
      'In strict compliance with telecommunications consumer privacy standards, public leaderboards and service displays will show only masked MSISDNs (e.g., 251*******22) displaying a maximum of 5 visible digits. Subscriber names, full phone numbers, and location details are never published.',
  },
  {
    title: '7. Fair Play & Prohibited Activities',
    content:
      'Any attempt to manipulate scores, utilize automated scripts, exploit system anomalies, or engage in fraudulent activities will result in immediate disqualification, forfeiture of accumulated points, and potential suspension of the MSISDN from the service.',
  },
  {
    title: '8. Amendments & Contact Information',
    content:
      'Ethio Telecom and EthioFantasy reserve the right to modify these terms, prize structures, or gameplay rules with appropriate notice. For customer service and inquiries, subscribers can reach Ethio Telecom support at 994.',
  },
];
