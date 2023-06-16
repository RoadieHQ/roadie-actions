# Sync Roadie Techdocs Action

This Action is for [Roadie Backstage](https://roadie.io/) customers who have access to the Roadie API in their plan.

It updates a repository's Backstage [Techdocs](https://roadie.io/docs/getting-started/technical-documentation/) build in Roadie so that you don't have to wait for the docs to build when visiting the docs after a change has been made.

### Required Inputs:
- `path`: Path to the yaml file representing the Backstage entity linked to these docs. Defaults to `./catalog-info.yaml`
- `roadie-api-key`: API key for the Roadie API

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
      - name: Sync Roadie Techdocs
        uses: roadiehq/
        with:
          api-token: ${{ secrets.ROADIE_API_KEY }}
          catalog-info-path: './catalog-info.yaml'
          backstage-api-endpoint: 'https://api.roadie.so'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

