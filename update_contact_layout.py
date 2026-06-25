import os
import re

css_addition = """
/* --- CONTACT PAGE UNIFIED LAYOUT --- */
.contact-info-badges {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: -60px auto 60px;
  position: relative;
  z-index: 10;
  flex-wrap: wrap;
  padding: 0 20px;
}
.info-badge {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(197, 154, 109, 0.3);
  box-shadow: 0 15px 30px rgba(0,0,0,0.08);
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  flex: 1;
  min-width: 250px;
  max-width: 350px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.info-badge:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(197, 154, 109, 0.2);
}
.info-badge i {
  font-size: 2.5rem;
  color: var(--primary);
  margin-bottom: 15px;
  display: block;
}
.info-badge h4 {
  color: var(--secondary);
  margin-bottom: 10px;
  font-size: 1.3rem;
}
.info-badge p, .info-badge a {
  color: var(--text-muted);
  margin: 0;
  font-size: 1.05rem;
  text-decoration: none;
}
.info-badge a:hover {
  color: var(--primary);
}

.unified-forms-container {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
}
.unified-forms-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: stretch;
}
@media (max-width: 900px) {
  .unified-forms-grid {
    grid-template-columns: 1fr;
  }
}

.unified-form-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(197, 154, 109, 0.2);
  box-shadow: 0 20px 40px rgba(0,0,0,0.06);
  border-radius: 24px;
  padding: 40px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}
.unified-form-card:hover {
  box-shadow: 0 25px 50px rgba(197, 154, 109, 0.15);
}
.unified-form-card h3 {
  color: var(--secondary);
  font-size: 1.8rem;
  margin-bottom: 8px;
  text-align: center;
}
.unified-form-card .subtitle {
  text-align: center;
  color: var(--text-muted);
  margin-bottom: 30px;
  font-size: 1rem;
}

/* Ensure inputs in both forms look identical */
.unified-input {
  background: rgba(255, 255, 255, 0.7) !important;
  border: 1px solid rgba(197, 154, 109, 0.3) !important;
  border-radius: 12px !important;
  padding: 15px 20px !important;
  font-size: 1.05rem !important;
  color: var(--text-main) !important;
  transition: all 0.3s ease !important;
  width: 100% !important;
  font-family: var(--font-body) !important;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.02) !important;
}
.unified-input:focus {
  background: rgba(255, 255, 255, 1) !important;
  border-color: var(--primary) !important;
  box-shadow: 0 0 15px rgba(197, 154, 109, 0.2), inset 0 2px 5px rgba(0,0,0,0.02) !important;
  outline: none !important;
  transform: translateY(-2px);
}
.unified-label {
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 8px;
  display: block;
  font-size: 0.95rem;
}
.unified-group {
  margin-bottom: 25px;
  position: relative;
}
.unified-btn {
  width: 100%;
  padding: 16px;
  font-size: 1.1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(197, 154, 109, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  margin-top: auto;
}
.unified-btn:hover {
  box-shadow: 0 15px 30px rgba(197, 154, 109, 0.5);
  transform: scale(1.02);
}
"""

with open('css/style.css', 'a') as f:
    f.write(css_addition)
print("CSS Added")

