
#!/bin/bash

# 🚀 Visayatri Quick Deploy Script
# This script helps you deploy Visayatri to production quickly

set -e

echo "╔════════════════════════════════════════╗"
echo "║  🚀 VISAYATRI DEPLOYMENT WIZARD        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not installed${NC}"
    echo "  Install from: https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found ($(node -v))${NC}"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git not installed${NC}"
    echo "  Install from: https://git-scm.com"
    exit 1
fi
echo -e "${GREEN}✓ Git found ($(git --version))${NC}"

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}✗ Run this script from the project root directory${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project structure verified${NC}"
echo ""

# Step 2: Setup GitHub
echo -e "${BLUE}Step 2: Preparing for GitHub...${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Visayatri platform with premium UI"
else
    echo -e "${GREEN}✓ Git repository already initialized${NC}"
fi
echo ""

echo -e "${YELLOW}📌 NEXT STEPS FOR GITHUB:${NC}"
echo ""
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named 'visayatri'"
echo "3. Copy the commands below to add your remote:"
echo ""
echo -e "${BLUE}git remote add origin https://github.com/YOUR-USERNAME/visayatri.git${NC}"
echo -e "${BLUE}git branch -M main${NC}"
echo -e "${BLUE}git push -u origin main${NC}"
echo ""
read -p "Press Enter once you've completed the GitHub setup..."
echo ""

# Step 3: Collect Environment Variables
echo -e "${BLUE}Step 3: Collecting Environment Variables${NC}"
echo ""

echo "We need some information for deployment:"
echo ""

read -p "Enter your MongoDB Atlas connection string: " MONGODB_URI
read -p "Enter your Razorpay Key ID: " RAZORPAY_KEY_ID
read -p "Enter your Razorpay Key Secret: " RAZORPAY_KEY_SECRET
read -p "Enter your WhatsApp number (with country code, no +): " WHATSAPP_NUMBER
read -p "Enter your future frontend URL (e.g., https://visayatri.vercel.app): " FRONTEND_URL

# Step 4: Create .env files
echo ""
echo -e "${BLUE}Step 4: Setting up environment files...${NC}"
echo ""

cat > backend/.env << EOF
NODE_ENV=production
PORT=5002
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
WHATSAPP_NUMBER=$WHATSAPP_NUMBER
FRONTEND_URL=$FRONTEND_URL
EOF

echo -e "${GREEN}✓ Backend .env created${NC}"

cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://visayatri-api.onrender.com/api
NEXT_PUBLIC_WHATSAPP=$WHATSAPP_NUMBER
NEXT_PUBLIC_RAZORPAY_KEY=$RAZORPAY_KEY_ID
EOF

echo -e "${GREEN}✓ Frontend .env.local created${NC}"
echo ""

# Step 5: Test builds locally
echo -e "${BLUE}Step 5: Testing local builds...${NC}"
echo ""

echo "Building backend..."
cd backend
npm install > /dev/null 2>&1
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo "Building frontend..."
cd frontend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
cd ..
echo -e "${GREEN}✓ Frontend build successful${NC}"
echo ""

# Step 6: Deployment instructions
echo -e "${BLUE}Step 6: Deployment Instructions${NC}"
echo ""

echo -e "${YELLOW}📱 FRONTEND - VERCEL DEPLOYMENT:${NC}"
echo ""
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Set Root Directory to: frontend"
echo "4. Add Environment Variables:"
echo "   - NEXT_PUBLIC_API_URL = https://visayatri-api.onrender.com/api"
echo "   - NEXT_PUBLIC_WHATSAPP = $WHATSAPP_NUMBER"
echo "5. Click Deploy"
echo ""

echo -e "${YELLOW}🖥️  BACKEND - RENDER DEPLOYMENT:${NC}"
echo ""
echo "1. Go to https://render.com/new"
echo "2. Select 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Set Root Directory to: backend"
echo "5. Add Environment Variables:"
echo "   - MONGODB_URI = $MONGODB_URI"
echo "   - JWT_SECRET = (generate strong random string)"
echo "   - RAZORPAY_KEY_ID = $RAZORPAY_KEY_ID"
echo "   - RAZORPAY_KEY_SECRET = $RAZORPAY_KEY_SECRET"
echo "   - WHATSAPP_NUMBER = $WHATSAPP_NUMBER"
echo "   - FRONTEND_URL = $FRONTEND_URL"
echo "   - NODE_ENV = production"
echo "6. Click Deploy"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📖 For detailed deployment guide, see: DEPLOYMENT.md"
echo "📞 Need help? Check README.md or contact via WhatsApp: $WHATSAPP_NUMBER"
echo ""
