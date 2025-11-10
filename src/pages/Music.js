import React, { useState } from 'react';
import AudioVisualizer from '../components/AudioVisualizer';

function Music({ onTrackChange }) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Define available folders and their properties
  const folders = [
    { name: 'Dance', path: 'Dance/', preset: 'electronic' },
    { name: 'Vibe', path: 'Vibe/', preset: 'ambient' },
    { name: 'Score', path: 'Score/', preset: 'rock' }
  ];

  // Generate tracks based on selected folder
  const getTracksForFolder = (folderName) => {
    const folderMap = {
      'Dance': [
        { file: 'Dance/core as f.mp3', name: 'Hardcore Energy' }, // original: core as f
        { file: 'Dance/1hollis balshdh.wav', name: 'Hollis Groove' }, // original: 1hollis balshdh
        { file: 'Dance/alex g normal jumpstyle.mp3', name: 'normal jumpstyle' },
        { file: 'Dance/angelcore2.mp3', name: 'Angelic Dreams' }, // original: angelcore2
        { file: 'Dance/cc type beat 2 slow.mp3', name: 'cc type beat 2 slow' },
        { file: 'Dance/cc ukg swag 9-19.mp3', name: 'cc ukg' }, // original: cc ukg swag
        { file: 'Dance/classic detroit house.mp3', name: 'detroit house' },
        { file: 'Dance/control.mp3', name: 'control' },
        { file: 'Dance/happy ukg.mp3', name: 'Joyful Garage' }, // original: happy ukg
        { file: 'Dance/together again 162.mp3', name: 'together again 162' }
      ],
      'Vibe': [
        { file: 'Vibe/backseat with a subwoofer.mp3', name: 'backseat with a subwoofer' },
        { file: 'Vibe/hey you.mp3', name: 'hey you' },
        { file: 'Vibe/junglista niiice and easy.wav', name: 'junglista' },
        { file: 'Vibe/ringtone.mp3', name: 'ringtone' },
        { file: 'Vibe/shit innit MEL.mp3', name: 'Reality Check' }, // original: shit innit
        { file: 'Vibe/soft melody.mp3', name: 'soft melody' },
        { file: 'Vibe/wip bleh.mp3', name: 'wip' } // original: wip bleh
      ],
      'Score': [
        { file: 'Score/spice lounge matrix set 80bpm with scratch mixdown 2_normalized.wav', name: 'Spice Lounge Matrix' }, // original: spice lounge matrix set 80bpm with scratch mixdown 2
        { file: 'Score/cc type beat 2 fast.mp3', name: 'Fast Type Beat' }, // original: cctype beat 2 fast
        { file: 'Score/DG bitch 2.mp3', name: 'Detroit Grit' }, // original: dg bitch 2
        { file: 'Score/DNB 177 HAPPIII real.mp3', name: 'DNB 177' },
        { file: 'Score/funkalicious mixdown 3_normalized.wav', name: 'Funkalicious Mixdown' }, // original: funkalicious mixdown 3
        { file: 'Score/yaii happi core mix 2.mp3', name: 'Happy Hardcore Remix' } // original: happi core mix 2
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
    // Also notify parent component about track change
    if (onTrackChange && currentTracks[trackIndex]) {
      onTrackChange(currentTracks[trackIndex]);
    }
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
