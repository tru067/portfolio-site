import Papa from 'papaparse';

// Utility function to parse CSV content
export const parseCSV = (csvContent) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Fetch bio content from the public folder
export const getBioContent = async () => {
  try {
    const response = await fetch('/bio.txt');
    if (!response.ok) {
      throw new Error('Failed to fetch bio content');
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error loading bio content:', error);
    // Fallback to placeholder content if file can't be loaded
    return `Truman Portfolio Bio

I'm a passionate musician and producer based in [City], with over [X] years of experience creating unique sounds that blend [genres/styles]. My journey in music began [when/how], and I've been fortunate to [achievements/highlights].

I specialize in [music style/production type] and have worked with [clients/artists/types of projects]. My music has been featured in [places/shows/projects], and I'm always looking for new opportunities to collaborate and create.

When I'm not in the studio, you can find me [hobbies/interests] or exploring new sounds and techniques to incorporate into my work.`;
  }
};

export const getDiscographyData = () => {
  return [
    {
      "Title": "Demo Track 1",
      "Artist": "Truman",
      "Year": "2024",
      "Genre": "Electronic",
      "Description": "First demo release showcasing new sound design techniques",
      "Link": "https://soundcloud.com/placeholder"
    },
    {
      "Title": "Album Title",
      "Artist": "Truman",
      "Year": "2023",
      "Genre": "Ambient",
      "Description": "Full-length album exploring atmospheric soundscapes",
      "Link": "https://soundcloud.com/placeholder"
    },
    {
      "Title": "Single Release",
      "Artist": "Truman",
      "Year": "2023",
      "Genre": "Pop",
      "Description": "Catchy single that gained radio play",
      "Link": "https://soundcloud.com/placeholder"
    },
    {
      "Title": "EP Collection",
      "Artist": "Truman",
      "Year": "2022",
      "Genre": "Indie Rock",
      "Description": "Collection of early experimental tracks",
      "Link": "https://soundcloud.com/placeholder"
    },
    {
      "Title": "Collaboration Project",
      "Artist": "Truman & Partner",
      "Year": "2022",
      "Genre": "Alternative",
      "Description": "Joint project with fellow musician",
      "Link": "https://soundcloud.com/placeholder"
    }
  ];
};

export const getResumeData = () => {
  return [
    {
      "Job Title": "Senior Producer",
      "Company": "Studio XYZ",
      "Dates": "2022-Present",
      "Description": "Lead producer for major recording projects, managing client relationships and overseeing production quality.",
      "Achievements": "Increased studio revenue by 40% through client acquisition, Maintained 98% project delivery rate",
      "Skills": "Project Management, Audio Engineering, Client Relations, Pro Tools, Logic Pro"
    },
    {
      "Job Title": "Freelance Producer",
      "Company": "Self-Employed",
      "Dates": "2020-2022",
      "Description": "Independent music production and sound design for various clients including ad agencies and independent artists.",
      "Achievements": "Completed 50+ projects across multiple genres, Built lasting relationships with 20+ clients",
      "Skills": "Music Production, Sound Design, Mixing, Mastering, Audio Editing"
    },
    {
      "Job Title": "Audio Engineer",
      "Company": "Recording Studio ABC",
      "Dates": "2018-2020",
      "Description": "Recording engineer specializing in live sessions and post-production work.",
      "Achievements": "Engineered 100+ recording sessions, Received commendation for technical expertise",
      "Skills": "Live Recording, Studio Recording, Signal Processing, Microphone Techniques"
    },
    {
      "Job Title": "Music Technology Student",
      "Company": "University of Arts",
      "Dates": "2014-2018",
      "Description": "Bachelor's degree in Music Technology with focus on production and sound design.",
      "Achievements": "Graduated Magna Cum Laude, Won award for innovative sound design project",
      "Skills": "Digital Audio Workstations, Music Theory, Acoustics, Composition"
    }
  ];
};