new_html_content = """    <!-- Contact Info Badges -->
    <div class="contact-info-badges">
        <div class="info-badge">
            <i class="fa fa-map-marker"></i>
            <h4>Location</h4>
            <p>Bangalore, India</p>
        </div>
        <div class="info-badge">
            <i class="fa fa-phone"></i>
            <h4>Phone</h4>
            <a href="tel:+919845188112">+91 98451 88112</a>
        </div>
        <div class="info-badge">
            <i class="fa fa-envelope"></i>
            <h4>Email</h4>
            <a href="mailto:info.svasth@gmail.com">info.svasth@gmail.com</a>
        </div>
        <div class="info-badge">
            <i class="fa fa-globe"></i>
            <h4>Socials</h4>
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 10px;">
                <a href="#" style="font-size: 1.5rem; color: var(--text-muted);"><i class="fa fa-facebook"></i></a>
                <a href="#" style="font-size: 1.5rem; color: var(--text-muted);"><i class="fa fa-instagram"></i></a>
                <a href="#" style="font-size: 1.5rem; color: var(--text-muted);"><i class="fa fa-twitter"></i></a>
            </div>
        </div>
    </div>

    <!-- Unified Forms Section -->
    <section class="unified-forms-container">
        <div class="unified-forms-grid">
            
            <!-- Send a Message Form -->
            <div class="unified-form-card">
                <h3>Send a Message</h3>
                <p class="subtitle">Have a question? We'd love to hear from you.</p>
                
                <form id="contactForm" style="display: flex; flex-direction: column; height: 100%;">
                    <input type="hidden" name="_captcha" value="false">
                    <div class="unified-group">
                        <label class="unified-label">Name</label>
                        <input type="text" name="name" class="unified-input" placeholder="Your Name" required>
                    </div>
                    <div class="unified-group">
                        <label class="unified-label">Email</label>
                        <input type="email" name="email" class="unified-input" placeholder="Your Email" required>
                    </div>
                    <div class="unified-group">
                        <label class="unified-label">Subject</label>
                        <input type="text" name="_subject" class="unified-input" placeholder="Subject" required>
                    </div>
                    <div class="unified-group" style="flex-grow: 1;">
                        <label class="unified-label">Message</label>
                        <textarea name="message" class="unified-input" style="height: 140px;" placeholder="Your Message" required></textarea>
                    </div>
                    <button type="submit" id="submitBtn" class="unified-btn">Send Message</button>
                </form>
                <div id="formStatus" style="display: none; margin-top: 20px; padding: 15px; border-radius: 8px; text-align: center; font-weight: 600;"></div>
            </div>

            <!-- Website Feedback Form -->
            <div class="unified-form-card">
                <h3>Website Feedback</h3>
                <p class="subtitle">Tell us how we can improve your experience!</p>
                
                <div id="fbFormContainer" style="height: 100%;">
                    <form id="fbForm" novalidate style="display: flex; flex-direction: column; height: 100%;">
                        <div class="grid grid-2" style="gap: 15px; margin-bottom: 25px;">
                            <div class="unified-group" style="margin-bottom: 0;">
                                <label class="unified-label">Full Name</label>
                                <input type="text" class="unified-input" id="fbName" placeholder="John Doe" required>
                                <div class="fb-error-msg">Please enter your name</div>
                            </div>
                            <div class="unified-group" style="margin-bottom: 0;">
                                <label class="unified-label">Age</label>
                                <input type="number" class="unified-input" id="fbAge" placeholder="25" min="1" max="120" required>
                                <div class="fb-error-msg">Please enter a valid age</div>
                            </div>
                        </div>

                        <div class="unified-group">
                            <label class="unified-label">How would you rate your experience?</label>
                            <div class="fb-stars" id="fbStarRating">
                                <input type="radio" id="fbStar5" name="fbRating" value="5" required>
                                <label for="fbStar5" title="5 stars"><i class="fa fa-star"></i></label>
                                <input type="radio" id="fbStar4" name="fbRating" value="4">
                                <label for="fbStar4" title="4 stars"><i class="fa fa-star"></i></label>
                                <input type="radio" id="fbStar3" name="fbRating" value="3">
                                <label for="fbStar3" title="3 stars"><i class="fa fa-star"></i></label>
                                <input type="radio" id="fbStar2" name="fbRating" value="2">
                                <label for="fbStar2" title="2 stars"><i class="fa fa-star"></i></label>
                                <input type="radio" id="fbStar1" name="fbRating" value="1">
                                <label for="fbStar1" title="1 star"><i class="fa fa-star"></i></label>
                            </div>
                            <div class="fb-error-msg" id="fbRatingError">Please select a rating</div>
                        </div>

                        <div class="unified-group" style="flex-grow: 1;">
                            <label class="unified-label">Your Feedback</label>
                            <textarea class="unified-input" id="fbFeedbackText" style="height: 140px;" placeholder="Tell us what you liked or what we can improve..." maxlength="500" required></textarea>
                            <span class="fb-char-counter" id="fbCharCounter">0 / 500</span>
                            <div class="fb-error-msg">Please provide your feedback</div>
                        </div>

                        <button type="submit" class="unified-btn" id="fbSubmitBtn">
                            <span>Submit Feedback</span>
                            <div class="fb-btn-loader"></div>
                        </button>
                    </form>
                </div>
                
                <div class="fb-success-state" id="fbSuccessState" style="margin: auto 0;">
                    <div class="fb-success-icon"><i class="fa fa-check"></i></div>
                    <h2 style="color: var(--secondary); margin-bottom: 10px;">Thank You!</h2>
                    <p style="color: var(--text-muted); margin-bottom: 25px;">Your feedback has been successfully submitted.</p>
                    <button class="unified-btn" onclick="resetFeedbackForm()">Submit Another</button>
                </div>
            </div>

        </div>
    </section>
"""

with open('contact.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace everything between <!-- Contact Section --> and <!-- Footer -->
# Using regex dotall
pattern = r"<!-- Contact Section -->.*?<!-- Footer -->"
replacement = new_html_content + "\n    <!-- Footer -->"
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('contact.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("HTML Updated")
