import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace "</div>\n      </div>\n      {/* 100k+ Donors Section */}" with "</div>\n      {/* 100k+ Donors Section */}"
content = content.replace("      </div>\n      </div>\n      {/* 100k+ Donors Section */}", "      </div>\n      {/* 100k+ Donors Section */}")

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
