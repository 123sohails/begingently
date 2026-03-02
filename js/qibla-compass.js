// Qibla Compass for BeginGently
(function() {
  'use strict';

  // API configuration
  const QIBLA_API = 'https://aladhan.api.islamic.network/v1';
  
  let userLocation = { lat: null, lon: null };
  let qiblaDirection = null;
  let distanceToKaaba = null;
  let compassHeading = 0;
  let isTracking = false;

  // Initialize Qibla compass
  async function initQiblaCompass() {
    try {
      userLocation = await getUserLocation();
      await getQiblaFromAPI();
      updateCompassDisplay();
      startCompassTracking();
      console.log('Qibla compass initialized for:', userLocation);
    } catch (error) {
      console.log('Error initializing Qibla compass:', error);
      loadDefaultQibla();
    }
  }

  // Get user location
  async function getUserLocation() {
    return new Promise((resolve, reject) => {
      // Default to India location
      const fallbackLocation = { lat: 28.6139, lon: 77.2090 }; // New Delhi
      
      if (!navigator.geolocation) {
        console.log('Geolocation not supported, using India fallback');
        resolve(fallbackLocation);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.log('Location request timeout, using India fallback');
        resolve(fallbackLocation);
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          console.log('Location detected for Qibla:', location);
          resolve(location);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.log('Location error for Qibla:', error.message, 'using India fallback');
          resolve(fallbackLocation);
        },
        {
          timeout: 5000,
          enableHighAccuracy: true
        }
      );
    });
  }

  // Get Qibla direction from official API
  async function getQiblaFromAPI() {
    try {
      const url = `${QIBLA_API}/qibla/${userLocation.lat}/${userLocation.lon}`;
      console.log('Fetching Qibla direction from API:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200) {
        qiblaDirection = data.data.direction;
        console.log('Qibla direction from API:', qiblaDirection.toFixed(1) + '°');
        
        // Calculate distance to Kaaba (using our own calculation)
        distanceToKaaba = calculateDistance(userLocation.lat, userLocation.lon, 21.4225, 39.8262);
        console.log('Distance to Kaaba:', distanceToKaaba.toFixed(0) + ' km');
        
        return true;
      } else {
        throw new Error(`API error: ${data.status}`);
      }
    } catch (error) {
      console.log('Error getting Qibla from API:', error);
      // Fallback to manual calculation
      calculateQiblaManually();
      return false;
    }
  }

  // Manual Qibla calculation (fallback)
  function calculateQiblaManually() {
    if (!userLocation.lat || !userLocation.lon) return;

    const KAABA_LAT = 21.4225;
    const KAABA_LON = 39.8262;
    
    const lat1 = userLocation.lat * Math.PI / 180;
    const lon1 = userLocation.lon * Math.PI / 180;
    const lat2 = KAABA_LAT * Math.PI / 180;
    const lon2 = KAABA_LON * Math.PI / 180;

    const dLon = lon2 - lon1;
    
    const y = Math.sin(dLon);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLon);
    
    qiblaDirection = Math.atan2(y, x) * 180 / Math.PI;
    qiblaDirection = (qiblaDirection + 360) % 360;
    
    distanceToKaaba = calculateDistance(userLocation.lat, userLocation.lon, KAABA_LAT, KAABA_LON);
    
    console.log('Qibla direction (manual calculation):', qiblaDirection.toFixed(1) + '°');
  }

  // Calculate distance between two points (Haversine formula)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Start compass tracking
  function startCompassTracking() {
    if (!window.DeviceOrientationEvent) {
      console.log('Device orientation not supported');
      updateCompassDisplay();
      return;
    }

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            isTracking = true;
            window.addEventListener('deviceorientation', handleOrientation);
          } else {
            console.log('Device orientation permission denied');
            updateCompassDisplay();
          }
        })
        .catch(console.error);
    } else {
      // Non-iOS 13+ devices
      isTracking = true;
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  // Handle device orientation
  function handleOrientation(event) {
    if (event.alpha !== null) {
      compassHeading = event.alpha;
      updateCompassDisplay();
    }
  }

  // Update compass display
  function updateCompassDisplay() {
    const container = document.getElementById('qibla-compass-container');
    if (!container) return;

    const currentHeading = isTracking ? compassHeading : 0;
    const relativeQibla = (qiblaDirection - currentHeading + 360) % 360;
    
    let html = '<div class="qibla-compass-widget">';
    html += '<h3>🧭 Qibla Direction</h3>';
    
    // API Compass Image
    if (userLocation.lat && userLocation.lon) {
      const compassImageUrl = `${QIBLA_API}/qibla/${userLocation.lat}/${userLocation.lon}/compass`;
      html += '<div class="api-compass-container">';
      html += '<img src="' + compassImageUrl + '" alt="Qibla Compass" class="api-compass-image" />';
      html += '<div class="compass-overlay">';
      html += '<div class="compass-text">API Compass</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Manual compass display
    html += '<div class="compass-container">';
    html += '<div class="compass-circle">';
    html += '<div class="compass-needle" style="transform: rotate(' + relativeQibla + 'deg)">';
    html += '<div class="needle-north"></div>';
    html += '<div class="needle-south"></div>';
    html += '<div class="needle-qibla"></div>';
    html += '</div>';
    html += '<div class="compass-markings">';
    html += '<div class="mark mark-n">N</div>';
    html += '<div class="mark mark-e">E</div>';
    html += '<div class="mark mark-s">S</div>';
    html += '<div class="mark mark-w">W</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    // Direction info
    html += '<div class="qibla-info">';
    html += '<div class="info-row">';
    html += '<span class="info-label">Qibla Direction:</span>';
    html += '<span class="info-value">' + qiblaDirection.toFixed(1) + '°</span>';
    html += '</div>';
    
    if (distanceToKaaba) {
      html += '<div class="info-row">';
      html += '<span class="info-label">Distance to Kaaba:</span>';
      html += '<span class="info-value">' + distanceToKaaba.toFixed(0) + ' km</span>';
      html += '</div>';
    }
    
    if (userLocation.lat && userLocation.lon) {
      html += '<div class="info-row">';
      html += '<span class="info-label">Your Location:</span>';
      html += '<span class="info-value">' + userLocation.lat.toFixed(4) + '°, ' + userLocation.lon.toFixed(4) + '°</span>';
      html += '</div>';
    }
    
    html += '</div>';
    
    // Instructions
    html += '<div class="compass-instructions">';
    if (isTracking) {
      html += '<p>📱 Hold your phone flat and rotate until the green needle points to the Kaaba</p>';
    } else {
      html += '<p>📱 Qibla direction: ' + qiblaDirection.toFixed(1) + '° from North (clockwise)</p>';
      html += '<p>📍 Face this direction when praying</p>';
    }
    html += '</div>';
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Load default Qibla (fallback)
  function loadDefaultQibla() {
    userLocation = { lat: 28.6139, lon: 77.2090 }; // New Delhi
    calculateQibla();
    updateCompassDisplay();
    console.log('Using default Qibla direction for New Delhi');
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Qibla Compass: Initializing...');
    
    // Test location first
    testLocationForQibla().then((result) => {
      console.log('Qibla Compass: Location test result:', result);
    });
    
    // Test Qibla API
    testQiblaAPI().then((result) => {
      console.log('Qibla Compass: API test result:', result);
    });
    
    initQiblaCompass();
  });

  // Test Qibla API
  async function testQiblaAPI() {
    try {
      console.log('Testing Qibla API...');
      
      // Test with Mumbai coordinates
      const testUrl = `${QIBLA_API}/qibla/19.0760/72.8777`;
      console.log('Testing Qibla API with URL:', testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log('Qibla API Response:', data);
      
      if (data.code === 200) {
        console.log('Qibla API is working! Direction:', data.data.direction.toFixed(1) + '°');
        return { success: true, direction: data.data.direction };
      } else {
        console.log('Qibla API returned error:', data);
        return { success: false, error: data.status };
      }
    } catch (error) {
      console.log('Qibla API test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test location for Qibla
  async function testLocationForQibla() {
    try {
      console.log('Testing location for Qibla compass...');
      
      if (!navigator.geolocation) {
        return { success: false, error: 'Geolocation not supported' };
      }

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve({ success: false, error: 'Location request timeout', fallback: 'New Delhi' });
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
            console.log('Qibla location test successful:', location);
            resolve(location);
          },
          (error) => {
            clearTimeout(timeoutId);
            const errorInfo = {
              success: false,
              error: error.message,
              code: error.code,
              fallback: 'New Delhi'
            };
            console.log('Qibla location test failed:', errorInfo);
            resolve(errorInfo);
          },
          {
            timeout: 3000,
            enableHighAccuracy: true
          }
        );
      });
    } catch (error) {
      console.log('Qibla location test exception:', error);
      return { success: false, error: error.message, fallback: 'New Delhi' };
    }
  }

  // Make functions globally available
  window.qiblaCompassAPI = {
    refresh: initQiblaCompass,
    getLocation: () => userLocation,
    getDirection: () => qiblaDirection
  };
})();
