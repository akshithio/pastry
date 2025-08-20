# Pastry

Pastry is a modern, multi-model AI chat application that lets you have conversations with various AI models in one unified interface. Built with the [T3 Stack](https://create.t3.gg/), Pastry provides a seamless experience for interacting with different AI capabilities.

## ✨ Features

### 🤖 **Multiple AI Models**
- **Gemini 2.0 Flash** - Google's experimental multimodal model with vision capabilities
- **Pixtral 12B** - Mistral's multimodal model with vision and document processing
- **Llama 3.1 8B** - Meta's efficient instruction-following model
- **DeepSeek R1** - Open-source model with reasoning capabilities

### 🎯 **Smart Capabilities**
- **Vision** - Upload and analyze images with supported models
- **Document Processing** - Chat with PDFs and extract information
- **Web Search** - Get real-time information (model-dependent)
- **Reasoning** - See step-by-step thinking process with DeepSeek R1
- **Tool Usage** - Enhanced functionality with tool-capable models

### 💬 **Advanced Chat Features**
- **Real-time Streaming** - Watch responses generate in real-time
- **Conversation Management** - Organize, search, and export chat history
- **File Attachments** - Support for images, PDFs, and documents
- **Auto-resume** - Continue interrupted conversations seamlessly
- **Model Switching** - Change AI models mid-conversation

### 🎨 **User Experience**
- **Personalized Landing** - Curated prompts based on categories (Create, Explore, Code, Learn)
- **Dark/Light Mode** - Adaptive theming for any environment
- **Responsive Design** - Works perfectly on desktop and mobile
- **Authentication** - Secure user accounts with NextAuth

## 🛠️ Technology Stack

This project is built with modern web technologies:

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[NextAuth.js](https://next-auth.js.org)** - Authentication solution
- **[Prisma](https://prisma.io)** - Database ORM with PostgreSQL
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[AI SDK](https://sdk.vercel.ai)** - Integration with multiple AI providers
- **[TypeScript](https://typescriptlang.org)** - Type-safe development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- API keys for AI providers (optional for free tiers)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akshithio/pastry.git
   cd pastry
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your database URL and any API keys you want to use.

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start chatting with AI!

### Usage

1. **Sign in** with your preferred authentication provider
2. **Choose a model** from the model selector based on your needs
3. **Start chatting** - try the suggested prompts or ask anything
4. **Upload files** by dragging and dropping or clicking the attachment button
5. **Switch models** anytime to leverage different capabilities
6. **Export conversations** from the settings panel

## 📖 Learn More

To learn more about the technologies powering Pastry:

- **[T3 Stack Documentation](https://create.t3.gg/)** - Learn about the full stack
- **[AI SDK Documentation](https://sdk.vercel.ai/)** - Understand AI integrations
- **[Next.js Documentation](https://nextjs.org/docs)** - Deep dive into React framework
- **[Prisma Documentation](https://prisma.io/docs)** - Database and ORM guides

## 🚀 Deployment

Pastry can be deployed on various platforms:

### Vercel (Recommended)
The easiest way to deploy Pastry is using [Vercel](https://vercel.com/):

1. Connect your GitHub repository to Vercel
2. Set up environment variables in the Vercel dashboard
3. Deploy with automatic CI/CD

### Other Platforms
- **[Netlify](https://create.t3.gg/en/deployment/netlify)** - Alternative serverless deployment
- **[Docker](https://create.t3.gg/en/deployment/docker)** - Containerized deployment
- **Railway, DigitalOcean, AWS** - Traditional hosting options

## 🤝 Contributing

We welcome contributions to Pastry! Please feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
