# Lens Social DApp 🚀

A modern, decentralized social media application built on Lens Protocol with a beautiful UI and seamless user experience.

## ✨ Features

- **🔐 Web3 Authentication** - Connect with MetaMask and other Web3 wallets
- **👤 Profile Management** - Create and manage your Lens Protocol profile
- **📝 Content Creation** - Share posts with text and media content
- **🔄 Social Interactions** - Like, comment, and repost content
- **👥 Social Network** - Follow other users and discover content
- **📱 Responsive Design** - Beautiful UI that works on all devices
- **🎨 Modern UI/UX** - Glass morphism design with smooth animations

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS animations
- **State Management**: Zustand
- **Web3**: Lens Protocol + Ethers.js + MetaMask
- **UI Components**: Radix UI + Lucide React icons
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MetaMask or other Web3 wallet
- Polygon network configured in your wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lens-social-dapp.git
   cd lens-social-dapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_LENS_ENVIRONMENT=development
VITE_POLYGON_RPC_URL=https://polygon-rpc.com/
VITE_LENS_API_URL=https://api.lens.dev
```

### Network Configuration

The app is configured to work with Polygon network by default. Make sure your wallet is connected to Polygon Mainnet.

## 📱 Usage

### 1. Connect Wallet
- Click "Connect Wallet" button
- Approve MetaMask connection
- Switch to Polygon network if prompted

### 2. Create Profile
- Enter your desired handle (e.g., "alice")
- Add display name and bio
- Upload profile picture (optional)
- Click "Create Profile"

### 3. Start Sharing
- Click "Create Post" button
- Write your content (max 5000 characters)
- Add media if desired
- Click "Post" to publish

### 4. Interact with Content
- Like posts by clicking the heart icon
- Follow users by clicking "Follow" button
- Refresh feed to see latest content

## 🎨 UI Components

The app includes a comprehensive set of reusable UI components:

- **Button** - Multiple variants and sizes
- **Card** - Glass morphism design with variants
- **Modal** - Responsive modal with backdrop
- **Avatar** - Profile pictures with fallbacks
- **LoadingSpinner** - Animated loading indicators
- **NotificationToast** - Toast notifications

## 🔒 Security Features

- **Wallet Signature** - Secure authentication via wallet signatures
- **Input Validation** - Client-side validation for all user inputs
- **Error Handling** - Comprehensive error handling and user feedback
- **Safe Transactions** - Secure blockchain interactions

## 📱 Responsive Design

The app is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages
```bash
npm run build
# Deploy dist/ folder to GitHub Pages
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Lens Protocol](https://lens.xyz/) - Decentralized social graph
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [Lucide React](https://lucide.dev/) - Beautiful icons

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Join our Discord community
- Check the documentation

## 🔮 Roadmap

- [ ] Comment system
- [ ] Direct messaging
- [ ] NFT integration
- [ ] Mobile app
- [ ] Advanced search
- [ ] Analytics dashboard
- [ ] Multi-language support

---

Made with ❤️ by the Lens Social DApp team
