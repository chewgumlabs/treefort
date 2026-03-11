# Room Submission Workflow

## Inputs

- `content/submissions/*.json`: kid room submissions
- `content/reviews/*.json`: moderator decisions
- `content/verified-room-manifests/*.json`: reviewer-captured semantic room snapshots for approved submissions

## Submission requirements

- GitHub login, repo slug, and site URL
- room manifest URL
- explicit acknowledgements:
  - `age13Plus`
  - `publicSite`
  - `noPrivateInfo`
- requested door behavior:
  - `lock`
  - `knock`
  - `discord`
  - `stalk`

## Approval checklist

- the submitted room manifest resolves and validates against the latest semantic room schema
- a reviewer captures the approved snapshot into `content/verified-room-manifests/<submission-id>.json`
- the snapshot hash is written into the approval review record
- no personal information appears in public copy
- the GitHub Pages site is reachable
- the requested door mode matches the kid's intention
- listing position and sort order are assigned by the reviewer, not the submitter

## Reviewer commands

- `npm run capture:snapshot -- <submission-id>`
- `npm run approve:submission -- <submission-id> <sort-order> <x> <y> [reviewer]`
