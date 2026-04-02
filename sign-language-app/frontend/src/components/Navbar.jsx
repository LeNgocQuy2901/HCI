import { Link } from 'react-router-dom'

export const Navbar = () => {
  return (
    <nav className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center hover:opacity-80">
          <h1 className="text-2xl font-bold text-blue-400">🤟 Sign Language Interpreter</h1>
        </Link>
        <div className="flex gap-6">
          <Link to="/" className="hover:text-blue-400 transition duration-200 font-semibold">
            🏠 Home
          </Link>
          <Link to="/gesture-recognition" className="hover:text-blue-400 transition duration-200 font-semibold">
            🎥 Nhận Diện
          </Link>
          <a href="#learn" className="hover:text-blue-400 transition duration-200 font-semibold">
            📚 Học
          </a>
          <a href="#chat" className="hover:text-blue-400 transition duration-200 font-semibold">
            💬 Chat
          </a>
          <a href="#profile" className="hover:text-blue-400 transition duration-200 font-semibold">
            👤 Hồ Sơ
          </a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
