# FileIcon - Image to Icon Converter

## Overview
A minimalist, elegant web application that converts PNG/JPG images into downloadable icon files for Windows (.ico) and macOS (.icns).

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js with Sharp for image processing
- **Design**: Warm cream (#f4e9d1) background, luxury minimalist aesthetic with rich brown accent

## Key Features
- Drag-and-drop or click-to-upload image upload
- Converts to Windows .ico (16-256px sizes) and macOS .icns (16-1024px sizes)
- Instant download of converted files
- Auto-cleanup of generated files after 5 minutes

## Routes
- `/` - Home page with upload and conversion UI
- `/api/convert` - POST endpoint accepting multipart form with `image` field
- `/api/download/:filename` - GET endpoint to download generated .ico/.icns files

## Tech Stack
- sharp - Image resizing
- png-to-ico - ICO file generation
- multer - File upload handling
- framer-motion - UI animations

## Recent Changes
- 2026-02-19: Initial build - full icon conversion app with elegant dark UI
