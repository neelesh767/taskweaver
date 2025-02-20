import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";

export class FileHelper {
  private _projectRootPath: string | undefined = undefined;

  constructor() {
    this._projectRootPath = this.getProjectRootPath();
  }

  public getProjectRootPath() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      // Return the root path of the first workspace folder
      return workspaceFolders[0].uri.fsPath;
    }
    // Handle the case when no workspace is open
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      // If a file is open, return the directory of that file
      return editor.document.uri.fsPath;
    }
    return undefined; // No workspace or file open
  }

  public async getAllFilesInProject(
    dir: string = this._projectRootPath || "",
    fileList: string[] = []
  ): Promise<string[]> {
    if (!dir) return [];
    const files = fs.readdirSync(dir);

    files.forEach(async (file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        await this.getAllFilesInProject(filePath, fileList);
      } else {
        if (filePath.includes("node_modules") || filePath.includes(".git"))
          return;
        fileList.push(filePath);
      }
    });

    // Remove the base path from all the files
    fileList = fileList.map((file) => {
      return file.replace(this._projectRootPath + "/", "");
    });

    return fileList;
  }

  public async getFileContent(filePath: string) {
    return fs.readFileSync(filePath, "utf-8");
  }

  /**
   * Searches for all files containing the given keyword using ripgrep, ignoring specific folders.
   * @param keyword The search term to look for in files.
   * @param excludeFolders Array of folder names to ignore (e.g., ["node_modules", ".git"])
   * @returns A promise resolving to an array of file paths where the keyword is found.
   */
  public async findAllFilesWithKeyword(
    keyword: string,
    excludeFolders: string[] = ["node_modules", ".git", "dist"]
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const workspacePath = this._projectRootPath;
      if (!workspacePath) {
        return reject(new Error("No workspace folder found."));
      }

      // Resolve vscode-ripgrep at runtime
      let rgPath: string;
      try {
        const rg = require("vscode-ripgrep");
        rgPath = rg.rgPath;
      } catch (err) {
        return reject(
          new Error("Failed to load vscode-ripgrep. Make sure it is installed.")
        );
      }

      // Build exclusion rules
      const excludeArgs = excludeFolders.flatMap((folder) => [
        "--glob",
        `!${folder}/**`,
      ]);

      const args = [
        "--files-with-matches", // Only return filenames
        "--no-heading", // No additional output
        ...excludeArgs, // Add exclusions
        keyword, // Search term
      ];

      const command = `"${rgPath}" ${args.join(" ")}`;

      cp.exec(command, { cwd: workspacePath }, (error, stdout) => {
        if (error && (error as any).code !== 1) {
          return reject(error);
        }

        const files = stdout
          .split("\n")
          .map((file) => file.trim())
          .filter((file) => file.length > 0)
          .map((file) => path.join(workspacePath, file));

        resolve(files);
      });
    });
  }
}
