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
    description: 'Build strength in your upper body with these essential exercises',
    exercises: [
      { 
        name: 'Push-ups', 
        description: 'Classic upper body exercise',
        instructions: 'Start in a plank position, lower your body until your chest nearly touches the floor, then push back up',
        reps: 10,
        duration: 0,
        difficulty: 'medium' as const,
        category: 'strength',
        imageUrl: EXERCISE_IMAGES[0],
        restTime: 60
      },
      { 
        name: 'Dumbbell Rows', 
        description: 'Target your back muscles',
        instructions: 'Bend at the waist, hold dumbbells, and pull them up towards your chest',
        reps: 12,
        duration: 0,
        difficulty: 'medium' as const,
        category: 'strength',
        imageUrl: EXERCISE_IMAGES[0],
        restTime: 60
      },
      { 
        name: 'Shoulder Press', 
        description: 'Strengthen your shoulders',
        instructions: 'Sit or stand with dumbbells at shoulder level, press them overhead',
        reps: 10,
        duration: 0,
        difficulty: 'medium' as const,
        category: 'strength',
        imageUrl: EXERCISE_IMAGES[0],
        restTime: 60
      },
    ],
    coverImage: EXERCISE_IMAGES[0],
  },
  {
    name: 'Core Workout',
    description: 'Strengthen your core muscles for better stability and posture',
    exercises: [
      { 
        name: 'Plank', 
        description: 'Core stability exercise',
        instructions: 'Hold a plank position with your body in a straight line from head to heels',
        reps: 0,
        duration: 30,
        difficulty: 'easy' as const,
        category: 'core',
        imageUrl: EXERCISE_IMAGES[3],
        restTime: 30
      },
      { 
        name: 'Crunches', 
        description: 'Target your abdominal muscles',
        instructions: 'Lie on your back, lift your shoulders off the ground while keeping your lower back pressed down',
        reps: 15,
        duration: 0,
        difficulty: 'easy' as const,
        category: 'core',
        imageUrl: EXERCISE_IMAGES[3],
        restTime: 30
      },
      { 
        name: 'Russian Twists', 
        description: 'Work your obliques',
        instructions: 'Sit with knees bent, lean back slightly, and twist your torso from side to side',
        reps: 20,
        duration: 0,
        difficulty: 'medium' as const,
        category: 'core',
        imageUrl: EXERCISE_IMAGES[3],
        restTime: 30
      },
    ],
    coverImage: EXERCISE_IMAGES[3],
  },
  {
    name: 'Lower Body Power',
    description: 'Build strength and power in your legs and glutes',
    exercises: [
      { 
        name: 'Squats', 
        description: 'Fundamental lower body exercise',
        instructions: 'Stand with feet shoulder-width apart, lower your body as if sitting back into a chair',
        reps: 15,
        duration: 0,
        difficulty: 'medium' as const,
        category: 'strength',
        imageUrl: EXERCISE_IMAGES[2],
        restTime: 60
      },
      { 
        name: 'Lunges', 
        description: 'Single-leg strength exercise',
        instructions: 'Step forward with one leg, lower your body until both knees are bent at 90 degrees',
        reps: 12,
        duration: 0,
        difficulty: 'medium' as const,
        category: 'strength',
        imageUrl: EXERCISE_IMAGES[2],
        restTime: 60
      },
      { 
        name: 'Calf Raises', 
        description: 'Strengthen your calf muscles',
        instructions: 'Stand on the edge of a step, raise your heels up and down',
        reps: 20,
        duration: 0,
        difficulty: 'easy' as const,
        category: 'strength',
        imageUrl: EXERCISE_IMAGES[2],
        restTime: 30
      },
    ],
    coverImage: EXERCISE_IMAGES[2],
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