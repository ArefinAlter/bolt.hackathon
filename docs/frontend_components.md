# Frontend Components Documentation

Complete documentation of all frontend components in the Dokani platform.

---

## Component Overview

The frontend uses a **component-based architecture** with reusable, composable components organized by feature and functionality.

### Component Categories

1. **UI Components** - Base components (shadcn/ui)
2. **Layout Components** - Page structure and navigation
3. **Feature Components** - Business logic components
4. **Form Components** - Input and validation components
5. **Display Components** - Data presentation components

---

## UI Components (shadcn/ui)

Base components built with Radix UI primitives and Tailwind CSS.

### Button Component
```typescript
// src/components/ui/button.tsx
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}
```

**Usage:**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Submit Return Request
</Button>
```

### Card Component
```typescript
// src/components/ui/card.tsx
interface CardProps {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Return Request</CardTitle>
    <CardDescription>Order #12345</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Request details...</p>
  </CardContent>
</Card>
```

### Dialog Component
```typescript
// src/components/ui/dialog.tsx
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}
```

**Usage:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <DialogDescription>
      Are you sure you want to proceed?
    </DialogDescription>
  </DialogContent>
</Dialog>
```

### Form Components
```typescript
// src/components/ui/form.tsx
interface FormProps {
  children: React.ReactNode
  onSubmit: (data: any) => void
}

interface FormFieldProps {
  name: string
  children: React.ReactNode
}
```

**Usage:**
```tsx
<Form onSubmit={handleSubmit}>
  <FormField name="email">
    <FormLabel>Email</FormLabel>
    <FormControl>
      <Input type="email" />
    </FormControl>
    <FormMessage />
  </FormField>
</Form>
```

---

## Authentication Components

### AuthForm Component
```typescript
// src/components/auth/AuthForm.tsx
interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (data: AuthFormData) => void
  isLoading?: boolean
  error?: string
}

interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
}
```

**Features:**
- Unified login/signup form
- Form validation with react-hook-form
- Error handling and display
- Loading states
- Password strength indicator

**Usage:**
```tsx
<AuthForm 
  mode="login"
  onSubmit={handleLogin}
  isLoading={isLoading}
  error={error}
/>
```

### AuthGuard Component
```typescript
// src/components/auth/AuthGuard.tsx
interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'customer'
  fallback?: React.ReactNode
}
```

**Features:**
- Route protection
- Role-based access control
- Automatic redirect to login
- Custom fallback components

**Usage:**
```tsx
<AuthGuard requiredRole="admin">
  <AdminDashboard />
</AuthGuard>
```

### RoleSelectionCard Component
```typescript
// src/components/auth/RoleSelectionCard.tsx
interface RoleSelectionCardProps {
  role: 'admin' | 'customer'
  title: string
  description: string
  icon: React.ReactNode
  onSelect: (role: 'admin' | 'customer') => void
  isSelected?: boolean
}
```

**Usage:**
```tsx
<RoleSelectionCard
  role="admin"
  title="Business Admin"
  description="Manage returns and policies"
  icon={<Shield className="h-8 w-8" />}
  onSelect={handleRoleSelect}
  isSelected={selectedRole === 'admin'}
/>
```

---

## Customer Components

### ChatContainer Component
```typescript
// src/components/customer/ChatContainer.tsx
interface ChatContainerProps {
  sessionId: string
  businessId: string
  customerEmail?: string
  onMessageSent?: (message: ChatMessage) => void
}
```

**Features:**
- Real-time chat interface
- Message history
- File upload support
- Typing indicators
- Message status tracking

**Usage:**
```tsx
<ChatContainer
  sessionId={sessionId}
  businessId={businessId}
  customerEmail={customerEmail}
  onMessageSent={handleMessageSent}
/>
```

### ChatMessage Component
```typescript
// src/components/customer/ChatMessage.tsx
interface ChatMessageProps {
  message: ChatMessage
  onFeedback?: (messageId: string, isPositive: boolean) => void
  onViewFile?: (url: string, fileName: string) => void
  showFeedback?: string | null
}
```

**Features:**
- Message display with timestamps
- File attachment preview
- Feedback buttons
- Return detection indicators
- Message status display

**Usage:**
```tsx
<ChatMessage
  message={message}
  onFeedback={handleFeedback}
  onViewFile={handleViewFile}
  showFeedback={showFeedback}
/>
```

### VoiceCallInterface Component
```typescript
// src/components/customer/VoiceCallInterface.tsx
interface VoiceCallInterfaceProps {
  callSessionId: string
  onCallEnd?: () => void
  onCallStart?: () => void
}
```

**Features:**
- Voice call controls
- Audio visualization
- Call quality indicators
- Mute/unmute functionality
- Call duration display

