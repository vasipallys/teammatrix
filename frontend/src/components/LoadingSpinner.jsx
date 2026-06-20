import React from 'react'

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  text = '', 
  fullScreen = false,
  className = '' 
}) => {
  if (fullScreen) {
    const overlayStyles = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }

    const contentStyles = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem'
    }

    const spinnerContainerStyles = {
      position: 'relative',
      width: '80px',
      height: '80px'
    }

    const ring1Styles = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      border: '2px solid transparent',
      borderTopColor: 'var(--theme-primary)',
      borderRadius: '50%',
      animation: 'spin 1.5s linear infinite'
    }

    const ring2Styles = {
      position: 'absolute',
      width: '70%',
      height: '70%',
      top: '15%',
      left: '15%',
      border: '2px solid transparent',
      borderRightColor: 'var(--theme-accent)',
      borderRadius: '50%',
      animation: 'spin 2s linear infinite reverse'
    }

    const ring3Styles = {
      position: 'absolute',
      width: '40%',
      height: '40%',
      top: '30%',
      left: '30%',
      border: '2px solid transparent',
      borderBottomColor: 'var(--theme-secondary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }

    const pulseStyles = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '20px',
      height: '20px',
      background: 'var(--theme-primary)',
      borderRadius: '50%',
      animation: 'pulse 2s ease-in-out infinite'
    }

    const textStyles = {
      color: 'var(--theme-text)',
      fontSize: '1.1rem',
      fontWeight: '500',
      textAlign: 'center',
      margin: 0,
      animation: 'fadeInOut 2s ease-in-out infinite'
    }

    return (
      <div style={overlayStyles}>
        <div style={contentStyles}>
          <div style={spinnerContainerStyles}>
            <div style={ring1Styles}></div>
            <div style={ring2Styles}></div>
            <div style={ring3Styles}></div>
            <div style={pulseStyles}></div>
          </div>
          {text && <p style={textStyles}>{text}</p>}
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { 
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            50% { 
              transform: translate(-50%, -50%) scale(1.5);
              opacity: 0.5;
            }
          }

          @keyframes fadeInOut {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  const spinnerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  }

  const getSize = () => {
    switch (size) {
      case 'sm': return '16px'
      case 'md': return '24px'
      case 'lg': return '32px'
      case 'xl': return '40px'
      default: return '24px'
    }
  }

  const modernSpinnerStyles = {
    position: 'relative',
    width: getSize(),
    height: getSize()
  }

  const ringSpinnerStyles = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: '2px solid transparent',
    borderTopColor: `var(--theme-${variant})`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }

  const dotSpinnerStyles = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '25%',
    height: '25%',
    background: `var(--theme-${variant})`,
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite'
  }

  const textSpinnerStyles = {
    color: 'var(--theme-textSecondary)',
    fontSize: '0.875rem',
    fontWeight: '500'
  }

  return (
    <div className={`loading-spinner ${className}`} style={spinnerStyles}>
      <div style={modernSpinnerStyles}>
        <div style={ringSpinnerStyles}></div>
        <div style={dotSpinnerStyles}></div>
      </div>
      {text && <span style={textSpinnerStyles}>{text}</span>}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  )
}

// Skeleton loading component for content
export const SkeletonLoader = ({ 
  lines = 3, 
  height = '1rem', 
  className = '',
  animated = true 
}) => {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  }

  const lineStyles = {
    background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
    borderRadius: 'var(--radius-sm)',
    position: 'relative',
    overflow: 'hidden',
    ...(animated && {
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    })
  }

  return (
    <div className={`skeleton-container ${className}`} style={containerStyles}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          style={{ 
            ...lineStyles,
            height,
            width: index === lines - 1 ? '70%' : '100%'
          }}
        />
      ))}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

// Card skeleton for loading states
export const CardSkeleton = ({ className = '' }) => {
  const cardStyles = {
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-backdrop)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    padding: '1.5rem'
  }

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem'
  }

  const avatarStyles = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  }

  const titleGroupStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  }

  const contentStyles = {
    marginTop: '1rem'
  }

  return (
    <div className={`card-skeleton ${className}`} style={cardStyles}>
      <div style={headerStyles}>
        <div style={avatarStyles}></div>
        <div style={titleGroupStyles}>
          <SkeletonLoader lines={1} height="1.25rem" />
          <SkeletonLoader lines={1} height="0.875rem" />
        </div>
      </div>
      <div style={contentStyles}>
        <SkeletonLoader lines={3} />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner