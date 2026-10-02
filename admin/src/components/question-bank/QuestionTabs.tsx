import React from 'react';
import { QuizQuestion } from '../../types';

export type QuestionTabId =
  | 'ALL'
  | 'LEVEL_CONTENT'
  | 'DAILY_CHALLENGE'
  | 'DRAFTS'
  | 'NEEDS_REVIEW'
  | 'PUBLISHED'
  | 'INACTIVE';

interface QuestionTabsProps {
  activeTab: QuestionTabId;
  onTabChange: (tab: QuestionTabId) => void;
  questions: QuizQuestion[];
}

export const QuestionTabs: React.FC<QuestionTabsProps> = ({
  activeTab,
  onTabChange,
  questions,
}) => {
  const getCount = (tabId: QuestionTabId) => {
    switch (tabId) {
      case 'ALL':
        return questions.length;
      case 'LEVEL_CONTENT':
        return questions.filter((q) => q.pool === 'LEVEL_BASED' || (!q.pool && q.levelNumber)).length;
      case 'DAILY_CHALLENGE':
        return questions.filter((q) => q.pool === 'DAILY_CHALLENGE').length;
      case 'DRAFTS':
        return questions.filter((q) => q.status === 'DRAFT').length;
      case 'NEEDS_REVIEW':
        return questions.filter((q) => q.status === 'NEEDS_REVIEW' || q.status === 'REVIEW').length;
      case 'PUBLISHED':
        return questions.filter((q) => q.status === 'PUBLISHED').length;
      case 'INACTIVE':
        return questions.filter((q) => q.status === 'INACTIVE').length;
      default:
        return 0;
    }
  };

  const tabs: { id: QuestionTabId; label: string }[] = [
    { id: 'ALL', label: 'ALL QUESTIONS' },
    { id: 'LEVEL_CONTENT', label: 'LEVEL CONTENT' },
    { id: 'DAILY_CHALLENGE', label: 'DAILY CHALLENGE' },
    { id: 'DRAFTS', label: 'DRAFTS' },
    { id: 'NEEDS_REVIEW', label: 'NEEDS REVIEW' },
    { id: 'PUBLISHED', label: 'PUBLISHED' },
    { id: 'INACTIVE', label: 'INACTIVE' },
  ];

  return (
    <div className="border-b border-slate-200">
      <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const count = getCount(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-blue-800 text-blue-100'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
