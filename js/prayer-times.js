// Prayer Times and Notifications for BeginGently
(function() {
  'use strict';

  // Prayer times API configuration
  const PRAYER_API = 'https://islamicapi.com/api/v1/prayer-time';
  let CALCULATION_METHOD = '2'; // Islamic Society of North America (better for India)
  let SCHOOL = '2'; // Hanafi school (common in India)
  const API_KEY = '9TDRzUjl1Q5gyaBhTR3C5gA9RHlrhRO27hAIHCBTWHlDfy82'; // Your API key
  
  let prayerTimes = {};
  let nextPrayer = null;
  let notificationPermission = false;
  let reminders = {};
  let apiData = null; // Store full API response for additional data

  // Major cities database with coordinates
  const cities = [
    { name: "New York", country: "USA", lat: 40.7128, lon: -74.0060 },
    { name: "London", country: "UK", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
    { name: "Mumbai", country: "India", lat: 19.0760, lon: 72.8777 },
    { name: "Delhi", country: "India", lat: 28.6139, lon: 77.2090 },
    { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
    { name: "Dubai", country: "UAE", lat: 25.2048, lon: 55.2708 },
    { name: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357 },
    { name: "Istanbul", country: "Turkey", lat: 41.0082, lon: 28.9784 },
    { name: "Jakarta", country: "Indonesia", lat: -6.2088, lon: 106.8456 },
    { name: "Karachi", country: "Pakistan", lat: 24.8607, lon: 67.0011 },
    { name: "Lahore", country: "Pakistan", lat: 31.5497, lon: 74.3436 },
    { name: "Mecca", country: "Saudi Arabia", lat: 21.3891, lon: 39.8579 },
    { name: "Medina", country: "Saudi Arabia", lat: 24.4707, lon: 39.6122 },
    { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lon: 46.6753 },
    { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lon: 101.6869 },
    { name: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Bangkok", country: "Thailand", lat: 13.7563, lon: 100.5018 },
    { name: "Los Angeles", country: "USA", lat: 34.0522, lon: -118.2437 },
    { name: "Chicago", country: "USA", lat: 41.8781, lon: -87.6298 },
    { name: "Toronto", country: "Canada", lat: 43.6532, lon: -79.3832 },
    { name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
    { name: "Melbourne", country: "Australia", lat: -37.8136, lon: 144.9631 },
    { name: "Berlin", country: "Germany", lat: 52.5200, lon: 13.4050 },
    { name: "Moscow", country: "Russia", lat: 55.7558, lon: 37.6173 },
    { name: "Beijing", country: "China", lat: 39.9042, lon: 116.4074 },
    { name: "Shanghai", country: "China", lat: 31.2304, lon: 121.4737 },
    { name: "Hong Kong", country: "China", lat: 22.3193, lon: 114.1694 },
    { name: "Seoul", country: "South Korea", lat: 37.5665, lon: 126.9780 }
  ];

  // Initialize prayer times
  async function initPrayerTimes() {
    try {
      console.log('🕌 Initializing prayer times...');
      showLocationStatus('🗺️ Detecting your location...');
      
      // Try to get user location with timeout
      const location = await getUserLocationWithTimeout();
      console.log('📍 Location obtained:', location);
      
      // Check if we got the fallback location (New Delhi)
      const isFallback = location.lat === 28.6139 && location.lon === 77.2090;
      
      if (isFallback) {
        console.log('⚠️ Browser geolocation failed, trying IP location as primary fallback...');
        // Try IP location automatically when browser geolocation fails
        const ipLocation = await getLocationFromIP();
        if (ipLocation) {
          console.log('✅ IP location detected automatically:', ipLocation);
          updateLocationStatus({ 
            success: true, 
            lat: ipLocation.lat, 
            lon: ipLocation.lon,
            city: ipLocation.city,
            error: null 
          });
          
          const url = `${PRAYER_API}/?lat=${ipLocation.lat}&lon=${ipLocation.lon}&method=${CALCULATION_METHOD}&school=${SCHOOL}&api_key=${API_KEY}`;
          await loadPrayerTimesFromURL(url);
          return;
        }
      }
      
      // Update location status in UI
      updateLocationStatus({ 
        success: !isFallback, 
        lat: location.lat, 
        lon: location.lon,
        error: isFallback ? 'Using default location' : null 
      });
      
      const url = `${PRAYER_API}/?lat=${location.lat}&lon=${location.lon}&method=${CALCULATION_METHOD}&school=${SCHOOL}&api_key=${API_KEY}`;
      await loadPrayerTimesFromURL(url);
      
    } catch (error) {
      console.log('❌ Error loading prayer times:', error);
      showLocationStatus('❌ Error loading prayer times');
      // Always fallback to default times
      loadDefaultPrayerTimes();
    }
  }

  // Load prayer times from URL (extracted for reuse)
  async function loadPrayerTimesFromURL(url) {
    try {
      console.log('🌐 Fetching prayer times...');
      console.log('🔗 API URL:', url);
      
      showLocationStatus('⏱️ Loading prayer times...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200 && data.status === 'success') {
        prayerTimes = data.data.times;
        apiData = data.data; // Store full API response
        console.log('✅ Prayer times loaded successfully:', prayerTimes);
        console.log('📅 Hijri date:', data.data.date.hijri);
        console.log('🧭 Qibla direction:', data.data.qibla);
        updatePrayerDisplay();
        updateHijriDate();
        updateQiblaInfo();
        scheduleReminders();
      } else {
        throw new Error(`API error: ${data.message || data.status}`);
      }
    } catch (error) {
      console.log('❌ Error loading prayer times:', error);
      showLocationStatus('❌ Error loading prayer times');
      loadDefaultPrayerTimes();
    }
  }

  // Get user location with timeout and better error handling
  async function getUserLocationWithTimeout() {
    return new Promise((resolve) => {
      // Fallback immediately to India location
      const fallbackLocation = { lat: 28.6139, lon: 77.2090 }; // New Delhi
      
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported, using India fallback');
        resolve(fallbackLocation);
        return;
      }

      console.log('🌐 Browser protocol:', location.protocol);
      console.log('🌐 Hostname:', location.hostname);
      
      // Check if HTTPS (required for geolocation in most browsers)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.log('❌ Geolocation requires HTTPS, using India fallback');
        showLocationPermissionMessage('HTTPS required for location access');
        resolve(fallbackLocation);
        return;
      }

      console.log('✅ Location access should be available, requesting permission...');

      // Try direct geolocation request first (more aggressive)
      requestLocationWithTimeout(fallbackLocation, resolve);
    });
  }

  // Request location with timeout
  function requestLocationWithTimeout(fallbackLocation, resolve) {
    console.log('🗺️ Requesting user location...');
    
    // Set timeout for location request (10 seconds for better reliability)
    const timeoutId = setTimeout(() => {
      console.log('⏰ Location request timeout, using India fallback');
      resolve(fallbackLocation);
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        console.log('✅ Location detected:', location);
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
        console.log(`❌ Location error (${errorType}):`, error.message);
        resolve(fallbackLocation);
      },
      {
        timeout: 10000,
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
    console.log('🏛️ Using default India prayer times');
    showLocationStatus('🏛️ Using default India prayer times');
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
      const testUrl = `${PRAYER_API}/?lat=28.6139&lon=77.2090&method=${CALCULATION_METHOD}&school=${SCHOOL}&api_key=${API_KEY}`;
      console.log('Testing API with URL:', testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.code === 200 && data.status === 'success') {
        console.log('✅ API is working! Prayer times:', data.data.times);
        return true;
      } else {
        console.log('❌ API returned error:', data);
        return false;
      }
    } catch (error) {
      console.log('❌ API test failed:', error);
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
    html += '<p>📍 <strong>Location:</strong> <span id="current-location">Detecting...</span> <button id="refresh-location" class="refresh-btn" style="margin-left: 10px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer;">🔄 Refresh</button> <button id="manual-location" class="manual-btn" style="margin-left: 5px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer;">📍 Change City</button> <button id="ip-location" class="ip-location-btn" style="margin-left: 5px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--accent); border-radius: 4px; background: var(--accent); color: white; cursor: pointer; display: none;">🌐 IP Location</button> <button id="try-location" class="try-location-btn" style="margin-left: 5px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--primary); border-radius: 4px; background: var(--primary); color: white; cursor: pointer; display: none;">🎯 Try Location</button> <button id="timezone-location" class="timezone-btn" style="margin-left: 5px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--secondary); border-radius: 4px; background: var(--secondary); color: white; cursor: pointer; display: none;">🕐 Timezone</button> <button id="settings-btn" class="settings-btn" style="margin-left: 5px; padding: 2px 8px; font-size: 12px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer;">⚙️ Settings</button></p>';
    html += '<div id="hijri-date" style="margin-top: 5px; font-size: 14px; color: var(--text-light);"></div>';
    html += '<div id="qibla-info" style="margin-top: 5px; font-size: 14px; color: var(--text-light);"></div>';
    html += '<div id="settings-form" style="display: none; margin-top: 10px; padding: 10px; background: var(--neutral-light); border-radius: 6px;">';
    html += '<p style="margin: 0 0 8px 0; font-size: 14px;">Prayer Calculation Settings:</p>';
    html += '<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">';
    html += '<label style="font-size: 12px;">Method:</label>';
    html += '<select id="calc-method" style="padding: 4px; border: 1px solid var(--sand); border-radius: 4px; font-size: 12px;">';
    html += '<option value="2">Islamic Society of North America</option>';
    html += '<option value="3">Muslim World League</option>';
    html += '<option value="5">Egyptian General Authority</option>';
    html += '<option value="1">University of Islamic Sciences, Karachi</option>';
    html += '</select>';
    html += '</div>';
    html += '<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">';
    html += '<label style="font-size: 12px;">School:</label>';
    html += '<select id="school-method" style="padding: 4px; border: 1px solid var(--sand); border-radius: 4px; font-size: 12px;">';
    html += '<option value="2">Hanafi (Asr later)</option>';
    html += '<option value="1">Shafi (Asr standard)</option>';
    html += '</select>';
    html += '</div>';
    html += '<div style="display: flex; gap: 10px;">';
    html += '<button id="apply-settings" style="padding: 4px 12px; border: 1px solid var(--primary); border-radius: 4px; background: var(--primary); color: white; cursor: pointer; font-size: 12px;">Apply</button>';
    html += '<button id="cancel-settings" style="padding: 4px 8px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer; font-size: 12px;">Cancel</button>';
    html += '</div>';
    html += '</div>';
    html += '<div id="manual-location-form" style="display: none; margin-top: 10px; padding: 10px; background: var(--neutral-light); border-radius: 6px;">';
    html += '<p style="margin: 0 0 8px 0; font-size: 14px;">Enter your city name:</p>';
    html += '<div style="display: flex; gap: 10px; align-items: center;">';
    html += '<input type="text" id="city-input" placeholder="e.g., New York, London, Mumbai" style="padding: 4px; border: 1px solid var(--sand); border-radius: 4px; width: 200px;">';
    html += '<button id="set-manual-location" style="padding: 4px 12px; border: 1px solid var(--primary); border-radius: 4px; background: var(--primary); color: white; cursor: pointer;">Set</button>';
    html += '<button id="cancel-manual-location" style="padding: 4px 8px; border: 1px solid var(--sand); border-radius: 4px; background: var(--neutral-light); cursor: pointer;">Cancel</button>';
    html += '</div>';
    html += '<div id="city-suggestions" style="margin-top: 8px; max-height: 150px; overflow-y: auto;"></div>';
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
    
    // Add try location button event listener
    const tryLocationBtn = document.getElementById('try-location');
    if (tryLocationBtn) {
      tryLocationBtn.addEventListener('click', () => {
        console.log('🎯 Manual location permission request triggered');
        tryLocationBtn.textContent = '🎯 Requesting...';
        tryLocationBtn.disabled = true;
        
        // Force location permission request
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('✅ Location permission granted!');
              const location = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              updateLocationStatus({ success: true, lat: location.lat, lon: location.lon });
              loadPrayerTimesForLocation(location);
              tryLocationBtn.style.display = 'none';
            },
            (error) => {
              console.log('❌ Location permission denied:', error);
              alert('Location access was denied. Please use the city search option instead.');
              tryLocationBtn.textContent = '🎯 Try Location';
              tryLocationBtn.disabled = false;
            },
            {
              timeout: 10000,
              enableHighAccuracy: true
            }
          );
        }
      });
    }
    
    // Add IP location button event listener
    const ipLocationBtn = document.getElementById('ip-location');
    if (ipLocationBtn) {
      ipLocationBtn.addEventListener('click', async () => {
        console.log('🌐 IP-based location request triggered');
        ipLocationBtn.textContent = '🌐 Detecting...';
        ipLocationBtn.disabled = true;
        
        const location = await getLocationFromIP();
        if (location) {
          updateLocationStatus({ success: true, lat: location.lat, lon: location.lon, city: location.city });
          loadPrayerTimesForLocation(location);
          ipLocationBtn.style.display = 'none';
        } else {
          alert('IP location detection failed. Please try another method.');
          ipLocationBtn.textContent = '🌐 IP Location';
          ipLocationBtn.disabled = false;
        }
      });
    }
    
    // Add timezone location button event listener
    const timezoneBtn = document.getElementById('timezone-location');
    if (timezoneBtn) {
      timezoneBtn.addEventListener('click', () => {
        console.log('🕐 Timezone-based location request triggered');
        timezoneBtn.textContent = '🕐 Detecting...';
        timezoneBtn.disabled = true;
        
        const location = getLocationFromTimezone();
        if (location) {
          updateLocationStatus({ success: true, lat: location.lat, lon: location.lon, city: location.city });
          loadPrayerTimesForLocation(location);
          timezoneBtn.style.display = 'none';
        } else {
          alert('Timezone location detection failed. Please try another method.');
          timezoneBtn.textContent = '🕐 Timezone';
          timezoneBtn.disabled = false;
        }
      });
    }
    
    // Add settings button event listener
    const settingsBtn = document.getElementById('settings-btn');
    const settingsForm = document.getElementById('settings-form');
    const applySettingsBtn = document.getElementById('apply-settings');
    const cancelSettingsBtn = document.getElementById('cancel-settings');
    
    if (settingsBtn && settingsForm) {
      settingsBtn.addEventListener('click', () => {
        settingsForm.style.display = settingsForm.style.display === 'none' ? 'block' : 'none';
        // Set current values
        const calcMethodSelect = document.getElementById('calc-method');
        const schoolMethodSelect = document.getElementById('school-method');
        if (calcMethodSelect) calcMethodSelect.value = CALCULATION_METHOD;
        if (schoolMethodSelect) schoolMethodSelect.value = SCHOOL;
      });
    }
    
    if (applySettingsBtn) {
      applySettingsBtn.addEventListener('click', () => {
        const calcMethodSelect = document.getElementById('calc-method');
        const schoolMethodSelect = document.getElementById('school-method');
        
        if (calcMethodSelect && schoolMethodSelect) {
          const newMethod = calcMethodSelect.value;
          const newSchool = schoolMethodSelect.value;
          
          console.log('🔧 Updating prayer calculation settings:', { method: newMethod, school: newSchool });
          
          // Update the variables
          CALCULATION_METHOD = newMethod;
          SCHOOL = newSchool;
          
          // Reload prayer times with new settings
          initPrayerTimes();
          
          settingsForm.style.display = 'none';
        }
      });
    }
    
    if (cancelSettingsBtn) {
      cancelSettingsBtn.addEventListener('click', () => {
        settingsForm.style.display = 'none';
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
        const cityInput = document.getElementById('city-input');
        
        if (cityInput) {
          const cityName = cityInput.value.trim();
          if (cityName) {
            const city = findCity(cityName);
            if (city) {
              console.log('📍 City selected:', city);
              const location = { lat: city.lat, lon: city.lon };
              updateLocationStatus({ success: true, lat: city.lat, lon: city.lon, city: city.name });
              loadPrayerTimesForLocation(location);
              manualLocationForm.style.display = 'none';
              cityInput.value = '';
              clearCitySuggestions();
            } else {
              alert('City not found. Try major cities like New York, London, Mumbai, Delhi, etc.');
            }
          } else {
            alert('Please enter a city name');
          }
        }
      });
    }
    
    if (cancelManualBtn) {
      cancelManualBtn.addEventListener('click', () => {
        manualLocationForm.style.display = 'none';
        clearCitySuggestions();
      });
    }
    
    // Add city input search functionality
    const cityInput = document.getElementById('city-input');
    if (cityInput) {
      cityInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          showCitySuggestions(query);
        } else {
          clearCitySuggestions();
        }
      });
      
      cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          setManualBtn.click();
        }
      });
    }
  }

  // Find city by name (case-insensitive, partial match)
  function findCity(cityName) {
    const query = cityName.toLowerCase();
    return cities.find(city => 
      city.name.toLowerCase() === query || 
      city.name.toLowerCase().includes(query) ||
      city.country.toLowerCase() === query
    );
  }

  // Show city suggestions
  function showCitySuggestions(query) {
    const suggestionsDiv = document.getElementById('city-suggestions');
    if (!suggestionsDiv) return;
    
    const queryLower = query.toLowerCase();
    const matches = cities.filter(city => 
      city.name.toLowerCase().includes(queryLower) || 
      city.country.toLowerCase().includes(queryLower)
    ).slice(0, 5); // Limit to 5 suggestions
    
    if (matches.length > 0) {
      let html = '<div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Suggestions:</div>';
      matches.forEach(city => {
        html += `<div class="city-suggestion" style="padding: 4px 8px; cursor: pointer; border-radius: 3px; margin-bottom: 2px;" data-city="${city.name}">${city.name}, ${city.country}</div>`;
      });
      suggestionsDiv.innerHTML = html;
      
      // Add click handlers to suggestions
      suggestionsDiv.querySelectorAll('.city-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
          const cityName = suggestion.getAttribute('data-city');
          const cityInput = document.getElementById('city-input');
          if (cityInput) {
            cityInput.value = cityName;
            clearCitySuggestions();
            document.getElementById('set-manual-location').click();
          }
        });
        
        // Add hover effect
        suggestion.addEventListener('mouseenter', () => {
          suggestion.style.backgroundColor = 'var(--sand)';
        });
        suggestion.addEventListener('mouseleave', () => {
          suggestion.style.backgroundColor = 'transparent';
        });
      });
    } else {
      suggestionsDiv.innerHTML = '<div style="font-size: 12px; color: var(--text-light);">No cities found</div>';
    }
  }

  // Clear city suggestions
  function clearCitySuggestions() {
    const suggestionsDiv = document.getElementById('city-suggestions');
    if (suggestionsDiv) {
      suggestionsDiv.innerHTML = '';
    }
  }

  // Load prayer times for specific location
  async function loadPrayerTimesForLocation(location) {
    try {
      console.log('🌐 Loading prayer times for manual location:', location);
      
      const url = `${PRAYER_API}/?lat=${location.lat}&lon=${location.lon}&method=${CALCULATION_METHOD}&school=${SCHOOL}&api_key=${API_KEY}`;
      
      console.log('🔗 API URL for manual location:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200 && data.status === 'success') {
        prayerTimes = data.data.times;
        apiData = data.data; // Store full API response
        console.log('✅ Manual location prayer times loaded:', prayerTimes);
        console.log('📅 Hijri date:', data.data.date.hijri);
        updatePrayerDisplay();
        updateHijriDate();
        updateQiblaInfo();
        scheduleReminders();
      } else {
        throw new Error(`API error: ${data.message || data.status}`);
      }
    } catch (error) {
      console.log('❌ Error loading manual location prayer times:', error);
      loadDefaultPrayerTimes();
    }
  }

  // Get location from IP address
  async function getLocationFromIP() {
    try {
      console.log('🌐 Getting location from IP address...');
      showLocationStatus('🌐 Detecting location from IP...');
      
      // Use ipapi.co for IP geolocation (free tier)
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error(`IP API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const location = {
          lat: data.latitude,
          lon: data.longitude,
          city: data.city,
          country: data.country_name,
          source: 'IP'
        };
        console.log('✅ IP-based location detected:', location);
        return location;
      } else {
        throw new Error('IP location data incomplete');
      }
    } catch (error) {
      console.log('❌ IP location detection failed:', error);
      return null;
    }
  }

  // Get location from browser timezone
  function getLocationFromTimezone() {
    try {
      console.log('🕐 Getting location from timezone...');
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = new Date().getTimezoneOffset();
      
      // Major cities by timezone (simplified mapping)
      const timezoneMap = {
        'Asia/Kolkata': { lat: 28.6139, lon: 77.2090, city: 'New Delhi' },
        'Asia/Karachi': { lat: 24.8607, lon: 67.0011, city: 'Karachi' },
        'Asia/Dhaka': { lat: 23.8103, lon: 90.4125, city: 'Dhaka' },
        'Asia/Jakarta': { lat: -6.2088, lon: 106.8456, city: 'Jakarta' },
        'Asia/Bangkok': { lat: 13.7563, lon: 100.5018, city: 'Bangkok' },
        'Asia/Singapore': { lat: 1.3521, lon: 103.8198, city: 'Singapore' },
        'Asia/Tokyo': { lat: 35.6762, lon: 139.6503, city: 'Tokyo' },
        'Asia/Shanghai': { lat: 31.2304, lon: 121.4737, city: 'Shanghai' },
        'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694, city: 'Hong Kong' },
        'Asia/Seoul': { lat: 37.5665, lon: 126.9780, city: 'Seoul' },
        'Europe/London': { lat: 51.5074, lon: -0.1278, city: 'London' },
        'Europe/Paris': { lat: 48.8566, lon: 2.3522, city: 'Paris' },
        'Europe/Berlin': { lat: 52.5200, lon: 13.4050, city: 'Berlin' },
        'Europe/Istanbul': { lat: 41.0082, lon: 28.9784, city: 'Istanbul' },
        'Europe/Moscow': { lat: 55.7558, lon: 37.6173, city: 'Moscow' },
        'America/New_York': { lat: 40.7128, lon: -74.0060, city: 'New York' },
        'America/Chicago': { lat: 41.8781, lon: -87.6298, city: 'Chicago' },
        'America/Los_Angeles': { lat: 34.0522, lon: -118.2437, city: 'Los Angeles' },
        'America/Toronto': { lat: 43.6532, lon: -79.3832, city: 'Toronto' },
        'Australia/Sydney': { lat: -33.8688, lon: 151.2093, city: 'Sydney' }
      };
      
      const location = timezoneMap[timezone];
      
      if (location) {
        location.source = 'Timezone';
        console.log('✅ Timezone-based location detected:', location);
        return location;
      } else {
        console.log('⚠️ Timezone not mapped, using default');
        return { lat: 28.6139, lon: 77.2090, city: 'New Delhi', source: 'Timezone Default' };
      }
    } catch (error) {
      console.log('❌ Timezone location detection failed:', error);
      return null;
    }
  }

  // Update Qibla direction display
  function updateQiblaInfo() {
    const qiblaElement = document.getElementById('qibla-info');
    if (qiblaElement && apiData && apiData.qibla) {
      const qibla = apiData.qibla;
      const direction = qibla.direction.degrees;
      const distance = qibla.distance.value;
      const unit = qibla.distance.unit;
      
      // Convert degrees to compass direction
      const compassDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const index = Math.round(direction / 22.5) % 16;
      const compassDir = compassDirections[index];
      
      const qiblaText = `🧭 Qibla: ${direction.toFixed(1)}° ${compassDir} (${distance.toFixed(0)} ${unit} to Kaaba)`;
      qiblaElement.innerHTML = qiblaText;
    }
  }

  // Update Hijri date display
  function updateHijriDate() {
    const hijriElement = document.getElementById('hijri-date');
    if (hijriElement && apiData && apiData.date && apiData.date.hijri) {
      const hijri = apiData.date.hijri;
      const hijriText = `📅 ${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
      hijriElement.innerHTML = hijriText;
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
    console.log('🕌 Prayer Times: Initializing...');
    
    // Show initial loading state
    showLocationStatus('🗺️ Detecting your location...');
    
    // Test API first
    testAPI().then((isWorking) => {
      if (isWorking) {
        console.log('✅ Prayer Times: API is working, loading prayer times...');
      } else {
        console.log('⚠️ Prayer Times: API test failed, using fallback');
      }
    });
    
    // Test location
    testLocation().then((location) => {
      console.log('📍 Prayer Times: Location test result:', location);
      if (!location.success) {
        console.log('⚠️ Prayer Times: Location detection failed, will show manual options');
      }
    });
    
    // Request notification permission
    requestNotificationPermission();
    
    // Load prayer times
    initPrayerTimes();
    
    // Update every minute
    setInterval(updatePrayerDisplay, 60000);
    
    // Add comprehensive test function to window for debugging
    window.testPrayerTimes = () => {
      console.log('🧪 Running comprehensive prayer times test...');
      console.log('📍 Testing location detection...');
      testLocation().then(loc => console.log('Location test:', loc));
      console.log('🌐 Testing API...');
      testAPI().then(api => console.log('API test:', api));
      console.log('🕌 Current prayer times:', prayerTimes);
      console.log('🎯 Next prayer:', nextPrayer);
      console.log('🔔 Notification permission:', notificationPermission);
      return { location: 'tested', api: 'tested', prayerTimes, nextPrayer, notificationPermission };
    };
    
    console.log('💡 Tip: Run testPrayerTimes() in console for comprehensive test');
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
    const tryLocationBtn = document.getElementById('try-location');
    const ipLocationBtn = document.getElementById('ip-location');
    const timezoneBtn = document.getElementById('timezone-location');
    
    if (statusElement) {
      if (locationResult.success) {
        const coords = `${locationResult.lat.toFixed(4)}°, ${locationResult.lon.toFixed(4)}°`;
        const displayText = locationResult.city ? `${locationResult.city} (${coords})` : coords;
        statusElement.innerHTML = `✅ Located (${displayText})`;
        statusElement.style.color = '#27ae60';
        if (locationElement) {
          locationElement.textContent = locationResult.city || coords;
        }
        // Hide all manual buttons when successful
        if (tryLocationBtn) tryLocationBtn.style.display = 'none';
        if (ipLocationBtn) ipLocationBtn.style.display = 'none';
        if (timezoneBtn) timezoneBtn.style.display = 'none';
      } else {
        statusElement.innerHTML = `🏛️ Using New Delhi (location ${locationResult.error || 'not available'})`;
        statusElement.style.color = '#f39c12';
        if (locationElement) {
          locationElement.textContent = 'New Delhi (fallback)';
        }
        // Prioritize IP Location button when failed
        if (ipLocationBtn) {
          ipLocationBtn.style.display = 'inline-block';
          ipLocationBtn.textContent = '� IP Location (Recommended)';
          ipLocationBtn.disabled = false;
        }
        if (tryLocationBtn) {
          tryLocationBtn.style.display = 'inline-block';
          tryLocationBtn.textContent = '� Try Location';
          tryLocationBtn.disabled = false;
        }
        if (timezoneBtn) {
          timezoneBtn.style.display = 'inline-block';
          timezoneBtn.textContent = '🕐 Timezone';
          timezoneBtn.disabled = false;
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
