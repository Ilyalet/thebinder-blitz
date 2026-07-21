import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FAQS = [
  {
    q: 'How do I add a document?',
    a: 'From the Dashboard, click "Choose File" under Scan or Upload a Document. The AI will automatically extract text, generate a title and summary, and suggest tags and tasks.',
  },
  {
    q: 'What is the difference between a Task and a Reminder?',
    a: 'Both live in the same list and support due dates and priority. Reminders are meant for date-based nudges (like a renewal), while Tasks are action items — you can filter by type on the Tasks and Reminders pages.',
  },
  {
    q: 'How do I organize documents?',
    a: 'Use Folders to group documents, and Tags to label them by topic. Manage tag colors, renames, and merges from Tag Manager.',
  },
  {
    q: 'How do I export my calendar?',
    a: 'From the Calendar page, click Export to download an .ics file of all your tasks and reminders.',
  },
];

export default function HelpPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-sm text-gray-500 mt-1">Answers to common questions about TheBinder.</p>
        </div>
        <div className="space-y-4">
          {FAQS.map((item, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-base">{item.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 pt-0">{item.a}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
