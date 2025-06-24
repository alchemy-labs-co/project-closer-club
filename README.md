# PLAT4ME Client Onboarding
> Welcome to the PLAT4ME client onboarding process for **[CLIENT_NAME]**!
> 
> This guide walks you through setting up a new client project from cloning the repo to handing over the final site.

## 🚀 Setup Steps

### 1. Clone the GitHub Repository
```bash
git clone [REPO_URL]
cd [PROJECT_DIRECTORY]
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Update Project Name
Update the project name in `package.json` and other relevant metadata:
- Project Name: `[PROJECT_NAME]`
- Description: `[PROJECT_DESCRIPTION]`

## 🛠️ Supabase Setup

### 4. Create Supabase Instance
- Create a new Supabase organization named `[CLIENT_NAME]`
- Set up a new project under that organization called `[PROJECT_NAME]`
- Database Password: `[SUPABASE_DB_PASSWORD]`

## ☁️ Vercel Deployment

### 5. Create Vercel Instance
- Connect the GitHub repository to a new Vercel deployment
- Project name: `[VERCEL_PROJECT_NAME]`

### 6. Connect Client Domain
- Primary domain: `[CLIENT_DOMAIN]`
- Additional domains: `[ADDITIONAL_DOMAINS]` (if needed)

## 🔑 Environment Variables (ENVs)

### 7. Setup Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=[SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUPABASE_SERVICE_ROLE_KEY]
AUTH_SECRET=[GENERATE_STRONG_SECRET]
```

## 🗄️ Database Setup

### 8. Generate & Run Migrations
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## 🎨 Branding and Assets

### 9. Update Public Assets
- Logo: Replace `/public/logo.svg` with `[CLIENT_LOGO]`
- Favicon: Replace `/public/favicon.ico` with `[CLIENT_FAVICON]`
- Primary colors: Update from default blue/gold to:
  - Primary: `[PRIMARY_COLOR_HEX]`
  - Secondary: `[SECONDARY_COLOR_HEX]`

## 👤 Admin Account Setup

### 10. Create Admin Accounts
Use the following code to create an admin user:

```javascript
const { headers, response } = await auth.api.signUpEmail({
    returnHeaders: true,
    body: {
        email: "[ADMIN_EMAIL]",
        password: "[ADMIN_PASSWORD]",
        name: "[ADMIN_NAME]",
        role: "admin"
    }
});

// console.log(headers, response);

if (!response.user.id) {
    return data({
        success: false,
        message: "Something went wrong",
    }, {
        status: 403,
    });
}
```

## 🖼️ Personal Landing Page

### 11. Setup Personal Landing Page
- Update content in `/pages/landing.js` with:
  - Client Name: `[CLIENT_NAME]`
  - Tagline: `[CLIENT_TAGLINE]`
  - Description: `[CLIENT_DESCRIPTION]`

## 📢 Final Step: Share the Website

Deliver the final live website link to the client at `[FINAL_WEBSITE_URL]`!

## ✅ Onboarding Checklist

- [ ] Clone Repo
- [ ] Install Dependencies
- [ ] Update Project Name
- [ ] Create Supabase Instance
- [ ] Setup Vercel Deployment
- [ ] Connect Domain
- [ ] Insert ENVs
- [ ] Secure Auth Secret
- [ ] Run DB Generations & Migrations
- [ ] Update Branding
- [ ] Create Admin Accounts
- [ ] Set up Personal Landing Page
- [ ] Share Website

---
*Last Updated: [DATE]*