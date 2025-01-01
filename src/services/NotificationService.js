import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addHours, parseISO } from 'date-fns';

class NotificationService {
  constructor() {
    this.configure();
  }

  async configure() {
    // Configure notifications
    await Notifications.setNotificationChannelAsync('feeding-reminders', {
      name: 'Feeding Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9A9E',
    });

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    return true;
  }

  async scheduleFeedingReminder(lastFeedingTime, type) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    // Calculate next feeding time based on type
    let nextFeedingHours;
    switch (type) {
      case 'breast':
        nextFeedingHours = 2; // Remind after 2 hours for breastfeeding
        break;
      case 'bottle':
        nextFeedingHours = 3; // Remind after 3 hours for bottle feeding
        break;
      case 'solid':
        nextFeedingHours = 4; // Remind after 4 hours for solid food
        break;
      default:
        nextFeedingHours = 3;
    }

    const nextFeedingTime = addHours(
      typeof lastFeedingTime === 'string' ? parseISO(lastFeedingTime) : lastFeedingTime,
      nextFeedingHours
    );

    // Cancel any existing reminders
    await this.cancelFeedingReminders();

    // Schedule new reminder
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Feeding Reminder',
        body: `Time to feed your baby! Last ${type} feeding was ${format(lastFeedingTime, 'h:mm a')}`,
        data: { type },
      },
      trigger: {
        date: nextFeedingTime,
      },
    });

    // Store the reminder ID
    await AsyncStorage.setItem('lastFeedingReminderId', identifier);
    await AsyncStorage.setItem('nextFeedingTime', nextFeedingTime.toISOString());

    return identifier;
  }

  async cancelFeedingReminders() {
    const reminderId = await AsyncStorage.getItem('lastFeedingReminderId');
    if (reminderId) {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
      await AsyncStorage.removeItem('lastFeedingReminderId');
      await AsyncStorage.removeItem('nextFeedingTime');
    }
  }

  async getNextFeedingTime() {
    const nextFeedingTime = await AsyncStorage.getItem('nextFeedingTime');
    return nextFeedingTime ? parseISO(nextFeedingTime) : null;
  }

  // For development/testing
  async scheduleTestNotification() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification',
      },
      trigger: {
        seconds: 5,
      },
    });

    return identifier;
  }
}

export default new NotificationService(); 