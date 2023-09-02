const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000;
let accessToken = null; // Store your token here. Ideally, you'd get this dynamically from your Spotify auth flow.
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

app.get('/login', (req, res) => {
    const scopes = [
        'ugc-image-upload',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'streaming',
        'app-remote-control',
        'user-read-email',
        'user-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-read-private',
        'playlist-modify-private',
        'user-library-modify',
        'user-library-read',
        'user-top-read',
        'user-read-playback-position',
        'user-read-recently-played',
        'user-follow-read',
        'user-follow-modify',
      ];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(authorizeURL);
});

app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    console.error("Callback error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi.authorizationCodeGrant(code).then(data => {
    accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    res.redirect('/'); // redirect to the main page or wherever you want
  }).catch(error => {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
  });
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/" + "/public/index.html");
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/login`);
});



app.get('/get-token', (req, res) => {
    if (!accessToken) {
        return res.status(401).json({ error: 'Token not available' });
    }

    res.json({ token: accessToken });
});
