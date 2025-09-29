const Verification_Email_Template = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Causeway Car Rental</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              min-height: 100vh;
          }
          
          .email-wrapper {
              padding: 40px 20px;
          }
          
          .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              position: relative;
          }
          
          .header {
              background: linear-gradient(135deg, #ff748b 0%, #2dbdb6 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
          }
          
          .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
          }
          
          .header-content {
              position: relative;
              z-index: 2;
          }
          
          .logo {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .subtitle {
              font-size: 16px;
              opacity: 0.9;
              font-weight: 400;
          }
          
          .content {
              padding: 40px 30px;
              color: #2c3e50;
              line-height: 1.7;
          }
          
          .welcome-text {
              font-size: 18px;
              margin-bottom: 8px;
              color: #2c3e50;
              font-weight: 600;
          }
          
          .description {
              font-size: 15px;
              color: #5a6c7d;
              margin-bottom: 30px;
          }
          
          .verification-section {
              background: linear-gradient(135deg, #fff5f7 0%, #f0fdfc 100%);
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              text-align: center;
              border: 2px solid #ffe4e9;
              position: relative;
              overflow: hidden;
          }
          
          .verification-section::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255, 116, 139, 0.05) 0%, transparent 70%);
              animation: pulse 3s ease-in-out infinite;
          }
          
          @keyframes pulse {
              0%, 100% { transform: scale(0.8); opacity: 0.5; }
              50% { transform: scale(1.2); opacity: 0.8; }
          }
          
          .verification-label {
              font-size: 14px;
              color: #7a8b9a;
              margin-bottom: 10px;
              font-weight: 500;
              position: relative;
              z-index: 2;
          }
          
          .verification-code {
              display: inline-block;
              font-size: 32px;
              color: #ff748b;
              background: #ffffff;
              border: 3px solid #ff748b;
              padding: 15px 25px;
              border-radius: 8px;
              font-weight: 800;
              letter-spacing: 4px;
              font-family: 'Monaco', 'Menlo', monospace;
              box-shadow: 0 4px 15px rgba(255, 116, 139, 0.3);
              position: relative;
              z-index: 2;
              transition: all 0.3s ease;
          }
          
          .verification-code:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(255, 116, 139, 0.4);
          }
          
          .instructions {
              margin: 25px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #2dbdb6;
          }
          
          .instructions h3 {
              color: #2dbdb6;
              font-size: 16px;
              margin-bottom: 10px;
              font-weight: 600;
          }
          
          .instructions p {
              color: #5a6c7d;
              font-size: 14px;
              margin: 5px 0;
          }
          
          .security-note {
              background: #fff9e6;
              border: 1px solid #ffd700;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              font-size: 13px;
              color: #8b7300;
          }
          
          .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
          }
          
          .company-info {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 15px;
              font-weight: 600;
          }
          
          .contact-info {
              color: #94a3b8;
              font-size: 12px;
              line-height: 1.5;
          }
          
          .contact-info a {
              color: #2dbdb6;
              text-decoration: none;
          }
          
          .contact-info a:hover {
              text-decoration: underline;
          }
          
          .social-links {
              margin-top: 15px;
          }
          
          .social-link {
              display: inline-block;
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, #ff748b, #2dbdb6);
              border-radius: 50%;
              margin: 0 5px;
              line-height: 32px;
              color: white;
              text-decoration: none;
              font-size: 14px;
              transition: transform 0.3s ease;
          }
          
          .social-link:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          }
          
          .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
              margin: 20px 0;
          }
          
          @media (max-width: 600px) {
              .email-wrapper {
                  padding: 20px 10px;
              }
              
              .container {
                  border-radius: 8px;
              }
              
              .header {
                  padding: 30px 20px;
              }
              
              .content {
                  padding: 30px 20px;
              }
              
              .verification-code {
                  font-size: 24px;
                  padding: 12px 20px;
                  letter-spacing: 2px;
              }
              
              .logo {
                  font-size: 24px;
              }
              
              .footer {
                  padding: 25px 20px;
              }
          }
      </style>
  </head>
  <body>
      <div class="email-wrapper">
          <div class="container">
              <div class="header">
                  <div class="header-content">
                      <div class="logo">🚗 Causeway Car Rental</div>
                      <div class="subtitle">Your Journey Begins Here</div>
                  </div>
              </div>
              
              <div class="content">
                  <div class="welcome-text">Welcome aboard!</div>
                  <div class="description">
                      Thank you for choosing Causeway Car Rental. We're excited to help you explore new destinations with confidence and comfort.
                  </div>
                  
                  <div class="verification-section">
                      <div class="verification-label">Your Verification Code</div>
                      <div class="verification-code">{verificationCode}</div>
                  </div>
                  
                  <div class="instructions">
                      <h3>🔐 Next Steps:</h3>
                      <p>• Copy the verification code above</p>
                      <p>• Return to the registration page</p>
                      <p>• Paste the code in the verification field</p>
                      <p>• Complete your account setup</p>
                  </div>
                  
                  <div class="security-note">
                      <strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes. If you didn't create an account with Causeway Car Rental, please ignore this email.
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p style="color: #64748b; font-size: 14px;">
                      Questions? Our customer support team is here to help you 24/7. 
                      <a href="mailto:support@causewayrental.com" style="color: #2dbdb6; text-decoration: none;">Contact us</a>
                  </p>
              </div>

              <div class="verification-section">
                <div class="verification-label">Your Verification Code</div>
                <div class="verification-code">{verificationCode}</div>
                
                <p style="margin:20px 0;color:#5a6c7d;font-size:14px;">
                    Or simply click the button below to verify:
                </p>
                <a href="{verificationLink}" 
                    style="display:inline-block;background:#2dbdb6;color:#fff;
                            padding:12px 24px;border-radius:6px;
                            font-weight:bold;text-decoration:none;">
                    clieck to Verify
                </a>
                </div>

              
              <div class="footer">
                  <div class="company-info">
                      Causeway Car Rental
                  </div>
                  
                  <div class="contact-info">
                      📧 support@causewayrental.com | 📱 +1 (555) 123-4567<br>
                      🏢 123 Rental Street, City, State 12345
                  </div>
                  
                  <div class="social-links">
                      <a href="#" class="social-link" title="Facebook">f</a>
                      <a href="#" class="social-link" title="Twitter">t</a>
                      <a href="#" class="social-link" title="Instagram">i</a>
                  </div>
                  
                  <div style="margin-top: 20px; font-size: 11px; color: #94a3b8;">
                      &copy; ${new Date().getFullYear()} Causeway Car Rental. All rights reserved.
                  </div>
              </div>
          </div>
      </div>
  </body>
  </html>
