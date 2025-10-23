import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Handle form submission with fetch to avoid full page reload
    const form = e.target;
    const formData = new FormData(form);
    
    // Log form data being submitted
    console.log('Form Data Being Submitted:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    console.log('Submitting to: https://formsubmit.co/trumangaynes@gmail.com');
    console.log('Method: POST');

    fetch('https://formsubmit.co/trumangaynes@gmail.com', {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      console.log('=== RESPONSE RECEIVED ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('OK:', response.ok);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('✓ Form submission successful!');
        alert('Thank you for your message! It has been sent successfully.');
        
        // Reset form
        console.log('Resetting form fields...');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        console.log('Form reset complete');
      } else {
        console.error('✗ Form submission failed with status:', response.status);
        alert('There was an error sending your message. Please try again.');
      }
      console.log('=== FORM SUBMISSION COMPLETE ===\n');
    })
    .catch(error => {
      console.error('=== FORM SUBMISSION ERROR ===');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Full Error Object:', error);
      alert('There was an error sending your message. Please try again.');
      console.log('=== FORM SUBMISSION COMPLETE (WITH ERROR) ===\n');
    });
  };

  return (
    <div className="page">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Contact</h1>
        <p className="page-subtitle">Get in touch for collaborations and inquiries</p>
      </div>

      {/* Two Column Layout */}
      <div className="contact-layout">
        {/* Left Column - Contact Form */}
        <div className="contact-form-container">
          <div className="contact-form-card">
            <p className="contact-intro">
              Interested in working together? Send me a message and I'll get back to you soon.
            </p>

            <form className="contact-form" onSubmit={handleSubmit}>
              {/* Hidden fields for FormSubmit.co */}
              <input type="hidden" name="_next" value={window.location.href} />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_subject" value="New Contact Form Submission" />

              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject" className="form-label">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="form-input"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  className="form-textarea"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell me about your project or inquiry..."
                />
              </div>



              <div className="form-group" style={{ textAlign: 'center', marginTop: '32px', marginBottom: '16px' }}>
                <button type="submit" className="btn btn-secondary" style={{ fontSize: '18px', padding: '16px 32px' }}>
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Other Ways to Connect */}
        <div className="contact-info-container">
          <div className="contact-info-card">
            <h3 className="contact-info-title">Other Ways to Connect</h3>
            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-icon">✉️</div>
                <div className="contact-details">
                  <div className="contact-label">Email</div>
                  <div className="contact-value">trumangaynes@gmail.com</div>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📱</div>
                <div className="contact-details">
                  <div className="contact-label">Phone</div>
                  <div className="contact-value">+1 (310) 975-4896</div>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <div className="contact-label">Location</div>
                  <div className="contact-value">Manhattan, New York</div>
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div className="contact-profile">
              <img
                src="/media/images/profile.png"
                alt="Profile"
                className="contact-profile-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik01MCAxMjBDNTAgMTAwIDUwIDgwIDc1IDgwQzk5IDgwIDEwMCA5NSA5OSAxMjAiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
