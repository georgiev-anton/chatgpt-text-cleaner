# ChatGPT Text Cleaner
Message feedback or bug:
- Issue in this github page
- Email: [extension.dev.lab@gmail.com](mailto:extension.dev.lab@gmail.com)
- X - [https://x.com/byghoster](https://x.com/byghoster)
- Threads - [https://www.threads.com/@script.guru](https://www.threads.com/@script.guru)
- Inst - [https://www.instagram.com/script.guru](https://www.instagram.com/script.guru)

A React application that removes hidden Unicode characters and watermarks from ChatGPT-generated text.

## Features

- Remove invisible Unicode characters (Zero-Width Space, Narrow No-Break Space, etc.)
- Replace special characters with standard equivalents (smart quotes, em dashes)
- Real-time text processing
- Copy and download cleaned text
- File upload support
- Visualization of invisible characters

## Demo

You can try the live demo at: [https://yourusername.github.io/chatgpt-text-cleaner/](https://yourusername.github.io/chatgpt-text-cleaner/)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chatgpt-text-cleaner.git
cd chatgpt-text-cleaner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Deployment to GitHub Pages

1. Update the `base` path in `vite.config.js` to match your repository name
2. Build and deploy:
```bash
npm run deploy
```

## Technologies Used

- React 19
- Vite
- Tailwind CSS
- Lucide React Icons
- shadcn/ui components

## About Hidden Characters

New ChatGPT models (o3, o4-mini) add invisible Unicode characters to generated text. These characters serve as hidden watermarks to identify AI-generated content but can cause issues when copying text, break formatting, and lead to unexpected behavior in text editors and web forms.

## License

MIT License

