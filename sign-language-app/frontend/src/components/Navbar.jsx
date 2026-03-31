export const Navbar = () => {
  return (
    <nav className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-400">🤟 Sign Language Interpreter</h1>
        </div>
        <div className="flex gap-4">
          <a href="/" className="hover:text-blue-400">Home</a>
          <a href="/recognize" className="hover:text-blue-400">Recognize</a>
          <a href="/learn" className="hover:text-blue-400">Learn</a>
          <a href="/chat" className="hover:text-blue-400">Chat</a>
          <a href="/profile" className="hover:text-blue-400">Profile</a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
