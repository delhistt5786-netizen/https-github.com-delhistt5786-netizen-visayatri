const MAP = {
  // Application statuses
  pending:             ['bg-amber-100  text-amber-700',   'Pending'],
  documents_received:  ['bg-blue-100   text-blue-700',    'Docs Received'],
  in_review:           ['bg-purple-100 text-purple-700',  'In Review'],
  processing:          ['bg-indigo-100 text-indigo-700',  'Processing'],
  approved:            ['bg-emerald-100 text-emerald-700','Approved ✓'],
  rejected:            ['bg-red-100    text-red-700',     'Rejected'],
  delivered:           ['bg-gray-100   text-gray-600',    'Delivered'],
  // Payment statuses
  paid:                ['bg-emerald-100 text-emerald-700','Paid ✓'],
  unpaid:              ['bg-orange-100  text-orange-700', 'Unpaid'],
  refunded:            ['bg-gray-100    text-gray-600',   'Refunded'],
  waived:              ['bg-gray-100    text-gray-500',   'Waived'],
  created:             ['bg-blue-50     text-blue-500',   'Created'],
  failed:              ['bg-red-100     text-red-600',    'Failed'],
};

export default function StatusBadge({ status }) {
  const [cls, label] = MAP[status] || ['bg-gray-100 text-gray-500', status];
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}
