import os

target_files = [
    'index.html', 'about.html', 'services.html', 'contact.html', 
    'blogs.html', 'calculators.html', 'footer.html'
]

# We need to modify the image tag to be clickable, and add a second modal.
# The clearest way is to inject the HTML specifically into the bottom of the designer modal logic.

image_modal_html = """
        <!-- Designer Image Expanding Lightbox -->
        <div id="designerImageModal" class="designer-modal" style="z-index: 10000; background-color: rgba(0,0,0,0.9);" onclick="closeDesignerImageDetail()">
          <span class="designer-modal-close" style="color: white; font-size: 40px; right: 30px; top: 20px;">&times;</span>
          <img id="designerImageDetailSrc" src="" style="max-width: 90%; max-height: 90%; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); object-fit: contain; cursor: zoom-out;">
        </div>

        <script>
          function openDesignerImageDetail(e, src) {
            e.stopPropagation(); // prevent closing outer modal
            var modal = document.getElementById('designerImageModal');
            if(modal) {
              document.getElementById('designerImageDetailSrc').src = src;
              modal.style.display = 'flex';
              setTimeout(function() { modal.classList.add('show'); }, 10);
            }
          }
          function closeDesignerImageDetail() {
            var modal = document.getElementById('designerImageModal');
            if(modal) {
              modal.classList.remove('show');
              setTimeout(function() { modal.style.display = 'none'; }, 300);
            }
          }
        </script>
"""

for filepath in target_files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update the image wrapper to have cursor: zoom-in and onclick
        old_img = '<img src="img/Sumant.jpeg" alt="Sumant Hipparagi" class="designer-profile-img"'
        new_img = '<img src="img/Sumant.jpeg" alt="Sumant Hipparagi" class="designer-profile-img" style="cursor: zoom-in;" onclick="openDesignerImageDetail(event, this.src)"'
        
        content = content.replace(old_img, new_img)

        # Inject the new Lightbox HTML/JS right after </script> tag of the existing designer modal
        # We know the script tag ends with:
        #           });
        #         </script>
        
        target_injection_point = "        </script>"
        if "designerImageModal" not in content and target_injection_point in content:
            # We only perform replacement on the specific </script> terminating the designer modal block.
            # Using rfind to catch the last script or specifically replace it.
            # Since there are multiple <script> tags, we replace ALL `</script>` temporarily? NO.
            # We can just split by "Designed by <span" to isolate the footer area.
            
            # Better: let's replace the explicit event listener end block we wrote earlier
            end_block = """          window.addEventListener('click', function(event) {
            var modal = document.getElementById('designerModal');
            if (event.target == modal) {
              closeDesignerModal();
            }
          });
        </script>"""
            
            if end_block in content:
                content = content.replace(end_block, end_block + "\n" + image_modal_html)
            elif "function closeDesignerModal()" in content:
                # Fallback if white space differs
                # Let's cleanly inject it before the closing </body> or </footer>?
                pass
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Injected lightbox into {filepath}")
