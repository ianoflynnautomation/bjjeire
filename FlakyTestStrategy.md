# Flaky Test Management & Automation

## 1. Overview

This document outlines our automated system for identifying, reporting, and managing flaky tests. The primary goal is to improve the reliability of our CI/CD pipelines, reduce engineering toil spent on investigating inconsistent failures, and maintain a high standard of quality.

The system automatically analyzes test results, flags tests that exhibit flaky behavior, creates actionable bug reports, and quarantines them to prevent further disruption to the CI process.

---

## 2. How It Works: The End-to-End Process

The system is composed of several automated steps that run within our Azure DevOps pipelines.

### Step 1: Data Collection

- **What**: After every test run on the main branch, a script (`Log-TestHistory.ps1`) collects detailed results for each test.
- **Data Points**: Test name, outcome (Passed/Failed), execution duration, error messages, build ID, and timestamp.
- **Where**: Logged centrally to an Azure Data Explorer Cluster database for historical analysis.

### Step 2: Nightly Analysis

- **What**: A scheduled pipeline (`cron: "0 3 * * *"`) runs the core analysis script (`Analyze-FlakyTests-AzureBoards.ps1`) every night.
- **How**: 
  - Queries all test results from the last **14 days** (`$TimeWindowDays`).
  - Analyzes each test that has run at least **20 times** (`$MinRunsThreshold`).

A test is flagged as flaky if it meets one or more of the following criteria:

#### Signal 1: High Flip Rate (Inconsistent Outcome)

- **Description**: Identifies tests that frequently change their outcome between `Passed` and `Failed`.
- **Flip Rate Threshold**: >1% of runs (`$FlakinessThreshold`).
- **Statistical Significance**: At least **2 flips** (`$MinFlipsThreshold`) within the window.

#### Signal 2: Unstable Execution Time (Inconsistent Performance)

- **Description**: Identifies tests with erratic performance, often due to environmental or non-deterministic factors.
- **Logic**: Calculates the average execution time and standard deviation.
- **Threshold**: 
  - Standard deviation is **2.5x greater** (`$DurationStdDevFactor`) than the average execution time.
  - Example: Test with average `100ms` and std dev `250ms` is flagged.

### Step 3: Automated Bug Creation & Quarantine

When a test is flagged as flaky:

- **Creates a Bug**:  
  - Title: `[Flaky Test] Your.Test.Name`  
  - Includes analysis data, run history, and last failure details.
- **Applies Tags**:  
  - `FlakyTest`, `Automated`, `Quarantined`

### Step 4: Test Quarantine in CI

- **Script**: `Get-QuarantinedTestFilter.ps1`
- **Function**: Queries Azure Boards for bugs with the `Quarantined` tag.
- **Outcome**: Excludes flagged tests from the CI run to prevent build failures.

### Step 5: Automated Resolution (Closing the Loop)

- **Nightly analysis** also checks for recovery/stability.
- **Process**:
  - Compares current flaky tests with previously flagged ones.
  - If a test is no longer flaky:
    - **Resolves the Bug**: Changes work item to `Resolved`.
    - **Removes Quarantine**: Reintegrates the test into CI.
    - **Calculates MTTR**: Adds comment like `MTTR: 5 days, 4 hours`.

---

## 3. Developer Responsibilities

- **Investigate**:  
  - Review flaky test bug details.  
  - Use `Reason(s) for Flakiness` to identify whether it's due to flip-rate or duration.

- **Fix the Code**:  
  - Address instability in the test or related product code.

- **Do Not Manually Resolve the Bug**:  
  - Once the fix is merged to `main`, automation will:
    - Monitor the test.
    - Automatically resolve the bug and remove the quarantine.
    - Ensure that the fix is validated by stable behavior over time.
