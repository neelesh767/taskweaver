<script lang="ts">
  import { onMount } from "svelte";

  let task = "";
  let files: { relativePath: string; absolutePath: string }[] = [];
  let selectedFiles: string[] = [];
  let searchQuery = "";
  let loading = false;
  let plan:
    | {
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
      }
    | undefined = undefined;

  onMount(() => {
    vscode.postMessage({ type: "requestFiles" });

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "fileList") {
        files = [...message.files];
      }
      if (message.type === "plan") {
        plan = message.plan;
        loading = false;
      }
      if (message.type === "resetTask") {
        resetTask();
      }
    });
  });

  function submitTask() {
    loading = true;
    vscode.postMessage({ type: "submitTask", task, selectedFiles });
  }

  function toggleFileSelection(file: string) {
    if (loading) return; // Prevent interaction while loading
    selectedFiles = selectedFiles.includes(file)
      ? selectedFiles.filter((f) => f !== file)
      : [...selectedFiles, file];
  }

  function resetTask() {
    task = "";
    selectedFiles = [];
    plan = undefined;
    loading = false;
  }
</script>

<!-- Loading state -->
{#if loading}
  <div class="container">
    <h2>Hold tight! I'm generating a detailed plan for your task.</h2>
    <h2 style="margin-top: 7px;">This won't take long...</h2>
  </div>
{/if}

<!-- Task input screem -->
{#if !plan && !loading}
  <div class="container">
    <!-- Task input -->
    <h1 style="margin-bottom: 20px;">Need help with your code?</h1>
    <h3 style="margin-bottom: 5px;">
      Describe your task, and I'll generate a structured plan to guide you!
    </h3>
    <div class="task-input-container">
      <input
        type="text"
        bind:value={task}
        placeholder="Enter your task..."
        class="task-input"
      />
    </div>

    <!-- File selector -->
    <h4 class="file-selector-header">
      Help me understand your code, select relevant files
    </h4>
    <input
      style="border: 2px solid #FFFFFF1A; border-radius: 5px;"
      class="file-input"
      type="text"
      bind:value={searchQuery}
      placeholder="Search files..."
    />

    <div class="file-list">
      {#if files.filter((file) => file.relativePath
          .toLowerCase()
          .includes(searchQuery.toLowerCase())).length === 0}
        <div class="">
          <span>No such files found</span>
        </div>
      {/if}
      {#each files
        .filter((file) => file.relativePath
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
        .slice(0, 5) as file}
        <div
          class="file-item"
          on:click={() => toggleFileSelection(file.absolutePath)}
          on:keydown={(e) =>
            e.key === "Enter" && toggleFileSelection(file.absolutePath)}
        >
          <span>{file.relativePath}</span>
          <input
            type="checkbox"
            checked={selectedFiles.includes(file.absolutePath)}
            on:change={() => toggleFileSelection(file.absolutePath)}
            disabled={loading}
          />
        </div>
      {/each}
    </div>

    <button
      on:click={submitTask}
      class="generate-btn"
      disabled={loading || !task.trim()}
    >
      {loading ? "Generating Plan..." : "Generate Plan"}
    </button>
  </div>
{/if}

<!-- Plan display -->
{#if plan && !loading}
  <div class="task-display">
    Task: {task}
  </div>

  <div class="plan-container">
    <!-- Missing Information -->
    {#if plan.missing_information}
      <h4 style="color: red;">⚠️ Missing Information</h4>
      <p class="missing-info" style="margin-top: 3px;">
        {plan.missing_information}
      </p>
    {/if}
    <!-- Plan -->
    <h3 style="margin-bottom: 7px; font-weight: 400; font-size: large;">
      Plan:
    </h3>
    {#each plan.steps as step}
      <div class="plan-step">
        <h4>
          <span style="font-weight: 800;">Step {step.step_number}:</span>
          {step.description}
        </h4>
        {#if step.code_snippet}
          <pre><code>{step.code_snippet}</code></pre>
        {/if}
      </div>
    {/each}
    <!-- Dependencies -->
    <h3
      style="margin-bottom: 7px; margin-top: 25px; font-weight: 400; font-size: large;"
    >
      Dependencies:
    </h3>
    <ul>
      {#each plan.dependencies as dep}
        <li>✔️ {dep}</li>
      {/each}
    </ul>

    <!-- Final Checklist -->
    <h3
      style="margin-bottom: 7px; margin-top: 25px; font-weight: 400; font-size: large;"
    >
      Final Checklist:
    </h3>
    <ul>
      {#each plan.final_checklist as check}
        <li>✅ {check}</li>
      {/each}
    </ul>
  </div>

  <button on:click={resetTask} class="reset-btn">Give Another Task</button>
{/if}

<style>
  .container {
    padding: 1.5rem;
    color: #fff;
    font-family: Arial, sans-serif;
    border-radius: 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .task-input-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1rem;
    border: 2px solid #ffffff1a;
    border-radius: 5px;
    width: 100%;
    margin-top: 15px;
  }

  .task-input {
    width: 100%;
    padding: 10px;
    font-size: 1rem;

    color: white;
    border-radius: 5px;
    text-align: left;
    transition: all 0.3s ease-in-out;
  }

  .task-input:focus {
    outline: none;
    border-color: #545f60;
    box-shadow: 0 0 7px rgba(71, 79, 81, 0.5);
  }

  .file-selector-header {
    width: 100%;
    text-align: left;
    margin-top: 15px;
    margin-bottom: 7px;
  }
  .file-input {
    padding: 10px;
    font-size: 1rem;
    color: white;
    border-radius: 5px;
    text-align: left;
    transition: all 0.3s ease-in-out;
  }

  .file-list {
    max-height: 200px;
    margin-top: 5px;
    width: 100%;
    overflow-y: auto;
    padding: 5px;
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
    cursor: pointer;
    border-radius: 5px;
    white-space: nowrap;
  }

  .file-item input {
    margin-right: 10px;
  }

  .file-item:hover {
    background: #2a2a3b;
  }

  .plan-container {
    width: 100%;
    padding: 1rem;
    border-radius: 8px;
    text-align: left;
  }

  .plan-step {
    padding: 7px;
    border-radius: 5px;
    margin-bottom: 10px;
    border: 1px solid #ffffff1a;
  }

  .plan-step pre {
    background: #222;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }

  .task-display {
    font-size: 1.5rem;
    font-weight: bold;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 10px;
  }

  .missing-info {
    font-size: 0.9rem;
    font-style: italic;
    margin-bottom: 15px;
  }

  button {
    width: 100%;
    padding: 0.5rem;
    border-radius: 5px;
    border: none;
    font-weight: bold;
    margin-top: 10px;
  }

  .generate-btn {
    background: #007acc;
    color: white;
    cursor: pointer;
    font-weight: 500;
  }

  .generate-btn:disabled {
    background: #444;
    cursor: not-allowed;
  }

  .reset-btn {
    background: #ff4d4d;
    color: white;
    cursor: pointer;
    margin-bottom: 15px;
  }
</style>
