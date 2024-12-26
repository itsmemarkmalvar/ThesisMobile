import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const setupNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  // Configure notification categories
  await Notifications.setNotificationCategoryAsync('VACCINE_REMINDER', [
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Remind me tomorrow',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'COMPLETE',
      buttonTitle: 'Mark as completed',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  return true;
};

export const scheduleVaccineReminder = async (vaccine, dueDate, reminderSettings) => {
  const { reminderDays = 7, reminderTime = '09:00' } = reminderSettings;
  
  const trigger = new Date(dueDate);
  const [hours, minutes] = reminderTime.split(':');
  
  trigger.setDate(trigger.getDate() - reminderDays);
  trigger.setHours(parseInt(hours), parseInt(minutes), 0);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Upcoming Vaccination',
      body: `${vaccine.name} is due in ${reminderDays} days`,
      data: { vaccineId: vaccine.id, dueDate },
      categoryIdentifier: 'VACCINE_REMINDER',
      sound: true,
    },
    trigger,
  });

  // Store notification ID for management
  const notifications = await AsyncStorage.getItem('vaccineNotifications');
  const notificationsObj = notifications ? JSON.parse(notifications) : {};
  notificationsObj[vaccine.id] = notificationId;
  await AsyncStorage.setItem('vaccineNotifications', JSON.stringify(notificationsObj));
};

export const cancelVaccineReminder = async (vaccineId) => {
  const notifications = await AsyncStorage.getItem('vaccineNotifications');
  if (notifications) {
    const notificationsObj = JSON.parse(notifications);
    if (notificationsObj[vaccineId]) {
      await Notifications.cancelScheduledNotificationAsync(notificationsObj[vaccineId]);
      delete notificationsObj[vaccineId];
      await AsyncStorage.setItem('vaccineNotifications', JSON.stringify(notificationsObj));
    }
  }
}; 