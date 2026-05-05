@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-display: 'Source Serif 4', serif;
    --font-body: 'Inter', sans-serif;

    --background: 253 90% 22%;
    --foreground: 6 72% 47%;
    --card: 11 47% 11%;
    --card-foreground: 7 40% 98%;
    --popover: 222 47% 11%;
    --popover-foreground: 210 40% 98%;
    --primary: 353 87% 47%;
    --primary-foreground: 222 47% 11%;
    --secondary: 215 19% 35%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 43 60% 53%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 20%;
    --input: 217 33% 20%;
    --ring: 43 60% 53%;
    --chart-1: 43 60% 53%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.25rem;

    --sidebar-background: 222 47% 9%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 217 91% 60%;
    --sidebar-primary-foreground: 222 47% 11%;
    --sidebar-accent: 217 33% 17%;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-border: 217 33% 20%;
    --sidebar-ring: 217 91% 60%;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 222 47% 11%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 11%;
    --popover-foreground: 210 40% 98%;
    --primary: 43 60% 53%;
    --primary-foreground: 222 47% 11%;
    --secondary: 215 19% 35%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 63.9%;
    --accent: 43 60% 53%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 20%;
    --input: 217 33% 20%;
    --ring: 43 60% 53%;
    --chart-1: 43 60% 53%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 222 47% 9%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 217 91% 60%;
    --sidebar-primary-foreground: 222 47% 11%;
    --sidebar-accent: 217 33% 17%;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-border: 217 33% 20%;
    --sidebar-ring: 217 91% 60%;
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: hsl(222 47% 11%);
}
::-webkit-scrollbar-thumb {
  background: hsl(215 19% 35%);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(217 91% 60%);
}