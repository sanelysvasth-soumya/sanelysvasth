import os
import re

cta_html = """
          <div class="alert-info">
            <h3>Ready to Take the Next Step?</h3>
            <p>
              <a href="https://wa.me/message/U43IYBJMJDQAD1" target="_blank" style="background-color: var(--accent-color-light); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Click to Book Now!</a>
            </p>
          </div>
"""

directory = '/Users/h_sumant/SanelySvasth/sanelysvasth-main/blog-posts'
exclude_file = '19mealsforacidity.html'

for filename in os.listdir(directory):
    if filename.endswith(".html") and filename != exclude_file:
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        if "Ready to Take the Next Step?" in content:
            print(f"Skipping {filename}: CTA already present")
            continue
            
        # Regex to find the closing </div> of blog-content
        # It looks for </div> followed by whitespace and then either <section class="social-sharing" or </article>
        pattern = r'(</div>)(\s*)(?=<section class="social-sharing"|</article>)'
        
        # Check if pattern exists
        if re.search(pattern, content):
            new_content = re.sub(pattern, cta_html + r'\1\2', content, count=1)
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"Skipping {filename}: Could not find insertion point")
