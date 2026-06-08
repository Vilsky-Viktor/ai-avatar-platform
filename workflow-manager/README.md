# workflow-manager

Pub/Sub message orchestrator that drives multi-step job workflows. Reads job state from the `workflow-manager` subscription, decides what to do next, routes the job to the correct service topic, and handles retries and cleanup.

## Responsibility

- Route each pending workflow step to its target service's Pub/Sub topic
- Retry failed workflows up to `maxRuns` times (resets all steps and re-routes from the first step)
- Mark jobs as `completed` or `error` in `job-manager` after all steps finish
- Delete intermediate storage files once a job completes successfully

## Message flow

```
[any publisher] → workflow-manager topic
        ↓
  workflow-manager evaluates job.workflow state:
    allStepsCompleted  → mark completed, delete intermediate files
    jobError           → maxRuns exhausted, mark error
    stepError          → curRun < maxRuns, reset all steps + re-publish to first service
    newWorkflow        → first step, publish to step[0].service topic
    pendingStep        → publish to next pending step's service topic
```

## Retry logic

When a step fails and `job.curRun < job.maxRuns`, all workflow steps are reset to `pending` and the job is re-published to the first step's service from the beginning. The `curRun` counter increments on each full restart.

## Cleanup

After successful completion, intermediate files (step `uploadPath` values that are not `resultMediaPath` or `resultThumbnailPath`) are deleted from Firebase Storage in parallel.

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs |
| `BUCKET_NAME` | Firebase Storage bucket |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `workflow-manager-sub`) |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages (default `10`) |

## Running locally

```bash
npm run dev
```
