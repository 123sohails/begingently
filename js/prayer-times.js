// Prayer Times and Notifications for BeginGently
(function() {
  'use strict';

  // Prayer times API configuration
  const PRAYER_API = 'https://aladhan.api.islamic.network/v1';
  const CALCULATION_METHOD = '3'; // Muslim World League (perfect for India)
  
  let prayerTimes = {};
  let nextPrayer = null;
  let notificationPermission = false;
  let reminders = {};

  // Initialize prayer times
  async function initPrayerTimes() {
    try {
      console.log('🕌 Initializing prayer times...');
      showLocationStatus('Detecting your location...');
      
      // Try to get user location with timeout
      const location = await getUserLocationWithTimeout();
      console.log('📍 Location obtained:', location);
      
      // Update location status in UI
      updateLocationStatus({ success: true, lat: location.lat, lon: location.lon });
      
      // Format date as DD-MM-YYYY (API requirement)
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      
      const url = `${PRAYER_API}/timings/${formattedDate}?latitude=${location.lat}&longitude=${location.lon}&method=${CALCULATION_METHOD}`;
      
      console.log('🌐 Fetching prayer times for:', location.lat, location.lon, 'Date:', formattedDate);
      console.log('🔗 API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200) {
        prayerTimes = data.data.timings;
        console.log('✅ Prayer times loaded successfully:', prayerTimes);
        updatePrayerDisplay();
        scheduleReminders();
      } else {
        throw new Error(`API error: ${data.status}`);
      }
    } catch (error) {
      console.log('❌ Error loading prayer times:', error);
      // Always fallback to default times
      loadDefaultPrayerTimes();
    }
  }

  // Get user location with timeout and better error handling
  async function getUserLocationWithTimeout() {
    return new Promise((resolve) => {
      // Fallback immediately to India location
      const fallbackLocation = { lat: 28.6139, lon: 77.2090 }; // New Delhi
      
      if (!navigator.geolocation) {
        console.log('Geolocation not supported, using India fallback');
        resolve(fallbackLocation);
        return;
      }

      // Check if HTTPS (required for geolocation in most browsers)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.log('Geolocation requires HTTPS, using India fallback');
        showLocationPermissionMessage('HTTPS required for location access');
        resolve(fallbackLocation);
        return;
      }

      // Check current permission status
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          console.log('Location permission state:', result.state);
          if (result.state === 'denied') {
            console.log('Location permission denied, using India fallback');
            showLocationPermissionMessage('Location permission denied. Using New Delhi location.');
            resolve(fallbackLocation);
            return;
          }
          // If granted or prompt, proceed with location request
          requestLocationWithTimeout(fallbackLocation, resolve);
        }).catch(() => {
          // Permissions API not supported, proceed anyway
          requestLocationWithTimeout(fallbackLocation, resolve);
        });
      } else {
        // Permissions API not supported, proceed directly
        requestLocationWithTimeout(fallbackLocation, resolve);
      }
    });
  }

  // Request location with timeout
  function requestLocationWithTimeout(fallbackLocation, resolve) {
    console.log('Requesting user location...');
    
    // Set timeout for location request (5 seconds)
    const timeoutId = setTimeout(() => {
      console.log('Location request timeout, using India fallback');
      showLocationPermissionMessage('Location request timeout. Using New Delhi location.');
      resolve(fallbackLocation);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        console.log('Location detected:', location);
        showLocationPermissionMessage('✅ Location detected successfully!');
        resolve(location);
      },
      (error) => {
        clearTimeout(timeoutId);
        let errorType = 'Unknown error';
        let userMessage = 'Location access failed. Using New Delhi location.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'Permission denied';
            userMessage = 'Location permission denied. Using New Delhi location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'Position unavailable';
            userMessage = 'Location unavailable. Using New Delhi location.';
            break;
          case error.TIMEOUT:
            errorType = 'Request timeout';
            userMessage = 'Location request timeout. Using New Delhi location.';
            break;
        }
        console.log('Location error (' + errorType + '):', error.message, 'using India fallback');
        showLocationPermissionMessage(userMessage);
        resolve(fallbackLocation);
      },
      {
        timeout: 5000,
        enableHighAccuracy: true,
        maximumAge: 60000 // Accept cached location up to 1 minute old
      }
    );
  }

  // Show location permission message to user
  function showLocationPermissionMessage(message) {
    const statusElement = document.getElementById('location-status-text');
    if (statusElement) {
      statusElement.innerHTML = message;
      statusElement.style.color = message.includes('✅') ? '#27ae60' : '#f39c12';
    }
  }

  // Load default prayer times (fallback)
  function loadDefaultPrayerTimes() {
    console.log('Using default India prayer times');
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

  // Test API directly
  async function testAPI() {
    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      
      const testUrl = `${PRAYER_API}/timings/${formattedDate}?latitude=28.6139&longitude=77.2090&method=3`;
      console.log('Testing API with URL:', testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.code === 200) {
        console.log('API is working! Prayer times:', data.data.timings);
        return true;
      } else {
        console.log('API returned error:', data);
        return false;
      }
    } catch (error) {
      console.log('API test failed:', error);
      return false;
    }
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
    html += '<div class="location-status">';
    html += '<p>📍 <strong>Location:</strong> <span id="current-location">Detecting...</span> <button id="refresh-location" class="refresh-btn" style="margin-left: 10px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer;">🔄 Refresh</button> <button id="manual-location" class="manual-btn" style="margin-left: 5px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer;">📍 Set Location</button></p>';
    html += '<div id="manual-location-form" style="display: none; margin-top: 10px; padding: 10px; background: var(--neutral-light); border-radius: 6px;">';
    html += '<p style="margin: 0 0 8px 0; font-size: 14px;">Enter your coordinates (decimal degrees):</p>';
    html += '<div style="display: flex; gap: 10px; align-items: center;">';
    html += '<input type="number" id="lat-input" placeholder="Latitude" step="0.0001" min="-90" max="90" style="padding: 4px; border: 1px solid var(--sand); border-radius: 4px; width: 100px;">';
    html += '<input type="number" id="lon-input" placeholder="Longitude" step="0.0001" min="-180" max="180" style="padding: 4px; border: 1px solid var(--sand); border-radius: 4px; width: 100px;">';
    html += '<button id="set-manual-location" style="padding: 4px 12px; border: 1px solid var(--primary); border-radius: 4px; background: var(--primary); color: white; cursor: pointer;">Set</button>';
    html += '<button id="cancel-manual-location" style="padding: 4px 8px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer;">Cancel</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
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
    
    // Add refresh button event listener
    const refreshBtn = document.getElementById('refresh-location');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('🔄 Manual location refresh triggered');
        refreshBtn.textContent = '🔄 Refreshing...';
        refreshBtn.disabled = true;
        initPrayerTimes().then(() => {
          refreshBtn.textContent = '🔄 Refresh';
          refreshBtn.disabled = false;
        });
      });
    }
    
    // Add manual location button event listener
    const manualLocationBtn = document.getElementById('manual-location');
    const manualLocationForm = document.getElementById('manual-location-form');
    const setManualBtn = document.getElementById('set-manual-location');
    const cancelManualBtn = document.getElementById('cancel-manual-location');
    
    if (manualLocationBtn && manualLocationForm) {
      manualLocationBtn.addEventListener('click', () => {
        manualLocationForm.style.display = manualLocationForm.style.display === 'none' ? 'block' : 'none';
      });
    }
    
    if (setManualBtn) {
      setManualBtn.addEventListener('click', () => {
        const latInput = document.getElementById('lat-input');
        const lonInput = document.getElementById('lon-input');
        
        if (latInput && lonInput) {
          const lat = parseFloat(latInput.value);
          const lon = parseFloat(lonInput.value);
          
          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            console.log('📍 Manual location set:', { lat, lon });
            const manualLocation = { lat, lon };
            updateLocationStatus({ success: true, lat, lon });
            loadPrayerTimesForLocation(manualLocation);
            manualLocationForm.style.display = 'none';
          } else {
            alert('Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)');
          }
        }
      });
    }
    
    if (cancelManualBtn) {
      cancelManualBtn.addEventListener('click', () => {
        manualLocationForm.style.display = 'none';
      });
    }
  }

  // Load prayer times for specific location
  async function loadPrayerTimesForLocation(location) {
    try {
      console.log('🌐 Loading prayer times for manual location:', location);
      
      // Format date as DD-MM-YYYY (API requirement)
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      
      const url = `${PRAYER_API}/timings/${formattedDate}?latitude=${location.lat}&longitude=${location.lon}&method=${CALCULATION_METHOD}`;
      
      console.log('🔗 API URL for manual location:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200) {
        prayerTimes = data.data.timings;
        console.log('✅ Manual location prayer times loaded:', prayerTimes);
        updatePrayerDisplay();
        scheduleReminders();
      } else {
        throw new Error(`API error: ${data.status}`);
      }
    } catch (error) {
      console.log('❌ Error loading manual location prayer times:', error);
      loadDefaultPrayerTimes();
    }
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
    console.log('Prayer Times: Initializing...');
    
    // Show location status
    showLocationStatus();
    
    // Test API first
    testAPI().then((isWorking) => {
      if (isWorking) {
        console.log('Prayer Times: API is working, loading prayer times...');
      } else {
        console.log('Prayer Times: API test failed, using fallback');
      }
    });
    
    // Test location
    testLocation().then((location) => {
      console.log('Prayer Times: Location test result:', location);
      updateLocationStatus(location);
    });
    
    // Request notification permission
    requestNotificationPermission();
    
    // Load prayer times
    initPrayerTimes();
    
    // Update every minute
    setInterval(updatePrayerDisplay, 60000);
  });

  // Show location status to user
  function showLocationStatus(message = 'Checking...') {
    const container = document.getElementById('prayer-times-container');
    if (container) {
      const statusHtml = `
        <div class="location-status">
          <p>📍 <strong>Location Status:</strong> <span id="location-status-text">${message}</span></p>
        </div>
      `;
      container.innerHTML = statusHtml;
    }
  }

  // Update location status
  function updateLocationStatus(locationResult) {
    const statusElement = document.getElementById('location-status-text');
    const locationElement = document.getElementById('current-location');
    
    if (statusElement) {
      if (locationResult.success) {
        const coords = `${locationResult.lat.toFixed(4)}°, ${locationResult.lon.toFixed(4)}°`;
        statusElement.innerHTML = `✅ Located (${coords})`;
        statusElement.style.color = '#27ae60';
        if (locationElement) {
          locationElement.textContent = coords;
        }
      } else {
        statusElement.innerHTML = `🏛️ Using New Delhi (location ${locationResult.error || 'not available'})`;
        statusElement.style.color = '#f39c12';
        if (locationElement) {
          locationElement.textContent = 'New Delhi (fallback)';
        }
      }
    }
  }

  // Test location detection
  async function testLocation() {
    try {
      console.log('Testing location detection...');
      
      if (!navigator.geolocation) {
        return { success: false, error: 'Geolocation not supported' };
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve({ success: false, error: 'Location request timeout' });
        }, 3000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            const location = {
              success: true,
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            console.log('Location test successful:', location);
            resolve(location);
          },
          (error) => {
            clearTimeout(timeoutId);
            const errorInfo = {
              success: false,
              error: error.message,
              code: error.code
            };
            console.log('Location test failed:', errorInfo);
            resolve(errorInfo);
          },
          {
            timeout: 3000,
            enableHighAccuracy: false
          }
        );
      });
    } catch (error) {
      console.log('Location test exception:', error);
      return { success: false, error: error.message };
    }
  }

  // Make functions globally available
  window.prayerTimesAPI = {
    refresh: initPrayerTimes,
    requestPermission: requestNotificationPermission
  };
})();
