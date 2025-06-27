# Frontend Overview

Complete overview of the Dokani platform frontend architecture, built with Next.js 14, TypeScript, and Tailwind CSS.

---

## Architecture Overview

The frontend is built as a **modern, responsive web application** with the following key characteristics:

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for global state
- **Authentication**: Supabase Auth integration
- **Real-time**: WebSocket connections for live updates
- **PWA**: Progressive Web App capabilities

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (landing)/         # Landing page routes
│   ├── auth/              # Authentication pages
│   ├── customer/          # Customer-facing pages
│   ├── dashboard/         # Admin dashboard pages
│   ├── return/            # Return request pages
│   └── settings/          # Settings pages
├── components/            # Reusable UI components
│   ├── auth/              # Authentication components
│   ├── common/            # Shared components
│   ├── customer/          # Customer-specific components
│   ├── dashboard/         # Dashboard components
│   ├── landing/           # Landing page components
│   ├── return/            # Return-specific components
│   └── ui/                # Base UI components (shadcn/ui)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries and API clients
├── providers/             # React context providers
├── store/                 # Zustand state management
└── types/                 # TypeScript type definitions
```

---

## Key Technologies

### Core Framework
- **Next.js 14**: React framework with App Router
- **React 18**: Latest React features and concurrent rendering
- **TypeScript**: Static type checking and better DX

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **Lucide React**: Icon library
- **Framer Motion**: Animation library (optional)

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state management (optional)
- **Local Storage**: Persistent client-side storage

### Authentication & Backend
- **Supabase**: Backend-as-a-Service
- **Supabase Auth**: Authentication system
- **Supabase Realtime**: Real-time subscriptions

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Tailwind CSS IntelliSense**: CSS autocomplete

---

## Page Structure

### Landing Pages (`/`)
- **Hero Section**: Main value proposition
- **Features**: Platform capabilities
- **Benefits**: Business advantages
- **Pricing**: Service tiers
- **Stack**: Technology showcase

### Authentication (`/auth`)
- **Login** (`/auth/login`): User authentication
- **Signup** (`/auth/signup`): User registration
- **Forgot Password** (`/auth/forgot-password`): Password recovery
- **Reset Password** (`/auth/reset-password`): Password reset

### Customer Interface (`/customer`)
- **Chat** (`/customer/chat`): AI-powered customer support
- **Voice Calls**: Real-time voice conversations
- **Video Calls**: Real-time video conversations
- **File Upload**: Evidence submission

### Admin Dashboard (`/dashboard`)
- **Overview**: Business metrics and analytics
- **Returns** (`/dashboard/requests`): Return request management
- **Analytics** (`/dashboard/analytics`): Performance metrics
- **Policy** (`/dashboard/policy`): Policy management
- **Personas** (`/dashboard/personas`): AI persona configuration

### Return Management (`/return`)
- **Status Tracking** (`/return/[public_id]`): Return request status
- **Evidence Upload**: Document submission
- **Conversation History**: Chat logs

---

## Component Architecture

### UI Components (shadcn/ui)
Base components built with Radix UI primitives:
- **Button**: Interactive buttons with variants
- **Card**: Content containers
- **Dialog**: Modal dialogs
- **Form**: Form components with validation
- **Input**: Text input fields
- **Select**: Dropdown selections
- **Toast**: Notification system

### Business Components
Domain-specific components organized by feature:

#### Authentication Components
- `AuthForm`: Unified authentication form
- `AuthGuard`: Route protection
- `RoleSelectionCard`: User role selection

#### Customer Components
- `ChatContainer`: Main chat interface
- `ChatMessage`: Individual message display
- `VoiceCallInterface`: Voice call UI
- `VideoCallInterface`: Video call UI
- `FilePreview`: File attachment viewer

#### Dashboard Components
- `DashboardLayout`: Admin layout wrapper
- `AnalyticsDashboard`: Metrics visualization
- `ReturnsTable`: Return request management
- `PolicyEditor`: Policy configuration
- `PersonaCreator`: AI persona setup

---

## State Management

### Global State (Zustand)
```typescript
// User state
interface UserStore {
  user: User | null
  isAuthenticated: boolean
  role: 'admin' | 'customer' | null
  setUser: (user: User | null) => void
  setRole: (role: 'admin' | 'customer') => void
}

