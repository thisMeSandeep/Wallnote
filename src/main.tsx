import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import '@fontsource/caveat/400.css';
import '@fontsource/caveat/600.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/kalam/400.css';
import '@fontsource/kalam/700.css';
import '@fontsource/architects-daughter/400.css';

import './styles/reset.css';
import './styles/tokens.css';
import './styles/wall.css';
import './styles/surfaces.css';
import './styles/note.css';
import './styles/papers.css';
import './styles/ui.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
