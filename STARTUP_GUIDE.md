# 🚀 NextGen Organization Visualizer - Startup Guide

## Quick Start

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm
- Git

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

# Run the application
python run.py
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000/ws

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env` file in the backend directory:

```env
# Security
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///org_visualizer.db

# LDAP Configuration (if using LDAP sync)
LDAP_SERVER=ldap://your-ldap-server:389
LDAP_USER=cn=admin,dc=example,dc=com
LDAP_PASSWORD=your-ldap-password
LDAP_BASE_DN=dc=example,dc=com

# Server Configuration
PORT=5000
FLASK_ENV=development
```

## 📊 Sample Data

The application includes sample data generators:

1. **Load Sample Organization Data**:
   - Go to "Data Hub" tab
   - Click "Load Sample" in Organization section

2. **Load Sample Work Plan Data**:
   - Go to "Data Hub" tab
   - Click "Load Sample" in Work Plan section

## 🎯 Key Features

### 1. Organization Visualization
- Interactive hierarchy charts
- Multiple visualization types (Sunburst, Tree, Network)
- Advanced filtering and search
- Real-time collaboration

### 2. AI-Powered Analytics
- Predictive insights
- Risk assessment
- Skill gap analysis
- Performance recommendations

### 3. Work Plan Management
- Gantt chart visualization
- Resource conflict detection
- Timeline optimization
- Capacity planning

### 4. Advanced Features
- Real-time collaboration with live cursors
- Multi-format export (PDF, Excel, PNG, SVG)
- Performance monitoring
- Command palette (Ctrl+K)
- Keyboard shortcuts (Ctrl+?)
- Multiple themes

## 🔍 Troubleshooting

### Common Issues

#### Backend Issues

**Import Error: cannot import name 'request'**
```bash
# Make sure you're using the correct Flask-SocketIO version
pip install flask-socketio==5.3.6
```

**Database Connection Error**
```bash
# Delete existing database and recreate
rm org_visualizer.db
python run.py
```

**LDAP Connection Error**
```bash
# Check LDAP server connectivity
# Verify credentials in environment variables
# LDAP is optional - the app works without it
```

#### Frontend Issues

**Module Not Found Error**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

**WebSocket Connection Failed**
- Ensure backend is running on port 5000
- Check firewall settings
- Verify CORS configuration

### Performance Issues

**Slow Loading**
- Check browser console for errors
- Monitor network tab for failed requests
- Use Performance Dashboard (Ctrl+P) to identify bottlenecks

**High Memory Usage**
- Use Performance Monitor to track memory leaks
- Clear browser cache
- Restart the application

## 🧪 Testing

### Run Comprehensive Tests

```javascript
// In browser console
import testUtils from './src/utils/testUtils.js'
testUtils.runComprehensiveTests()
```

### Manual Testing Checklist

- [ ] Load sample data successfully
- [ ] Upload CSV/Excel files
- [ ] Navigate between tabs
- [ ] Use filters and search
- [ ] Export data in different formats
- [ ] Test real-time collaboration
- [ ] Verify keyboard shortcuts
- [ ] Check responsive design on mobile

## 📈 Performance Optimization

### Backend Optimization
- Use database indexing for large datasets
- Enable caching for frequently accessed data
- Configure proper logging levels
- Use production WSGI server (gunicorn)

### Frontend Optimization
- Enable production build for deployment
- Use code splitting for large components
- Optimize images and assets
- Enable service worker for caching

## 🚀 Deployment

### Development Deployment
```bash
# Backend
cd backend
python run.py

# Frontend
cd frontend
npm start
```

### Production Deployment
```bash
# Backend
cd backend
pip install gunicorn
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app:app

# Frontend
cd frontend
npm run build
# Serve build folder with nginx or similar
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🔐 Security Considerations

### Development
- Use HTTPS in production
- Set strong SECRET_KEY
- Configure CORS properly
- Validate all user inputs
- Use environment variables for secrets

### Production
- Use production database (PostgreSQL)
- Enable SSL/TLS
- Configure firewall rules
- Regular security updates
- Monitor for vulnerabilities

## 📞 Support

### Getting Help
1. Check this startup guide
2. Review console errors
3. Check application logs
4. Use built-in help system (Ctrl+H)
5. Review component documentation

### Feature Requests
- Use the command palette (Ctrl+K) to explore features
- Check the feature showcase for demonstrations
- Review the analytics dashboard for insights

## 🎉 Success!

If you see the NextGen Organization Visualizer interface with sample data loaded, you're all set! 

**Next Steps**:
1. Upload your own organization data
2. Explore the AI analytics features
3. Try the collaboration tools
4. Customize themes and settings
5. Export your visualizations

---

**Happy Visualizing!** 🎯
