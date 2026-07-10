import React from 'react';
import { Sparkles } from 'lucide-react';
import Card from '../ui/Card';

interface InsightCardProps {
  texts: string[];
  className?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ texts, className = '' }) => (
  <Card className={`p-5 ${className}`}>
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-primary-300" />
      <h3 className="text-sm font-semibold text-white">Insights</h3>
    </div>
    {texts.length === 0 ? (
      <p className="mt-3 text-sm text-gray-400">Log your weight and meals for a few days and insights will show up here.</p>
    ) : (
      <ul className="mt-3 space-y-2.5">
        {texts.map((text, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
            <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" />
            {text}
          </li>
        ))}
      </ul>
    )}
  </Card>
);

export default InsightCard;
