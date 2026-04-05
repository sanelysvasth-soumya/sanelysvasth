import glob

files = [
    "jumpRopeCalorie.html", "burpeesCalorie.html", "bmiCalculator.html",
    "whrCalculator.html", "ibwCalculator.html", "whtrCalculator.html",
    "bmrCalculator.html", "proteinCalculator.html", "waterCalculator.html"
]

target = "rgba(30, 36, 41, 0.8)"
replacement = "rgba(55, 65, 81, 0.7)"

for f in files:
    try:
        with open(f, 'r') as file:
            content = file.read()
            
        new_content = content.replace(target, replacement)
        
        # Write back if changed
        if content != new_content:
            with open(f, 'w') as file:
                file.write(new_content)
            print(f"Updated {f}")
        else:
            print(f"No changes needed for {f}")
    except Exception as e:
        print(f"Error processing {f}: {e}")

