//
let token = null;
let player = null;
let currentPlayingTrackID = null;
let select;

document.getElementById("artist").innerHTML = "Loading";
document.getElementById("song").innerHTML = "Loading";

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
async function toggleLiked(isLiked){
    console.log("Followed data: ", isLiked)
    
	if(isLiked){
        document.getElementById("addToLikedCircle").style.fill = "#ff6666";
	}
	else{
		document.getElementById("addToLikedCircle").style.fill = "#66D36E";
	}
};

async function loadInfo(trackInfo) {
    currentPlayingTrackID = trackInfo.id;
    console.log(trackInfo.id);

    let artistNames = trackInfo.artists.map(artist => artist.name).join(", ");
    document.getElementById("artist").innerHTML = artistNames;
    document.getElementById("song").innerHTML = trackInfo.name;
    document.getElementById("cover").src = trackInfo.album.images[0].url;
    document.getElementById("background-cover").src = trackInfo.album.images[0].url;

    fetch('/isLiked', {
        method: 'POST', // You can use POST or other HTTP methods as needed
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
      },
      body: JSON.stringify({ currentPlayingTrackID }), // Send the ID in the request body
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json(); // If your backend returns JSON data
      })
      .then(data => {
        //toggleLiked(data[0]);
      })
      .catch(error => {
        console.error('Error:', error);
      });

}
// Function to populate the select element with playlist names
function populateSelect(playlistArray) {
    select = document.getElementById('playlists');
    select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = ''; 
    defaultOption.textContent = 'Choose a playlist';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    playlistArray.forEach((playlist) => {

        const option = document.createElement('option');
        option.value = playlist.id;
        option.text = playlist.name;
        select.appendChild(option);
      });
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

                fetch('/getPlaylist')
                .then(response => response.json())
                .then(playlists => {
                    populateSelect(playlists);
                })
                .catch(error => {
                    console.error('There was an error fetching the data:', error);
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
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Set the content type to JSON
                },
                body: JSON.stringify({ currentPlayingTrackID }), // Send the ID in the request body
                })
                .then(response => {
                    if (!response.ok) {
                    throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    recommendedtracks = data.recommendation.tracks; 
                    playTrack(recommendedtracks[recommendedtracksIterator]) 
                    
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

            document.getElementById('addToLiked').addEventListener('click', () => {
                // Make an HTTP request to your backend endpoint
                fetch('/addToLiked', {
                  method: 'POST', // You can use POST or other HTTP methods as needed
                  headers: {
                    'Content-Type': 'application/json', // Set the content type to JSON
                },
                body: JSON.stringify({ currentPlayingTrackID }), // Send the ID in the request body
                })
                .then(response => {
                  if (!response.ok) {
                    throw new Error('Network response was not ok');
                  }
                  return response.json(); // If your backend returns JSON data
                })
                .then(likeStatus => {
                    toggleLiked(likeStatus);
                  })
                .catch(error => {
                  console.error('Error:', error);
                });
            });

            document.getElementById('addToPlaylist').addEventListener('click', () => {
                
                let dataToSend = {
                    playlistId: select.options[ select.selectedIndex ].value,
                    trackId: currentPlayingTrackID
                };

                if(dataToSend.playlistId!==""){
                    addToPlaylistAnimation();
                    fetch('addToPlaylist', {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify(dataToSend) 
                    })
                    .then(response => {
                        if (!response.ok) {
                        throw new Error('Network response was not ok');
                        }
                        return response.json(); 
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                }else{
                    shakeSelect();
                }
            });

            		
            var slider = document.getElementById("volume");
            slider.oninput = function() {
                console.log(slider.value)
                if(slider.value==0){
                    speakerSound.style.display = "none"; 
                }else{
                    speakerSound.style.display = "block"; 
                }
                player.setVolume(slider.value)
            };
        });
 

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID is not ready for playback', device_id);
        });
    
    } catch (error) {
        console.log("Main Fail:", error.message);
    }
};
function shakeSelect(){
    $('.select').toggleClass('selectAnimated');

    setTimeout(() => {
        $('.select').toggleClass('selectAnimated');
    }, "500");
}
function addToPlaylistAnimation(){
    $('.addToPlaylist').toggleClass('addToPlaylistAnimated');

    setTimeout(() => {
        $('.addToPlaylist').toggleClass('addToPlaylistAnimated');
    }, "1000");
}


