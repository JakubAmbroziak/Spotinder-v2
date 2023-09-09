# Spotinder - Find Music You Like

Spotinder is a web application that provides you with a personalized music experience. Discover new tracks, manage your playlists, and enjoy your favorite music on Spotify with ease.

## Features

- **Recommendations**: Get personalized music recommendations based on your listening history.
- **Playlist Management**: Add your favorite tracks to your Spotify playlists directly from the app.
- **Like and Dislike**: Easily like or dislike tracks, and see your liked songs in one place.
- **Responsive Design**: Enjoy a seamless music experience on desktop devices.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js 
- **APIs**: [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node)

## Getting Started

To run Spotinder locally and contribute to the project, follow these steps:

1. Clone the repository: `git clone https://github.com/JakubAmbroziak/Spotinder-v2`
2. Install dependencies: `npm install`
3. Set up environment variables by creating a `.env` file (example provided in `.env.example`).
4. Start the development server: `npm start`

## Instructions for Using Spotinder

**1. Swipe Right:** 
   - If you like a track, swipe right on the cover image.
      - This action helps tailor the upcoming song recommendations based on your preferences.

**2. Swipe Left:** 
   - If you don't like a track, swipe left on the cover image.
   - Swiping left indicates that you're not interested in the track.

**3. Click on the Cover:** 
   - Click on the cover image to toggle between resume and pause for the currently playing track.

**4. Use Buttons:** 
   - Use the provided buttons to interact with the music:
     - **Add to Liked:** Click this button to add the currently playing track to your liked songs.
     - **Add to Playlist:** Click this button to add the currently playing track to one of your Spotify playlists. Select the playlist from the dropdown menu.

Enjoy your personalized music experience with Spotinder!
