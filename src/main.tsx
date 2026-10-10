import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Latin subsets only. The full packages ship Cyrillic and Devanagari too,
// which nothing here renders and which the service worker would then have to
// precache — roughly a megabyte of fonts nobody sees.
import '@fontsource/caveat/latin-400.css';
import '@fontsource/caveat/latin-600.css';
import '@fontsource/patrick-hand/latin-400.css';
import '@fontsource/kalam/latin-400.css';
import '@fontsource/kalam/latin-700.css';
import '@fontsource/architects-daughter/latin-400.css';

import './styles/reset.css';
import './styles/tokens.css';
import './styles/wall.css';
import './styles/surfaces.css';
import './styles/note.css';
import './styles/papers.css';
import './styles/ink.css';
import './styles/light.css';
import './styles/room.css';
import './styles/ui.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
