import { Curriculum } from '../data/curriculum';

export const getCurriculumStats = (curriculum: Curriculum) => {
  let totalSubjects = 0;
  let totalECTS = 0;
  let totalSemesters = 0;

  curriculum.years.forEach(year => {
    year.semesters.forEach(semester => {
      totalSemesters++;
      totalSubjects += semester.subjects.length;
      totalECTS += semester.total_ects_credits;
    });
  });

  return {
    totalYears: curriculum.years.length,
    totalSemesters,
    totalSubjects,
    totalECTS
  };
};
