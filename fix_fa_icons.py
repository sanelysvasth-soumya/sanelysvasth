import glob
import os

target_files = [
    'index.html', 'about.html', 'services.html', 'contact.html', 
    'blogs.html', 'calculators.html', 'footer.html'
]

for filepath in target_files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace('fas fa-envelope', 'fa fa-envelope')
        content = content.replace('fas fa-phone', 'fa fa-phone')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed FA icons in {filepath}")
