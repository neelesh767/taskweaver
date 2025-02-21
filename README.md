# TaskWeaver README

## Overview

TaskWeaver is a powerful VS Code extension designed to assist developers in generating structured implementation plans from their codebase. By analyzing selected files and extracting relevant context, TaskWeaver provides step-by-step guidance for:

- Adding new features
- Fixing issues
- Modifying existing code

This tool enhances development efficiency by suggesting necessary changes, identifying dependencies, and generating a final checklist, ensuring a more organized and streamlined coding process.

## Setup Instructions

To set up TaskWeaver locally, follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/your-repo/taskweaver.git
   cd taskweaver
   ```

2. Create a `.env` file at the root level and add the following key:

   ```env
   OPEN_AI_API_KEY=your_openai_api_key
   ```

   Replace `your_openai_api_key` with your actual OpenAI API key.

3. Install dependencies:

   ```sh
   npm install
   ```

4. Run the extension:
   ```sh
   npm run watch
   ```

## Features

- **Structured Implementation Plans**: Generates clear, step-by-step guidance.
- **Dependency Insights**: Identifies necessary changes and dependencies.
- **Final Checklist**: Ensures all required modifications are accounted for.
