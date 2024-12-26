import NetInfo from '@react-native-community/netinfo';
import { diaperService } from '../services/diaperService';

class SyncManager {
  constructor() {
    this.isOnline = false;
    this.isSyncing = false;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      if (wasOffline && this.isOnline) {
        this.syncData();
      }
    });
  }

  async syncData() {
    if (this.isSyncing || !this.isOnline) return;

    try {
      this.isSyncing = true;
      await diaperService.syncWithServer();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncManager = new SyncManager(); 