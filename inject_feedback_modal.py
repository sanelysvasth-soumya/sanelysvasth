import os
import re

css_addition = """
/* --- GLOBAL FEEDBACK MODAL UI --- */
.global-feedback-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 24px;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(197, 154, 109, 0.4);
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.global-feedback-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 25px rgba(197, 154, 109, 0.5);
}

.global-feedback-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 10000;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.global-feedback-overlay.show {
  opacity: 1;
}

.global-feedback-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 25px 50px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  transform: scale(0.9) translateY(20px);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.global-feedback-overlay.show .global-feedback-card {
  transform: scale(1) translateY(0);
}

.global-feedback-close {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 28px;
  color: #aaa;
  cursor: pointer;
  transition: color 0.2s;
  background: none;
  border: none;
  line-height: 1;
}
.global-feedback-close:hover {
  color: var(--primary);
}

.gf-header {
  text-align: center;
  margin-bottom: 25px;
}
.gf-header h2 {
  font-size: 2rem;
  color: var(--secondary);
  margin-bottom: 5px;
}
.gf-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Form Elements inside Modal */
.gf-form-group {
  margin-bottom: 20px;
  position: relative;
}
.gf-form-control {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(197, 154, 109, 0.3);
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 1rem;
  color: var(--text-main);
  transition: all 0.3s ease;
  width: 100%;
  font-family: var(--font-body);
}
.gf-form-control:focus {
  background: rgba(255, 255, 255, 1);
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(197, 154, 109, 0.2);
  outline: none;
}
textarea.gf-form-control {
  resize: vertical;
  min-height: 120px;
}
.gf-form-label {
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 8px;
  display: block;
  font-size: 0.9rem;
}

/* Animated 5-Star Rating */
.gf-rating-wrapper {
  margin-bottom: 25px;
}
.gf-stars {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
}
.gf-stars input { display: none; }
.gf-stars label {
  font-size: 2.2rem;
  color: #e4e5e9;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-right: 5px;
}
.gf-stars label:hover,
.gf-stars label:hover ~ label,
.gf-stars input:checked ~ label {
  color: #ffc107;
  text-shadow: 0 0 10px rgba(255, 193, 7, 0.4);
}
.gf-stars label:hover {
  transform: scale(1.1) rotate(-5deg);
}

.gf-char-counter {
  position: absolute;
  bottom: 12px;
  right: 15px;
  font-size: 0.75rem;
  color: var(--text-muted);
  pointer-events: none;
  transition: color 0.3s;
}
.gf-char-counter.near-limit { color: #f39c12; }
.gf-char-counter.limit-reached { color: #e74c3c; font-weight: bold; }

.gf-btn-submit {
  width: 100%;
  padding: 14px;
  font-size: 1.05rem;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 15px rgba(197, 154, 109, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
}
.gf-btn-submit:hover {
  box-shadow: 0 12px 20px rgba(197, 154, 109, 0.4);
  transform: scale(1.02);
}
.gf-btn-loader {
  display: none;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: gfSpin 1s ease-in-out infinite;
  position: absolute;
}
@keyframes gfSpin { to { transform: rotate(360deg); } }
.gf-btn-submit.loading span { opacity: 0; }
.gf-btn-submit.loading .gf-btn-loader { display: block; }

.gf-error-msg {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 5px;
  display: none;
}
.gf-form-control.error {
  border-color: #e74c3c;
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.2);
}

/* Success State in Modal */
.gf-success-state {
  display: none;
  text-align: center;
  padding: 30px 0;
}
.gf-success-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
  color: white;
  font-size: 35px;
  animation: gfScaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes gfScaleIn {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .global-feedback-btn {
    bottom: 20px;
    right: 20px;
    padding: 10px 18px;
    font-size: 0.9rem;
  }
  .global-feedback-card {
    padding: 30px 20px;
  }
  .gf-header h2 { font-size: 1.6rem; }
  .gf-stars label { font-size: 2rem; }
}
"""

