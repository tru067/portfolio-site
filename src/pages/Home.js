import React, { useState, useEffect } from 'react';
import { getBioContent } from '../utils/csvParser';

function Home() {
  const [bioContent, setBioContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [mutedVideos, setMutedVideos] = useState({});

  useEffect(() => {
    const loadBioContent = async () => {
      try {
        const content = await getBioContent();
        setBioContent(content);
      } catch (error) {
        console.error('Error loading bio content:', error);
        setBioContent('Error loading bio content. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadBioContent();
  }, []);

  const toggleVideoMute = (videoId) => {
    setMutedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Hero Section - 2 Column Layout with Matrix Effects */}
      <div className="hero-section-2col">
        <div className="hero-image matrix-image-container">
            <img
              src="/media/images/profile.png"
              alt="Truman Gaynes at work"
              className="hero-img matrix-image"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+';
              }}
            />
            <div className="matrix-image-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="hero-description">
            <h1 className="hero-title matrix-title">Music, Storytelling, and Sound Design</h1>
            <p className="matrix-description">I'm Truman Gaynes, a New York-based music technologist and licensing coordinator connecting sound to story across entertainment, fashion, and brands. I compose daily, edit dialogue and ADR, and manage organized delivery workflows that help creative teams move faster.</p>
          </div>
        </div>
      </div>

      {/* Matrix Content Flow */}
      <div className="matrix-content-flow">
        <div className="matrix-info-item">
          <h3 className="matrix-info-title">education</h3>
          <p className="matrix-info-content">NYU - Music Technology, Music Business</p>
        </div>
        <div className="matrix-info-item">
          <h3 className="matrix-info-title">focus</h3>
          <p className="matrix-info-content">Composition, Licensing, Sound Design</p>
        </div>
        <div className="matrix-info-item">
          <h3 className="matrix-info-title">experience</h3>
          <p className="matrix-info-content">Turner Music, NYFW, Project Wayfarer</p>
        </div>
      </div>

      {/* My Story and Video Section */}
      <div className="story-video-section">
        <div className="my-story">
          <h3 className="story-title">My Story</h3>
          <div className="story-content">
            <p>My background in Music Technology and the Business of Entertainment (NYU) bridges the creative and logistical sides of sound. I've worked on dozens of original compositions, including for New York Fashion Week, interactive scores for indie games, and helping with custom pitches at Tuner Music for global brands.</p>
          </div>
        </div>

        <div className="video-showcase">
          <div className="portfolio-video matrix-video-container">
            <video
              className="matrix-video"
              src="/media/images/Life On Mars with Nick Graham - Nick Graham (720p, h264).mp4"
              title="Portfolio Video"
              loop
              muted={!mutedVideos['video1']}
              autoPlay
              playsInline
              onClick={() => toggleVideoMute('video1')}
              volume="0.6"
            />
            <div className="video-overlay">
              <div className="video-controls">
                <span className="muted-indicator">{mutedVideos['video1'] === false ? '🔊' : '🔇'}</span>
                <span className="click-to-unmute">{mutedVideos['video1'] === false ? 'Click to mute' : 'Click to unmute'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video and Story Section - Video Left, Text Right */}
      <div className="video-story-section">
        <div className="video-showcase">
          <div className="portfolio-video matrix-video-container">
            <video
              className="matrix-video"
              src="/media/images/Nick Graham S_S18 Atlantis - Nick Graham (720p, h264).mp4"
              title="Music Portfolio Video"
              loop
              muted={!mutedVideos['video2']}
              autoPlay
              playsInline
              onClick={() => toggleVideoMute('video2')}
              volume="0.6"
            />
            <div className="video-overlay">
              <div className="video-controls">
                <span className="muted-indicator">{mutedVideos['video2'] === false ? '🔊' : '🔇'}</span>
                <span className="click-to-unmute">{mutedVideos['video2'] === false ? 'Click to mute' : 'Click to unmute'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="my-story">
          <div className="story-content">
            <p>I'm passionate about how music transcends borders and mediums, using sound to shape emotional and interactive experiences. My work thrives at the intersection of composition, storytelling, and technology—collaborating with diverse artists worldwide to craft music that not only supports narrative but drives it forward.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
