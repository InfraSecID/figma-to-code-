# FigmaToCode AI
<img width="1709" height="568" alt="Screenshot from 2026-10-24 23-12-36" src="https://github.com/user-attachments/assets/0b5be4f4-c020-4529-a511-459f213f84ad" />

FigmaToCode AI is a Next.js application that converts a UI design image into clean, responsive React component code using Tailwind CSS and Gemini AI. Upload a mockup, screenshot, or wireframe, and the app sends it to the Gemini API to generate frontend code that matches the design structure and layout.

This project is built for rapid frontend prototyping, UI-to-code workflows, and design handoff automation.

## Features

- Upload UI screenshots or design images in PNG, JPG, or WEBP format
- Drag-and-drop support with file validation
- Image preview before generation
- AI-powered conversion into React + Tailwind CSS code
- Copy generated code to the clipboard
- Built with Next.js App Router and TypeScript
- Responsive UI for local development and testing

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Google GenAI SDK
- Lucide React icons

## Project Structure

```bash
.
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts       # Gemini API endpoint for code generation
│   ├── globals.css            # Global styling
│   ├── layout.tsx             # App layout
│   └── page.tsx               # Main UI for uploading images and generating code
├── public/                    # Static assets
├── .env.local                 # Local environment configuration (not committed)
├── package.json               # Project scripts and dependencies
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint config
├── README.md                  # Project documentation
└── ...
```

## Prerequisites

Before running this project, make sure you have:

- Node.js 20+ (recommended: LTS)
- npm, pnpm, yarn, or bun
- A valid Google Gemini API key

## Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd figma-to-code
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

```bash
cp .env.example .env.local
```

If there is no `.env.example`, create `.env.local` manually and add:

```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```

## Running the App

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## How It Works

1. Upload a UI design image using the upload area or drag-and-drop
2. The app validates the file type and size
3. The image is converted into a base64 string
4. A POST request is sent to `/api/generate`
5. Gemini analyzes the image and returns frontend code
6. The generated code is displayed in the UI for review and copy

## API Endpoint

The server exposes a generation endpoint at:

```http
POST /api/generate
```

Request body:

```json
{
  "imageBase64": "data:image/png;base64,...",
  "mimeType": "image/png"
}
```

Response example:

```json
{
  "code": "export default function Example() { return <div className=\"...\">...</div>; }"
}
```

If the request fails, the API returns an error response:

```json
{
  "error": "Detailed error message"
}
```

## Scripts

```bash
npm run dev     # start the development server
npm run build   # create a production build
npm run start   # run the production server
npm run lint    # run ESLint checks
```

## Generating Code

The generator prompt instructs the model to behave like an expert frontend developer and return only code without markdown wrappers. The generated result is designed for React components using Tailwind CSS and semantic HTML.

## Notes

- Uploaded files are limited to PNG, JPG, and WEBP formats
- Maximum file size is 5MB
- Generated code should still be reviewed and adjusted for production use
- The quality of the output depends on image clarity, layout complexity, and the prompt instructions used by the model

## Deployment

This project is ready to be deployed on platforms such as Vercel.

When deploying, make sure to configure the environment variable:

```bash
GEMINI_API_KEY
```

## License

This project is currently unlicensed unless you add an explicit license file or update this section for your organization.

## Contributing

Contributions are welcome. If you want to improve the app, feel free to:

- open an issue
- submit a feature request
- create a pull request with improvements

## Support

If you run into problems:

- check the environment variable configuration
- verify the image format and size
- confirm that your Gemini API key is valid and has sufficient access
- review the terminal logs for API errors
