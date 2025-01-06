import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setupNotifications = async () => {
  try {
    await Notifications.setNotificationChannelAsync('vaccine-reminders', {
      name: 'Vaccine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
};

export const scheduleVaccineReminder = async (vaccine, date, settings) => {
  try {
    // Cancel any existing reminder first
    await cancelVaccineReminder(vaccine.id);

    if (!settings.enabled) return;

    const trigger = new Date(date);
    const [hours, minutes] = settings.reminderTime.split(':');
    
    trigger.setDate(trigger.getDate() - settings.reminderDays);
    trigger.setHours(parseInt(hours), parseInt(minutes), 0);

    // Only schedule if the trigger time is in the future
    if (trigger > new Date()) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming Vaccination',
          body: `${vaccine.name} is due in ${settings.reminderDays} days`,
          data: { vaccineId: vaccine.id, dueDate: date },
          sound: true,
        },
        trigger,
      });

      // Store the notification ID
      const notifications = await AsyncStorage.getItem('vaccineNotifications');
      const notificationsObj = notifications ? JSON.parse(notifications) : {};
      notificationsObj[vaccine.id] = notificationId;
      await AsyncStorage.setItem('vaccineNotifications', JSON.stringify(notificationsObj));

      return notificationId;
    }
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    throw error;
  }
};

export const cancelVaccineReminder = async (vaccineId) => {
  try {
    const notifications = await AsyncStorage.getItem('vaccineNotifications');
    if (notifications) {
      const notificationsObj = JSON.parse(notifications);
      const notificationId = notificationsObj[vaccineId];
      
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        delete notificationsObj[vaccineId];
        await AsyncStorage.setItem('vaccineNotifications', JSON.stringify(notificationsObj));
      }
    }
  } catch (error) {
    console.error('Error canceling reminder:', error);
    throw error;
  }
}; 