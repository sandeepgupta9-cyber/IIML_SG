# TaskFlow — Task Manager

A responsive personal task manager built with Next.js, React and TypeScript. It is ready to run locally and deploy to Vercel.

## Features
- Create, edit and delete tasks
- Start dates, due dates, priority, category and status
- Per-task progress percentage
- Dashboard summary and overall progress
- Search and filter tasks
- Upcoming and overdue task views
- Activity notes and last-updated timestamps
- Export and import tasks as JSON
- Browser local-storage persistence

## Requirements
- Node.js 20.9 or later
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy with GitHub + Vercel
1. Create a new GitHub repository.
2. Unzip this project and push the contents of this folder to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial TaskFlow app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```
3. Sign in to Vercel and choose **Add New → Project**.
4. Import the GitHub repository.
5. Keep the detected framework as **Next.js**, then select **Deploy**.

No environment variables or database are required for this starter version.

## Data and limitations
This version stores tasks in the browser's local storage. Data remains in the same browser profile on the same device, but it is not shared across devices or users. Clearing browser data can remove saved tasks. Use the Export button regularly to back up your tasks.

For multi-device sync, login, shared task lists, server-side backups, and scheduled email/push notifications, connect a database/auth provider such as Supabase and add a notification service.

## Project structure
```text
task-manager-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```
