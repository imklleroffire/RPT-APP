// Predefined exercise images
export const EXERCISE_IMAGES = [
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800', // Upper body
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', // Balance
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', // Lower body
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', // Core
  'https://images.unsplash.com/photo-1616699002805-0741e1e4a9c5?w=800', // Posture
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', // Stretching
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800', // Yoga
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', // Pilates
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', // Rehabilitation
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', // Strength
];

// Default exercise bundles
export const DEFAULT_BUNDLES = [
  {
    name: 'Upper Body Strength',
    exercises: [
      { name: 'Push-ups', reps: 10 },
      { name: 'Dumbbell Rows', reps: 12 },
      { name: 'Shoulder Press', reps: 10 },
    ],
    image: EXERCISE_IMAGES[0],
  },
  {
    name: 'Core Workout',
    exercises: [
      { name: 'Plank', duration: 30 },
      { name: 'Crunches', reps: 15 },
      { name: 'Russian Twists', reps: 20 },
    ],
    image: EXERCISE_IMAGES[3],
  },
  {
    name: 'Lower Body Power',
    exercises: [
      { name: 'Squats', reps: 15 },
      { name: 'Lunges', reps: 12 },
      { name: 'Calf Raises', reps: 20 },
    ],
    image: EXERCISE_IMAGES[2],
  },
];

export const exerciseImages = {
  default: EXERCISE_IMAGES[0], // Using the first exercise image as default
  // Add more exercise images as needed
  // Example:
  // squat: EXERCISE_IMAGES[2],
  // lunges: EXERCISE_IMAGES[2],
  // etc.
}; 