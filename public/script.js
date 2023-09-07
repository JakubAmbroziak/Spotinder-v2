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

let previousCoverURL = null;

async function loadInfo(trackInfo) {
    let artistNames = trackInfo.artists.map(artist => artist.name).join(", ");
    document.getElementById("artist").innerHTML = artistNames;
    document.getElementById("song").innerHTML = trackInfo.name;
    document.getElementById("cover").src = trackInfo.album.images[0].url;
}


let intervalID = null;

function startCheckingCoverChange() {

    
    intervalID = setInterval(async () => {
        let currentCoverURL = await loadInfo(); // Use loadInfo to get the current cover URL
        //console.log("INTERVAL CHECK", currentCoverURL, previousCoverURL);
        
        if (previousCoverURL !== currentCoverURL) {
            // Cover has changed
            //console.log("Cover changed! Stopping the interval.");
            clearInterval(intervalID);  // Stop checking
            isChecking = false; // Reset the flag
            // Do any other actions here
        } else {
            previousCoverURL = currentCoverURL;
        }
    }, 1000); // Check every 1 second. You can adjust this duration.
}


let recommendedtracks = null;
let recommendedtracksIterator = 0;
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
                async function playTrack(trackObject) {
                    loadInfo(trackObject);
                    try {
                        await play({
                            playerInstance: player,
                            spotify_uri: trackObject.uri,
                        });
                            
                    } catch (error) {
                        console.error("Error in playTrack:", error);
                    }
                }
            
                fetch('/get-recommendation')
                .then(response => response.json())
                .then(data => {
                    recommendedtracks = data.recommendation.tracks; 
                    playTrack(recommendedtracks[0]);
                })
                .catch(error => {
                    console.error('Error:', error);
                });

  


            const coverElement = document.getElementById("cover");
            let startX = 0;

            coverElement.addEventListener('dragstart', (event) => {
                startX = event.clientX; // Record the initial x position when the drag starts
            });

            coverElement.addEventListener('dragend', (event) => {
                const endX = event.clientX;

                const width = coverElement.offsetWidth;
                const threshold = 0.1; // Adjust this value to change sensitivity, 0.25 means 25%

                // Calculate the change as a percentage of the element's width
                const changeX = (endX - startX) / width;

                if (changeX > threshold) {
                    handleDragRight();
                } else if (changeX < -threshold) {
                    handleDragLeft();
                }
            });

            function handleDragRight() {
                console.log("Right");
                recommendedtracksIterator = 0;
            
                fetch('/trackAddedToSeed', {
                    method: 'POST'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    fetch('/get-recommendation')
                    .then(response => response.json())
                    .then(data => {
                        //recommendedtracks = data.recommendation.tracks; 
                        console.log(recommendedtracks)
                        //playTrack(recommendedtracks[recommendedtracksIterator]);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                    return response.text();
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
            

            function handleDragLeft() {
                console.log("Left");
                recommendedtracksIterator+=1;
                //console.log(recommendedtracksIterator);
                playTrack(recommendedtracks[recommendedtracksIterator])          
            }

        });
 

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID is not ready for playback', device_id);
        });
    

        
} catch (error) {
    console.log("Main Fail:", error.message);
}

};







