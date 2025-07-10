# Closer Club - Online Course Platform

> A comprehensive learning management system for teams, agents, and students with course management, analytics, and lead capture capabilities.

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone [REPO_URL]
cd closer-club-dev
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

Create a `.env` file with the following variables:

```
DATABASE_URL=[YOUR_DATABASE_URL]
AUTH_SECRET=[GENERATE_STRONG_SECRET]
BUNNY_STREAM_API_KEY=[BUNNY_CDN_API_KEY]
BUNNY_STORAGE_API_KEY=[BUNNY_STORAGE_API_KEY]
REDIS_URL=[REDIS_CONNECTION_URL]
```

## 🗄️ Database Setup

### 4. Generate & Run Migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## 👥 User Roles & Features

### Admin Dashboard
- Course creation and management
- Student and agent management
- Team leader administration
- Analytics and reporting
- Lead management

### Team Leaders
- Manage assigned agents
- View team analytics
- Access course assignments
- Monitor team progress

### Agents/Students
- Access assigned courses
- Complete modules and segments
- Take quizzes and assessments
- View progress and certificates

## 🏗️ Project Structure

```
app/
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── analytics/     # Analytics dashboards
│   │   ├── courses/       # Course management
│   │   ├── students/      # Student management
│   │   └── team-leaders/  # Team leader features
│   ├── global/           # Shared components
│   ├── marketing/        # Landing page components
│   └── ui/              # UI components library
├── lib/
│   ├── admin/           # Admin-specific logic
│   ├── student/         # Student-specific logic
│   ├── team-leaders/    # Team leader logic
│   └── zod-schemas/     # Validation schemas
└── routes/             # File-based routing
```

## 👤 Admin Account Setup

### Create Admin User

Use the following code to create an admin user:

```javascript
const { headers, response } = await auth.api.signUpEmail({
	returnHeaders: true,
	body: {
		email: "[ADMIN_EMAIL]",
		password: "[ADMIN_PASSWORD]",
		name: "[ADMIN_NAME]",
		role: "admin",
	},
});

if (!response.user.id) {
	return data(
		{
			success: false,
			message: "Something went wrong",
		},
		{
			status: 403,
		}
	);
}
```

## 🎯 Key Features

- **Course Management**: Create courses with modules, segments, and quizzes
- **Video Integration**: Bunny CDN integration for video streaming
- **Role-Based Access**: Admin, Team Leader, and Agent/Student roles
- **Analytics Dashboard**: Comprehensive analytics for all user types
- **Lead Capture**: Marketing funnel with lead capture forms
- **File Attachments**: Support for course materials and attachments
- **Progress Tracking**: Monitor student progress through courses
- **Certificate Generation**: Automatic certificate generation upon completion

## 🛠️ Development

### Start Development Server

```bash
bun run dev
```

### Build for Production

```bash
bun run build
```

## 📱 Routes Overview

- `/admin` - Admin dashboard and management
- `/team` - Team leader interface
- `/agent` - Agent/student learning interface
- `/` - Marketing landing page with lead capture

## 🔧 Tech Stack

- **Framework**: Remix (React Router v7)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **CDN**: Bunny.net for video and file storage
- **Caching**: Redis
- **UI Components**: Radix UI primitives
- **Authentication**: Custom auth implementation

---

_Built for modern learning management and team collaboration._
