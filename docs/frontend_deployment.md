# Frontend Deployment Documentation

Complete guide for deploying the Dokani platform frontend.

## Deployment Platforms

### Vercel (Recommended)
- Automatic deployments from Git
- Built-in Next.js optimization
- Global CDN
- Preview deployments

### Netlify
- Git-based deployments
- Custom build commands
- Form handling
- Serverless functions

### AWS
- S3 + CloudFront
- ECS containers
- Amplify hosting

## Environment Variables

Required:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional:
```env
NEXT_PUBLIC_APP_URL=your-app-url
NEXT_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-key
NEXT_PUBLIC_TAVUS_API_KEY=your-tavus-key
```

## Build Process

```bash
npm install
npm run build
npm start
```

## Performance Optimization

- Bundle analysis
- Image optimization
- Code splitting
- Caching strategies

## Security

- Content Security Policy
- Security headers
- Environment variable protection
- HTTPS enforcement

## Monitoring

- Error tracking (Sentry)
- Performance monitoring
- Health checks
- Analytics integration

---

## Deployment Overview

The frontend can be deployed to multiple platforms with different configurations:

- **Vercel** - Recommended for Next.js applications
- **Netlify** - Alternative deployment platform
- **AWS** - Enterprise deployment
- **Docker** - Containerized deployment
- **Self-hosted** - Custom server deployment

---

## Pre-deployment Checklist

### Environment Variables
Ensure all required environment variables are set:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
NEXT_PUBLIC_APP_URL=your-app-url
NEXT_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-key
NEXT_PUBLIC_TAVUS_API_KEY=your-tavus-key
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Build Optimization
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test the build locally
npm start
```

### Performance Checks
- [ ] Bundle size analysis
- [ ] Lighthouse performance score
- [ ] Core Web Vitals
- [ ] Image optimization
- [ ] Code splitting verification

---

## Vercel Deployment

### Setup
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

### Configuration
Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variables
Set in Vercel dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add each variable with appropriate values

### Custom Domain
1. Go to Project Settings
2. Navigate to Domains
3. Add your custom domain
4. Configure DNS records

### Preview Deployments
- Automatic preview deployments for pull requests
- Branch-specific deployments
- Preview URLs for testing

---

## Netlify Deployment

### Setup
1. **Connect Repository**
   - Link GitHub/GitLab repository
   - Configure build settings

2. **Build Configuration**
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Environment Variables**
   - Set in Netlify dashboard
   - Use Netlify CLI for local development

### Netlify CLI
```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## AWS Deployment

### AWS Amplify
1. **Connect Repository**
   - Connect to GitHub/GitLab
   - Configure build settings

2. **Build Settings**
   ```yaml
   # amplify.yml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### AWS S3 + CloudFront
1. **Build and Upload**
   ```bash
   npm run build
   aws s3 sync .next s3://your-bucket-name
   ```

2. **CloudFront Distribution**
   - Create distribution
   - Configure origin
   - Set up caching rules

3. **Route 53**
   - Configure DNS records
   - Set up SSL certificate

### AWS ECS (Container)
1. **Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Deploy to ECS**
   ```bash
   docker build -t dokani-frontend .
   docker push your-registry/dokani-frontend
   ```

---

## Docker Deployment

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: unless-stopped
```

### Build and Run
```bash
# Build image
docker build -t dokani-frontend .

# Run container
docker run -p 3000:3000 dokani-frontend

# Using Docker Compose
docker-compose up -d
```

---

## Self-hosted Deployment

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/dokani
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static assets
    location /_next/static {
        alias /var/www/dokani/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Public assets
    location /public {
        alias /var/www/dokani/public;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dokani-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/dokani',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: 'your-supabase-url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key'
    },
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Restart PM2
pm2 restart dokani-frontend

# Reload Nginx
sudo systemctl reload nginx
```

---

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

### GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - curl -X POST $DEPLOY_WEBHOOK
  only:
    - main
```

---

## Performance Optimization

### Bundle Analysis
```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // your config
})

# Analyze bundle
ANALYZE=true npm run build
```

### Image Optimization
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  }
}
```

### Caching Strategy
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000'
          }
        ]
      }
    ]
  }
}
```

---

## Monitoring and Analytics

### Error Tracking
```typescript
// src/lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

export function captureError(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context
  })
}
```

### Performance Monitoring
```typescript
// src/lib/analytics.ts
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_ANALYTICS_ID, {
      page_path: url
    })
  }
}

export function trackEvent(action: string, category: string, label?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label
    })
  }
}
```

### Health Checks
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) throw error
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 })
  }
}
```

---

## Security Configuration

### Content Security Policy
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: blob:;
              connect-src 'self' https://your-supabase-project.supabase.co;
              frame-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ]
  }
}
```

### Security Headers
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install

# Check TypeScript errors
npm run type-check

# Check linting errors
npm run lint
```

#### Runtime Errors
```bash
# Check logs
npm run dev 2>&1 | tee logs.txt

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Performance Issues
```bash
# Analyze bundle
ANALYZE=true npm run build

# Check Core Web Vitals
npm run lighthouse

# Monitor memory usage
node --inspect npm start
```

### Debug Configuration
```javascript
// next.config.js
module.exports = {
  // Enable source maps in production
  productionBrowserSourceMaps: true,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Custom webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
    return config
  }
}
```

---

## Rollback Strategy

### Version Management
```bash
# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Rollback to previous version
git checkout v0.9.0
npm run build
npm start
```

### Database Migrations
```sql
-- Create rollback migration
CREATE OR REPLACE FUNCTION rollback_to_version(target_version TEXT)
RETURNS VOID AS $$
BEGIN
  -- Rollback logic here
  RAISE NOTICE 'Rolling back to version %', target_version;
END;
$$ LANGUAGE plpgsql;
```

### Blue-Green Deployment
1. Deploy new version to staging
2. Run smoke tests
3. Switch traffic to new version
4. Monitor for issues
5. Rollback if necessary

---

**See also:**
- `frontend_overview.md` for architecture overview
- `frontend_components.md` for component documentation
- `frontend_integration.md` for API integration
- `frontend_types.md` for TypeScript definitions 