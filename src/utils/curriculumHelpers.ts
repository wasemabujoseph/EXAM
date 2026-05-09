import { curriculum } from '../data/curriculum';

/**
 * Extracts all academic years from the curriculum data.
 */
export const getAcademicYears = () => {
  return curriculum.years.map(y => y.year);
};

/**
 * Extracts all subjects for a specific academic year.
 */
export const getSubjectsByYear = (yearLabel: string) => {
  const yearData = curriculum.years.find(y => y.year === yearLabel);
  if (!yearData) return [];
  
  const subjects: string[] = [];
  yearData.semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      subjects.push(sub.name);
    });
  });
  
  // Remove duplicates and sort
  return Array.from(new Set(subjects)).sort();
};

/**
 * Normalizes academic year labels (e.g., "I Year" -> "1").
 */
export const normalizeYearValue = (label: string): string => {
  if (label.includes('I Year')) return '1';
  if (label.includes('II Year')) return '2';
  if (label.includes('III Year')) return '3';
  if (label.includes('IV Course')) return '4';
  if (label.includes('V Course')) return '5';
  if (label.includes('VI Course')) return '6';
  return label;
};

/**
 * Maps numeric year to label used in curriculum.
 */
export const getYearLabelFromValue = (value: string | number): string => {
  const v = value.toString();
  switch (v) {
    case '1': return 'I Year';
    case '2': return 'II Year';
    case '3': return 'III Year';
    case '4': return 'IV Course';
    case '5': return 'V Course';
    case '6': return 'VI Course';
    default: return v;
  }
};
