with open('index.html', 'r') as f:
    content = f.read()

content = content.replace(
    '<link rel="apple-touch-icon" href="/icon.svg" />',
    '<link rel="apple-touch-icon" href="/icon.png" />'
)

with open('index.html', 'w') as f:
    f.write(content)
