import type { Category } from './types';

export const categories: Category[] = [
  { id: 'cat-1', code: 'CSC', name: 'Computer Science', description: 'Software, systems, networking and digital innovation.', maxScore: 80 },
  { id: 'cat-2', code: 'MAT', name: 'Mathematics', description: 'Applied maths, modelling, statistics and pure mathematics.', maxScore: 80 },
  { id: 'cat-3', code: 'AGR', name: 'Agriculture', description: 'Agriculture, agribusiness and food production innovations.', maxScore: 80 },
  { id: 'cat-4', code: 'PHY', name: 'Physics', description: 'Physics principles, prototypes and engineering concepts.', maxScore: 80 },
  { id: 'cat-5', code: 'FTE', name: 'Food Technology', description: 'Food processing, preservation and nutrition science.', maxScore: 80 },
  { id: 'cat-6', code: 'ECO', name: 'Economics', description: 'Economic modelling, finance and practical market solutions.', maxScore: 80 },
  { id: 'cat-7', code: 'BHS', name: 'Behavioral Science', description: 'Human behavior, learning and social science projects.', maxScore: 80 },
  { id: 'cat-8', code: 'ROB', name: 'Robotics', description: 'Robotics, automation and embedded systems.', maxScore: 80 },
  { id: 'cat-9', code: 'ENV', name: 'Environmental Science', description: 'Climate, environment and sustainability projects.', maxScore: 80 },
  { id: 'cat-10', code: 'ENG', name: 'Engineering', description: 'Applied engineering solutions and prototypes.', maxScore: 80 },
  { id: 'cat-11', code: 'CHE', name: 'Chemistry', description: 'Chemical processes and lab-based innovations.', maxScore: 80 },
  { id: 'cat-12', code: 'BIO', name: 'Biology', description: 'Living systems, ecology and biotechnology foundations.', maxScore: 80 },
  { id: 'cat-13', code: 'REN', name: 'Renewable Energy', description: 'Solar, wind, hydro and clean energy solutions.', maxScore: 80 },
  { id: 'cat-14', code: 'HSC', name: 'Health Science', description: 'Health, diagnostics and community wellness projects.', maxScore: 80 },
  { id: 'cat-15', code: 'ESP', name: 'Earth & Space Science', description: 'Space, weather, geology and earth systems.', maxScore: 80 },
  { id: 'cat-16', code: 'SDS', name: 'Statistics & Data Science', description: 'Data analysis, prediction and statistical insight.', maxScore: 80 },
  { id: 'cat-17', code: 'BIOX', name: 'Biotechnology', description: 'Applied biology, genetics and lab innovation.', maxScore: 80 },
  { id: 'cat-18', code: 'APT', name: 'Applied Technology', description: 'Useful real-world technology for schools and communities.', maxScore: 80 },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}
