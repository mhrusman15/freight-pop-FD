# Deploy Frontend to Vercel (with GitHub)

Use these steps to deploy the **frontend** (Next.js) app to Vercel by connecting your GitHub repository.

---

## 1. Push your code to GitHub

If the project is not on GitHub yet:

```bash
# From your project root (e.g. freight-pop)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Create the repo first at [github.com/new](https://github.com/new) if needed, then use your repo URL above.

---

## 2. Connect GitHub to Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in (or create an account).
2. Click **“Sign in with GitHub”** (or **Add New** → **Project**).
3. When asked to authorize Vercel, click **“Authorize Vercel”** so Vercel can read your GitHub repos.
4. After connecting, you’ll see your GitHub account linked in Vercel.

---

## 3. Import the project from GitHub

1. On Vercel, click **“Add New…”** → **“Project”**.
2. You’ll see a list of your GitHub repositories. Find **freight-pop** (or your repo name).
3. Click **“Import”** next to that repo.
4. If you don’t see the repo:
   - Click **“Adjust GitHub App Permissions”** and grant Vercel access to that repository, or
   - Use **“Import Third-Party Git Repository”** and paste your repo URL.

---

## 4. Configure the project (important)

Before deploying, set the **Root Directory** so Vercel builds the Next.js app inside `frontend/`:

1. On the import screen, find **“Root Directory”**.
2. Click **“Edit”** and set it to: **`frontend`**.
3. Leave **Framework Preset** as **Next.js**.
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** leave default.
6. (Optional) Add **Environment Variables** if your app needs them (e.g. `NEXT_PUBLIC_API_URL`).
7. Click **“Deploy”**.

---

## 5. After deployment

- Vercel will build and deploy. When it’s done, you’ll get a URL like **`https://your-project.vercel.app`**.
- Every push to the connected branch (e.g. `main`) will trigger a new deployment automatically.

---

## Fix: “Repository does not contain the requested branch or commit”

If you see: **“The provided GitHub repository does not contain the requested branch or commit reference. Please ensure the repository is not empty.”**

1. **Push your code to GitHub** (repo must have at least one commit on the branch Vercel uses):
   ```bash
   cd E:\freight-pop
   git status
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/freight-pop-fd.git
   git push -u origin main
   ```
   Use your real GitHub username and repo name. If the repo already exists and has a different branch (e.g. `master`), use that branch name when pushing.

2. **Set Root Directory in Vercel:** Click **Edit** next to **Root Directory** and set it to **`frontend`** (not `./`). Your Next.js app is inside the `frontend` folder.

3. **Set Application Preset:** Change **Application Preset** from “Other” to **Next.js**.

4. Click **Deploy** again after the push.

---

## Alternative: Deploy with Vercel CLI (from your machine)

1. Install Vercel CLI (one time):
   ```bash
   npm i -g vercel
   ```

2. From the **frontend** directory:
   ```bash
   cd frontend
   vercel
   ```

3. Follow the prompts (login, link to existing project or create new one).

4. For production:
   ```bash
   vercel --prod
   ```

---

## Project settings summary (Vercel Dashboard)

| Setting           | Value              |
|-------------------|--------------------|
| Root Directory    | `frontend`         |
| Framework Preset  | Next.js            |
| Build Command     | `npm run build`    |
| Output Directory  | (default)          |
| Install Command   | `npm install`      |
| Node.js Version   | 18.x or 20.x       |

---

## Files in this folder

- **`vercel.json`** – Tells Vercel this is a Next.js project (optional; Vercel usually auto-detects).
- **`.vercelignore`** – Keeps unnecessary files out of the deploy.

After deployment, Vercel will give you a URL like `https://your-project.vercel.app`.
