import React, { useState, useEffect } from 'react';

function Resume() {
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Read the resume.txt file
    fetch('/resume.txt')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load resume file');
        }
        return response.text();
      })
      .then(text => {
        setResumeText(text);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading resume:', error);
        setError('Failed to load resume. Please try again later.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Resume</h1>
          <p className="page-subtitle">Professional experience and technical skills</p>
        </div>
        <div className="resume-wrapper">
          <div className="loading">Loading resume...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Resume</h1>
          <p className="page-subtitle">Professional experience and technical skills</p>
        </div>
        <div className="resume-wrapper">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      

      <div className="resume-wrapper">
        <div className="education-section">
          <h2 className="education-title">Education</h2>
          <div className="education-content">
            <h3 className="school-name">New York University</h3>
            <p className="graduation">Graduated: May 2024</p>
            <p className="degree">Bachelor of Music: Music Technology</p>
            <p className="minor">Minor: Business of Entertainment, Media and Technology (BEMT)</p>
            <p className="honors">Honors: NYU Steinhardt Scholarship</p>
            <div className="coursework">
              <p className="coursework-title">Relevant Coursework:</p>
              <p className="courses">Music Business Strategy, Strategic Music and Branding, Marketing Statistics</p>
            </div>
          </div>
        </div>

        <div className="skills-section">
          <h2 className="skills-title">Skills</h2>
          <div className="skills-content">
            <div className="skill-category">
              <h3 className="skill-category-title">Language</h3>
              <p className="skill-items">Spanish (Fluent), Italian (Fluent), French (Conversational)</p>
            </div>
            <div className="skill-category">
              <h3 className="skill-category-title">Technical</h3>
              <p className="skill-items">Ableton Live (Advanced), Pro Tools (Intermediate), Airtable (Intermediate), C++ (Beginner), HTML (Beginner)</p>
            </div>
          </div>
        </div>

        <div className="resume-text-container">
          <div className="resume-header">
          <h1>Resume</h1>
        </div>
          <div className="resume-text">
            {resumeText.split('\n').map((line, index) => {
              const lines = resumeText.split('\n');
              const currentLine = line.trim();
              const nextLine = lines[index + 1]?.trim() || '';
              const prevLine = lines[index - 1]?.trim() || '';

              // Check if this line is a company name (followed by location)
              if (currentLine && !currentLine.includes('●') &&
                  (nextLine.includes('New York, NY') || nextLine.includes('Los Angeles, CA'))) {
                return (
                  <div key={index} className="company-header">
                    <h2 className="company-name">{currentLine}</h2>
                    <span className="company-location">{nextLine}</span>
                  </div>
                );
              }

              // Skip location lines that are already handled above
              if (currentLine.includes('New York, NY') || currentLine.includes('Los Angeles, CA')) {
                return null;
              }

              // Format job titles
              if (currentLine && !currentLine.startsWith('●') && !currentLine.startsWith('Present') &&
                  !currentLine.includes('2022') && !currentLine.includes('2018') && !currentLine.includes('2017') &&
                  currentLine.length < 50 && prevLine.includes('NY') || prevLine.includes('CA')) {
                return <h3 key={index} className="job-title">{currentLine}</h3>;
              }

              // Format dates (Present or date ranges)
              if (currentLine === 'Present' ||
                  (currentLine.includes('2022') || currentLine.includes('2018') || currentLine.includes('2017'))) {
                return <p key={index} className="job-dates">{currentLine}</p>;
              }

              // Format bullet points
              if (currentLine.startsWith('●')) {
                return <p key={index} className="resume-bullet">{currentLine}</p>;
              }

              // Skip empty lines
              if (!currentLine) {
                return null;
              }

              // Regular text (fallback)
              return <p key={index} className="resume-paragraph">{currentLine}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resume;
