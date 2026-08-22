with open('src/App.tsx', 'r') as f:
    content = f.read()

old_auth = """  if (!userRole) {
    return <AuthComponent onLogin={(role) => setUserRole(role)} />;
  }"""

new_auth = """  if (!userRole) {
    return (
      <>
        <AuthComponent onLogin={(role) => setUserRole(role)} />
        <InstallPrompt />
      </>
    );
  }"""

if old_auth in content:
    content = content.replace(old_auth, new_auth)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Patched App.tsx")
else:
    print("Could not find auth logic")
