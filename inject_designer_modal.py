import os
import re

css_addition = """
/* --- DESIGNER MODAL UI --- */
.designer-modal {
  display: none;
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(5px);
}
.designer-modal.show {
  opacity: 1;
}
.designer-modal-content {
  background-color: #fff;
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
  transform: scale(0.8) translateY(20px);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
}
.designer-modal.show .designer-modal-content {
  transform: scale(1) translateY(0);
}
.designer-modal-close {
  position: absolute;
  top: 15px;
  right: 20px;
  color: #aaa;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
}
.designer-modal-close:hover {
  color: var(--primary);
}
.designer-profile-wrap {
  margin-bottom: 20px;
}
.designer-profile-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--primary);
  object-fit: cover;
  box-shadow: 0 5px 15px rgba(197, 154, 109, 0.3);
}
.designer-name-title {
  font-family: var(--font-heading);
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 1.8rem;
}
.designer-profession {
  color: #7f8c8d;
  font-family: var(--font-body);
  font-size: 1.1rem;
  margin-bottom: 25px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.designer-contact-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.designer-contact-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #f8f9fa;
  padding: 12px 20px;
  border-radius: 10px;
  color: #34495e;
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 500;
  transition: all 0.2s ease;
}
.designer-contact-link i {
  color: var(--primary);
  font-size: 1.2rem;
}
.designer-contact-link:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-2px);
}
.designer-contact-link:hover i {
  color: white;
}
"""

modal_html = """
        <div class="designer-credit" onclick="openDesignerModal()" style="cursor: pointer; transition: transform 0.2s ease;" onmouseover="this.style.transform='translateX(-50%) scale(1.05)'" onmouseout="this.style.transform='translateX(-50%) scale(1)'" title="View Designer Profile">
          Designed by <span class="designer-name">H. Sumant</span>
        </div>

        <!-- Designer Profile Modal -->
        <div id="designerModal" class="designer-modal">
          <div class="designer-modal-content">
            <span class="designer-modal-close" onclick="closeDesignerModal()">&times;</span>
            <div class="designer-profile-wrap">
              <img src="img/sumantProfile.jpg" alt="Sumant Hipparagi" class="designer-profile-img" onerror="this.src='https://ui-avatars.com/api/?name=Sumant+Hipparagi&background=c59a6d&color=fff&size=150&rounded=true'">
            </div>
            <h3 class="designer-name-title">Sumant Hipparagi</h3>
            <p class="designer-profession">Software Engineer</p>
            <div class="designer-contact-info">
              <a href="mailto:sumanthipparagi@gmail.com" class="designer-contact-link"><i class="fas fa-envelope"></i> Contact via Email</a>
              <a href="tel:+910000000000" class="designer-contact-link"><i class="fas fa-phone"></i> Contact via Phone</a>
            </div>
          </div>
        </div>

        <script>
          function openDesignerModal() {
            var modal = document.getElementById('designerModal');
            if(modal) {
              modal.style.display = 'flex';
              setTimeout(function() { modal.classList.add('show'); }, 10);
            }
          }
          function closeDesignerModal() {
            var modal = document.getElementById('designerModal');
            if(modal) {
              modal.classList.remove('show');
              setTimeout(function() { modal.style.display = 'none'; }, 300);
            }
          }
          window.addEventListener('click', function(event) {
            var modal = document.getElementById('designerModal');
            if (event.target == modal) {
              closeDesignerModal();
            }
          });
        </script>
"""

target_files = [
    'index.html', 'about.html', 'services.html', 'contact.html', 
    'blogs.html', 'calculators.html', 'footer.html'
]

# Append CSS globally
css_path = 'css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    existing_css = f.read()

if "DESIGNER MODAL UI" not in existing_css:
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write(css_addition)
    print(f"Appended Designer Modal CSS to {css_path}")

# Rewrite HTML targets
for filepath in target_files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We find the existing designer credit block using regex
        original = r'<div class="designer-credit">\s*Designed by <span class="designer-name">H\. Sumant</span>\s*</div>'
        
        if re.search(original, content):
            new_content = re.sub(original, modal_html.strip(), content)
            
            # Since the user requested interaction hover states we replaced it with our dynamic one.
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath} with interactive designer modal.")

print("Modal implementation finished.")
