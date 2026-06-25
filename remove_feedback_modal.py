import os
import re

# 1. Remove from all HTML files
html_files = [f for f in os.listdir('.') if f.endswith('.html')]

# The injected block starts with <!-- Global Feedback Modal Injection --> and goes up to just before </body>
# Because it might span multiple lines, we use regex with DOTALL or simply find the start marker and split.
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_marker = "  <!-- Global Feedback Modal Injection -->"
    if start_marker in content:
        # Split at start_marker, keep first part
        parts = content.split(start_marker)
        if len(parts) == 2:
            before_injection = parts[0]
            after_injection = parts[1]
            
            # The after_injection ends right before </body>. We need to find </body> in after_injection
            # actually it's just `</body>` at the end of the file since we injected it right before `</body>`.
            # Let's safely extract `</body>\n</html>` or whatever remains.
            
            body_split = after_injection.rsplit("</body>", 1)
            if len(body_split) == 2:
                new_content = before_injection + "</body>" + body_split[1]
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Removed injection from {filepath}")
            else:
                print(f"Could not cleanly remove from {filepath} (missing </body>)")

# 2. Remove CSS from style.css
css_path = 'css/style.css'
if os.path.exists(css_path):
    with open(css_path, 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    css_start_marker = "/* --- GLOBAL FEEDBACK MODAL UI --- */"
    if css_start_marker in css_content:
        parts = css_content.split(css_start_marker)
        if len(parts) == 2:
            new_css = parts[0].strip() + "\n"
            with open(css_path, 'w', encoding='utf-8') as f:
                f.write(new_css)
            print("Removed CSS from style.css")

print("Removal script complete.")