// Chat state
interface ChatStore {
  messages: ChatMessage[]
  isTyping: boolean
  addMessage: (message: ChatMessage) => void
  setTyping: (typing: boolean) => void
}
```

### Local State
- **React useState**: Component-level state
- **React useReducer**: Complex state logic
- **React useMemo**: Computed values
- **React useCallback**: Memoized functions

---

## API Integration

### Supabase Client
```typescript
// Initialize client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Authentication
const { data: { user } } = await supabase.auth.getUser()

// Database operations
const { data, error } = await supabase
  .from('return_requests')
  .select('*')
  .eq('business_id', businessId)
```

### Edge Functions
```typescript
// Call Supabase Edge Functions
const response = await fetch('/functions/v1/triage-agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
})
```

### Real-time Subscriptions
```typescript
// Subscribe to real-time updates
const subscription = supabase
  .channel('return_requests')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'return_requests'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe()
```

---

## Routing & Navigation

### App Router Structure
- **Layout Routes**: Shared layouts (`layout.tsx`)
- **Page Routes**: Individual pages (`page.tsx`)
- **Loading States**: Loading UI (`loading.tsx`)
- **Error Boundaries**: Error handling (`error.tsx`)
- **Not Found**: 404 pages (`not-found.tsx`)

### Route Groups
- `(landing)`: Landing page routes
- `(dashboard)`: Dashboard routes
- `(auth)`: Authentication routes

### Dynamic Routes
- `[id]`: Dynamic segments
- `[public_id]`: Public identifiers
- `[...slug]`: Catch-all routes

---

## Styling System

### Tailwind CSS Configuration
```typescript
// tailwind.config.ts
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      }
    }
  }
}
```

### Design System
- **Colors**: Consistent color palette
- **Typography**: Font hierarchy and spacing
- **Spacing**: Consistent spacing scale
- **Components**: Reusable component patterns

---

## Performance Optimization

### Next.js Optimizations
- **App Router**: Server components and streaming
- **Image Optimization**: Automatic image optimization
- **Font Optimization**: Font loading optimization
- **Bundle Analysis**: Code splitting and tree shaking

### React Optimizations
- **Memoization**: React.memo, useMemo, useCallback
- **Code Splitting**: Dynamic imports
- **Lazy Loading**: Component lazy loading
- **Virtual Scrolling**: Large list optimization

---

## Security Features

### Authentication
- **JWT Tokens**: Secure token-based auth
- **Route Protection**: Guarded routes
- **Role-based Access**: User role validation
- **Session Management**: Secure session handling

### Data Protection
- **Input Validation**: Client-side validation
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Cross-site request forgery protection
- **HTTPS**: Secure communication

---

## Testing Strategy

### Unit Testing
- **Jest**: Test runner
- **React Testing Library**: Component testing
- **MSW**: API mocking

### Integration Testing
- **Playwright**: End-to-end testing
- **Cypress**: Browser testing

### Testing Patterns
```typescript
// Component test example
import { render, screen } from '@testing-library/react'
import { ChatMessage } from '@/components/customer/ChatMessage'

test('renders chat message', () => {
  render(<ChatMessage message={mockMessage} />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

---

## Deployment

### Build Process
```bash
# Development
npm run dev

# Production build
npm run build

# Production start
npm start
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=your-app-url
```

### Deployment Platforms
- **Vercel**: Recommended for Next.js
- **Netlify**: Alternative deployment
- **AWS**: Enterprise deployment
- **Docker**: Containerized deployment

---

## Development Workflow

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks

### Development Tools
- **VS Code**: Recommended editor
- **React DevTools**: Component debugging
- **Redux DevTools**: State debugging
- **Network Tab**: API debugging

---

## Future Enhancements

### Planned Features
- **PWA Support**: Offline functionality
- **Mobile App**: React Native version
- **Advanced Analytics**: Enhanced metrics
- **Multi-language**: Internationalization
- **Dark Mode**: Theme switching

### Performance Improvements
- **Service Workers**: Caching strategies
- **CDN Integration**: Content delivery
- **Image Optimization**: Advanced image handling
- **Bundle Optimization**: Code splitting improvements

---

**See also:**
- `frontend_components.md` for detailed component documentation
- `frontend_types.md` for TypeScript type definitions
- `frontend_integration.md` for API integration patterns
- `frontend_deployment.md` for deployment guidelines 