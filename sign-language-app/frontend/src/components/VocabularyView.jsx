import React, { useState, useEffect } from 'react'
import { learnService } from '../services/api'
import './VocabularyView.css'

const VocabularyView = ({ lessonId, vocabularies: initialVocabs }) => {
  const [vocabularies, setVocabularies] = useState(initialVocabs || [])
  const [loading, setLoading] = useState(!initialVocabs)
  const [selectedVocab, setSelectedVocab] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!initialVocabs) {
      fetchVocabularies()
    }
  }, [lessonId, initialVocabs])

  const fetchVocabularies = async () => {
    try {
      setLoading(true)
      const response = await learnService.getVocabularies(lessonId)
      setVocabularies(response.data)
      if (response.data.length > 0) {
        setSelectedVocab(response.data[0])
      }
    } catch (err) {
      console.error('Error fetching vocabularies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelectedVocab(vocabularies[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedVocab(vocabularies[currentIndex + 1])
    }
  }

  if (loading) {
    return <div className="vocabulary-view loading">Loading vocabulary...</div>
  }

  if (vocabularies.length === 0) {
    return <div className="vocabulary-view empty">No vocabulary available</div>
  }

  return (
    <div className="vocabulary-view">
      <div className="vocab-grid">
        <div className="vocab-list">
          <h3>Vocabulary List</h3>
          <div className="vocab-items">
            {vocabularies.map((vocab, index) => (
              <div
                key={vocab.id}
                className={`vocab-item ${selectedVocab?.id === vocab.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedVocab(vocab)
                  setCurrentIndex(index)
                }}
              >
                <span className="vocab-number">{index + 1}</span>
                <span className="vocab-word">{vocab.word}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedVocab && (
          <div className="vocab-detail">
            <div className="vocab-progress">
              {currentIndex + 1} / {vocabularies.length}
            </div>

            <h2>{selectedVocab.word}</h2>

            {selectedVocab.pronunciation && (
              <p className="pronunciation">
                /{ selectedVocab.pronunciation}/
              </p>
            )}

            {selectedVocab.image_url && (
              <img src={selectedVocab.image_url} alt={selectedVocab.word} className="vocab-image" />
            )}

            {selectedVocab.video_url && (
              <div className="vocab-video">
                <video controls width="100%">
                  <source src={selectedVocab.video_url} type="video/mp4" />
                </video>
              </div>
            )}

            {selectedVocab.description && (
              <div className="vocab-description">
                <h4>Definition:</h4>
                <p>{selectedVocab.description}</p>
              </div>
            )}

            {selectedVocab.example_sentence && (
              <div className="vocab-example">
                <h4>Example:</h4>
                <p>"{selectedVocab.example_sentence}"</p>
              </div>
            )}

            <div className="vocab-navigation">
              <button 
                onClick={handlePrevious} 
                disabled={currentIndex === 0}
                className="nav-btn"
              >
                ← Previous
              </button>
              <button 
                onClick={handleNext} 
                disabled={currentIndex === vocabularies.length - 1}
                className="nav-btn"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VocabularyView
