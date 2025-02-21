import OpenAI from "openai";
import * as path from "path";
import * as dotenv from "dotenv";

export class OpenAiHelper {
  _openai?: OpenAI;
  _apiKey?: string =
    dotenv.config({ path: path.resolve(__dirname, ".env") })?.parsed
      ?.OPEN_AI_API_KEY || "";

  constructor() {
    this._openai = new OpenAI({
      apiKey: this._apiKey,
    });
  }

  public async helloWorld() {
    const completion = this._openai?.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [{ role: "user", content: "write a haiku about ai" }],
    });

    const result = await completion;

    console.log(result?.choices[0].message);
  }

  /**
   * Generates keywords and identifies potentially missing relevant files based on a given task and project structure.
   *
   * @param {Object} params - The parameters for generating keywords.
   * @param {string} params.task - The task description for which keywords need to be generated.
   * @param {string[]} params.selectedFileNames - The list of file names selected by the user as relevant.
   * @param {string[]} params.allFiles - The complete list of files in the project directory.
   * @returns {Promise<any>} - A promise that resolves to the response from OpenAI, containing suggested keywords and missing files.
   *
   * This function uses the OpenAI API to analyze the provided task, selected files, and project structure.
   * It generates important keywords and identifying missing files that may be relevant for the task.
   */

  public async generateKeyWords({
    task,
    selectedFileNames,
    allFiles,
  }: {
    task: string;
    selectedFileNames: string[];
    allFiles: string[];
  }) {
    const prompt = `You are an advanced AI coding assistant designed to analyze software projects and generate structured implementation plans. 

## Task:
The user wants to achieve the following goal in their project:
- "${task}"

## Provided Files:
The user has selected the following files as relevant for this task:
${selectedFileNames.map((file) => `- ${file}`).join("\n")}

## Project Structure:
Here is the entire project directory structure:
${allFiles.map((file) => `- ${file}`).join("\n")} 

**VERY IMPORTANT:**
- You can ONLY pick missing files from this list.
- Do NOT create new file names.
- If a file does not exist in the provided project structure, you CANNOT include it in "missing_files".
- "keywords" MUST be a single word each (no spaces allowed).


## Objective:
Your job is to analyze the provided files, task description, and project structure to:
1. **Suggest Keywords:** Identify important keywords, function names, class names, or API calls that should be searched for in the project files (**MUST be a single word each** (no spaces allowed)).
2. **Find Missing but Relevant Files:** If certain files from the provided project structure are missing from the selected files but likely contain useful information for completing the task, list them.

**Rules for Missing Files:**
- Only select files from the provided project structure.
- Do NOT create or suggest new file names that are not in the project structure.
- Provide a reason why each file is relevant to the task.

## Expected JSON Response:
Your response **must** strictly follow this structured JSON format:
- "keywords": A list of important keywords, function names, or class names to search for in the project.
- "missing_files": A list of filenames from the given project structure that were not selected by the user but could be useful.

Ensure the response is in structured JSON format, and **do not add any extra explanations.**`;

    const response = await this._openai?.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });

    const responseObj = JSON.parse(
      response?.choices[0].message.content || "{}"
    );

    return responseObj;
  }

  /**
   * Given a task, all selected files, and the list of all files in the project,
   * this function generates a detailed step-by-step implementation plan for the task.
   * The plan includes code snippets, descriptions, and any dependencies required.
   * The function also returns a list of suggested files to look at that are not in the
   * selected files list.
   *
   * @param task The task to generate a plan for.
   * @param allSelectedFiles The object containing the selected files with their content.
   * @param allFiles The list of all files in the project.
   * @returns A JSON object containing the plan.
   */
  public async generatePlanForTask(
    task: string,
    allSelectedFiles: { [key: string]: string },
    allFiles: string[]
  ) {
    const fileContent = Object.keys(allSelectedFiles).map((key) => {
      return `- File: ${key}: 
      ${allSelectedFiles[key]}
      
      
      `;
    });

    const prompt = `You are an advanced AI coding assistant that helps developers implement features efficiently.

    ## Task:
    The user wants to complete the following task in their project:
    - "${task}"
    
    ## Project Structure:
    The project has the following structure:
    ${
      allFiles.length > 0
        ? allFiles.map((file) => `- ${file}`).join("\n")
        : "- No project structure provided."
    }
    
    ## Provided Files:
    ${
      fileContent
        ? `The user has provided the following files along with their content:\n${fileContent}`
        : "⚠️ No specific files were provided for reference."
    }
    
    ---
    
    ### **Objective:**
    Your job is to generate a **detailed step-by-step implementation plan** to complete the task.
    
    ### **Plan Requirements:**
    1. **Step-by-Step Instructions:**  
       - Each step should describe a specific action to take.  
       - If applicable, include relevant code snippets.  
       - If no relevant files are provided, create a generic plan based on best practices.
    
    2. **Dependencies:**  
       - Mention if a step depends on another step.  
       - Specify any external libraries or frameworks required.  
    
    3. **Final Review Checklist:**  
       - A checklist to verify that the task has been implemented correctly.  
    
    ---
    
    ### **Handling Missing Information:**
    - If the provided files do not contain relevant information for the task, explicitly state this in the response.
    - Suggest files that might be needed from the **Project Structure** for better accuracy.

    ### **Handling Missing Information:**
    - If the provided files do not contain relevant information for the task, explicitly state this in the response.
    - In such cases, clearly mention **assumptions** of what the task is and explain the thought process for the plan in the "missing_information" field.
    - Clearly state that you could not find the necessary information in the project.
    - If all necessary information is available, leave the "missing_information" field as an empty string.
    
    ---
    
    ### **Expected JSON Output:**
    Your response **must strictly follow** this JSON structure:
    json
    {
      "steps": [
        {
          "step_number": 1,
          "description": "Detailed explanation of what needs to be done in this step.",
          "code_snippet": "Relevant code snippet if applicable"
        }
      ],
      "dependencies": [
        "List of dependencies between steps or external libraries needed."
      ],
      "final_checklist": [
        "A list of items to verify that the implementation is correct."
      ],
      "missing_information": "Explanation if no relevant information was found in the provided files.",
      "suggested_files": [
        "List of files from the project structure that might be useful."
      ]
    }
    `;

    const response = await this._openai?.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });

    const responseObj = JSON.parse(
      response?.choices[0].message.content || "{}"
    );

    return responseObj;
  }
}
