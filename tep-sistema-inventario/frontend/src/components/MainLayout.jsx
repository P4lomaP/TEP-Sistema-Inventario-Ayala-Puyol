import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout({ children, activePage = 'dashboard', pageTitle = 'Dashboard' }) {
  // En pantallas grandes (>=1024px) inicia abierto; en móviles inicia cerrado
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800 relative overflow-x-hidden">
      {/* Sidebar de navegación: colapsable en escritorio y drawer deslizante en móvil */}
      <Sidebar 
        activePage={activePage} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Overlay oscuro de fondo solo para pantallas móviles */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Área principal dinámica: se adapta y expande al 100% cuando el sidebar se cierra */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Barra superior con botón toggle y menú de perfil */}
        <Navbar 
          title={pageTitle} 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} 
        />

        {/* Contenido renderizado que se estira o centra fluidamente */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}