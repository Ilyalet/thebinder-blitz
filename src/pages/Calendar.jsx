import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task } from '@/entities/all';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Plus, Bell, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, subMonths, subWeeks, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import TaskCreator from '@/components/tasks/TaskCreator';
import AiFeatureWrapper from '@/components/ai/AiFeatureWrapper';
import { exportCalendar } from '@/functions/exportCalendar';

function formatTime(reminder) {
  return format(parseISO(`${reminder.due_date}T${reminder.due_time}`), 'h:mm a');
}

function getReminderColor(priority) {
  switch (priority) {
    case 'high': return 'bg-purple-200 text-purple-800 border-purple-300';
    case 'medium': return 'bg-indigo-200 text-indigo-800 border-indigo-300';
    case 'low': return 'bg-teal-200 text-teal-800 border-teal-300';
    default: return 'bg-slate-200 text-slate-800 border-slate-300';
  }
}

const CalendarDay = ({ date, reminders, isCurrentMonth, isToday, onClick }) => {
  const dayReminders = reminders.filter(reminder =>
    reminder.due_date && isSameDay(parseISO(reminder.due_date), date)
  );

  return (
    <div
      className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-colors hover:bg-gray-50 ${
        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
      } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
      onClick={() => onClick(date, dayReminders)}
    >
      <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : ''}`}>
        {format(date, 'd')}
      </div>
      <div className="space-y-1">
        {dayReminders.slice(0, 3).map(reminder => (
          <div
            key={reminder.id}
            className={`text-xs p-1.5 rounded border truncate ${getReminderColor(reminder.priority)}`}
            title={`Reminder: ${reminder.title}`}
          >
            <div className="flex items-center gap-1">
              <Bell className="w-2 h-2 shrink-0" />
              <span className="truncate font-medium">{formatTime(reminder)} · {reminder.title}</span>
            </div>
          </div>
        ))}
        {dayReminders.length > 3 && (
          <div className="text-xs text-gray-500 font-medium">+{dayReminders.length - 3} more</div>
        )}
      </div>
    </div>
  );
};

const WeeklyCalendarDay = ({ date, reminders, isToday, onClick }) => {
  const dayReminders = reminders.filter(reminder =>
    reminder.due_date && isSameDay(parseISO(reminder.due_date), date)
  );

  return (
    <div className={`w-full lg:flex-1 min-h-[80px] lg:min-h-[250px] border-b lg:border-b-0 lg:border-r border-gray-200 last:border-b-0 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
      <div className={`p-3 border-b border-gray-200 font-medium flex items-center justify-between lg:block lg:text-center ${
        isToday ? 'bg-blue-600 text-white' : 'bg-gray-50'
      }`}>
        <div className="text-sm lg:text-xs">{format(date, 'EEE')}</div>
        <div className="text-xl">{format(date, 'd')}</div>
      </div>
      <div className="p-2 space-y-2">
        {dayReminders.map(reminder => (
          <div
            key={reminder.id}
            className={`text-xs p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getReminderColor(reminder.priority)}`}
            onClick={() => onClick(date, [reminder])}
            title={`Reminder: ${reminder.title} - ${reminder.description || 'No description'}`}
          >
            <div className="flex items-center gap-1 font-medium mb-1">
              <Bell className="w-3 h-3 shrink-0" />
              <span className="truncate">{formatTime(reminder)} · {reminder.title}</span>
            </div>
            {reminder.description && (
              <div className="text-xs opacity-75 truncate">{reminder.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month');
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const remindersData = await Task.filter({ type: 'reminder' });
      setReminders(remindersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive"
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const monthDays = useMemo(() => {
    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

  const weekDays = useMemo(() => {
    const days = [];
    let day = weekStart;
    while (day <= weekEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [weekStart, weekEnd]);

  const navigateMonth = (direction) => {
    setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const navigateWeek = (direction) => {
    setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const handleDayClick = (date, dayItems) => {
    if (dayItems.length > 0) {
      setEditingItem(dayItems[0]);
    }
  };

  const handleItemUpdated = () => {
    setEditingItem(null);
    fetchData();
    toast({ title: "Success", description: "Item has been updated." });
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await Task.delete(deletingItem.id);
      setDeletingItem(null);
      fetchData();
      toast({ title: "Success", description: "Item has been deleted." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const handleTaskCreated = () => {
    setShowTaskCreator(false);
    fetchData();
    toast({ title: "Success", description: "Reminder created successfully." });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, headers } = await exportCalendar();
      const blob = new Blob([data], { type: headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let filename = 'calendar.ics';
      const disposition = headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast({
        title: "Export Successful",
        description: "Your calendar has been exported as an .ics file.",
      });
    } catch (error) {
      console.error("Failed to export calendar:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate the calendar file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500">View all your reminders in calendar format.</p>
          </div>
          <div className="flex items-center gap-2">
            <AiFeatureWrapper
              featureName="Calendar Export"
              placeholder={
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="flex items-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              }
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </Button>
            </AiFeatureWrapper>
            <Button
              size="sm"
              onClick={() => setShowTaskCreator(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Reminder
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="w-3 h-3 text-purple-600" />
            <span className="text-sm text-gray-600">Reminders</span>
          </div>
          <div className="text-xs text-gray-500">
            Colors indicate priority: Light = Low, Medium = Medium, Dark = High
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-0 gap-3 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <CardTitle className="text-lg">
                {viewType === 'month'
                  ? format(currentDate, 'MMMM yyyy')
                  : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                }
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant={viewType === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewType === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('week')}
                >
                  Week
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewType === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewType === 'month' ? navigateMonth('next') : navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {viewType === 'month' ? (
              <div className="grid grid-cols-7 border-t border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-b border-gray-200 bg-gray-50">
                    {day}
                  </div>
                ))}

                {monthDays.map(day => (
                  <CalendarDay
                    key={day.toISOString()}
                    date={day}
                    reminders={reminders}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    isToday={isSameDay(day, new Date())}
                    onClick={handleDayClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row border-t border-gray-200">
                {weekDays.map(day => (
                  <WeeklyCalendarDay
                    key={day.toISOString()}
                    date={day}
                    reminders={reminders}
                    isToday={isSameDay(day, new Date())}
                    onClick={handleDayClick}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingItem && (
        <EditTaskModal
          task={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onTaskUpdated={handleItemUpdated}
          onTaskDeleted={() => {
            setDeletingItem(editingItem);
            setEditingItem(null);
          }}
        />
      )}

      {deletingItem && (
        <DeleteConfirmationDialog
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDelete}
          itemName={deletingItem.title}
        />
      )}

      {showTaskCreator && (
        <TaskCreator
          taskType="reminder"
          isOpen={showTaskCreator}
          onClose={() => setShowTaskCreator(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
