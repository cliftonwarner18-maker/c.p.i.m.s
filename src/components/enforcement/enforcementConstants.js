export const STATUSES = [
  'New', 'Assigned', 'Under Investigation', 'Charges Filed', 'Court Pending',
  'Closed - Convicted', 'Closed - Dismissed', 'Closed - No Action',
];

export const EVIDENCE_SOURCES = ['Stop Arm Camera', 'Driver Report', 'Witness Report', 'Other'];

export const isClosed = (s) => (s || '').startsWith('Closed');

export const STATUS_COLORS = {
  'New': '#dc2626',
  'Assigned': '#ea580c',
  'Under Investigation': '#ca8a04',
  'Charges Filed': '#2563eb',
  'Court Pending': '#7c3aed',
  'Closed - Convicted': '#16a34a',
  'Closed - Dismissed': '#64748b',
  'Closed - No Action': '#94a3b8',
};