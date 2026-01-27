import { BackgroundGeolocation } from '@capacitor/background-geolocation';

class BackgroundGeolocation {
  async start() {
    await BackgroundGeolocation.start();
  }

  async stop() {
    await BackgroundGeolocation.stop();
  }

  async addEventListener(event, callback) {
    await BackgroundGeolocation.addEventListener(event, callback);
  }

  async removeEventListener(event, callback) {
    await BackgroundGeolocation.removeEventListener(event, callback);
  }
}

export default BackgroundGeolocation;