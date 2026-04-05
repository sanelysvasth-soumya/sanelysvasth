import os
import re

directory = '.'
html_files = [f for f in os.listdir(directory) if f.endswith('.html')]

target_footer = """<ul class="footer-links">
            <li><a href="mailto:info.svasth@gmail.com">info.svasth@gmail.com</a></li>
            <li><a href="tel:+919845188112">+91 98451 88112</a></li>
            <li>Bangalore, India</li>
          </ul>"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to replace the entire ul block following "Contact"
    pattern = r'(<h4 class="footer-title">Contact</h4>\s*)<ul class="footer-links">.*?</ul>'
    
    new_content = re.sub(pattern, r'\1' + target_footer, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file}")

