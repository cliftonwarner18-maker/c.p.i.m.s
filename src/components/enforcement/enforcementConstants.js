export const STATUSES = [
  'New', 'Assigned', 'Under Investigation', 'Charges Filed', 'Court Pending',
  'Closed - Convicted', 'Closed - Dismissed', 'Closed - No Action',
];

export const EVIDENCE_SOURCES = ['Stop Arm Camera', 'Driver Report', 'Witness Report', 'Other'];

export const COUNTIES = ['New Hanover', 'Brunswick', 'Pender'];

export const SCHOOL_GROUPS = [
  {
    group: 'Pre-Kindergarten Centers',
    schools: [
      'College Road Pre-K Center (Stephen Buchanan)',
      'Dorothy B. Johnson Pre-K Center (Jordan Steinhilber)',
      'Mary Washington Howe Pre-K Center (Leigh Ann Lampley)',
    ],
  },
  {
    group: 'Elementary Schools (K-5)',
    schools: [
      'Alderman Elementary',
      'Edwin A. Anderson Elementary',
      'H. C. Bellamy Elementary',
      'John J. Blair Elementary',
      'Bradley Creek Elementary',
      'Carolina Beach School',
      'Castle Hayne Elementary',
      'Codington Elementary (Year-Round)',
      'College Park Elementary',
      'Eaton Elementary (Year-Round)',
      'Forest Hills Global Elementary',
      'Holly Tree Elementary',
      'The International School at Gregory (K-8)',
      'Mary C. Williams Elementary',
      'Masonboro Elementary School',
      'Murrayville Elementary',
      'Ogden Elementary',
      'Pine Valley Elementary',
      'Porters Neck Elementary',
      'Rachel Freeman School of Engineering (Restart Year-Round)',
      'Snipes Academy of Arts & Design (Restart Year-Round)',
      'Sunset Park Elementary',
      'Winter Park Elementary',
      'Wrightsboro Elementary',
      'Wrightsville Beach Elementary',
    ],
  },
  {
    group: 'Middle Schools (6-8)',
    schools: [
      'Emma B. Trask Middle School',
      'Holly Shelter Middle School',
      'Murray Middle School',
      'Myrtle Grove Middle School',
      'Noble Middle School',
      'Roland-Grise Middle School',
      'Williston Middle School',
    ],
  },
  {
    group: 'High Schools (9-12)',
    schools: [
      'Emsley A. Laney High School',
      'Eugene Ashley High School',
      'Isaac Bear Early College High School',
      'John T. Hoggard High School',
      'New Hanover High School',
      'Southeast Area Technical High School',
      'Wilmington Early College High School',
      'Career Readiness Academy at Mosley',
    ],
  },
];

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