**Usage:**
```tsx
<VoiceCallInterface
  callSessionId={callSessionId}
  onCallEnd={handleCallEnd}
  onCallStart={handleCallStart}
/>
```

### VideoCallInterface Component
```typescript
// src/components/customer/VideoCallInterface.tsx
interface VideoCallInterfaceProps {
  callSessionId: string
  onCallEnd?: () => void
  onCallStart?: () => void
}
```

**Features:**
- Video call interface
- Screen sharing
- Video controls
- Call quality metrics
- Recording capabilities

**Usage:**
```tsx
<VideoCallInterface
  callSessionId={callSessionId}
  onCallEnd={handleCallEnd}
  onCallStart={handleCallStart}
/>
```

### FilePreview Component
```typescript
// src/components/customer/FilePreview.tsx
interface FilePreviewProps {
  file: FileUpload
  onClose: () => void
  onDownload?: (file: FileUpload) => void
}
```

**Features:**
- Image preview
- Document viewer
- Download functionality
- File metadata display
- Responsive design

**Usage:**
```tsx
<FilePreview
  file={selectedFile}
  onClose={() => setSelectedFile(null)}
  onDownload={handleDownload}
/>
```

---

## Dashboard Components

### DashboardLayout Component
```typescript
// src/components/dashboard/DashboardLayout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}
```

**Features:**
- Responsive sidebar navigation
- Header with user menu
- Breadcrumb navigation
- Mobile menu support
- Theme switching

**Usage:**
```tsx
<DashboardLayout title="Analytics" description="Business metrics">
  <AnalyticsDashboard />
</DashboardLayout>
```

### Sidebar Component
```typescript
// src/components/dashboard/Sidebar.tsx
interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  user: User
}
```

**Features:**
- Navigation menu
- User profile section
- Collapsible sections
- Active state indicators
- Mobile responsive

**Usage:**
```tsx
<Sidebar
  isOpen={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  user={user}
/>
```

### AnalyticsDashboard Component
```typescript
// src/components/dashboard/AnalyticsDashboard.tsx
interface AnalyticsDashboardProps {
  businessId: string
  dateRange?: {
    start: Date
    end: Date
  }
}
```

**Features:**
- Key metrics display
- Chart visualizations
- Date range filtering
- Export functionality
- Real-time updates

**Usage:**
```tsx
<AnalyticsDashboard
  businessId={businessId}
  dateRange={dateRange}
/>
```

### ReturnsTable Component
```typescript
// src/components/dashboard/requests/ReturnsTable.tsx
interface ReturnsTableProps {
  businessId: string
  filters?: ReturnRequestFilter
  onRequestClick?: (request: ReturnRequest) => void
}
```

**Features:**
- Sortable columns
- Filtering options
- Pagination
- Bulk actions
- Export to CSV

**Usage:**
```tsx
<ReturnsTable
  businessId={businessId}
  filters={filters}
  onRequestClick={handleRequestClick}
/>
```

### RequestDetail Component
```typescript
// src/components/dashboard/requests/RequestDetail.tsx
interface RequestDetailProps {
  request: ReturnRequest
  onClose: () => void
  onRequestUpdated: (updatedRequest: ReturnRequest) => void
}
```

**Features:**
- Detailed request view
- Status timeline
- Evidence gallery
- Decision panel
- Admin notes

**Usage:**
```tsx
<RequestDetail
  request={selectedRequest}
  onClose={() => setSelectedRequest(null)}
  onRequestUpdated={handleRequestUpdated}
/>
```

### PolicyEditor Component
```typescript
// src/components/dashboard/policy/PolicyEditor.tsx
interface PolicyEditorProps {
  businessId: string
  policy?: Policy
  onSave: (policy: Policy) => void
}
```

**Features:**
- Policy rule configuration
- Real-time validation
- Version control
- A/B testing setup
- Compliance checking

**Usage:**
```tsx
<PolicyEditor
  businessId={businessId}
  policy={currentPolicy}
  onSave={handlePolicySave}
/>
```

### PersonaCreator Component
```typescript
// src/components/dashboard/personas/PersonaCreator.tsx
interface PersonaCreatorProps {
  businessId: string
  provider: 'elevenlabs' | 'tavus'
  onSave: (config: ProviderConfig) => void
}
```

**Features:**
- Voice/video persona setup
- Provider integration
- Test functionality
- Configuration management
- Performance metrics

**Usage:**
```tsx
<PersonaCreator
  businessId={businessId}
  provider="elevenlabs"
  onSave={handlePersonaSave}
/>
```

---

## Return Components

### ReturnSummary Component
```typescript
// src/components/return/ReturnSummary.tsx
interface ReturnSummaryProps {
  request: ReturnRequest
  onStatusUpdate?: (status: string) => void
}
```

