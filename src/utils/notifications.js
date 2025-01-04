import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { immunizationApi } from '../api/immunization';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const setupNotifications = async () => {
  try {
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

    // Set up notification response handler
    Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return true;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
};

const handleNotificationResponse = async (response) => {
  try {
    const { notification, actionIdentifier } = response;
    const { vaccineId, dueDate } = notification.request.content.data;

    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('No token found');

    switch (actionIdentifier) {
      case 'SNOOZE':
        // Reschedule for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9 AM

        await scheduleVaccineReminder(
          { id: vaccineId },
          dueDate,
          { reminderDays: 1, reminderTime: '09:00' }
        );
        break;

      case 'COMPLETE':
        // Mark vaccine as completed
        await immunizationApi.markVaccineCompleted(token, {
          vaccine_id: vaccineId,
          given_at: new Date().toISOString(),
          administered_by: '',
          administered_at: '',
          notes: 'Marked as completed from notification'
        });
        break;
    }
  } catch (error) {
    console.error('Error handling notification response:', error);
  }
};

export const scheduleVaccineReminder = async (vaccine, dueDate, reminderSettings) => {
  try {
    // Get stored reminder settings
    const storedSettings = await AsyncStorage.getItem('vaccineReminderSettings');
    const settings = storedSettings ? JSON.parse(storedSettings) : {
      enabled: true,
      reminderDays: 7,
      reminderTime: '09:00'
    };

    // Use provided settings or fall back to stored settings
    const { reminderDays = settings.reminderDays, reminderTime = settings.reminderTime } = reminderSettings;
    
    const trigger = new Date(dueDate);
    const [hours, minutes] = reminderTime.split(':');
    
    trigger.setDate(trigger.getDate() - reminderDays);
    trigger.setHours(parseInt(hours), parseInt(minutes), 0);

    // Cancel any existing reminder for this vaccine
    await cancelVaccineReminder(vaccine.id);

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

    return true;
  } catch (error) {
    console.error('Error scheduling vaccine reminder:', error);
    return false;
  }
};

export const cancelVaccineReminder = async (vaccineId) => {
  try {
    const notifications = await AsyncStorage.getItem('vaccineNotifications');
    if (notifications) {
      const notificationsObj = JSON.parse(notifications);
      if (notificationsObj[vaccineId]) {
        await Notifications.cancelScheduledNotificationAsync(notificationsObj[vaccineId]);
        delete notificationsObj[vaccineId];
        await AsyncStorage.setItem('vaccineNotifications', JSON.stringify(notificationsObj));
      }
    }
    return true;
  } catch (error) {
    console.error('Error canceling vaccine reminder:', error);
    return false;
  }
}; 