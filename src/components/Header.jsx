import { LogOut, Home } from 'lucide-react';

export default function Header({ navigate, user, onLogout, showHome = false }) {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('home')}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-purple-600 flex items-center justify-center">
            <span className="text-white font-extrabold text-xl">KH</span>
          </div>
          <div>
            <h1 className="text-purple-600 tracking-tight">KH PERFECTION</h1>
            <p className="text-xs text-gray-500">Votre succès, notre mission</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {showHome && (
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Home size={20} />
              <span>Accueil</span>
            </button>
          )}
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Bonjour, <span className="font-semibold">{user.name}</span>
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut size={18} />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
