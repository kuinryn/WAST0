const WASTE_COLORS = {
  biodegradable: 'bg-green-100 text-green-700',
  non_biodegradable: 'bg-yellow-100 text-yellow-700',
  residual: 'bg-gray-100 text-gray-700',
  hazardous: 'bg-red-100 text-red-700',
}

export default function ScheduleTable({ schedules, onEdit, onDelete, canEdit }) {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No schedules found for this barangay.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Waste Type</th>
            <th className="px-4 py-3 text-left">Collection Day</th>
            <th className="px-4 py-3 text-left">Time</th>
            <th className="px-4 py-3 text-left">Frequency</th>
            {canEdit && <th className="px-4 py-3 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {schedules.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${WASTE_COLORS[s.waste_type]}`}>
                  {s.waste_type.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700">{s.collection_day}</td>
              <td className="px-4 py-3 text-gray-700">{s.collection_time}</td>
              <td className="px-4 py-3 text-gray-500 capitalize">{s.frequency.replace('_', '-')}</td>
              {canEdit && (
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => onEdit(s)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}