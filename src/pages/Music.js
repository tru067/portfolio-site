import React, { useState } from 'react';
import AudioVisualizer from '../components/AudioVisualizer';

function Music() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Define available folders and their properties
  const folders = [
    { name: 'Dance', path: 'Dance/', preset: 'electronic' },
    { name: 'Groove', path: 'Groove/', preset: 'ambient' },
    { name: 'Hype', path: 'Hype/', preset: 'rock' }
  ];

  // Generate tracks based on selected folder
  const getTracksForFolder = (folderName) => {
    const folderMap = {
      'Dance': [
        { file: 'Dance/1hollis balshdh.wav', name: '1hollis balshdh' },
        { file: 'Dance/alex g jumpstyle.mp3', name: 'alex g jumpstyle' },
        { file: 'Dance/alex g normal jumpstyle.mp3', name: 'normal jumpstyle' },
        { file: 'Dance/angelcore2.mp3', name: 'angelcore2' },
        { file: 'Dance/cc type beat 2 slow.mp3', name: 'cc type beat 2 slow' },
        { file: 'Dance/cc ukg swag 9-19.mp3', name: 'cc ukg swag' },
        { file: 'Dance/classic detroit house.mp3', name: 'detroit house' },
        { file: 'Dance/happy ukg.mp3', name: 'happy ukg' }
      ],
      'Groove': [
        { file: 'Groove/fakemink faceit.mp3', name: 'fakemink faceit' },
        { file: 'Groove/forever.mp3', name: 'forever' },
        { file: 'Groove/junglista niiice and easy.wav', name: 'junglista' },
        { file: 'Groove/ringtone.mp3', name: 'ringtone' },
        { file: 'Groove/shit innit MEL.mp3', name: 'shit innit' },
        { file: 'Groove/triplet loop 926 MEL.mp3', name: 'triplet loop' },
        { file: 'Groove/ukg wip chopped n screwed .mp3', name: 'ukg wip' },
        { file: 'Groove/wip bleh.mp3', name: 'wip bleh' }
      ],
      'Hype': [
        { file: 'Hype/1hollis balshdh.mp3', name: '1hollis balshdh' },
        { file: 'Hype/cc type beat 2 fast.mp3', name: 'cc type beat 2 fast' },
        { file: 'Hype/core as f.mp3', name: 'core as f' },
        { file: 'Hype/DNB 177 HAPPIII real.mp3', name: 'DNB 177' },
        { file: 'Hype/yaii happi core mix 2.mp3', name: 'happi core mix 2' }
      ]
    };

    const tracks = folderMap[folderName] || [];
    return tracks.map(track => ({
      ...track,
      preset: folders.find(f => f.name === folderName)?.preset || 'default'
    }));
  };

  const currentTracks = selectedFolder ? getTracksForFolder(selectedFolder) : [];

  const handleFolderSelect = (folderName) => {
    setSelectedFolder(folderName);
    setSelectedTrack(null); // Reset track selection when changing folders
  };

  const handleTrackChange = (trackIndex) => {
    setSelectedTrack(trackIndex);
  };

  return (
    <div className="page" style={{
      height: 'calc(100vh - 80px)', // Account for navbar height
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0
    }}>
      {/* Audio Visualizer Section - Full Available Height */}
      <div className="audio-visualizer-section" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '10px' // Reduced padding for mobile
      }}>
        {/* Cassette Tape Visualizer with Integrated Categories */}
        <AudioVisualizer
          folders={folders}
          tracks={currentTracks}
          currentTrackIndex={selectedTrack}
          onTrackChange={handleTrackChange}
          onFolderChange={handleFolderSelect}
          selectedFolder={selectedFolder}
          height={600} // Reduced from 800px for mobile
          className="cassette-player"
        />
      </div>
    </div>
  );
}

export default Music;
