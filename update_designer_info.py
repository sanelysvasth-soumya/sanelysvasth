import glob
import os

target_files = [
    'index.html', 'about.html', 'services.html', 'contact.html', 
    'blogs.html', 'calculators.html', 'footer.html'
]

old_img = 'img/sumantProfile.jpg'
new_img = 'img/Sumant.jpeg'

old_email = 'mailto:sumanthipparagi@gmail.com'
new_email = 'mailto:h.sumant.2000@gmail.com'
old_email_text = 'Contact via Email'
new_email_text = 'h.sumant.2000@gmail.com'

old_phone = 'tel:+910000000000'
new_phone = 'tel:+918088014580'
old_phone_text = 'Contact via Phone'
new_phone_text = '+91 80880 14580'

for filepath in target_files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace(old_img, new_img)
        
        # Replace mailto link constraint and inner HTML text
        content = content.replace(old_email, new_email)
        content = content.replace(old_email_text, new_email_text)
        
        # Replace tel link constraint and inner HTML text
        content = content.replace(old_phone, new_phone)
        content = content.replace(old_phone_text, new_phone_text)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
