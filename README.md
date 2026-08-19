# Signal Guardian

A modern, full-featured signal monitoring and management application built with React, TypeScript, and Tailwind CSS.

## 📋 About

Signal Guardian is a comprehensive monitoring solution designed to track, visualize, and manage signals with real-time updates. Built with a focus on user experience and performance, it provides intuitive dashboards, detailed analytics, and advanced management capabilities.

## ✨ Features

- **Real-time Monitoring**: Live signal tracking and updates
- **Interactive Dashboards**: Visualize data with charts and graphs powered by Recharts
- **Map Integration**: Geographic signal visualization using Leaflet
- **Form Management**: Robust form handling with validation via React Hook Form and Zod
- **Component Library**: Rich UI components from shadcn-ui and Radix UI
- **Dark Mode Support**: Built-in theme switching with next-themes
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **State Management**: Efficient data fetching with TanStack React Query
- **Type Safety**: Full TypeScript support throughout the application
- **Accessibility**: WAI-ARIA compliant components for inclusive design

## 🛠 Tech Stack

- **Framework**: [React](https://react.dev/) 18.3
- **Build Tool**: [Vite](https://vitejs.dev/) 5
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with animations
- **UI Components**: [shadcn-ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
- **Routing**: [React Router](https://reactrouter.com/) 6
- **State Management**: [TanStack React Query](https://tanstack.com/query/latest)
- **Visualization**: [Recharts](https://recharts.org/) and [Leaflet](https://leafletjs.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) toasts
- **Linting**: [ESLint](https://eslint.org/)

## 📦 Installation

### Prerequisites

- Node.js 16+ (recommended 18+)
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarkoUzelac/signal-guardian.git
   cd signal-guardian
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 🚀 Available Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production
- `npm run build:dev` - Build with development configuration
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## 📁 Project Structure

```
signal-guardian/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and helpers
│   ├── styles/          # Global styles and Tailwind config
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## 🔧 Development

### Code Quality

The project uses ESLint for code quality checks:

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📖 Documentation

For more information about the technologies used:

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn-ui Components](https://ui.shadcn.com/)
- [React Router Docs](https://reactrouter.com/)

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve Signal Guardian.

## 📝 License

This project is open source and available under the MIT License.

## 👤 Author

**Marko Uzelac**
- GitHub: [@MarkoUzelac](https://github.com/MarkoUzelac)

## 🙏 Acknowledgments

- [shadcn/ui](https://github.com/shadcn-ui/ui) for the excellent component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- All contributors and the open source community

---

**Last Updated**: August 2026
