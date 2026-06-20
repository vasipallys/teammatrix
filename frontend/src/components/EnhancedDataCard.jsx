import React, { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, MoreHorizontal, Maximize2, Download, Share2 } from 'lucide-react'

const EnhancedDataCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'blue',
  trend = null,
  subtitle = '',
  data = [],
  className = '',
  onExpand = null,
  onExport = null
}) => {
  const [showActions, setShowActions] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const cardRef = useRef(null)
  const canvasRef = useRef(null)

  // Calculate trend if not provided
  const calculatedTrend = trend || (previousValue && !isNaN(value) && !isNaN(previousValue) ? 
    ((value - previousValue) / previousValue * 100).toFixed(1) : null)

  const getTrendIcon = () => {
    if (!calculatedTrend || isNaN(calculatedTrend)) return Minus
    return parseFloat(calculatedTrend) > 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = () => {
    if (!calculatedTrend || isNaN(calculatedTrend)) return 'text-gray-400'
    return parseFloat(calculatedTrend) > 0 ? 'text-green-400' : 'text-red-400'
  }

  // Mini chart drawing
  useEffect(() => {
    if (data.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const { width, height } = canvas
      
      ctx.clearRect(0, 0, width, height)
      
      if (data.length < 2) return
      
      const max = Math.max(...data)
      const min = Math.min(...data)
      const range = max - min || 1
      
      ctx.strokeStyle = getColorValue(color)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      ctx.beginPath()
      data.forEach((point, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((point - min) / range) * height
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
      
      // Add gradient fill
      ctx.globalAlpha = 0.2
      ctx.fillStyle = getColorValue(color)
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()
    }
  }, [data, color])

  const getColorValue = (colorName) => {
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f59e0b',
      red: '#ef4444',
      cyan: '#06b6d4'
    }
    return colors[colorName] || colors.blue
  }

  const handleCardClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const TrendIcon = getTrendIcon()

  return (
    <div 
      ref={cardRef}
      className={`enhanced-data-card ${color} ${isAnimating ? 'animating' : ''} ${className}`}
      onClick={handleCardClick}
    >
      <div className="card-background">
        <div className="gradient-overlay"></div>
        <div className="particle-container">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>
      </div>

      <div className="card-header">
        <div className="card-icon">
          <Icon size={24} />
        </div>
        
        <div className="card-actions">
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
          >
            <MoreHorizontal size={16} />
          </button>
          
          {showActions && (
            <div className="actions-dropdown">
              {onExpand && (
                <button 
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    onExpand()
                    setShowActions(false)
                  }}
                >
                  <Maximize2 size={14} />
                  Expand
                </button>
              )}
              {onExport && (
                <button 
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    onExport()
                    setShowActions(false)
                  }}
                >
                  <Download size={14} />
                  Export
                </button>
              )}
              <button 
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.share?.({ title, text: `${title}: ${value}` })
                  setShowActions(false)
                }}
              >
                <Share2 size={14} />
                Share
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card-content">
        <div className="main-value">
          <span className="value-number">{isNaN(value) ? '0' : value}</span>
          {calculatedTrend && !isNaN(calculatedTrend) && (
            <div className={`trend-indicator ${getTrendColor()}`}>
              <TrendIcon size={16} />
              <span>{Math.abs(parseFloat(calculatedTrend))}%</span>
            </div>
          )}
        </div>
        
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
        
        {data.length > 0 && (
          <div className="mini-chart">
            <canvas 
              ref={canvasRef}
              width={120}
              height={40}
            />
          </div>
        )}
      </div>

      <div className="card-footer">
        {previousValue && (
          <div className="previous-value">
            Previous: {previousValue}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .enhanced-data-card {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: 1.5rem;
          cursor: pointer;
          transition: all var(--transition-normal);
          overflow: hidden;
          min-height: 180px;
          display: flex;
          flex-direction: column;
        }

        .enhanced-data-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, ${getColorValue(color)}, ${getColorValue(color)}80);
          opacity: 0.8;
        }

        .enhanced-data-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .enhanced-data-card.animating {
          transform: scale(0.98);
          transition: all var(--transition-fast);
        }

        .card-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }

        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 70% 30%, ${getColorValue(color)}20 0%, transparent 50%);
          opacity: 0.6;
        }

        .particle-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: ${getColorValue(color)};
          border-radius: 50%;
          opacity: 0.4;
        }

        .particle-1 {
          top: 20%;
          left: 80%;
          animation: particleFloat1 4s ease-in-out infinite;
        }

        .particle-2 {
          top: 60%;
          left: 20%;
          animation: particleFloat2 6s ease-in-out infinite;
        }

        .particle-3 {
          top: 80%;
          left: 70%;
          animation: particleFloat3 5s ease-in-out infinite;
        }

        .particle-4 {
          top: 30%;
          left: 40%;
          animation: particleFloat1 7s ease-in-out infinite reverse;
        }

        .particle-5 {
          top: 70%;
          left: 90%;
          animation: particleFloat2 8s ease-in-out infinite reverse;
        }

        @keyframes particleFloat1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(5px); }
        }

        @keyframes particleFloat2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(8px) translateX(-3px); }
        }

        @keyframes particleFloat3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-6px) translateX(-8px); }
        }

        .card-header {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, ${getColorValue(color)}, ${getColorValue(color)}80);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px ${getColorValue(color)}40;
        }

        .card-actions {
          position: relative;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: var(--radius-md);
          padding: 0.5rem;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--theme-text);
        }

        .actions-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 0.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 10;
          min-width: 120px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--theme-text);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.875rem;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .card-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .main-value {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .value-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--theme-text);
          font-family: var(--font-display);
          line-height: 1;
        }

        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.1);
        }

        .text-green-400 {
          color: #4ade80;
        }

        .text-red-400 {
          color: #f87171;
        }

        .text-gray-400 {
          color: #9ca3af;
        }

        .card-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--theme-text);
          margin-bottom: 0.25rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: var(--theme-textSecondary);
          opacity: 0.8;
        }

        .mini-chart {
          margin-top: auto;
          padding-top: 1rem;
        }

        .mini-chart canvas {
          width: 100%;
          height: 40px;
          opacity: 0.8;
        }

        .card-footer {
          position: relative;
          z-index: 1;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .previous-value {
          font-size: 0.8rem;
          color: var(--theme-textSecondary);
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .enhanced-data-card {
            min-height: 160px;
            padding: 1.25rem;
          }

          .value-number {
            font-size: 2rem;
          }

          .card-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  )
}

export default EnhancedDataCard