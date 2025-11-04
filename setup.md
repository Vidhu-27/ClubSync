# ClubSync Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file in the root directory with:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=clubsync
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production
   ```

3. **Start MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Ensure MongoDB is running on localhost:27017

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000)

## Default Director Account

To create a default director account, you can use the MongoDB shell or create a script:

```javascript
// In MongoDB shell or script
use clubsync

db.users.insertOne({
  email: "director@mitwpu.edu.in",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J7qJqJqJq", // password: director123
  role: "director",
  createdAt: new Date()
})
```

## Features Implemented

### ✅ Authentication System
- JWT-based authentication
- Role-based access control (Director, Club, Faculty)
- Secure password hashing with bcrypt
- MITWPU email validation

### ✅ Responsive Design
- Mobile-first approach
- Dynamic layouts that adapt to screen size
- Touch-friendly interfaces
- Modern glass morphism design
- Tailwind CSS with custom design system

### ✅ Director Dashboard
- Real-time statistics
- Club approval/rejection
- Budget request management
- Event oversight
- Responsive cards and tables

### ✅ Club Dashboard
- Member management (add/remove)
- Event management (create/edit/delete)
- Budget tracking
- Club profile management
- Mobile-optimized forms

### ✅ API Routes
- RESTful API design
- Authentication middleware
- Error handling
- Input validation
- MongoDB integration

### ✅ Database Integration
- MongoDB for clubs, events, and budget data
- Automatic collection creation
- Data validation and sanitization
- Efficient queries and updates

## Mobile Features

### Navigation
- Collapsible sidebar that transforms to mobile navigation
- Touch gestures for navigation
- Breadcrumb navigation
- Active state indicators

### Forms
- Touch-optimized input fields
- Smart keyboard types
- Real-time validation
- Mobile-friendly error messages

### Data Display
- Card-based layouts
- Swipe actions
- Infinite scroll for large lists
- Responsive tables

## Performance Optimizations

- Code splitting with Next.js
- Image optimization
- Bundle size optimization
- Lazy loading
- Efficient API calls

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input sanitization
- CORS protection
- Role-based access control

## Testing the Application

1. **Register a Club**
   - Go to `/register`
   - Fill in club details with MITWPU email
   - Submit for director approval

2. **Director Login**
   - Login with director credentials
   - Approve/reject clubs
   - Manage budget requests

3. **Club Management**
   - Login with approved club
   - Add members and events
   - Submit budget requests

## Deployment

The application is ready for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **DigitalOcean**

Make sure to set environment variables in your deployment platform.



