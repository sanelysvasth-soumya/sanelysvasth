import os
import glob
import re

css_path = 'css/style.css'
calculator_files = [
    'bmiCalculator.html', 'bmrCalculator.html', 'boys0to2LFA.html', 
    'boys2to5LFA.html', 'boys5to18HFA.html', 'burpeesCalorie.html', 
    'girls0to2LFA.html', 'girls2to5LFA.html', 'girls5to18HFA.html', 
    'ibwCalculator.html', 'jumpRopeCalorie.html', 'proteinCalculator.html', 
    'waterCalculator.html', 'whrCalculator.html', 'whtrCalculator.html'
]

# We know the specific CSS block from boys0to2LFA.html starts around .calculator-container
source_file = 'boys0to2LFA.html'

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract from <style> to </style>
style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if style_match:
    full_css = style_match.group(1)
    
    # Filter the CSS: We ONLY want calculator and form related rules, NOT body/h2 overrides
    # Let's remove the body {} and h2 {} rules at the very top.
    filtered_css = re.sub(r'body\s*{[^}]*}', '', full_css, flags=re.DOTALL)
    filtered_css = re.sub(r'h2,\s*h4\s*{[^}]*}', '', filtered_css, flags=re.DOTALL)
    
    css_to_append = "\n/* --- GLOBALLY EXTRACTED CALCULATOR STYLES --- */\n" + filtered_css.strip() + "\n"

    # Ensure it's not already appended to avoid duplicates
    with open(css_path, 'r', encoding='utf-8') as f:
        existing_style = f.read()
    
    if "GLOBALLY EXTRACTED CALCULATOR STYLES" not in existing_style:
        with open(css_path, 'a', encoding='utf-8') as f:
            f.write(css_to_append)
        print(f"Appended calculator CSS UI to {css_path}")
    else:
        print("CSS already appended, skipping.")

# Clean up all inline styles inside the individual HTML files
for file in calculator_files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            html = f.read()
            original_html = html
            
        # We need to drop <style>...</style> block
        html = re.sub(r'<style>.*?</style>', '', html, flags=re.DOTALL)

        # Inject Poppins and Montserrat Google fonts if not present (since they are used in the CSS headers)
        google_fonts = '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">'
        if 'fonts.googleapis.com/css2?family=Poppins' not in html:
            html = html.replace('</head>', f'  {google_fonts}\n</head>')
        
        # In a few files, like bmiCalculator, there is a minor style like body {background-color}. We can leave google fonts and remove ALL <style> safely
        # Because we're handling the entire layout via the new styling

        if html != original_html:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"Cleaned up {file}")
            
print("Migration complete!")
