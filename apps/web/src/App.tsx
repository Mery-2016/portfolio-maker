import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { Editor } from './pages/Editor.js';
import { Render } from './pages/Render.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:id/edit" element={<Editor />} />
        <Route path="/r/:id/edit/:step" element={<Editor />} />
        <Route path="/render/:id" element={<Render />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--paper)] text-[var(--ink)]">
              <h1 className="font-voice text-3xl font-bold mb-3">Такой страницы нет</h1>
              <Link to="/" className="text-[var(--lazur)] hover:underline text-sm font-medium">
                Вернуться к резюме
              </Link>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