html_injection = """
  <!-- Global Feedback Modal Injection -->
  <button class="global-feedback-btn" id="gfOpenBtn" onclick="openGlobalFeedback()">
    <i class="fa fa-commenting-o"></i> Feedback
  </button>

  <div class="global-feedback-overlay" id="gfOverlay">
    <div class="global-feedback-card">
      <button class="global-feedback-close" onclick="closeGlobalFeedback()">&times;</button>
      
      <div id="gfFormContainer">
        <div class="gf-header">
          <h2>We Value Your Feedback</h2>
          <p>Let us know how we did!</p>
        </div>
        <form id="gfForm" novalidate>
          <div class="grid grid-2" style="gap: 15px; margin-bottom: 20px;">
            <div class="gf-form-group" style="margin-bottom: 0;">
              <label class="gf-form-label">Full Name</label>
              <input type="text" class="gf-form-control" id="gfName" placeholder="John Doe" required>
              <div class="gf-error-msg">Please enter your name</div>
            </div>
            <div class="gf-form-group" style="margin-bottom: 0;">
              <label class="gf-form-label">Age</label>
              <input type="number" class="gf-form-control" id="gfAge" placeholder="25" min="1" max="120" required>
              <div class="gf-error-msg">Please enter a valid age</div>
            </div>
          </div>

          <div class="gf-rating-wrapper">
            <label class="gf-form-label">How would you rate your experience?</label>
            <div class="gf-stars" id="gfStarRating">
              <input type="radio" id="gfStar5" name="gfRating" value="5" required>
              <label for="gfStar5" title="5 stars"><i class="fa fa-star"></i></label>
              <input type="radio" id="gfStar4" name="gfRating" value="4">
              <label for="gfStar4" title="4 stars"><i class="fa fa-star"></i></label>
              <input type="radio" id="gfStar3" name="gfRating" value="3">
              <label for="gfStar3" title="3 stars"><i class="fa fa-star"></i></label>
              <input type="radio" id="gfStar2" name="gfRating" value="2">
              <label for="gfStar2" title="2 stars"><i class="fa fa-star"></i></label>
              <input type="radio" id="gfStar1" name="gfRating" value="1">
              <label for="gfStar1" title="1 star"><i class="fa fa-star"></i></label>
            </div>
            <div class="gf-error-msg" id="gfRatingError">Please select a rating</div>
          </div>

          <div class="gf-form-group">
            <label class="gf-form-label">Your Feedback</label>
            <textarea class="gf-form-control" id="gfFeedbackText" placeholder="Tell us what you liked or what we can improve..." maxlength="500" required></textarea>
            <span class="gf-char-counter" id="gfCharCounter">0 / 500</span>
            <div class="gf-error-msg">Please provide your feedback</div>
          </div>

          <button type="submit" class="gf-btn-submit" id="gfSubmitBtn">
            <span>Submit Feedback</span>
            <div class="gf-btn-loader"></div>
          </button>
        </form>
      </div>

      <div class="gf-success-state" id="gfSuccessState">
        <div class="gf-success-icon"><i class="fa fa-check"></i></div>
        <h2 style="color: var(--secondary); margin-bottom: 10px;">Thank You!</h2>
        <p style="color: var(--text-muted); margin-bottom: 25px;">Your feedback has been successfully submitted.</p>
        <button class="btn btn-primary" onclick="closeGlobalFeedback()" style="width: 100%;">Close</button>
      </div>
    </div>
  </div>

  <script>
    function openGlobalFeedback() {
      const overlay = document.getElementById('gfOverlay');
      if(overlay) {
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('show'), 10);
      }
    }

    function closeGlobalFeedback() {
      const overlay = document.getElementById('gfOverlay');
      if(overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
          overlay.style.display = 'none';
          // Reset form on close
          document.getElementById('gfForm').reset();
          document.getElementById('gfFormContainer').style.display = 'block';
          document.getElementById('gfSuccessState').style.display = 'none';
          document.getElementById('gfCharCounter').textContent = '0 / 500';
          document.querySelectorAll('.gf-form-control').forEach(el => el.classList.remove('error'));
          document.querySelectorAll('.gf-error-msg').forEach(el => el.style.display = 'none');
        }, 400);
      }
    }

    // Close on outside click
    window.addEventListener('click', function(e) {
      if (e.target === document.getElementById('gfOverlay')) {
        closeGlobalFeedback();
      }
    });

    // Character Counter
    const gfFeedbackText = document.getElementById('gfFeedbackText');
    if(gfFeedbackText) {
      gfFeedbackText.addEventListener('input', function() {
        const length = this.value.length;
        const max = 500;
        const counter = document.getElementById('gfCharCounter');
        counter.textContent = `${length} / ${max}`;
        if (length >= max * 0.9) counter.classList.add('near-limit');
        else counter.classList.remove('near-limit');
        if (length >= max) counter.classList.add('limit-reached');
        else counter.classList.remove('limit-reached');
      });
    }

    // Hide rating error on change
    document.querySelectorAll('input[name="gfRating"]').forEach(input => {
      input.addEventListener('change', () => {
        document.getElementById('gfRatingError').style.display = 'none';
      });
    });

    // Form Validation & Submit
    const gfForm = document.getElementById('gfForm');
    if(gfForm) {
      gfForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;
        
        function checkErr(id, condition) {
          const el = document.getElementById(id);
          const err = el.parentElement.querySelector('.gf-error-msg');
          if(condition) {
            el.classList.add('error');
            err.style.display = 'block';
            isValid = false;
          } else {
            el.classList.remove('error');
            err.style.display = 'none';
          }
        }

        checkErr('gfName', !document.getElementById('gfName').value.trim());
        const ageVal = document.getElementById('gfAge').value;
        checkErr('gfAge', !ageVal || ageVal < 1);
        checkErr('gfFeedbackText', !document.getElementById('gfFeedbackText').value.trim());

        const isRated = Array.from(document.querySelectorAll('input[name="gfRating"]')).some(r => r.checked);
        if(!isRated) {
          document.getElementById('gfRatingError').style.display = 'block';
          isValid = false;
        }

        if(isValid) {
          const btn = document.getElementById('gfSubmitBtn');
          btn.classList.add('loading');
          btn.disabled = true;

          setTimeout(() => {
            btn.classList.remove('loading');
            btn.disabled = false;
            document.getElementById('gfFormContainer').style.display = 'none';
            document.getElementById('gfSuccessState').style.display = 'block';
          }, 1200);
        }
      });

      // Clear errors on input
      document.querySelectorAll('.gf-form-control').forEach(input => {
        input.addEventListener('input', () => {
          input.classList.remove('error');
          const err = input.parentElement.querySelector('.gf-error-msg');
          if(err) err.style.display = 'none';
        });
      });
    }
  </script>
"""

# Append CSS globally
css_path = 'css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    existing_css = f.read()

if "GLOBAL FEEDBACK MODAL UI" not in existing_css:
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write(css_addition)
    print(f"Appended Global Feedback Modal CSS to {css_path}")

# Get all HTML files in current directory
html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for filepath in html_files:
    if filepath == 'feedback.html':
        continue # Skip the old one
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already injected
    if "<!-- Global Feedback Modal Injection -->" not in content:
        # Inject right before </body>
        new_content = content.replace("</body>", html_injection + "\n</body>")
        
        # If replace didn't work (maybe </body> is missing or different case), try regex
        if new_content == content:
             new_content = re.sub(r'</body>', html_injection + "\n</body>", content, flags=re.IGNORECASE)
             
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Injected Global Feedback Modal into {filepath}")

print("Feedback Modal injection script complete.")
