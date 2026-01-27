'use client';

import React, { useState, useEffect } from 'react';

async function getOnlineCount() {
  try {
    const response = await fetch('/api/users/online'); // Assuming an API endpoint for online count
    if (!response.ok) {
      throw new Error('Failed to fetch online count');
    }
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching online count:', error);
    return 0; // Return 0 in case of error
  }
}

const OnlineCounter = () => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const count = await getOnlineCount();
      setOnlineCount(count);
    };

    fetchCount();
    const intervalId = setInterval(fetchCount, 15000); // Fetch every 15 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-green-500"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3-9a1 1 0 000 2h4a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm font-medium">{onlineCount} users online</span>
    </div>
  );
};

export default OnlineCounter;
