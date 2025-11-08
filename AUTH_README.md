# Authentication System - GutHib

A dark-themed authentication system built with **Next.js 16**, **Auth0**, and **JWT tokens**.

## 🎨 Design Features

- **Dark Theme**: Pure black (#000000) background with white (#FFFFFF) text
- **Bold Borders**: Left and bottom borders are prominently styled (4-6px)
- **Zero Border Radius**: All elements have sharp, square corners
- **Monospace Font**: Courier New for that retro, developer aesthetic
- **Hover Effects**: Interactive shadow and transform effects

## 🔐 Authentication Features

### Auth0 Integration
- Secure authentication with Auth0
- Social login support (GitHub)
- Protected routes and sessions
- User profile management

### JWT Token System
- Custom JWT token generation
- Token verification middleware
- Protected API routes
- Token-based authentication alongside Auth0

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.js          # Sign in page
│   │   └── register/
│   │       └── page.js          # Registration page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...auth0]/      # Auth0 handlers
│   │   │   └── token/
│   │   │       └── route.js     # JWT token generation
│   │   ├── onboarding/
│   │   │   └── route.js         # Onboarding data API
│   │   └── protected/
│   │       └── profile/
│   │           └── route.js     # Protected API example
│   ├── onboarding/
│   │   └── page.js              # User onboarding form
│   ├── layout.js                # Root layout with Auth0Provider
│   ├── page.js                  # Home page
│   └── globals.css              # Dark theme styles
├── components/
│   ├── LogoutButton.js          # Logout component
│   └── Profile.js               # User profile display
├── lib/
│   ├── auth0.js                 # Auth0 client
│   ├── jwt.js                   # JWT utilities
│   └── users.js                 # User data management
└── middleware.js                # JWT verification middleware
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file with your Auth0 credentials:

```env
AUTH0_SECRET=your-secret-key
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=your-auth0-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
JWT_SECRET=your-jwt-secret (optional, uses AUTH0_SECRET if not set)
```

### 3. Configure Auth0 Dashboard

Add these URLs to your Auth0 application:
- **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`

### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Available Routes

### Public Routes
- `/` - Home page
- `/auth/signin` - Sign in form
- `/auth/register` - Registration form

### Protected Routes
- `/onboarding` - User onboarding (first-time users)
- `/api/protected/*` - JWT-protected API routes

### API Endpoints

#### Auth0 Authentication
- `GET /api/auth/login` - Initiate Auth0 login
- `GET /api/auth/logout` - Logout
- `GET /api/auth/callback` - Auth0 callback handler

#### Custom JWT
- `GET /api/auth/token` - Generate custom JWT token for authenticated user
- `GET /api/protected/profile` - Example protected endpoint (requires JWT)

#### Onboarding
- `POST /api/onboarding` - Save user onboarding data

## 🔑 JWT Usage Example

### 1. Get JWT Token

```javascript
const response = await fetch('/api/auth/token');
const { token } = await response.json();
```

### 2. Use Token in API Calls

```javascript
const response = await fetch('/api/protected/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🎨 Styling Guidelines

All styles follow the dark theme with these characteristics:

### Colors
- Background: `#000000` (pure black)
- Text: `#FFFFFF` (pure white)
- Gray: `#999999` (secondary text)
- Borders: `#FFFFFF` (white)

### Border Style
- Left border: `4-6px solid #ffffff`
- Bottom border: `4-6px solid #ffffff`
- Border radius: `0` everywhere

### Typography
- Font family: `'Courier New', monospace`
- Letter spacing: `1-2px`
- Font weights: `bold` (700) or `black` (900)

### Interactive Elements
- Hover: Transform with shadow effect
- Focus: Border color change, background highlight
- Active: State feedback with color inversion

## 📝 Custom Components

### Form Input
```jsx
<input className="form-input" />
```
Black background, white border, bold left and bottom borders

### Primary Button
```jsx
<button className="auth-button">TEXT</button>
```
White background, black text, inverts on hover

### Secondary Button
```jsx
<button className="auth-button-secondary">TEXT</button>
```
Black background, white border, inverts on hover

### Navigation Link
```jsx
<Link href="/path" className="nav-button">TEXT</Link>
```
Styled as button with hover effects

## 🔒 Security Features

- Server-side session management with Auth0
- Secure HTTP-only cookies
- CSRF protection
- JWT token expiration (7 days default)
- Protected API routes with middleware
- Environment variable security

## 📚 Tech Stack

- **Next.js 16** - React framework
- **Auth0** - Authentication provider
- **JWT (jsonwebtoken)** - Token management
- **Tailwind CSS 4** - Utility classes
- **React 19** - UI library

## 🛠️ Customization

### Change Token Expiration

Edit `src/lib/jwt.js`:

```javascript
export function generateToken(payload, expiresIn = '30d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
```

### Add More Protected Routes

Edit `src/middleware.js`:

```javascript
const protectedApiRoutes = [
  '/api/protected',
  '/api/your-route'
];
```

### Customize Theme Colors

Edit `src/app/globals.css` - search and replace color values

## 🐛 Troubleshooting

### Auth0 Callback Error
- Verify callback URLs in Auth0 dashboard
- Check `AUTH0_BASE_URL` matches your domain

### JWT Token Invalid
- Ensure `JWT_SECRET` or `AUTH0_SECRET` is set
- Check token hasn't expired (default 7 days)

### Styling Issues
- Clear browser cache
- Rebuild with `npm run build`
- Check for CSS conflicts

## 📄 License

MIT License - Feel free to use for your projects!
