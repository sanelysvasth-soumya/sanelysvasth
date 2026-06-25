import os
import glob

html_files = glob.glob('*.html')
old_text = "Empowering you to live a healthier, happier life through better nutrition."
new_text = "Guiding you to live a healthier and holistically fitter life - via food and lifestyle"

for file in html_files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if old_text in content:
            updated = content.replace(old_text, new_text)
            with open(file, 'w', encoding='utf-8') as f:
                f.write(updated)
            print(f"Updated {file}")
    except Exception as e:
        print(f"Failed on {file}: {e}")
