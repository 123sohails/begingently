// Prayer Times and Notifications for BeginGently
(function() {
  'use strict';

  // Prayer times API configuration
  const PRAYER_API = 'https://api.aladhan.com/v1/timings';
  const CALCULATION_METHOD = '3'; // Muslim World League (perfect for India)
  
  let prayerTimes = {};
  let nextPrayer = null;
  let notificationPermission = false;
  let reminders = {};

  // Initialize prayer times
  async function initPrayerTimes() {
    try {
      const location = await getUserLocation();
      const today = new Date().toISOString().split('T')[0];
      const url = `${PRAYER_API}/${today}?latitude=${location.lat}&longitude=${location.lon}&method=${CALCULATION_METHOD}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 200) {
        prayerTimes = data.data.timings;
        updatePrayerDisplay();
        scheduleReminders();
        console.log('Prayer times loaded successfully');
      }
    } catch (error) {
      console.log('Error loading prayer times:', error);
      // Fallback to default times
      loadDefaultPrayerTimes();
    }
  }

  // Get user location
  async function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }),
          (error) => {
            // Fallback to India location
            resolve({ lat: 28.6139, lon: 77.2090 }); // New Delhi, India
          }
        );
      } else {
        resolve({ lat: 28.6139, lon: 77.2090 }); // New Delhi, India
      }
    });
  }

  // Load default prayer times (fallback)
  function loadDefaultPrayerTimes() {
    prayerTimes = {
      Fajr: '05:15',
      Dhuhr: '12:30',
      Asr: '15:45',
      Maghrib: '18:30',
      Isha: '19:45'
    };
    updatePrayerDisplay();
    scheduleReminders();
  }

  // Update prayer times display
  function updatePrayerDisplay() {
    const container = document.getElementById('prayer-times-container');
    if (!container) return;

    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr, icon: '🌅' },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr, icon: '☀️' },
      { name: 'Asr', time: prayerTimes.Asr, icon: '🌤️' },
      { name: 'Maghrib', time: prayerTimes.Maghrib, icon: '🌅' },
      { name: 'Isha', time: prayerTimes.Isha, icon: '🌙' }
    ];

    const currentTime = new Date();
    nextPrayer = findNextPrayer(currentTime, prayers);

    let html = '<div class="prayer-times-widget">';
    html += '<h3>🕌 Today\'s Prayers</h3>';
    html += '<div class="prayer-times-list">';

    prayers.forEach(prayer => {
      const isNext = nextPrayer && nextPrayer.name === prayer.name;
      const hasPassed = hasPrayerPassed(currentTime, prayer.time);
      
      html += `
        <div class="prayer-time ${isNext ? 'next-prayer' : ''} ${hasPassed ? 'passed' : ''}">
          <span class="prayer-icon">${prayer.icon}</span>
          <span class="prayer-name">${prayer.name}</span>
          <span class="prayer-time">${formatTime(prayer.time)}</span>
          ${isNext ? '<span class="next-badge">Next</span>' : ''}
        </div>
      `;
    });

    html += '</div>';
    
    if (nextPrayer) {
      const timeUntil = getTimeUntil(nextPrayer.time, currentTime);
      html += `<div class="next-prayer-info">⏰ Next: ${nextPrayer.name} in ${timeUntil}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // Find next prayer
  function findNextPrayer(currentTime, prayers) {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    for (let prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      if (prayerMinutes > currentMinutes) {
        return prayer;
      }
    }
    
    // If all prayers passed, return tomorrow's Fajr
    return prayers[0];
  }

  // Check if prayer has passed
  function hasPrayerPassed(currentTime, prayerTime) {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [hours, minutes] = prayerTime.split(':').map(Number);
    const prayerMinutes = hours * 60 + minutes;
    return prayerMinutes < currentMinutes;
  }

  // Format time
  function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Get time until prayer
  function getTimeUntil(prayerTime, currentTime) {
    const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(prayerHours, prayerMinutes, 0, 0);
    
    if (prayerDate <= currentTime) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const diff = prayerDate - currentTime;
    const timeHours = Math.floor(diff / (1000 * 60 * 60));
    const timeMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (timeHours > 0) {
      return `${timeHours}h ${timeMinutes}m`;
    } else {
      return `${timeMinutes} minutes`;
    }
  }

  // Request notification permission
  async function requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      notificationPermission = permission === 'granted';
      return notificationPermission;
    }
    return false;
  }

  // Schedule prayer reminders
  function scheduleReminders() {
    if (!notificationPermission) return;

    // Check every minute for prayer times
    setInterval(() => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      Object.entries(prayerTimes).forEach(([name, time]) => {
        const [prayerHours, prayerMinutes] = time.split(':').map(Number);
        const prayerMinutesTotal = prayerHours * 60 + prayerMinutes;
        
        // Check if it's prayer time (within 1 minute)
        if (Math.abs(currentMinutes - prayerMinutesTotal) <= 1) {
          const reminderKey = `${name}_${now.toDateString()}`;
          if (!reminders[reminderKey]) {
            sendPrayerNotification(name);
            reminders[reminderKey] = true;
          }
        }
      });
    }, 60000); // Check every minute
  }

  // Send prayer notification
  function sendPrayerNotification(prayerName) {
    if (!notificationPermission) return;

    const notification = new Notification(`🕌 Time for ${prayerName} Prayer`, {
      body: `It's time to perform your ${prayerName} prayer. May Allah accept your worship.`,
      icon: '/favicon.ico',
      tag: 'prayer-time',
      requireInteraction: true
    });

    // Auto-close after 30 seconds
    setTimeout(() => {
      notification.close();
    }, 30000);

    console.log(`Prayer notification sent for ${prayerName}`);
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    requestNotificationPermission();
    
    // Load prayer times
    initPrayerTimes();
    
    // Update every minute
    setInterval(updatePrayerDisplay, 60000);
  });

  // Make functions globally available
  window.prayerTimesAPI = {
    refresh: initPrayerTimes,
    requestPermission: requestNotificationPermission
  };
})();