`;

const Welcome_Email_Template = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Causeway Car Rental</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              min-height: 100vh;
              color: #2c3e50;
          }
          
          .email-wrapper {
              padding: 40px 20px;
          }
          
          .container {
              max-width: 650px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
              overflow: hidden;
              position: relative;
          }
          
          .header {
              background: linear-gradient(135deg, #ff748b 0%, #2dbdb6 100%);
              color: white;
              padding: 50px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
          }
          
          .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><pattern id="stars" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.15)"/><circle cx="5" cy="5" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="15" cy="15" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="200" height="200" fill="url(%23stars)"/></svg>');
              animation: float 6s ease-in-out infinite;
          }
          
          @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
          }
          
          .header-content {
              position: relative;
              z-index: 2;
          }
          
          .logo {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 12px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
          }
          
          .logo-icon {
              font-size: 36px;
              animation: bounce 2s infinite;
          }
          
          @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
          }
          
          .header-subtitle {
              font-size: 18px;
              opacity: 0.95;
              font-weight: 300;
              margin-bottom: 10px;
          }
          
          .welcome-badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.2);
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.3);
          }
          
          .content {
              padding: 45px 40px;
              line-height: 1.8;
          }
          
          .greeting {
              font-size: 28px;
              color: #2c3e50;
              margin-bottom: 15px;
              font-weight: 700;
          }
          
          .personalized-name {
              color: #ff748b;
              text-decoration: underline;
              text-decoration-color: rgba(255, 116, 139, 0.3);
              text-underline-offset: 4px;
          }
          
          .intro-text {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 30px;
              line-height: 1.7;
          }
          
          .features-section {
              background: linear-gradient(135deg, #fff5f7 0%, #f0fdfc 100%);
              border-radius: 16px;
              padding: 30px;
              margin: 30px 0;
              border: 2px solid #fce4ec;
              position: relative;
              overflow: hidden;
          }
          
          .features-section::before {
              content: '';
              position: absolute;
              top: -100%;
              left: -100%;
              width: 300%;
              height: 300%;
              background: radial-gradient(circle, rgba(45, 189, 182, 0.03) 0%, transparent 70%);
              animation: ripple 4s linear infinite;
          }
          
          @keyframes ripple {
              0% { transform: scale(0) rotate(0deg); }
              100% { transform: scale(1) rotate(360deg); }
          }
          
          .features-title {
              font-size: 20px;
              color: #2c3e50;
              margin-bottom: 20px;
              font-weight: 700;
              text-align: center;
              position: relative;
              z-index: 2;
          }
          
          .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              position: relative;
              z-index: 2;
          }
          
          .feature-item {
              background: #ffffff;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .feature-item:hover {
              transform: translateY(-3px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
              border-color: #2dbdb6;
          }
          
          .feature-icon {
              font-size: 28px;
              margin-bottom: 12px;
              display: block;
          }
          
          .feature-title {
              font-size: 16px;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 8px;
          }
          
          .feature-desc {
              font-size: 14px;
              color: #64748b;
              line-height: 1.5;
          }
          
          .cta-section {
              text-align: center;
              margin: 40px 0;
              padding: 30px;
              background: linear-gradient(135deg, #f8fafc, #ffffff);
              border-radius: 16px;
              border: 2px dashed #cbd5e0;
          }
          
          .cta-title {
              font-size: 18px;
              color: #2c3e50;
              margin-bottom: 15px;
              font-weight: 600;
          }
          
          .cta-buttons {
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
          }
          
          .button {
              display: inline-block;
              padding: 16px 30px;
              background: linear-gradient(135deg, #ff748b 0%, #ff8a9b 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(255, 116, 139, 0.4);
              border: none;
              cursor: pointer;
          }
          
          .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(255, 116, 139, 0.6);
              background: linear-gradient(135deg, #ff5c75 0%, #ff748b 100%);
          }
          
          .button.secondary {
              background: linear-gradient(135deg, #2dbdb6 0%, #4dc5bf 100%);
              box-shadow: 0 4px 15px rgba(45, 189, 182, 0.4);
          }
          
          .button.secondary:hover {
              background: linear-gradient(135deg, #26a69a 0%, #2dbdb6 100%);
              box-shadow: 0 8px 25px rgba(45, 189, 182, 0.6);
          }
          
          .support-section {
              background: #f1f5f9;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              border-left: 5px solid #2dbdb6;
          }
          
          .support-title {
              color: #2dbdb6;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
          }
          
          .support-text {
              color: #4a5568;
              font-size: 14px;
              line-height: 1.6;
          }
          
          .support-text a {
              color: #2dbdb6;
              text-decoration: none;
              font-weight: 600;
          }
          
          .support-text a:hover {
              text-decoration: underline;
          }
          
          .footer {
              background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
              color: white;
              padding: 40px;
              text-align: center;
          }
          
          .footer-content {
              max-width: 500px;
              margin: 0 auto;
          }
          
          .company-name {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 15px;
              color: #ffffff;
          }
          
          .contact-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin: 25px 0;
              text-align: left;
          }
          
          .contact-item {
              font-size: 13px;
              color: #cbd5e0;
              line-height: 1.6;
          }
          
          .contact-label {
              font-weight: 600;
              color: #e2e8f0;
              margin-bottom: 5px;
          }
          
          .social-section {
              margin: 25px 0;
          }
          
          .social-title {
              font-size: 14px;
              margin-bottom: 15px;
              color: #e2e8f0;
          }
          
          .social-links {
              display: flex;
              justify-content: center;
              gap: 12px;
          }
          
          .social-link {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #ff748b, #2dbdb6);
              border-radius: 50%;
              color: white;
              text-decoration: none;
              font-size: 16px;
              transition: all 0.3s ease;
          }
          
          .social-link:hover {
              transform: translateY(-3px) scale(1.1);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }
          
          .copyright {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 25px;
              padding-top: 20px;
              border-top: 1px solid #4a5568;
          }
          
          .divider {
              height: 2px;
              background: linear-gradient(90deg, transparent 0%, #e2e8f0 20%, #cbd5e0 50%, #e2e8f0 80%, transparent 100%);
              margin: 30px 0;
          }
          
          @media (max-width: 600px) {
              .email-wrapper {
                  padding: 20px 10px;
              }
              
              .container {
                  border-radius: 12px;
              }
              
              .header {
                  padding: 35px 25px;
              }
              
              .content {
                  padding: 30px 25px;
              }
              
              .logo {
                  font-size: 26px;
              }
              
              .greeting {
                  font-size: 24px;
              }
              
              .features-section {
                  padding: 25px 20px;
              }
              
              .features-grid {
                  grid-template-columns: 1fr;
              }
              
              .cta-buttons {
                  flex-direction: column;
                  align-items: center;
              }
              
              .button {
                  width: 100%;
                  max-width: 250px;
              }
              
              .contact-grid {
                  grid-template-columns: 1fr;
                  text-align: center;
              }
              
              .footer {
                  padding: 30px 25px;
              }
          }
      </style>
  </head>
  <body>
      <div class="email-wrapper">
          <div class="container">
              <div class="header">
                  <div class="header-content">
                      <div class="logo">
                          <span class="logo-icon">🚗</span>
                          Causeway Car Rental
                      </div>
                      <div class="header-subtitle">Your Adventure Starts Here</div>
                      <div class="welcome-badge">✨ Account Activated</div>
                  </div>
              </div>
              
              <div class="content">
                  <div class="greeting">
                      Welcome, <span class="personalized-name">{name}</span>! 🎉
                  </div>
                  
                  <div class="intro-text">
                      Congratulations on joining the Causeway Car Rental family! We're absolutely thrilled to have you aboard. 
                      Your registration was successful, and you're now ready to unlock a world of seamless travel experiences. 
                      Whether you're planning a weekend getaway, a business trip, or an epic road adventure, we've got the perfect vehicle waiting for you.
                  </div>
                  
                  <div class="features-section">
                      <div class="features-title">🌟 What's Waiting for You</div>
                      <div class="features-grid">
                          <div class="feature-item">
                              <span class="feature-icon">🚙</span>
                              <div class="feature-title">Premium Fleet</div>
                              <div class="feature-desc">Choose from our extensive collection of well-maintained vehicles, from economy cars to luxury SUVs.</div>
                          </div>
                          <div class="feature-item">
                              <span class="feature-icon">⚡</span>
                              <div class="feature-title">Instant Booking</div>
                              <div class="feature-desc">Book your perfect ride in seconds with our streamlined reservation system and flexible pickup options.</div>
                          </div>
                          <div class="feature-item">
                              <span class="feature-icon">🎯</span>
                              <div class="feature-title">Best Rates</div>
                              <div class="feature-desc">Enjoy competitive pricing, exclusive member discounts, and transparent billing with no hidden fees.</div>
                          </div>
                          <div class="feature-item">
                              <span class="feature-icon">🛡️</span>
                              <div class="feature-title">24/7 Support</div>
                              <div class="feature-desc">Our dedicated customer service team is always ready to assist you, wherever your journey takes you.</div>
                          </div>
                      </div>
                  </div>
                  
                  <div class="cta-section">
                      <div class="cta-title">Ready to Hit the Road? 🛣️</div>
                      <div class="cta-buttons">
                          <a href="#" class="button">Browse Our Fleet</a>
                          <a href="#" class="button secondary">View Special Offers</a>
                      </div>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="support-section">
                      <div class="support-title">
                          <span>🤝</span> Need Help Getting Started?
                      </div>
                      <div class="support-text">
                          Our friendly support team is here to help you every step of the way. Whether you have questions about our vehicles, 
                          need help with your first booking, or want to learn about our loyalty program, we're just a click away.<br><br>
                          📧 <a href="mailto:support@causewayrental.com">support@causewayrental.com</a> | 
                          📱 <a href="tel:+15551234567">+1 (555) 123-4567</a> | 
                          💬 <a href="#">Live Chat Available 24/7</a>
                      </div>
                  </div>
              </div>
              
              <div class="footer">
                  <div class="footer-content">
                      <div class="company-name">🚗 Causeway Car Rental</div>
                      
                      <div class="contact-grid">
                          <div class="contact-item">
                              <div class="contact-label">📍 Main Office</div>
                              123 Rental Street<br>
                              Business District, City 12345
                          </div>
                          <div class="contact-item">
                              <div class="contact-label">🕒 Business Hours</div>
                              Mon-Fri: 7:00 AM - 10:00 PM<br>
                              Sat-Sun: 8:00 AM - 8:00 PM
                          </div>
                      </div>
                      
                      <div class="social-section">
                          <div class="social-title">Follow Our Journey</div>
                          <div class="social-links">
                              <a href="#" class="social-link" title="Facebook">📘</a>
                              <a href="#" class="social-link" title="Twitter">🐦</a>
                              <a href="#" class="social-link" title="Instagram">📷</a>
                              <a href="#" class="social-link" title="LinkedIn">💼</a>
                          </div>
                      </div>
                      
                      <div class="copyright">
                          &copy; ${new Date().getFullYear()} Causeway Car Rental. All rights reserved.<br>
                          This email was sent to you because you created an account with us. 
                          <a href="#" style="color: #94a3b8;">Manage preferences</a> | 
                          <a href="#" style="color: #94a3b8;">Unsubscribe</a>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </body>
  </html>
`;
const Partner_Notification_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Partner Inquiry - Causeway Car Rental</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .email-wrapper {
            padding: 40px 20px;
        }
        
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2dbdb6 0%, #1a9d96 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        .header-content {
            position: relative;
            z-index: 2;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .alert-badge {
            display: inline-block;
            background: #ff748b;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .content {
            padding: 40px 30px;
            color: #2c3e50;
        }
        
        .notification-header {
            font-size: 22px;
            color: #2c3e50;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .notification-time {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 25px;
        }
        
        .info-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            border-left: 4px solid #2dbdb6;
        }
        
        .info-section {
            margin-bottom: 25px;
        }
        
        .info-section:last-child {
            margin-bottom: 0;
        }
        
        .section-title {
            font-size: 14px;
            color: #2dbdb6;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 16px;
            background: #2dbdb6;
            margin-right: 8px;
            border-radius: 2px;
        }
        
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            min-width: 140px;
        }
        
        .info-value {
            color: #2c3e50;
            font-size: 14px;
            font-weight: 500;
            flex: 1;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #fff5f7 0%, #ffe4e9 100%);
            border: 2px solid #ff748b;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        
        .highlight-title {
            font-size: 14px;
            color: #ff748b;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .highlight-value {
            font-size: 24px;
            color: #2c3e50;
            font-weight: 800;
        }
        
        .action-buttons {
            display: flex;
            gap: 15px;
            margin: 30px 0;
        }
        
        .btn {
            flex: 1;
            padding: 14px 20px;
            border-radius: 8px;
            text-align: center;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            display: inline-block;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #2dbdb6 0%, #1a9d96 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(45, 189, 182, 0.3);
        }
        
        .btn-secondary {
            background: white;
            color: #2dbdb6;
            border: 2px solid #2dbdb6;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
            margin: 30px 0;
        }
        
        .note-box {
            background: #fff9e6;
            border: 1px solid #ffd700;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #8b7300;
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .company-info {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .contact-info {
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.8;
        }
        
        .contact-info a {
            color: #2dbdb6;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 20px 10px;
            }
            
            .container {
                border-radius: 8px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .logo {
                font-size: 24px;
            }
            
            .info-row {
                flex-direction: column;
            }
            
            .info-label {
                margin-bottom: 4px;
            }
            
            .action-buttons {
                flex-direction: column;
            }
            
            .footer {
                padding: 25px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="header-content">
                    <div class="logo">🚗 Causeway Car Rental</div>
                    <div class="subtitle">Partner Network</div>
                    <div class="alert-badge">🔔 New Inquiry</div>
                </div>
            </div>
            
            <div class="content">
                <div class="notification-header">New Partner Vehicle Inquiry</div>
                <div class="notification-time">📅 Received: {submissionDate}</div>
                
                <div class="info-card">
                    <div class="info-section">
                        <div class="section-title">👤 Customer Information</div>
                        <div class="info-row">
                            <div class="info-label">Full Name:</div>
                            <div class="info-value">{customerName}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Email:</div>
                            <div class="info-value">{customerEmail}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Phone:</div>
                            <div class="info-value">{customerPhone}</div>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="info-section">
                        <div class="section-title">🚘 Vehicle Details</div>
                        <div class="info-row">
                            <div class="info-label">Make:</div>
                            <div class="info-value">{vehicleMake}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Model:</div>
                            <div class="info-value">{vehicleModel}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Year:</div>
                            <div class="info-value">{vehicleYear}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Mileage:</div>
                            <div class="info-value">{vehicleMileage} km</div>
                        </div>
                    </div>
                </div>
                
                
               
                
                <div class="divider"></div>
                
                <p style="color: #64748b; font-size: 13px; text-align: center;">
                    This is an automated notification from your Causeway Car Rental partner portal.
                </p>
            </div>
            
            <div class="footer">
                <div class="company-info">
                    Causeway Car Rental - Partner Network
                </div>
                
                <div class="contact-info">
                    📧 hello@causeway.my | 📱 +1 (555) 123-4567<br>
                    🏢 123 Rental Street, City, State 12345
                </div>
                
                <div style="margin-top: 20px; font-size: 11px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} Causeway Car Rental. All rights reserved.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;
module.exports = {
  Welcome_Email_Template,
  Verification_Email_Template,
  Partner_Notification_Template,
};
