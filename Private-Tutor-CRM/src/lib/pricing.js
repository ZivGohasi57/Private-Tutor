export const LEVELS = {
  ELEMENTARY: 'elementary',
  MIDDLE: 'middle',
  HIGH: 'high',
  ACADEMIC: 'academic'
};

export const LEVEL_LABELS = {
  [LEVELS.ELEMENTARY]: 'Elementary',
  [LEVELS.MIDDLE]: 'Middle School',
  [LEVELS.HIGH]: 'High School',
  [LEVELS.ACADEMIC]: 'Academic'
};

export const COURSES = [
  { id: 'intro', name: 'מבוא למדמ"ח', price: 40 },
  { id: 'ds', name: 'מבני נתונים', price: 60 },
  { id: 'algo', name: 'אלגוריתמים', price: 80 },
  { id: 'os', name: 'מערכות הפעלה', price: 100 },
];

export const calculatePrice = (level, studentsCount, durationHours) => {
  if (!studentsCount || !durationHours) return 0;

  if (level === LEVELS.ACADEMIC) {
    if (studentsCount === 1) {
      if (durationHours <= 1) return 200 * durationHours;
      return 200 + ((durationHours - 1) * 150);
    }
    let pricePerStudent = 0;
    if (studentsCount === 2) pricePerStudent = 170;
    if (studentsCount === 3) pricePerStudent = 150;
    return pricePerStudent * studentsCount * durationHours;
  }

  let basePrice = 0;
  switch (level) {
    case LEVELS.ELEMENTARY: basePrice = 120; break;
    case LEVELS.MIDDLE: basePrice = studentsCount === 1 ? 140 : (studentsCount === 2 ? 120 : 100); break;
    case LEVELS.HIGH: basePrice = studentsCount === 1 ? 160 : (studentsCount === 2 ? 140 : 120); break;
  }
  
  
  const finalHourlyRate = (studentsCount > 1) ? (basePrice * studentsCount) : basePrice;
  return finalHourlyRate * durationHours;
};