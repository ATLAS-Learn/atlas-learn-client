// List of schools for the signup dropdown
export const SCHOOLS = [
    "Government Bilingual High School Douala",
    "Government Bilingual High School Yaoundé",
    "Sacred Heart College Mankon",
    "Our Lady of Lourdes College Mankon",
    "Baptist High School Buea",
    "Presbyterian Secondary School Mankon",
    "St. Joseph's College Sasse",
    "Sacred Heart College Bamenda",
    "Baptist High School Douala",
    "Our Lady of Lourdes College Bamenda",
    "Presbyterian Secondary School Douala",
    "Government High School Limbe",
    "Baptist High School Yaoundé",
    "Sacred Heart College Douala",
    "St. Joseph's College Douala",
    "Other",
] as const;

export type School = typeof SCHOOLS[number];
