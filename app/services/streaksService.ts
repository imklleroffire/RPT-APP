import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { format, isSameDay, subDays } from 'date-fns';
import { StreakData, DailyCompletion, CompletedExercise } from '../types/streaks';

export class StreaksService {
  private static instance: StreaksService;
  private updateQueue: Set<string> = new Set();
  private isUpdating = false;

  static getInstance(): StreaksService {
    if (!StreaksService.instance) {
      StreaksService.instance = new StreaksService();
    }
    return StreaksService.instance;
  }

  // Initialize streak data for a user if it doesn't exist
  async initializeStreakData(userId: string): Promise<void> {
    try {
      console.log('[STREAKS] Initializing streak data for user:', userId);
      
      // Check if completedExercises document exists
      const completedRef = doc(db, 'completedExercises', userId);
      const completedDoc = await getDoc(completedRef);
      
      if (!completedDoc.exists()) {
        console.log('[STREAKS] Creating completedExercises document');
        await setDoc(completedRef, {
          userId,
          lastCompletedDate: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      
      // Check if streaks document exists
      const streaksRef = doc(db, 'streaks', userId);
      const streaksDoc = await getDoc(streaksRef);
      
      if (!streaksDoc.exists()) {
        console.log('[STREAKS] Creating streaks document');
        await setDoc(streaksRef, {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          streakHistory: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      
      console.log('[STREAKS] Streak data initialization complete');
    } catch (error) {
      console.error('[STREAKS] Error initializing streak data:', error);
      throw error;
    }
  }

  // Get all assigned exercises for a user
  async getAssignedExercises(userId: string): Promise<CompletedExercise[]> {
    try {
      const bundlesRef = collection(db, 'bundles');
      const bundlesQuery = query(bundlesRef, where('assignedPatients', 'array-contains', userId));
      const bundlesSnapshot = await getDocs(bundlesQuery);
      
      const assignedExercises: CompletedExercise[] = [];
      
      console.log('[STREAKS] Found bundles for user:', bundlesSnapshot.size);
      
      for (const bundleDoc of bundlesSnapshot.docs) {
        const bundleData = bundleDoc.data();
        const exercises = bundleData.exercises || [];
        
        console.log(`[STREAKS] Bundle "${bundleData.name}": ${exercises.length} exercises`);
        
        exercises.forEach((exercise: any) => {
          assignedExercises.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            bundleId: bundleDoc.id,
            bundleName: bundleData.name,
            completedAt: new Date(),
            completed: false
          });
        });
      }
      
      console.log('[STREAKS] Total assigned exercises:', assignedExercises.length);
      return assignedExercises;
    } catch (error) {
      console.error('[STREAKS] Error getting assigned exercises:', error);
      return [];
    }
  }

  // Get completed exercises for a specific date
  async getCompletedExercisesForDate(userId: string, date: Date): Promise<CompletedExercise[]> {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const completedRef = doc(db, 'completedExercises', userId);
      const completedDoc = await getDoc(completedRef);
      
      console.log('[STREAKS] Looking for completed exercises on:', dateStr);
      
      if (!completedDoc.exists()) {
        console.log('[STREAKS] No completed exercises document found');
        return [];
      }
      
      const data = completedDoc.data();
      const dailyData = data[dateStr] || [];
      
      console.log('[STREAKS] Found completed exercises for date:', dailyData.length);
      
      return dailyData.map((item: any) => ({
        ...item,
        completedAt: item.completedAt?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('[STREAKS] Error getting completed exercises:', error);
      return [];
    }
  }

  // Update completed exercises for a specific date
  async updateCompletedExercises(userId: string, date: Date, exercises: CompletedExercise[]): Promise<void> {
    try {
      // Use the user's local timezone to ensure consistent date handling
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const dateStr = format(localDate, 'yyyy-MM-dd');
      const completedRef = doc(db, 'completedExercises', userId);
      
      await setDoc(completedRef, {
        [dateStr]: exercises.map(ex => ({
          ...ex,
          completedAt: Timestamp.fromDate(ex.completedAt)
        }))
      }, { merge: true });
      
      console.log('[STREAKS] Updated completed exercises for date:', dateStr);
      console.log('[STREAKS] Original date:', date.toISOString());
      console.log('[STREAKS] Local date:', localDate.toISOString());
      console.log('[STREAKS] Date string used:', dateStr);
      console.log('[STREAKS] Exercises completed:', exercises.filter(ex => ex.completed).length);
      
      // Immediately calculate streaks instead of queuing
      await this.calculateAndUpdateStreaks(userId);
    } catch (error) {
      console.error('[STREAKS] Error updating completed exercises:', error);
    }
  }

  // Queue a streak update to prevent spam
  private queueStreakUpdate(userId: string): void {
    this.updateQueue.add(userId);
    
    if (!this.isUpdating) {
      this.processUpdateQueue();
    }
  }

  // Process the update queue with debouncing
  private async processUpdateQueue(): Promise<void> {
    if (this.isUpdating || this.updateQueue.size === 0) return;
    
    this.isUpdating = true;
    
    // Wait a bit to collect multiple updates
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const userIds = Array.from(this.updateQueue);
    this.updateQueue.clear();
    
    for (const userId of userIds) {
      await this.calculateAndUpdateStreaks(userId);
    }
    
    this.isUpdating = false;
    
    // Check if more updates came in while processing
    if (this.updateQueue.size > 0) {
      this.processUpdateQueue();
    }
  }

  // Recalculate all streak data for a user
  async recalculateAllStreakData(userId: string): Promise<void> {
    try {
      console.log('[STREAKS] Recalculating ALL streak data for user:', userId);
      
      const assignedExercises = await this.getAssignedExercises(userId);
      
      // Get all completed exercises data
      const completedRef = doc(db, 'completedExercises', userId);
      const completedDoc = await getDoc(completedRef);
      
      let allCompletedData: { [date: string]: any[] } = {};
      if (completedDoc.exists()) {
        allCompletedData = completedDoc.data();
        console.log('[STREAKS] Found completed exercises for dates:', Object.keys(allCompletedData));
      }
      
      // Create new streak data
      const streakData: StreakData = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalDaysActive: 0,
        totalExercisesCompleted: 0,
        averageCompletionRate: 0,
        streakHistory: [],
        lastUpdated: new Date()
      };
      
      // Get all dates with activity (completed exercises)
      const activityDates = Object.keys(allCompletedData).filter(key => 
        key !== 'userId' && key !== 'lastCompletedDate' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'exercises'
      ).sort();
      
      if (activityDates.length === 0) {
        console.log('[STREAKS] No activity dates found');
        return;
      }
      
      // Create a complete timeline from first activity to today
      const firstDate = new Date(activityDates[0] + 'T00:00:00');
      const today = new Date();
      const allDates: string[] = [];
      
      // Generate all dates from first activity to today
      for (let d = new Date(firstDate); d <= today; d.setDate(d.getDate() + 1)) {
        allDates.push(format(d, 'yyyy-MM-dd'));
      }
      
      console.log('[STREAKS] Processing timeline from', activityDates[0], 'to', format(today, 'yyyy-MM-dd'));
      console.log('[STREAKS] Total dates to process:', allDates.length);
      
      let currentStreak = 0;
      let longestStreak = 0;
      let lastActivityDate: Date | null = null;
      
      for (const dateStr of allDates) {
        const completedExercises = allCompletedData[dateStr] || [];
        const totalAssigned = assignedExercises.length;
        const totalCompleted = completedExercises.filter((ex: any) => ex.completed).length;
        const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
        const allExercisesCompleted = totalCompleted === totalAssigned && totalAssigned > 0;
        
        console.log(`[STREAKS] Date ${dateStr}: ${totalCompleted}/${totalAssigned} (${Math.round(completionRate)}%)`);
        
        const dailyCompletion: DailyCompletion = {
          date: dateStr,
          exercises: completedExercises.map((ex: any) => ({
            ...ex,
            completedAt: ex.completedAt?.toDate() || new Date()
          })),
          totalAssigned,
          totalCompleted,
          completionRate,
          streakStatus: 'none',
          allExercisesCompleted
        };
        
        // Determine streak status
        const currentDate = new Date(dateStr + 'T00:00:00');
        const previousDate = lastActivityDate ? new Date(lastActivityDate) : null;
        
        if (allExercisesCompleted) {
          if (previousDate && isSameDay(previousDate, subDays(currentDate, 1))) {
            // Continue streak (yesterday was active)
            currentStreak += 1;
            dailyCompletion.streakStatus = 'maintained';
            console.log(`[STREAKS] Continuing streak: ${currentStreak}`);
          } else {
            // Start new streak (gap or first day)
            currentStreak = 1;
            dailyCompletion.streakStatus = 'started';
            console.log(`[STREAKS] Starting new streak: ${currentStreak}`);
          }
          lastActivityDate = currentDate;
        } else if (currentStreak > 0 && previousDate && isSameDay(previousDate, subDays(currentDate, 1))) {
          // Break streak (had streak yesterday, didn't complete today)
          currentStreak = 0;
          dailyCompletion.streakStatus = 'broken';
          console.log(`[STREAKS] Breaking streak on ${dateStr}`);
        } else if (currentStreak > 0 && previousDate && !isSameDay(previousDate, subDays(currentDate, 1))) {
          // Streak already broken due to gap
          currentStreak = 0;
          dailyCompletion.streakStatus = 'broken';
          console.log(`[STREAKS] Streak already broken due to gap on ${dateStr}`);
        }
        
        longestStreak = Math.max(currentStreak, longestStreak);
        streakData.streakHistory.push(dailyCompletion);
      }
      
      // Update final streak data
      streakData.currentStreak = currentStreak;
      streakData.longestStreak = longestStreak;
      streakData.lastActivityDate = lastActivityDate;
      
      // Calculate additional stats with safe array operations
      const activeDays = streakData.streakHistory.filter(h => h && h.totalCompleted > 0).length;
      const totalExercises = streakData.streakHistory.length > 0 
        ? streakData.streakHistory.reduce((sum, h) => sum + (h?.totalCompleted || 0), 0)
        : 0;
      const avgCompletion = streakData.streakHistory.length > 0 
        ? streakData.streakHistory.reduce((sum, h) => sum + (h?.completionRate || 0), 0) / streakData.streakHistory.length 
        : 0;
      
      streakData.totalDaysActive = activeDays;
      streakData.totalExercisesCompleted = totalExercises;
      streakData.averageCompletionRate = avgCompletion;
      
      // Save to Firestore
      const streakRef = doc(db, 'streaks', userId);
      await setDoc(streakRef, {
        ...streakData,
        lastActivityDate: streakData.lastActivityDate ? Timestamp.fromDate(streakData.lastActivityDate) : null,
        lastUpdated: Timestamp.fromDate(streakData.lastUpdated),
        streakHistory: streakData.streakHistory.map(h => ({
          ...h,
          exercises: h.exercises.map(ex => ({
            ...ex,
            completedAt: Timestamp.fromDate(ex.completedAt)
          }))
        }))
      });
      
      console.log('[STREAKS] Recalculation complete!');
      console.log('[STREAKS] Current streak:', currentStreak);
      console.log('[STREAKS] Longest streak:', longestStreak);
      console.log('[STREAKS] Total history entries:', streakData.streakHistory.length);
      
    } catch (error) {
      console.error('[STREAKS] Error recalculating streak data:', error);
    }
  }

  // Calculate and update streaks for a user (legacy function)
  async calculateAndUpdateStreaks(userId: string): Promise<void> {
    try {
      console.log('[STREAKS] Calculating streaks for user:', userId);
      
      // Use the improved recalculateAllStreakData function instead
      await this.recalculateAllStreakData(userId);
      
    } catch (error) {
      console.error('[STREAKS] Error calculating streaks:', error);
    }
  }

  // Get streak data for a user
  async getStreakData(userId: string): Promise<StreakData | null> {
    try {
      const streakRef = doc(db, 'streaks', userId);
      const streakDoc = await getDoc(streakRef);
      
      if (!streakDoc.exists()) {
        return null;
      }
      
      const data = streakDoc.data();
      
      // Safely parse dates with validation
      const safeParseDate = (timestamp: any): Date | null => {
        try {
          if (!timestamp) return null;
          if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          if (timestamp && timestamp.seconds) {
            return new Date(timestamp.seconds * 1000);
          }
          if (timestamp && typeof timestamp === 'string') {
            const parsed = new Date(timestamp);
            if (!isNaN(parsed.getTime())) {
              return parsed;
            }
          }
          return new Date();
        } catch (error) {
          console.error('[STREAKS] Error parsing date:', error);
          return new Date();
        }
      };

      return {
        userId: data.userId || userId,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        lastActivityDate: safeParseDate(data.lastActivityDate),
        totalDaysActive: data.totalDaysActive || 0,
        totalExercisesCompleted: data.totalExercisesCompleted || 0,
        averageCompletionRate: data.averageCompletionRate || 0,
        lastUpdated: safeParseDate(data.lastUpdated) || new Date(),
        streakHistory: (data.streakHistory || []).map((item: any) => ({
          ...item,
          date: item.date || format(new Date(), 'yyyy-MM-dd'),
          exercises: (item.exercises || []).map((ex: any) => ({
            ...ex,
            completedAt: safeParseDate(ex.completedAt) || new Date()
          }))
        }))
      } as StreakData;
    } catch (error) {
      console.error('[STREAKS] Error getting streak data:', error);
      return null;
    }
  }

  // Listen to streak data changes
  listenToStreakData(userId: string, callback: (data: StreakData | null) => void): () => void {
    const streakRef = doc(db, 'streaks', userId);
    
    return onSnapshot(streakRef, (doc) => {
      try {
        if (doc.exists()) {
          const data = doc.data();
          
          // Safely parse dates with validation
          const safeParseDate = (timestamp: any): Date | null => {
            try {
              if (!timestamp) return null;
              if (timestamp && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
              }
              if (timestamp && timestamp.seconds) {
                return new Date(timestamp.seconds * 1000);
              }
              if (timestamp && typeof timestamp === 'string') {
                const parsed = new Date(timestamp);
                if (!isNaN(parsed.getTime())) {
                  return parsed;
                }
              }
              return new Date();
            } catch (error) {
              console.error('[STREAKS] Error parsing date:', error);
              return new Date();
            }
          };

          const streakData: StreakData = {
            userId: data.userId || userId,
            currentStreak: data.currentStreak || 0,
            longestStreak: data.longestStreak || 0,
            lastActivityDate: safeParseDate(data.lastActivityDate),
            totalDaysActive: data.totalDaysActive || 0,
            totalExercisesCompleted: data.totalExercisesCompleted || 0,
            averageCompletionRate: data.averageCompletionRate || 0,
            lastUpdated: safeParseDate(data.lastUpdated) || new Date(),
            streakHistory: (data.streakHistory || []).map((item: any) => ({
              ...item,
              date: item.date || format(new Date(), 'yyyy-MM-dd'),
              exercises: (item.exercises || []).map((ex: any) => ({
                ...ex,
                completedAt: safeParseDate(ex.completedAt) || new Date()
              }))
            }))
          };
          callback(streakData);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('[STREAKS] Error in listenToStreakData:', error);
        callback(null);
      }
    });
  }
}

export const streaksService = StreaksService.getInstance();
