import os
import glob
import re

template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} - Svasth by Soumya</title>
  <link rel="stylesheet" type="text/css" href="../css/bootstrap.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
  <link rel="stylesheet" type="text/css" href="../css/style.css" />
  <link rel="icon" type="image/png" href="../img/other4.png" sizes="12x12" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="../js/jquery.1.11.1.js"></script>
  <script>
    $(function () {
      $("#nav-placeholder").load("../nav.html", function() {
        // Fix relative paths in the loaded nav.html
        $(this).find('a').each(function() {
          var href = $(this).attr('href');
          if (href && !href.startsWith('http') && !href.startsWith('#')) {
            $(this).attr('href', '../' + href);
          }
        });
        $(this).find('img').each(function() {
          var src = $(this).attr('src');
          if (src && !src.startsWith('http') && !src.startsWith('data:')) {
            $(this).attr('src', '../' + src);
          }
        });
      });
      $("#footer-placeholder").load("../footer.html", function() {
        // Fix relative paths in footer
        $(this).find('a').each(function() {
          var href = $(this).attr('href');
          if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
            $(this).attr('href', '../' + href);
          }
        });
      });
    });
  </script>
  <style>
    .recipe-meta {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin: 30px 0 20px;
      flex-wrap: wrap;
    }
    .recipe-meta-item {
      text-align: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      min-width: 120px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .recipe-meta-item i {
      color: var(--primary);
      font-size: 24px;
      margin-bottom: 10px;
    }
    .recipe-content-box {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      margin-top: -60px;
      position: relative;
      z-index: 10;
    }
    .ingredients-list { list-style: none; padding: 0; }
    .ingredients-list li { padding: 12px 0; border-bottom: 1px dashed #eee; display: flex; align-items: center; font-family: var(--font-body); }
    .ingredients-list li i { color: var(--primary); margin-right: 12px; }
    .instructions-list { padding-left: 20px; font-family: var(--font-body); line-height: 1.8; }
    .instructions-list li { margin-bottom: 15px; }
    /* Mobile Responsive Fix */
    @media (max-width: 768px) {
      .recipe-meta { flex-direction: column; gap: 15px; }
      .recipe-meta-item { width: 100%; }
    }
  </style>
</head>
<body>
  <div id="nav-placeholder"></div>

  <header class="section" style="background: linear-gradient(rgba(55, 65, 81, 0.7), rgba(55, 65, 81, 0.7)), url('{img}') no-repeat center center/cover; padding: 140px 0 80px; color: white; text-align: center;">
    <div class="container fade-in">
      <h1 style="color: white; margin-bottom: 10px; font-family: var(--font-primary); font-size: 3rem;">{title}</h1>
      <p style="font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto; font-family: var(--font-body);">{lead}</p>
    </div>
  </header>

  <section class="section" style="background-color: #f9fafb; padding-top: 0;">
    <div class="container">
      <div class="recipe-content-box">
        <div class="recipe-meta">
          {meta}
        </div>
        
        <div class="row mt-5" style="margin-top: 40px;">
          <div class="col-md-5">
            <h3 style="font-family: var(--font-primary); margin-bottom: 20px; color: var(--primary);"><i class="fas fa-shopping-basket"></i> Ingredients</h3>
            <ul class="ingredients-list">
              {ingredients}
            </ul>
          </div>
          <div class="col-md-7">
            <h3 style="font-family: var(--font-primary); margin-bottom: 20px; color: var(--primary);"><i class="fas fa-list-ol"></i> Instructions</h3>
            <ol class="instructions-list">
              {instructions}
            </ol>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div id="footer-placeholder"></div>
</body>
</html>
"""

recipe_files = glob.glob('recipies/*.html')

for filepath in recipe_files:
    print(f"Processing {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if already modernized by looking for our modern id
        if '<div class="recipe-content-box">' in content:
            continue

        # Extract title
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL | re.IGNORECASE)
        title = title_match.group(1).strip() if title_match else "Recipe"
        
        # lead
        lead_match = re.search(r'<p class="lead"[^>]*>(.*?)</p>', content, re.DOTALL | re.IGNORECASE)
        lead = lead_match.group(1).strip() if lead_match else ""
        
        # image
        img_match = re.search(r"url\(['\"]?(?:\.\./)?img/([^'\"\)]+)['\"]?\)", content)
        img = f"../img/{img_match.group(1)}" if img_match else "../img/bg3.jpg"

        # meta - target inner recipe-meta-item elements
        meta_items = re.findall(r'<div class="recipe-meta-item"[^>]*>(.*?)</div>\s*</div>', content, re.DOTALL | re.IGNORECASE)
        if not meta_items:
            meta_items = re.findall(r'<div class="recipe-meta-item"[^>]*>(.*?)</div>', content, re.DOTALL | re.IGNORECASE)
        
        if meta_items:
            # Reconstruct the divs correctly since findall might cut off nested inner p tags
            # Let's use a safer regex:
            meta_blocks = re.findall(r'<div class="recipe-meta-item[^>]*>.*?</div>\s*</div>', content, re.DOTALL | re.IGNORECASE)
            
            # If not nested, grab simple items
            if not meta_blocks:
                pattern = r'(<div class="recipe-meta-item"[^>]*>.*?</div>(?:\s*</div>)?)'
                meta_blocks = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
        
        # Manual parse to accurately extract <div class="recipe-meta-item"> blocks without breaking inner HTML
        meta = ""
        meta_start = content.find('<div class="recipe-meta">')
        if meta_start != -1:
            meta_end = content.find('<div class="row', meta_start)
            if meta_end == -1: meta_end = content.find('<h3', meta_start)
            meta = content[meta_start:meta_end]
            # Strip outer wrapper <div class="recipe-meta">
            meta = re.sub(r'^<div class="recipe-meta">\s*', '', meta)
            meta = meta.rstrip()
            if meta.endswith('</div>'):
                meta = meta[:-6] # strip last closing div of wrapper

        # ingredients
        ingred_inner = re.search(r'<ul class="ingredients-list"[^>]*>(.*?)</ul>', content, re.DOTALL | re.IGNORECASE)
        ingredients = ingred_inner.group(1).strip() if ingred_inner else ""

        # instructions
        inst_inner = re.search(r'<ol class="instructions-list"[^>]*>(.*?)</ol>', content, re.DOTALL | re.IGNORECASE)
        instructions = inst_inner.group(1).strip() if inst_inner else ""

        # Apply template
        new_html = template.replace('{title}', title)\
                           .replace('{lead}', lead)\
                           .replace('{img}', img)\
                           .replace('{meta}', meta)\
                           .replace('{ingredients}', ingredients)\
                           .replace('{instructions}', instructions)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_html)
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")

print("Done processing all recipes.")
