import { FileHelper } from "./FileHelper";
import { OpenAiHelper } from "./OpenAiHelper";

export class TaskGenerator {
  _openAiHelper: OpenAiHelper = new OpenAiHelper();
  _task: string = "";
  _selectedFileNames: string[] = [];
  _allFiles: string[] = [];
  _fileHelper: FileHelper = new FileHelper();

  constructor() {}

  /**
   * Given a task, a list of selected files, and the list of all files in the project,
   * this function generates a detailed step-by-step implementation plan for the task.
   * The plan includes code snippets, descriptions, and any dependencies required.
   * The function also returns a list of suggested files to look at that are not in the
   * selected files list.
   * @param task The task to generate a plan for.
   * @param selectedFileNames The list of files the user has selected.
   * @param allFiles The list of all files in the project.
   * @returns A JSON object containing the plan.
   */
  async generatePlanForTask(
    task: string,
    selectedFileNames: string[],
    allFiles: string[]
  ) {
    this._task = task;
    this._selectedFileNames = selectedFileNames;
    this._allFiles = allFiles;

    // =========================== Generate Keywords ===========================
    const { keywords, missing_files } =
      await this._openAiHelper.generateKeyWords({
        task: task,
        selectedFileNames: selectedFileNames,
        allFiles: allFiles,
      });

    let filesToSend = [...selectedFileNames, ...missing_files];
    filesToSend = filesToSend.map((file) => {
      return this._fileHelper.getProjectRootPath() + "/" + file;
    });

    // ========================= Search for files with keywords ==================
    keywords.forEach(async (keyword: string) => {
      let files = await this._fileHelper.findAllFilesWithKeyword(keyword);

      files = files.map((file) => {
        return this._fileHelper.getProjectRootPath() + "/" + file;
      });

      filesToSend.push(...files);
    });

    // Remove duplicates
    filesToSend = filesToSend.filter((file, index) => {
      return filesToSend.indexOf(file) === index;
    });

    // ========================= Get file content ==========================
    const fileContent: { [key: string]: string } = {};

    Promise.all(
      filesToSend.map(async (file: string) => {
        let content = "";
        try {
          content = await this._fileHelper.getFileContent(file);
        } catch (err) {
          console.log(err);
        }
        if (content) fileContent[file] = content;
      })
    );

    // =========================== Generate Plan ===========================
    const result: {
      dependencies: string[];
      final_checklist: string[];
      missing_information: string;
      steps: {
        code_snippet: string;
        description: string;
        step_number: number;
      }[];
      suggested_files: string[];
      show_missing_information?: boolean;
    } = await this._openAiHelper.generatePlanForTask(
      this._task,
      fileContent,
      this._allFiles
    );
    if (allFiles.length === 0) result.show_missing_information = true;

    return result;
  }
}
