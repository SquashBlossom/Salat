/* Starts the design kit page. Same fonts and styles as the app. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/amiri/400.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/motion.css';
import '../styles/components.css';
import '../styles/screens.css';
import './kit.css';
import Kit from './Kit.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><Kit /></StrictMode>);
