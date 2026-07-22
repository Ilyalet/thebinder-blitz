import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STEPS = [
  {
    title: 'Scan or upload',
    body: 'From the Dashboard, drag in a photo or PDF of a receipt, warranty, bill, insurance policy, contract, or appointment letter — or click Choose File.',
  },
  {
    title: 'AI reads and organizes it',
    body: 'TheBinder extracts the text, writes a title and summary, and suggests tags — all without you typing anything.',
  },
  {
    title: 'Review suggested tasks and reminders',
    body: 'If the document mentions a deadline or an appointment, a suggestion appears on the document page. Approve it to add it to your Tasks or Reminders, or decline it.',
  },
  {
    title: 'Find things later',
    body: 'Search, folders, and tags keep everything reachable — and the Calendar shows every reminder by date so nothing sneaks up on you.',
  },
];

const FAQS = [
  {
    q: 'How do I add a document?',
    a: 'From the Dashboard, click "Choose File" under Scan or Upload a Document. The AI will automatically extract text, generate a title and summary, and suggest tags and tasks.',
  },
  {
    q: 'What is the difference between a Task and a Reminder?',
    a: 'Tasks are a plain to-do list — title, priority, status, and an optional deadline. Reminders are calendar events — they always have a date and time, show up on the Calendar page, and export to .ics. AI-scanned documents are only turned into a reminder when the document states an actual time (like an appointment); otherwise they become a task.',
  },
  {
    q: 'How do I organize documents?',
    a: 'Use Folders to group documents, and Tags to label them by topic. Manage tag colors, renames, and merges from Tag Manager.',
  },
  {
    q: 'How do I export my calendar?',
    a: 'From the Calendar page, click Export to download an .ics file of all your reminders (tasks aren\'t calendar events, so they\'re not included).',
  },
  {
    q: 'What can the AI assistant help with?',
    a: 'The chat bubble in the bottom-right corner answers questions across everything in your Binder. On an individual document\'s page, "Ask Assistant" instead answers questions scoped to just that document.',
  },
  {
    q: 'Can I mark documents as favorites?',
    a: 'Click the star icon on any document card to favorite it. Favorited documents get their own tab on the Dashboard so they\'re always one click away.',
  },
  {
    q: 'How do I edit or delete a task, reminder, or document?',
    a: 'Use the pencil and trash icons on any item in the Tasks, Reminders, or Documents pages. Editing a document also lets you move it between folders.',
  },
  {
    q: "What if I upload the same document twice?",
    a: 'TheBinder checks new uploads against your existing documents and flags likely duplicates so you can review before keeping both.',
  },
];

export default function HelpPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-sm text-gray-500 mt-1">Answers to common questions about TheBinder.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">How TheBinder works</h2>
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-sm text-gray-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Frequently asked questions</h2>
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
    </div>
  );
}
