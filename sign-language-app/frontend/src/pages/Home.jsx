const Home = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Sign Language Interpreter</h1>
        <p className="text-xl text-gray-400">Learn, practice, and communicate in sign language</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">🎥 Real-time Recognition</h3>
          <p className="text-gray-400">Recognize sign language gestures in real-time using your camera</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">📚 Learn Vocabulary</h3>
          <p className="text-gray-400">Learn sign language vocabulary with videos and interactive lessons</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">💬 Chat Room</h3>
          <p className="text-gray-400">Communicate with others in real-time with sign language support</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">✅ Quizzes</h3>
          <p className="text-gray-400">Test your knowledge with interactive quizzes and get scores</p>
        </div>
      </div>
    </div>
  )
}

export default Home
