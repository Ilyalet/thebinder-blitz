export default function TodayActivity({ stats }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Activity</h3>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Docs processed</span>
        <span className="font-semibold text-gray-900">{stats.processedToday}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Active tasks</span>
        <span className="font-semibold text-gray-900">{stats.activeTasks}</span>
      </div>
    </div>
  );
}
