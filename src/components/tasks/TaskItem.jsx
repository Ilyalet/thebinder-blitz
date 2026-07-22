import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Bell, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function TaskItem({ task, onStatusChange, onEdit, onDelete }) {
  const isDone = task.status === 'done';

  return (
    <Card className={isDone ? 'opacity-60' : ''}>
      <CardContent className="p-4 flex items-start gap-3">
        <Checkbox checked={isDone} onCheckedChange={(checked) => onStatusChange(task.id, checked ? 'done' : 'pending')} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {task.type === 'reminder' ? (
              <Bell className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            ) : (
              <CheckSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            )}
            <h3 className={`font-medium text-sm truncate ${isDone ? 'line-through' : ''}`}>{task.title}</h3>
          </div>
          {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            {task.priority && <Badge variant="outline" className={PRIORITY_COLORS[task.priority] || ''}>{task.priority}</Badge>}
            {task.due_date && task.type === 'reminder' && task.due_time && (
              <span className="text-xs text-gray-500">
                Due {format(parseISO(`${task.due_date}T${task.due_time}`), "MMM d, yyyy 'at' h:mm a")}
              </span>
            )}
            {task.due_date && task.type !== 'reminder' && (
              <span className="text-xs text-gray-500">Due {format(parseISO(task.due_date), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(task)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
