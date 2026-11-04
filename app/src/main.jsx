/* Starts the app. Owns: fonts, styles, and mounting React. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/components.css';
import './styles/screens.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
