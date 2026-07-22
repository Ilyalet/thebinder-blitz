import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const TIPS = [
  'Tag your documents consistently so search and filters stay useful as your Binder grows.',
  'Set a due date on warranties and insurance renewals so reminders catch you before they lapse.',
  'Use folders to group documents by category, like "Home", "Auto", or "Family".',
  'The AI assistant can answer questions across all your uploaded documents at once.',
  'Favorite the documents you reference often so they are one click away on your dashboard.',
];

export default function TipOfTheDay() {
  const [tip, setTip] = useState(TIPS[0]);

  useEffect(() => {
    setTip(TIPS[new Date().getDate() % TIPS.length]);
  }, []);

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tip of the day</h3>
          <p className="text-sm text-gray-600 mt-0.5">{tip}</p>
        </div>
      </CardContent>
    </Card>
  );
}
