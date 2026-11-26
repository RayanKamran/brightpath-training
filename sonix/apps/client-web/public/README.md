# Public Assets

This directory contains static assets that are served directly by the web application.

## Files in this directory are publicly accessible

Files placed here will be available at:
- **Development**: `http://localhost:3004/<filename>`
- **Production**: `https://yourdomain.com/<filename>`

**No authentication required** - these files are publicly accessible to anyone.

## Current Assets

- `favicon.ico` - Browser favicon
- `dms-logo-2025.svg` - DMS Sonix logo (used by UI and Logto)
  - to generate a "data URL" for this image, run 

## Usage Examples

### In React Components

```tsx
// Reference public assets directly by filename
<img src="/dms-logo-2025.svg" alt="DMS Logo" />
```

### In Logto Configuration

For branding configuration, use the full URL:
```
http://localhost:3004/dms-logo-2025.svg (development)
https://yourdomain.com/dms-logo-2025.svg (production)
```

### In External Services

Any service that can access your web application can use these URLs:
```
http://localhost:3004/dms-logo-2025.svg
```

## Best Practices

1. **File Naming**: Use descriptive, lowercase names with hyphens
2. **Versioning**: Include version/year in filename for cache busting (e.g., `dms-logo-2025.svg`)
3. **Optimization**: 
   - Compress images before adding
   - Use SVG for logos when possible
   - Optimize PNG/JPG files
4. **Size**: Keep files small - these are served on every request
5. **Sensitive Data**: Never put sensitive files here - they're publicly accessible!

## File Types Commonly Placed Here

- Favicons (`.ico`, `.png`)
- Logos (`.svg`, `.png`)
- Open Graph images (`og-image.png`)
- Manifest files (`manifest.json`, `robots.txt`)
- Static documents (user manuals, PDFs)

## How It Works

Vite serves files from this directory at the root path during development and includes them in the build output for production.

See: [Vite Public Directory](https://vitejs.dev/guide/assets.html#the-public-directory)
