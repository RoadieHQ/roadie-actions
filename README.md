# Sync Backstage TechDocs Action

This Action allows CI triggered building of Backstage TechDocs for a repository so that you don't have to wait for docs to build on demand when viewing a new version.

### Prerequisites

This Action assumes that you have a publicly available HTTP API exposed from your Backstage backend that uses a Bearer token for Authorization. 

[Roadie Backstage](https://roadie.io/) customers may access this via the Roadie API. Please reach out to support@roadie.io for more info. 

### Required Inputs:
- `api-token`: An API token added as a Bearer token to the Backstage API requests
- `catalog-info-path`: Path to the yaml file representing the Backstage entity linked to these docs. Defaults to `./catalog-info.yaml`
- `backstage-api-endpoint`: The address of the exposed Backstage API
- `github-token`: A Github PAT to check if the docs were updated in this branch - if not passed this action will sync the docs every time which may cause load issues as techdocs builds can be resource intensive.

### Optional Inputs
Supplying a `github-token` allows the action to check if there have been any updates to the docs and only sync if there have been, thereby reducing unnecessary load on your Roadie instance.

NB: It is recommended that you supply this to avoid performance implications from frequent merges.

- `github-token`: A Github PAT to check if the docs were updated in this branch - if not passed this action will sync the docs every time

### Example usage
```yaml
on:
  push:
    branches:
      - main
jobs:
  update_roadie_techdocs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Sync Backstage Techdocs
        uses: roadiehq/backstage-techdocs-sync
        with:
          api-token: ${{ secrets.ROADIE_API_KEY }}
          catalog-info-path: './catalog-info.yaml'
          backstage-api-endpoint: 'https://api.roadie.so'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

