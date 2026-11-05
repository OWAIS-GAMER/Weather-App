
document.addEventListener('DOMContentLoaded', () => {

  // API Configuration
  const apiKey = 'd43d8a8ac2347c80d9723bcb48f5bc1b';

  let currentUnit = 'metric';
  let clockInterval;
  let lastRequest = null;

  // DOM Elements
  const cityInput = document.getElementById('cityInput');
  const searchForm = document.getElementById('searchForm');

  const weatherInfo = document.getElementById('weatherInfo');
  const loader = document.getElementById('loader');

  const sunContainer = document.getElementById('sun');
  const sunriseBox = document.getElementById('sunrise');
  const sunsetBox = document.getElementById('sunset');

  const clock = document.getElementById('clock');
  const timeSpan = document.getElementById('time');
  const dateSpan = document.getElementById('date');

  const useLocationBtn = document.getElementById('useLocation');
  const unitToggle = document.getElementById('unitToggle');

  const body = document.body;
  const bgToggle = document.getElementById('bgToggle');
  const toggleIcon = document.getElementById('toggleIcon');

  // Loader
  function showLoader() {
    loader.classList.remove('d-none');
  }

  function hideLoader() {
    loader.classList.add('d-none');
  }

  // Hide Panels
  function hideAllPanels() {

    weatherInfo.classList.remove('show');
    weatherInfo.classList.add('d-none');

    sunContainer.classList.remove('visible');
    sunContainer.classList.add('d-none');

    clock.classList.remove('visible');
    clock.classList.add('d-none');

    clearInterval(clockInterval);
  }

  // Show Message
  function showMessage(message) {

    hideAllPanels();
    hideLoader();

    weatherInfo.innerHTML = `<p>${message}</p>`;

    weatherInfo.classList.remove('d-none');
    weatherInfo.classList.add('show');
  }

  // Weather Panel
  function buildWeatherPanel(data) {

    const iconUrl =
      `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;

    const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
    const windUnit = currentUnit === 'metric' ? 'm/s' : 'mph';

    weatherInfo.innerHTML = `

      <h3>${data.name}</h3>

      <img
        src="${iconUrl}"
        class="weather-icon"
        alt="${description}"
      >

      <p class="temperature">${temp}${unitSymbol}</p>

      <p>${description}</p>

      <div class="weather-details">

        <span>
          <strong class="value">${data.main.humidity}%</strong>
          <small>Humidity</small>
        </span>

        <span>
          <strong class="value">
            ${Math.round(data.wind.speed)} ${windUnit}
          </strong>
          <small>Wind</small>
        </span>

      </div>
    `;

    weatherInfo.classList.remove('d-none');

    void weatherInfo.offsetWidth;

    weatherInfo.classList.add('show');
  }

  // Sunrise / Sunset
  function buildSunPanel(data) {

    const toTime = timestamp =>
      new Date(timestamp * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

    sunriseBox.innerHTML = `
      <small>Sunrise</small>
      <strong>${toTime(data.sys.sunrise)}</strong>
    `;

    sunsetBox.innerHTML = `
      <small>Sunset</small>
      <strong>${toTime(data.sys.sunset)}</strong>
    `;

    sunContainer.classList.remove('d-none');

    void sunContainer.offsetWidth;

    sunContainer.classList.add('visible');
  }

  // City Clock
  function updateClockForCity(offset) {

    clearInterval(clockInterval);

    function tick() {

      const utc =
        Date.now() + new Date().getTimezoneOffset() * 60000;

      const local = new Date(utc + offset * 1000);

      timeSpan.textContent = local.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const weekday = local.toLocaleDateString('en-US', {
        weekday: 'long'
      });

      const day = local.getDate();

      const month = local.toLocaleDateString('en-US', {
        month: 'long'
      });

      dateSpan.textContent = `${weekday}, ${day} ${month}`;
    }

    tick();

    clock.classList.remove('d-none');

    void clock.offsetWidth;

    clock.classList.add('visible');

    clockInterval = setInterval(tick, 1000);
  }

  // Fetch Weather
  async function fetchWeather(url) {

    hideAllPanels();
    showLoader();

    try {

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || Number(data.cod) !== 200) {
        throw new Error(data.message || 'Weather data unavailable.');
      }

      buildWeatherPanel(data);
      buildSunPanel(data);
      updateClockForCity(data.timezone);

      useLocationBtn.classList.add('d-none');

    } catch (error) {

      console.error('Weather Error:', error);

      showMessage(error.message || 'Something went wrong.');

      useLocationBtn.classList.remove('d-none');

    } finally {

      hideLoader();

    }
  }

  // Search Weather
  function searchWeather() {

    const city = cityInput.value.trim();

    if (!city) {
      showMessage('Please enter a city name.');
      return;
    }

    lastRequest = {
      type: 'city',
      value: city
    };

    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`;

    fetchWeather(url);
  }

  // Search Form
  searchForm.addEventListener('submit', event => {

    event.preventDefault();

    searchWeather();

  });

  // Current Location
  useLocationBtn.addEventListener('click', () => {

    if (!navigator.geolocation) {

      showMessage('Geolocation is not supported by this browser.');

      return;
    }

    hideAllPanels();
    showLoader();

    navigator.geolocation.getCurrentPosition(

      position => {

        const { latitude, longitude } = position.coords;

        lastRequest = {
          type: 'location',
          lat: latitude,
          lon: longitude
        };

        const url =
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${currentUnit}`;

        fetchWeather(url);

      },

      error => {

        let message = 'Unable to get your location. ';

        switch (error.code) {

          case error.PERMISSION_DENIED:
            message += 'Location access denied.';
            break;

          case error.POSITION_UNAVAILABLE:
            message += 'Location unavailable.';
            break;

          case error.TIMEOUT:
            message += 'Location request timed out.';
            break;

          default:
            message += 'Unknown error.';
        }

        showMessage(message);

      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }

    );

  });

  // Temperature Toggle
  unitToggle.addEventListener('change', () => {

    currentUnit = unitToggle.checked ? 'imperial' : 'metric';

    if (!lastRequest) return;

    let url;

    if (lastRequest.type === 'city') {

      url =
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(lastRequest.value)}&appid=${apiKey}&units=${currentUnit}`;

    } else {

      url =
        `https://api.openweathermap.org/data/2.5/weather?lat=${lastRequest.lat}&lon=${lastRequest.lon}&appid=${apiKey}&units=${currentUnit}`;

    }

    fetchWeather(url);

  });

  // Background Theme
  if (localStorage.getItem('bgVersion') === '2') {

    body.classList.add('bg-2');

    toggleIcon.classList.replace('fa-sun', 'fa-moon');

  }

  bgToggle.addEventListener('click', () => {

    const dark = body.classList.toggle('bg-2');

    if (dark) {

      toggleIcon.classList.replace('fa-sun', 'fa-moon');

      localStorage.setItem('bgVersion', '2');

    } else {

      toggleIcon.classList.replace('fa-moon', 'fa-sun');

      localStorage.setItem('bgVersion', '1');

    }

  });

});
