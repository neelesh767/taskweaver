import * as _vscode from "vscode";

declare global {
  const vscode: {
    postMessage: (payload: {
      type: string;
      task?: string;
      selectedFiles?: string[];
    }) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
  const apiBaseUrl: string;
}
