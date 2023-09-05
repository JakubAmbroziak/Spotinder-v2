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

async function loadInfo() {
    try {
        let response = await fetch('/get-CurrentPlaying');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();
        document.getElementById("artist").innerHTML = data.artists[0].name;
        document.getElementById("song").innerHTML = data.name;
        document.getElementById("cover").src = data.album.images[0].url;
        
        return data.album.images[0].url;  // Return the cover URL
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error.message);
    }
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
                async function playTrack(trackID) {
                    try {
                        await play({
                            playerInstance: player,
                            spotify_uri: "spotify:track:"+ trackID,
                        });
                            startCheckingCoverChange();
                    } catch (error) {
                        console.error("Error in playTrack:", error);
                    }
                }

            fetch('/get-recommendation')
            .then(response => response.json())
            .then(data => {
                console.log(data.tracks); 
                    recommendedtracks = data.tracks;
                console.log(recommendedtracks[recommendedtracksIterator])
                playTrack( recommendedtracks[recommendedtracksIterator]);
            })
            .catch(error => {
                console.error('Error:', error);
            });

            startCheckingCoverChange();
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
                recommendedtracksIterator=0;
                
                fetch('/trackAddedToSeed', {
                    method: 'POST'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();  // or .json() if you're returning JSON from the server
                })
                .then(data => {
                    console.log(data);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error.message);
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







