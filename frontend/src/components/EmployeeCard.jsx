import React from 'react'
import { X } from 'lucide-react'

const EmployeeCard = ({ employee, onClose }) => {
  return (
    <div className="employee-card-overlay">
      <div className="employee-card">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="employee-avatar">👤</div>
        <h2 className="employee-name">{employee['Staff Name']}</h2>

        <div className="employee-details">
          <section>
            <h4>📋 Basic Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Staff ID:</strong> {employee['Staff Id'] || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Rank:</strong> {employee['Rank'] || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Job Function:</strong> {employee['Job Function'] || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Work Location:</strong> {employee['Work Location'] || 'N/A'}
              </div>
            </div>
          </section>

          <section>
            <h4>🏢 Organization Details</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Company:</strong> {employee['Company Short Name'] || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Sub-platform:</strong> {employee['Sub-platform'] || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Primary Squad:</strong> {employee['Squad 1 (where applicable)'] || 'N/A'}
              </div>
            </div>
          </section>

          <section>
            <h4>🛠️ Skills & Expertise</h4>
            <div className="detail-item">
              <strong>Technical Skills:</strong> {employee['Tech Skills (SQL, Java, React etc)'] || 'N/A'}
            </div>
            <div className="detail-item">
              <strong>Domain Knowledge:</strong> {employee['Domain Knowledge (Equity, FX, Reg, Advisory etc)'] || 'N/A'}
            </div>
          </section>
        </div>
      </div>
      <style jsx="true">{`
        .employee-card-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-xl);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .employee-card {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          position: relative;
          padding: var(--space-xl);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { 
            transform: translateY(20px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }

        .close-btn {
          position: absolute;
          top: var(--space-lg);
          right: var(--space-lg);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
          transform: rotate(90deg);
        }

        .employee-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto var(--space-lg);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
          position: relative;
          overflow: hidden;
        }

        .employee-avatar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .employee-name {
          text-align: center;
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--space-xl);
          color: var(--theme-text);
          background: var(--theme-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .employee-details {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .employee-details section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          transition: all var(--transition-normal);
        }

        .employee-details section:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .employee-details h4 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-md);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-md);
        }

        .detail-item {
          padding: var(--space-sm) 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all var(--transition-normal);
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item:hover {
          padding-left: var(--space-sm);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-sm);
        }

        .detail-item strong {
          color: var(--theme-text);
          font-weight: 600;
          display: inline-block;
          min-width: 120px;
          margin-bottom: var(--space-xs);
        }

        .detail-item {
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .employee-card-overlay {
            padding: var(--space-lg);
          }

          .employee-card {
            padding: var(--space-lg);
            max-height: 95vh;
          }

          .employee-avatar {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
          }

          .employee-name {
            font-size: 1.25rem;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .detail-item strong {
            display: block;
            min-width: auto;
          }

          .close-btn {
            top: var(--space-md);
            right: var(--space-md);
          }
        }

        /* Scrollbar styling */
        .employee-card::-webkit-scrollbar {
          width: 6px;
        }

        .employee-card::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
        }

        .employee-card::-webkit-scrollbar-thumb {
          background: var(--theme-primary);
          border-radius: var(--radius-sm);
        }

        .employee-card::-webkit-scrollbar-thumb:hover {
          background: var(--theme-accent);
        }
      `}</style>
    </div>
  )
}

export default EmployeeCard