import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '@/entities/all';
import TaskItem from '@/components/tasks/TaskItem';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Loader2 } from 'lucide-react';

export default function TaskList({ entityType, entityId, refreshTrigger }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (entityType === 'document' && entityId) {
        setTasks(await Task.filter({ document_id: entityId }));
      } else {
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  const handleStatusChange = async (taskId, newStatus) => {
    await Task.update(taskId, { status: newStatus });
    fetchTasks();
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    await Task.delete(deletingTask.id);
    setDeletingTask(null);
    fetchTasks();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No tasks or reminders yet.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onStatusChange={handleStatusChange} onEdit={setEditingTask} onDelete={setDeletingTask} />
      ))}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={() => {
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}
      {deletingTask && (
        <DeleteConfirmationDialog isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={handleDelete} itemName={deletingTask.title} />
      )}
    </div>
  );
}
