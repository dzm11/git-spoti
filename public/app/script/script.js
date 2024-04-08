async function getCurrentTrack() {
  try {
    const response = await fetch('/current-track');

    // Sprawdzenie, czy odpowiedź jest poprawna (status 200)
    if (!response.ok) {
      throw new Error('Nie można pobrać danych');
    }

    const data = await response.json();
    const currentTrackElement = document.getElementById('spotifyContainer');
    const isLiveContainer = document.getElementById('isLiveContainer');

    if (data.is_playing) {
      // Jeśli odtwarzana jest piosenka
      isLiveContainer.innerHTML = 'LIVE';
      isLiveContainer.classList.add('live');
    } else {
      const lastPlayedTimestamp = new Date(data.timestamp).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - lastPlayedTimestamp;

      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;

      if (timeDifference < hour) {
        const minutesAgo = Math.floor(timeDifference / minute);
        isLiveContainer.innerHTML = `${minutesAgo} minutes ago`;
      } else if (timeDifference < day) {
        const hoursAgo = Math.floor(timeDifference / hour);
        isLiveContainer.innerHTML = `${hoursAgo} hours ago`;
      } else {
        const daysAgo = Math.floor(timeDifference / day);
        isLiveContainer.innerHTML = `${daysAgo} days ago`;
      }
    }

    currentTrackElement.innerHTML = `
      <img src="${data.item.album.images[0].url}" id="imgContainer" alt="" height="60px" width="60px">
      <div class="song">
          <div class="song__title" id="titleContainer">${data.item.name}</div>
          <div class="song__author" id="authorContainer">${data.item.artists[0].name}</div>
      </div>
    `;
  } catch (error) {
    console.error('Błąd pobierania aktualnej piosenki:', error);

    // Obsługa błędów dla użytkownika (może być wyświetlony jakiś komunikat)
    const errorMessage = document.createElement('div');
    errorMessage.textContent = 'Wystąpił błąd podczas pobierania danych.';
    document.body.appendChild(errorMessage);
  }
}

getCurrentTrack();