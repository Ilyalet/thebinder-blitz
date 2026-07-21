import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task } from '@/entities/all';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskItem from '@/components/tasks/TaskItem';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Plus, Bell, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import TaskCreator from '@/components/tasks/TaskCreator';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const PAGE_SIZE = 10;

export default function RemindersPage() {
    const [allReminders, setAllReminders] = useState([]);
    const [displayedReminders, setDisplayedReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingReminder, setEditingReminder] = useState(null);
    const [deletingReminder, setDeletingReminder] = useState(null);
    const [showTaskCreator, setShowTaskCreator] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const { toast } = useToast();
    const [filters, setFilters] = useState({
        searchTerm: "",
        status: "all",
        priority: "all",
    });

    const hasActiveFilters = useMemo(() =>
        filters.searchTerm.trim() !== '' || filters.status !== 'all' || filters.priority !== 'all',
        [filters]
    );

    const fetchData = useCallback(async () => {
        setLoading(true);

        if (hasActiveFilters) {
            const remindersToFilter = allReminders.length > 0 ? allReminders : await Task.filter({ type: 'reminder' });
            if (allReminders.length === 0) {
                setAllReminders(remindersToFilter);
            }

            let filteredReminders = remindersToFilter;

            if (filters.searchTerm.trim()) {
                const searchTerm = filters.searchTerm.toLowerCase();
                filteredReminders = filteredReminders.filter(reminder =>
                    reminder.title.toLowerCase().includes(searchTerm) ||
                    (reminder.description || '').toLowerCase().includes(searchTerm)
                );
            }
            if (filters.status !== 'all') {
                filteredReminders = filteredReminders.filter(reminder => reminder.status === filters.status);
            }
            if (filters.priority !== 'all') {
                filteredReminders = filteredReminders.filter(reminder => reminder.priority === filters.priority);
            }

            setDisplayedReminders(filteredReminders);
            setHasNextPage(false);

        } else {
            const offset = (currentPage - 1) * PAGE_SIZE;
            const reminders = await Task.filter({ type: 'reminder' }, '-created_date', PAGE_SIZE + 1, offset);

            setHasNextPage(reminders.length > PAGE_SIZE);
            const currentPageReminders = reminders.slice(0, PAGE_SIZE);
            setDisplayedReminders(currentPageReminders);
            if (allReminders.length > 0) {
                setAllReminders([]);
            }
        }

        setLoading(false);
    }, [hasActiveFilters, currentPage, allReminders, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleStatusChange = async (reminderId, newStatus) => {
        await Task.update(reminderId, { status: newStatus });
        fetchData();
    };

    const handleReminderUpdated = () => {
        setEditingReminder(null);
        fetchData();
        toast({ title: "Success", description: "Reminder has been updated." });
    };

    const handleDelete = async () => {
        if (!deletingReminder) return;
        await Task.delete(deletingReminder.id);
        setDeletingReminder(null);
        fetchData();
        toast({ title: "Success", description: "Reminder has been deleted." });
    };

    const handleTaskCreated = () => {
        setShowTaskCreator(false);
        fetchData();
        toast({ title: "Success", description: "Reminder created successfully." });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
                        <p className="text-sm text-gray-500">All your reminders in one place.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to={createPageUrl('Calendar')}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                Calendar View
                            </Button>
                        </Link>
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

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <TaskFilters filters={filters} onFilterChange={setFilters} />

                        <div className="mb-4 flex justify-between items-center">
                            {hasActiveFilters ? (
                                <div className="text-sm text-gray-600">Showing {displayedReminders.length} matching reminders</div>
                            ) : (
                                <div className="text-sm text-gray-600">Page {currentPage}</div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {displayedReminders.length > 0 ? (
                                displayedReminders.map(reminder => (
                                    <TaskItem
                                        key={reminder.id}
                                        task={reminder}
                                        onStatusChange={handleStatusChange}
                                        onEdit={setEditingReminder}
                                        onDelete={setDeletingReminder}
                                    />
                                ))
                            ) : (
                                <p className="text-center py-10 text-gray-500">No reminders found. Try adjusting your filters.</p>
                            )}
                        </div>

                        {!hasActiveFilters && (
                            <div className="mt-8 flex justify-center items-center gap-4">
                                <Button
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                                <span className="text-sm font-medium">Page {currentPage}</span>
                                <Button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={!hasNextPage}
                                    variant="outline"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {editingReminder && (
                <EditTaskModal
                    task={editingReminder}
                    isOpen={!!editingReminder}
                    onClose={() => setEditingReminder(null)}
                    onTaskUpdated={handleReminderUpdated}
                />
            )}

            {deletingReminder && (
                <DeleteConfirmationDialog
                    isOpen={!!deletingReminder}
                    onClose={() => setDeletingReminder(null)}
                    onConfirm={handleDelete}
                    itemName={deletingReminder.title}
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
