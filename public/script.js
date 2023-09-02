let token = null;
let player = null;

fetch('/get-token')
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            token = data.token;
        } else {
            console.error('Failed to get the token.');
        }
    })
    .catch(error => {
        console.error('There was an error fetching the token:', error);
    });

window.onSpotifyWebPlaybackSDKReady = () => {
    try {
        player = new Spotify.Player({
            name: 'Spotinder',
            getOAuthToken: callback => { callback(token); },
            volume: 0.25
        });
        player.connect();

        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID:', device_id);  
            const play = ({
                spotify_uri,
                playerInstance: {
                    _options: {
                    getOAuthToken
                    }
                }
                }) => {
                getOAuthToken(access_token => {
                    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [spotify_uri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    });
                })};          
                play({
                    playerInstance: player,
                    spotify_uri: "spotify:track:0dlP9SnqQa5k1A9mReybFb",
                });	
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID is not ready for playback', device_id);
        });
    
    } catch (error) {
        console.log("Main Fail:", error.message);
    }

};


