---
description: Push latest changes to GitHub (intjshiv-lab/Ramesh7_LinkVault)
---

# Push to GitHub

// turbo-all

1. Stage all changes:
```bash
cd "/Users/raman/Desktop/Build_Ra/Full Stack  AntiGravity " && git add -A
```

2. Check what's being committed:
```bash
cd "/Users/raman/Desktop/Build_Ra/Full Stack  AntiGravity " && git status --short
```

3. Commit with a descriptive message based on the changes:
```bash
cd "/Users/raman/Desktop/Build_Ra/Full Stack  AntiGravity " && git commit -m "<describe changes>"
```

4. Push to GitHub via SSH:
```bash
cd "/Users/raman/Desktop/Build_Ra/Full Stack  AntiGravity " && git push origin main
```

**Notes:**
- Remote is set to SSH: `git@github.com:intjshiv-lab/Ramesh7_LinkVault.git`
- SSH key is at `~/.ssh/id_ed25519`
- The `.gitignore` excludes: `node_modules/`, `*.db`, `.DS_Store`, `uploads/`, and everything in `Shiv/`
