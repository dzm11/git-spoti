const express = require('express');
const cors = require('cors');
const path = require('path');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Dodaj middleware cors
app.use(cors());

// Twoje pozostałe konfiguracje i trasy...

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN
});

// Funkcja do odświeżania tokenów Spotify
async function refreshTokens() {
  try {
    const { data } = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }
    });

    spotifyApi.setAccessToken(data.access_token);
  } catch (error) {
    console.error('Błąd odświeżania tokenów Spotify:', error.response ? error.response.data : error.message);
  }
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/authorize', (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(['user-read-currently-playing'], 'some-state');
  res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    res.send('Autoryzacja zakończona pomyślnie. Możesz teraz zamknąć to okno.');
  } catch (error) {
    console.error('Błąd autoryzacji:', error);
    res.status(500).send('Wystąpił błąd podczas autoryzacji.');
  }
});

app.get('/api/current-track', async (req, res) => {
  try {
    await refreshTokens();
    const data = await spotifyApi.getMyCurrentPlayingTrack();
    const track = data.body;

    // Jeśli obiekt item jest pusty, pobierz informacje o ostatnio odtwarzanej piosence
    if (!track) {
      const lastTrackData = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 1 });
      const lastTrack = lastTrackData.body.items[0];
      res.json(lastTrack.track);
    } else {
      res.json(track);
    }
  } catch (error) {
    console.error('Błąd pobierania aktualnej piosenki:', error);
    res.status(error.statusCode || 500).send(error.message || 'Wystąpił błąd podczas pobierania aktualnie odtwarzanej piosenki.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Serwer uruchomiony na porcie 3000`);
});


