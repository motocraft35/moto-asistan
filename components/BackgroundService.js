import React from 'react';
import { useEffect, useState } from 'react';
import { BackgroundService } from './BackgroundService';

const BackgroundServiceComponent = () => {
  const [isForeground, setIsForeground] = useState(false);

  useEffect(() => {
    const backgroundService = new BackgroundService();
    backgroundService.startService();

    const handleForegroundChange = () => {
      setIsForeground(true);
    };

    const handleBackgroundChange = () => {
      setIsForeground(false);
    };

    backgroundService.addEventListener('foreground', handleForegroundChange);
    backgroundService.addEventListener('background', handleBackgroundChange);

    return () => {
      backgroundService.removeEventListener('foreground', handleForegroundChange);
      backgroundService.removeEventListener('background', handleBackgroundChange);
    };
  }, []);

  return (
    <div>
      {isForeground ? (
        <div>Uygulama ön planda</div>
      ) : (
        <div>Uygulama arka planda</div>
      )}
    </div>
  );
};

export default BackgroundServiceComponent;