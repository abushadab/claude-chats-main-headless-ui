# DevTeam Chat

A modern team collaboration chat platform built with Next.js 15.

## Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library
- **React Query** - Data fetching and state management

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Features

- Multi-project workspace management
- Channel-based messaging
- Real-time chat interface
- User presence indicators
- Responsive design
- Dashlane-compatible (hydration-safe)

## Project Structure

```
├── app/              # Next.js app directory
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── src/
│   ├── components/   # React components
│   ├── data/         # Mock data
│   ├── hooks/        # Custom hooks
│   └── lib/          # Utility functions
└── public/           # Static assets
```

## Development

The application uses mock data for demonstration purposes. In a production environment, you would replace the mock data with real API calls.

## License

MIT