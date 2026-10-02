import React from 'react';
import { Database, CheckCircle2, Clock, AlertCircle, ImageOff } from 'lucide-react';
import { QuizQuestion } from '../../types';

interface QuestionSummaryCardsProps {
  questions: QuizQuestion[];
  activeFilter: string;
  onFilterClick: (filter: string) => void;
}

export const QuestionSummaryCards: React.FC<QuestionSummaryCardsProps> = ({
  questions,
  activeFilter,
  onFilterClick,
}) => {
  const total = questions.length;
  const published = questions.filter((q) => q.status === 'PUBLISHED').length;
  const draft = questions.filter((q) => q.status === 'DRAFT').length;
  const needsReview = questions.filter(
    (q) => q.status === 'NEEDS_REVIEW' || q.status === 'REVIEW'
  ).length;
  const withoutImage = questions.filter((q) => !q.imageUrl || q.imageUrl.trim() === '').length;

  const pct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

  const cards = [
    {
      id: 'ALL',
      label: 'TOTAL QUESTIONS',
      count: total,
      subtext: `Demo Staging: ${total} | 50K Target`,
      icon: Database,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50/70',
      borderColor: 'border-blue-200',
      badge: 'Catalog Active',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'PUBLISHED',
      label: 'PUBLISHED',
      count: published,
      subtext: `${pct(published)}% of total pool live in game`,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200',
      badge: 'Live in Quiz',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'DRAFT',
      label: 'DRAFT',
      count: draft,
      subtext: `${pct(draft)}% pending editor completion`,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/70',
      borderColor: 'border-amber-200',
      badge: 'Work in Progress',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'NEEDS_REVIEW',
      label: 'NEEDS REVIEW',
      count: needsReview,
      subtext: `${pct(needsReview)}% awaiting editorial sign-off`,
      icon: AlertCircle,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50/70',
      borderColor: 'border-purple-200',
      badge: 'Action Required',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'WITHOUT_IMAGE',
      label: 'WITHOUT IMAGE',
      count: withoutImage,
      subtext: `${withoutImage} questions require artwork`,
      icon: ImageOff,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50/70',
      borderColor: 'border-rose-200',
      badge: withoutImage > 0 ? 'Needs Attention' : 'Complete',
      badgeColor: withoutImage > 0 ? 'bg-rose-100 text-rose-800 font-semibold' : 'bg-slate-100 text-slate-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((c) => {
        const isSelected = activeFilter === c.id;
        const IconComponent = c.icon;
        return (
          <div
            key={c.id}
            onClick={() => onFilterClick(c.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
              isSelected
                ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider">
                {c.label}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bgColor}`}>
                <IconComponent className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {c.count}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.badgeColor}`}>
                {c.badge}
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-slate-500 font-medium truncate">
              {c.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
