/**
 * Robust helper functions to prevent NaN, Invalid Date, and 0 Questions errors.
 */

/**
 * Safely formats a date from multiple possible field names.
 */
export const formatSafeDate = (value: any, fallback = "Date unavailable"): string => {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Safely formats a percentage value.
 */
export const formatPercent = (value: number | string | null | undefined, fallback = "0%"): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === null || num === undefined || isNaN(num as number)) return fallback;
  return `${Math.round(num as number)}%`;
};

/**
 * Safely gets question count from an exam object with multiple possible structures.
 */
export const getQuestionCount = (exam: any): number => {
  if (!exam) return 0;
  
  const questions = exam.questions || 
                    exam.examData?.questions || 
                    exam.items || 
                    exam.mcqs || 
                    (Array.isArray(exam.data) ? exam.data : exam.data?.questions) || 
                    [];
                    
  return Array.isArray(questions) ? questions.length : 0;
};

/**
 * Safely calculates accuracy percentage from score and total.
 */
export const calculateAccuracy = (score: any, total: any): number => {
  const s = parseFloat(score);
  const t = parseFloat(total);
  if (isNaN(s) || isNaN(t) || t <= 0) return 0;
  return (s / t) * 100;
};

/**
 * Safely calculates average accuracy from an array of entries.
 */
export const getAverageAccuracy = (entries: any[]): number => {
  if (!entries || entries.length === 0) return 0;
  
  const validEntries = entries.filter(e => {
    const s = parseFloat(e.score);
    const t = parseFloat(e.totalQuestions || e.total_questions || e.total);
    return !isNaN(s) && !isNaN(t) && t > 0;
  });
  
  if (validEntries.length === 0) return 0;
  
  const totalAccuracy = validEntries.reduce((acc, e) => {
    const s = parseFloat(e.score);
    const t = parseFloat(e.totalQuestions || e.total_questions || e.total);
    return acc + (s / t) * 100;
  }, 0);
  
  return totalAccuracy / validEntries.length;
};

/**
 * Safely gets the highest accuracy from an array of entries.
 */
export const getHighestAccuracy = (entries: any[]): number => {
  if (!entries || entries.length === 0) return 0;
  
  const accuracies = entries.map(e => {
    const s = parseFloat(e.score);
    const t = parseFloat(e.totalQuestions || e.total_questions || e.total);
    if (isNaN(s) || isNaN(t) || t <= 0) return 0;
    return (s / t) * 100;
  });
  
  return Math.max(0, ...accuracies);
};