**Features:**
- Return status display
- Progress indicators
- Timeline view
- Action buttons
- Status updates

**Usage:**
```tsx
<ReturnSummary
  request={returnRequest}
  onStatusUpdate={handleStatusUpdate}
/>
```

### EvidenceGallery Component
```typescript
// src/components/return/EvidenceGallery.tsx
interface EvidenceGalleryProps {
  evidenceUrls: string[]
  onView: (url: string) => void
  onDownload?: (url: string) => void
}
```

**Features:**
- Image grid layout
- Thumbnail previews
- Full-screen viewer
- Download functionality
- Responsive design

**Usage:**
```tsx
<EvidenceGallery
  evidenceUrls={request.evidence_urls}
  onView={handleViewEvidence}
  onDownload={handleDownloadEvidence}
/>
```

### StatusTimeline Component
```typescript
// src/components/return/StatusTimeline.tsx
interface StatusTimelineProps {
  events: TimelineEvent[]
  currentStatus: string
}
```

**Features:**
- Timeline visualization
- Status progression
- Event details
- Timestamp display
- Interactive elements

**Usage:**
```tsx
<StatusTimeline
  events={timelineEvents}
  currentStatus={request.status}
/>
```

---

## Common Components

### LoadingSpinner Component
```typescript
// src/components/common/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
}
```

**Usage:**
```tsx
<LoadingSpinner size="lg" text="Loading..." />
```

### ErrorFallback Component
```typescript
// src/components/common/ErrorFallback.tsx
interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}
```

**Usage:**
```tsx
<ErrorFallback
  error={error}
  resetErrorBoundary={handleReset}
/>
```

### GlobalSearch Component
```typescript
// src/components/common/GlobalSearch.tsx
interface GlobalSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}
```

**Usage:**
```tsx
<GlobalSearch
  onSearch={handleSearch}
  placeholder="Search returns, customers..."
/>
```

---

## Component Patterns

### Compound Components
```tsx
// Example: Card with header, content, footer
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

### Render Props
```tsx
// Example: Data fetching component
<DataFetcher url="/api/returns">
  {({ data, loading, error }) => (
    loading ? <LoadingSpinner /> :
    error ? <ErrorMessage error={error} /> :
    <ReturnsTable data={data} />
  )}
</DataFetcher>
```

### Higher-Order Components
```tsx
// Example: Authentication wrapper
const withAuth = (Component: React.ComponentType) => {
  return (props: any) => (
    <AuthGuard>
      <Component {...props} />
    </AuthGuard>
  )
}
```

---

## Styling Guidelines

### Tailwind CSS Classes
- **Consistent spacing**: Use Tailwind's spacing scale
- **Responsive design**: Mobile-first approach
- **Dark mode support**: Use CSS variables
- **Component variants**: Consistent styling patterns

### CSS Custom Properties
```css
:root {
  --primary: 59 130 246;
  --primary-foreground: 255 255 255;
  --secondary: 100 116 139;
  --secondary-foreground: 255 255 255;
}
```

### Component Variants
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

## Performance Optimization

### React.memo
```tsx
const ChatMessage = React.memo(({ message, onFeedback }: ChatMessageProps) => {
  // Component implementation
})
```

### useMemo and useCallback
```tsx
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data)
}, [data])

const memoizedCallback = useCallback(() => {
  handleAction(id)
}, [id])
```

### Lazy Loading
```tsx
const LazyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  )
}
```

---

## Testing Components

### Unit Testing
```tsx
import { render, screen } from '@testing-library/react'
import { ChatMessage } from './ChatMessage'

test('renders message content', () => {
  const message = {
    id: '1',
    content: 'Hello world',
    sender: 'user',
    timestamp: new Date().toISOString()
  }
  
  render(<ChatMessage message={message} />)
  expect(screen.getByText('Hello world')).toBeInTheDocument()
})
```

### Integration Testing
```tsx
test('submits form with correct data', async () => {
  const mockSubmit = jest.fn()
  render(<AuthForm mode="login" onSubmit={mockSubmit} />)
  
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))
  
  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  })
})
```

---

## Accessibility

### ARIA Labels
```tsx
<button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
  onClick={onClose}
>
  <X className="h-4 w-4" />
</button>
```

### Keyboard Navigation
```tsx
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    onClose()
  }
}
```

### Focus Management
```tsx
useEffect(() => {
  if (isOpen) {
    dialogRef.current?.focus()
  }
}, [isOpen])
```

---

**See also:**
- `frontend_overview.md` for architecture overview
- `frontend_types.md` for TypeScript definitions
- `frontend_integration.md` for API integration
- `frontend_deployment.md` for deployment guidelines 