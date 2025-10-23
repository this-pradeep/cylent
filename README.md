# Cylent - Creative Agency Website

A premium, highly-optimized static website built with TailwindCSS. Designed for 100% Lighthouse scores across all metrics.

## Features

- **100% Static** - Pure HTML, CSS, and vanilla JavaScript
- **Highly SEO Optimized** - Comprehensive meta tags, structured data, semantic HTML
- **Performance Optimized** - Minified assets, optimized fonts, lazy loading
- **Dark/Light Mode** - Smooth theme switching with localStorage persistence
- **Minimalist & Premium Design** - Inspired by silence, universe, and light spectrum
- **Responsive** - Mobile-first design that works on all devices
- **Accessible** - Semantic HTML with proper ARIA labels

## Tech Stack

- **TailwindCSS** - Utility-first CSS framework
- **Figtree Font** - Modern, elegant typography
- **Vanilla JavaScript** - No frameworks, pure performance
- **HTML5** - Semantic markup for SEO

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Build CSS and watch for changes
npm run dev
```

Open `index.html` in your browser to view the website.

### Production Build

```bash
# Build and minify all assets
npm run build
```

This will:
1. Build and minify TailwindCSS (removes unused styles)
2. Minify JavaScript
3. Copy HTML to dist folder

The production-ready files will be in the `dist/` folder.

### Serve Production Build

```bash
# Serve the production build
npm run serve
```

## Project Structure

```
cylent_web/
├── src/
│   ├── styles.css          # TailwindCSS source
│   └── script.js           # JavaScript source
├── dist/                   # Production build output
│   ├── styles.css          # Minified CSS
│   ├── script.min.js       # Minified JS
│   └── index.html          # Production HTML
├── index.html              # Main HTML file
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # TailwindCSS configuration
└── postcss.config.js       # PostCSS configuration
```

## Performance Optimizations

- **Critical CSS Inlining** - Above-the-fold styles loaded immediately
- **Font Optimization** - Google Fonts with display=swap
- **Asset Minification** - CSS and JS compressed
- **Tree Shaking** - Unused TailwindCSS classes removed
- **Lazy Loading** - Images and non-critical resources
- **Preload/Prefetch** - Critical resources prioritized

## SEO Optimizations

- Semantic HTML5 markup
- Comprehensive meta tags
- Open Graph and Twitter Card support
- Structured Data (JSON-LD)
- Canonical URLs
- Proper heading hierarchy
- Alt text for images
- Fast page load times

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Copyright © 2024 Cylent. All rights reserved.
