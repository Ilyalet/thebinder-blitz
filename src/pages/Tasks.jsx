import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task } from '@/entities/all';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskItem from '@/components/tasks/TaskItem';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const PAGE_SIZE = 10;

export default function TasksPage() {
    const [allTasks, setAllTasks] = useState([]);
    const [displayedTasks, setDisplayedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState(null);
    const [deletingTask, setDeletingTask] = useState(null);
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
            const tasksToFilter = allTasks.length > 0 ? allTasks : await Task.filter({ type: 'task' });
            if (allTasks.length === 0 && tasksToFilter.length > 0) {
                setAllTasks(tasksToFilter);
            }

            let filteredTasks = tasksToFilter;

            if (filters.searchTerm.trim()) {
                const searchTerm = filters.searchTerm.toLowerCase();
                filteredTasks = filteredTasks.filter(task =>
                    task.title.toLowerCase().includes(searchTerm) ||
                    (task.description || '').toLowerCase().includes(searchTerm)
                );
            }
            if (filters.status !== 'all') {
                filteredTasks = filteredTasks.filter(task => task.status === filters.status);
            }
            if (filters.priority !== 'all') {
                filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
            }

            setDisplayedTasks(filteredTasks);
            setHasNextPage(false);

        } else {
            const offset = (currentPage - 1) * PAGE_SIZE;
            const tasks = await Task.filter({ type: 'task' }, '-created_date', PAGE_SIZE + 1, offset);

            setHasNextPage(tasks.length > PAGE_SIZE);
            const currentPageTasks = tasks.slice(0, PAGE_SIZE);
            setDisplayedTasks(currentPageTasks);
        }

        setLoading(false);
    }, [hasActiveFilters, currentPage, allTasks, filters]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleStatusChange = async (taskId, newStatus) => {
        await Task.update(taskId, { status: newStatus });
        fetchData();
    };

    const handleTaskUpdated = () => {
        setEditingTask(null);
        fetchData();
        toast({ title: "Success", description: "Task has been updated." });
    };

    const handleDelete = async () => {
        if (!deletingTask) return;
        await Task.delete(deletingTask.id);
        setDeletingTask(null);
        fetchData();
        toast({ title: "Success", description: "Task has been deleted." });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-sm text-gray-500 mt-1">All your tasks in one place.</p>
                </div>

                <TaskFilters filters={filters} onFilterChange={setFilters} />

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex justify-between items-center">
                            {hasActiveFilters ? (
                                <div className="text-sm text-gray-600">Showing {displayedTasks.length} matching tasks</div>
                            ) : (
                                <div className="text-sm text-gray-600">Page {currentPage}</div>
                            )}
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            {displayedTasks.length > 0 ? (
                                displayedTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onStatusChange={handleStatusChange}
                                        onEdit={setEditingTask}
                                        onDelete={setDeletingTask}
                                    />
                                ))
                            ) : (
                                <p className="text-center py-10 text-gray-500">No tasks found. Try adjusting your filters.</p>
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
                    </>
                )}
            </div>

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    isOpen={!!editingTask}
                    onClose={() => setEditingTask(null)}
                    onTaskUpdated={handleTaskUpdated}
                />
            )}

            {deletingTask && (
                <DeleteConfirmationDialog
                    isOpen={!!deletingTask}
                    onClose={() => setDeletingTask(null)}
                    onConfirm={handleDelete}
                    itemName={deletingTask.title}
                />
            )}
        </div>
    );
}
