import { useState, useRef, useEffect } from 'react'
import { gestureService } from '../services/api'

const GestureRecognition = () => {
  const [mode, setMode] = useState('camera') // 'camera' or 'upload'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [handDetected, setHandDetected] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState('Bắt đầu camera...')
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const autoCapureIntervalRef = useRef(null)

  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        setError(null)
      }
    } catch (err) {
      setError('❌ Không thể truy cập camera: ' + err.message)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      setCameraActive(false)
      setHandDetected(false)
      setDetectionStatus('Camera đã dừng')
    }
    // Clear auto-capture interval if exists
    if (autoCapureIntervalRef.current) {
      clearInterval(autoCapureIntervalRef.current)
    }
  }

  // Capture frame from camera
  const captureFrame = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context.drawImage(videoRef.current, 0, 0)
      
      canvasRef.current.toBlob(async (blob) => {
        await recognizeGesture(blob)
      })
    }
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      recognizeGesture(file)
    }
  }

  // Send to API for recognition
  const recognizeGesture = async (imageBlob) => {
    setLoading(true)
    setDetectionStatus('Đang phân tích ảnh...')
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('image', imageBlob)

    try {
      const response = await gestureService.recognizeGesture(formData)
      setResult(response.data)
      
      // Update hand detection status
      if (response.data.hand_detected) {
        setHandDetected(true)
        setDetectionStatus('✅ Đã phát hiện tay!')
      } else {
        setHandDetected(false)
        setDetectionStatus('❌ Chưa phát hiện tay - Di chuyển tay vào vùng xanh')
      }
    } catch (err) {
      setError('❌ Lỗi khi nhận diện: ' + (err.response?.data?.message || err.message))
      setDetectionStatus('⚠️ Lỗi khi phân tích')
      setHandDetected(false)
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (autoCapureIntervalRef.current) {
        clearInterval(autoCapureIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">🎥 Nhận Diện Ký Hiệu</h1>
        <p className="text-xl text-gray-400">Sử dụng camera hoặc tải ảnh lên để nhận diện ký hiệu tay</p>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-4 justify-center mb-8">
        <button
          onClick={() => {
            setMode('camera')
            startCamera()
          }}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            mode === 'camera'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📹 Camera Trực Tiếp
        </button>
        <button
          onClick={() => {
            setMode('upload')
            stopCamera()
          }}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            mode === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📤 Tải Ảnh Lên
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera/Upload Section */}
        <div className="space-y-4">
          {mode === 'camera' ? (
            <>
              {/* Camera with Hand Detection Zone */}
              <div className="bg-gray-800 rounded-lg overflow-hidden relative">
                {/* Status indicator */}
                <div className={`absolute top-4 right-4 z-10 px-4 py-2 rounded-full font-semibold text-white text-sm backdrop-blur-sm ${
                  handDetected 
                    ? 'bg-green-600/80 animate-pulse' 
                    : 'bg-orange-600/80'
                }`}>
                  {detectionStatus}
                </div>

                <div className="relative w-full h-96 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hand Detection Zone Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Outer box */}
                    <div className={`absolute inset-8 border-4 rounded-2xl transition ${
                      handDetected ? 'border-green-500' : 'border-blue-400'
                    }`}></div>
                    
                    {/* Main detection circle - VERY VISIBLE */}
                    <div className="relative w-56 h-72 flex items-center justify-center">
                      {/* Main green/cyan oval border - thick and visible */}
                      <div className={`absolute inset-0 border-4 rounded-full transition duration-200 ${
                        handDetected 
                          ? 'border-lime-400 shadow-lg shadow-lime-400 opacity-100' 
                          : 'border-cyan-300 opacity-80'
                      }`}></div>
                      
                      {/* Corner brackets - BRIGHT */}
                      <div className={`absolute top-2 left-2 w-10 h-10 border-t-4 border-l-4 transition ${
                        handDetected ? 'border-lime-300' : 'border-cyan-300'
                      }`}></div>
                      <div className={`absolute top-2 right-2 w-10 h-10 border-t-4 border-r-4 transition ${
                        handDetected ? 'border-lime-300' : 'border-cyan-300'
                      }`}></div>
                      <div className={`absolute bottom-2 left-2 w-10 h-10 border-b-4 border-l-4 transition ${
                        handDetected ? 'border-lime-300' : 'border-cyan-300'
                      }`}></div>
                      <div className={`absolute bottom-2 right-2 w-10 h-10 border-b-4 border-r-4 transition ${
                        handDetected ? 'border-lime-300' : 'border-cyan-300'
                      }`}></div>
                      
                      {/* Center target crosshair */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Horizontal line */}
                        <div className={`absolute h-1 w-12 transition ${
                          handDetected ? 'bg-lime-400' : 'bg-cyan-300'
                        }`}></div>
                        {/* Vertical line */}
                        <div className={`absolute w-1 h-12 transition ${
                          handDetected ? 'bg-lime-400' : 'bg-cyan-300'
                        }`}></div>
                        {/* Center dot */}
                        <div className={`absolute w-4 h-4 rounded-full transition ${
                          handDetected 
                            ? 'bg-lime-400 shadow-lg shadow-lime-400 animate-pulse' 
                            : 'bg-cyan-300'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Instructions overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <p className={`text-center font-semibold transition ${
                      handDetected 
                        ? 'text-green-300 text-lg' 
                        : 'text-white'
                    }`}>
                      {handDetected 
                        ? '✅ Tay được phát hiện - Nhấp chụp để nhận diện' 
                        : '👆 Đặt tay vào vùng xanh để nhận diện'}
                    </p>
                  </div>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                {cameraActive && (
                  <>
                    <button
                      onClick={captureFrame}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
                    >
                      {loading ? '⏳ Đang nhận diện...' : '📸 Chụp & Nhận Diện'}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
                    >
                      🛑 Dừng Camera
                    </button>
                  </>
                )}
                {!cameraActive && (
                  <button
                    onClick={startCamera}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    ▶️ Bật Camera
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-500 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition"
              >
                <div className="text-4xl mb-4">📁</div>
                <p className="text-lg font-semibold mb-2">Chọn ảnh từ máy tính</p>
                <p className="text-gray-400">Nhấp để chọn hoặc kéo thả ảnh vào đây</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin">⏳</div>
                  <p className="text-lg font-semibold mt-2">Đang nhận diện ảnh...</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Result Section */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">📊 Kết Quả</h2>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Recognized Gesture */}
                <div className="bg-gray-900 p-4 rounded-lg border border-green-600">
                  <p className="text-gray-400 text-sm mb-1">Ký Hiệu Nhận Diện</p>
                  <p className="text-5xl font-bold text-green-400">{result.gesture}</p>
                </div>

                {/* Confidence Score */}
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Độ Chính Xác</p>
                  <div className="mb-2">
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{
                          width: `${(result.confidence || 0) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xl font-semibold">
                    {((result.confidence || 0) * 100).toFixed(2)}%
                  </p>
                </div>

                {/* Top Predictions */}
                {result.predictions && result.predictions.length > 0 && (
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-3">Top Dự Đoán</p>
                    <div className="space-y-2">
                      {result.predictions.slice(0, 5).map((pred, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="font-semibold">{pred.gesture}</span>
                          <span className="text-gray-400">
                            {(pred.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gesture Info */}
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Thông Tin Ký Hiệu</p>
                  <p className="text-lg">
                    Ký hiệu: <span className="font-bold text-blue-400">{result.gesture}</span>
                  </p>
                  {result.description && (
                    <p className="text-gray-300 mt-2">{result.description}</p>
                  )}
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">Chụp ảnh hoặc tải ảnh lên để bắt đầu nhận diện</p>
              </div>
            )}
          </div>

          {/* Supported Gestures */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">📑 Ký Hiệu Được Hỗ Trợ</h3>
            <div className="grid grid-cols-4 gap-2">
              {/* Numbers 0-9 */}
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-900 p-3 rounded text-center font-semibold hover:bg-blue-900 cursor-pointer transition"
                >
                  {i}
                </div>
              ))}
              {/* Letters A-Z */}
              {[...Array(26)].map((_, i) => (
                <div
                  key={i + 10}
                  className="bg-gray-900 p-3 rounded text-center font-semibold hover:bg-blue-900 cursor-pointer transition"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {/* Special */}
              <div className="bg-gray-900 p-3 rounded text-center font-semibold hover:bg-blue-900 cursor-pointer transition">
                _
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-3xl font-bold text-blue-400">37</p>
          <p className="text-gray-400 mt-2">Ký Hiệu Được Hỗ Trợ</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-3xl font-bold text-green-400">90%+</p>
          <p className="text-gray-400 mt-2">Độ Chính Xác</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-3xl font-bold text-purple-400">Real-time</p>
          <p className="text-gray-400 mt-2">Nhận Diện Tức Thì</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-3xl font-bold text-orange-400">GPU</p>
          <p className="text-gray-400 mt-2">Tối Ưu Hóa</p>
        </div>
      </div>
    </div>
  )
}

export default GestureRecognition
