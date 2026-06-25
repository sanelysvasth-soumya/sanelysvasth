import os

css_addition = """
/* --- FEEDBACK SECTION UI (Contact Page) --- */
.feedback-section {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.5);
  padding: 80px 0;
  margin-top: 50px;
}
.feedback-card-static {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 15px 35px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 40px;
  max-width: 700px;
  margin: 0 auto;
  transition: all 0.3s ease;
}
.feedback-card-static:hover {
  box-shadow: 0 25px 45px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.fb-header {
  text-align: center;
  margin-bottom: 30px;
}
.fb-header h2 {
  font-size: 2.2rem;
  color: var(--secondary);
  margin-bottom: 10px;
}
.fb-header p {
  color: var(--text-muted);
  font-size: 1.05rem;
}

/* Form Elements */
.fb-form-group {
  margin-bottom: 25px;
  position: relative;
}
.fb-form-control {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(197, 154, 109, 0.2);
  border-radius: 12px;
  padding: 15px 20px;
  font-size: 1.05rem;
  color: var(--text-main);
  transition: all 0.3s ease;
  width: 100%;
  font-family: var(--font-body);
}
.fb-form-control:focus {
  background: rgba(255, 255, 255, 1);
  border-color: var(--primary);
  box-shadow: 0 0 15px rgba(197, 154, 109, 0.2);
  outline: none;
  transform: translateY(-2px);
}
textarea.fb-form-control {
  resize: vertical;
  min-height: 140px;
}
.fb-form-label {
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 8px;
  display: block;
  font-size: 0.95rem;
}

/* Animated 5-Star Rating */
.fb-rating-wrapper {
  margin-bottom: 30px;
}
.fb-stars {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
}
.fb-stars input { display: none; }
.fb-stars label {
  font-size: 2.5rem;
  color: #e4e5e9;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-right: 5px;
}
.fb-stars label:hover,
.fb-stars label:hover ~ label,
.fb-stars input:checked ~ label {
  color: #ffc107;
  text-shadow: 0 0 15px rgba(255, 193, 7, 0.4);
}
.fb-stars label:hover {
  transform: scale(1.15) rotate(-5deg);
}

.fb-char-counter {
  position: absolute;
  bottom: 15px;
  right: 15px;
  font-size: 0.8rem;
  color: var(--text-muted);
  pointer-events: none;
  transition: color 0.3s;
}
.fb-char-counter.near-limit { color: #f39c12; }
.fb-char-counter.limit-reached { color: #e74c3c; font-weight: bold; }

.fb-btn-submit {
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
}
.fb-btn-submit:hover {
  box-shadow: 0 15px 30px rgba(197, 154, 109, 0.4);
  transform: scale(1.02);
}
.fb-btn-loader {
  display: none;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: fbSpin 1s ease-in-out infinite;
  position: absolute;
}
@keyframes fbSpin { to { transform: rotate(360deg); } }
.fb-btn-submit.loading span { opacity: 0; }
.fb-btn-submit.loading .fb-btn-loader { display: block; }

.fb-error-msg {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 5px;
  display: none;
}
.fb-form-control.error {
  border-color: #e74c3c;
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.2);
}

/* Success State */
.fb-success-state {
  display: none;
  text-align: center;
  padding: 40px 0;
}
.fb-success-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 25px;
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
  color: white;
  font-size: 40px;
  animation: fbScaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes fbScaleIn {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .feedback-card-static {
    padding: 30px 20px;
  }
  .fb-header h2 { font-size: 1.8rem; }
  .fb-stars label { font-size: 2.2rem; }
}
"""

css_path = 'css/style.css'
if os.path.exists(css_path):
    with open(css_path, 'r', encoding='utf-8') as f:
        existing_css = f.read()
    
    if "FEEDBACK SECTION UI (Contact Page)" not in existing_css:
        with open(css_path, 'a', encoding='utf-8') as f:
            f.write(css_addition)
        print("Appended Feedback Section CSS to style.css")
