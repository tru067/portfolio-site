import React, { useState } from 'react';
import { getResumeData } from '../utils/csvParser';

function ResumeCard() {
  const resumeData = getResumeData();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  return (
    <div className="resume-container">
      <div className="tabs">
        {resumeData.map((job, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', fontSize: '16px', fontFamily: 'inherit' }}>{job['Job Title']}</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '2px', fontFamily: 'inherit' }}>
                {job.Company} • {job.Dates}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {resumeData.map((job, index) => (
          activeTab === index && (
            <div key={index} className="tab-pane active">
              <div className="job-header">
                <div>
                  <div className="job-title">{job['Job Title']}</div>
                  <div className="job-company">{job.Company}</div>
                </div>
                <div className="job-dates">{job.Dates}</div>
              </div>

              <div className="job-description">
                {job.Description}
              </div>

              <div className="job-achievements">
                <h5>Key Achievements</h5>
                {job.Achievements.split(', ').map((achievement, i) => (
                  <p key={i}>• {achievement}</p>
                ))}
              </div>

              <div className="job-skills">
                <h5 style={{
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000',
                  fontFamily: 'inherit'
                }}>
                  Skills & Technologies
                </h5>
                {job.Skills.split(', ').map((skill, i) => (
                  <span key={i} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default ResumeCard;
