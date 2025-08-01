# Poker Xray Vision - PWA

A Progressive Web App for poker pre-flop range visualization and analysis.

## 🌐 Live Demo

[Deploy your own version](#deployment) or visit the hosted version once deployed.

## ✨ Features

- **📱 Progressive Web App** - Installable on desktop and mobile
- **🔄 Offline Support** - Works without internet after first visit
- **⚡ Fast Loading** - Cached resources for instant access
- **🎯 Pre-Flop Analysis** - Visual range charts for all positions
- **🎮 Interactive** - Click to navigate between different scenarios
- **📊 Multiple Formats** - Cash games, ICM, various stack sizes
- **🎨 Responsive Design** - Works on all screen sizes

## 🚀 Quick Start

### For Users:
1. **Visit the URL** (once deployed)
2. **Install** - Click "Add to Home Screen" in your browser
3. **Use offline** - Works without internet after first visit

### For Developers:
1. **Clone the repository**
2. **Run locally:**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8080
   ```
3. **Visit:** `http://localhost:8000`

## 📱 PWA Features

- ✅ **Installable** - Add to desktop/mobile home screen
- ✅ **Offline Support** - All charts cached for offline use
- ✅ **Fast Loading** - Service worker caches resources
- ✅ **Cross-Platform** - Windows, Mac, Linux, iOS, Android
- ✅ **No Installation Required** - Just visit the URL

## 🎯 Poker Features

- **RFI (Raise First In)** - Opening ranges for all positions
- **3bet vs RFI** - 3-betting ranges against different positions
- **4bet vs 3bet** - 4-betting ranges and squeezes
- **Call/Allin Actions** - Special action buttons for specific scenarios
- **Multiple Stack Sizes** - 20bb, 100bb, 200bb average stacks
- **Cash & ICM** - Different formats for different game types

## 🛠️ Technical Stack

- **Frontend:** Vanilla JavaScript (ES6 modules)
- **Styling:** CSS3 with responsive design
- **PWA:** Service Worker + Web App Manifest
- **Hosting:** GitHub Pages / Netlify / Vercel

## 📁 Project Structure

```
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── src/
│   ├── main.js            # App entry point
│   ├── logic/             # Business logic
│   │   ├── state.js       # App state management
│   │   ├── navigation.js  # Hash-based routing
│   │   ├── actions.js     # Event handlers
│   │   └── imageLogic.js  # Image/label logic
│   ├── ui/                # UI components
│   │   ├── grid.js        # Poker grid rendering
│   │   ├── loader.js      # Progressive image loading
│   │   ├── options.js     # Format/stack options
│   │   └── render.js      # Main render function
│   └── styles/
│       └── main.css       # All styling
├── Charts/                # Poker chart images
└── *.png                  # UI assets
```

## 🚀 Deployment

### Option 1: GitHub Pages (Recommended)
1. **Run:** `deploy-to-github.bat`
2. **Follow the prompts**
3. **Enable GitHub Pages** in repository settings

### Option 2: Netlify
1. **Drag and drop** your folder to https://netlify.com
2. **Get instant URL**

### Option 3: Vercel
1. **Import repository** to https://vercel.com
2. **Auto-deploy**

## 🔧 Development

### Prerequisites
- Modern web browser
- Python 3+ or Node.js (for local development)

### Local Development
```bash
# Clone repository
git clone https://github.com/your-username/poker-xray-vision.git
cd poker-xray-vision

# Start local server
python -m http.server 8000
# or
npx http-server -p 8080

# Open browser
# http://localhost:8000
```

### Building for Production
The PWA is ready for production out of the box. Just deploy the files as-is.

## 📋 Browser Support

- ✅ Chrome 67+
- ✅ Firefox 67+
- ✅ Safari 11.1+
- ✅ Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Issues:** Create a GitHub issue
- **Questions:** Check the [Deployment Guide](DEPLOYMENT_GUIDE.md)
- **PWA Issues:** Check browser console for errors

## 🎉 Acknowledgments

- Poker range data and charts
- PWA standards and best practices
- Modern web development tools 