import { BackgroundService } from 'react-native-background-timer';

class BackgroundService {
  constructor() {
    this.timer = null;
    this.isForeground = false;
  }

  startService() {
    this.timer = BackgroundService.startBackgroundTimer(1000);
  }

  stopService() {
    BackgroundService.stopBackgroundTimer(this.timer);
  }

  addEventListener(event, callback) {
    BackgroundService.addEventListener(event, callback);
  }

  removeEventListener(event, callback) {
    BackgroundService.removeEventListener(event, callback);
  }
}

export default BackgroundService;