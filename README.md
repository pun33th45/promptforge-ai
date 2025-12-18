PromptForge-AI

PromptForge-AI is a modern web application that helps digital professionals craft better AI prompts and build smarter, ethical AI workflows. It provides structured guidance, reusable templates, and history tracking to ensure consistent, high-quality outputs from AI models.

🚀 Features

✨ Guided Prompt Generation — Create high-quality prompts using structured inputs.

📚 Reusable Templates — Standardize prompt creation across teams.

🕒 Prompt History — Review, reuse, and refine previously generated prompts.

⚖️ Ethical AI Practices — Encourage responsible and effective AI usage.

⚡ Fast & Lightweight — Built with Vite and TypeScript for performance.

🧩 Scalable Architecture — Easy to extend with new workflows or tools.

📸 Screenshots
<div align="center"> <p><strong>Landing Page and UI</strong></p> <img src="https://raw.githubusercontent.com/pun33th45/promptforge-ai/b25aac4d5d0eaf9b9e1104a7df4d927182c0aa6c/Screenshots/landing%20page.png" width="650" alt="Landing Page and UI" /> <hr width="70%" /> <p><strong>Prompt Generation</strong></p> <img src="https://raw.githubusercontent.com/pun33th45/promptforge-ai/b25aac4d5d0eaf9b9e1104a7df4d927182c0aa6c/Screenshots/Prompt%20generation.png" width="650" alt="Prompt Generation" /> <hr width="70%" /> <p><strong>History</strong></p> <img src="https://raw.githubusercontent.com/pun33th45/promptforge-ai/b25aac4d5d0eaf9b9e1104a7df4d927182c0aa6c/Screenshots/History.png" width="650" alt="Prompt History" /> </div>

🧱 Project Structure
📦 components
📦 services
├── App.tsx
├── index.tsx
├── constants.tsx
├── types.ts
├── vite.config.ts
📄 .env
📄 package.json
📄 tsconfig.json
📄 README.md


components/ – UI components

services/ – API and business logic

constants.tsx – Shared constants

types.ts – TypeScript types

🛠️ Tech Stack

Frontend: React + TypeScript

Build Tool: Vite

Styling: CSS / Utility-based styling

State & Logic: Modular service architecture

🧪 Getting Started

Follow these steps to run the project locally.

Prerequisites

Node.js ≥ 16

npm or yarn

🔧 Installation

Clone the repository

git clone https://github.com/pun33th45/promptforge-ai.git
cd promptforge-ai


Install dependencies

npm install
# or
yarn install


Configure environment variables

Create a .env file if required:

VITE_API_URL=your_api_url_here


Start the development server

npm run dev
# or
yarn dev


Visit:

http://localhost:3000

📦 Build for Production
npm run build
# or
yarn build


Preview the production build:

npm run preview

🤝 Contributing

Contributions are welcome and appreciated!

Fork the repository

Create a feature branch
git checkout -b feature/your-feature

Commit your changes
git commit -m "Add your feature"

Push to your branch
git push origin feature/your-feature

Open a Pull Request

🐛 Issues & Feedback

If you encounter bugs or have feature requests:

Open an issue on GitHub

Include steps to reproduce and expected behavior
