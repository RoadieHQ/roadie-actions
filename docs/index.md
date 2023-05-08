# Sync Roadie Techdocs Github Action

This Github Action can be used to sync (create a fresh build) of [techdocs](https://roadie.io/docs/getting-started/technical-documentation/) for a repo that is represented by an entity with a [techdocs annotation](https://backstage.io/docs/features/techdocs/how-to-guides/#how-to-understand-techdocs-ref-annotation-values) in [Roadie Backstage](https://roadie.io/).

Example usage:

```yaml
    steps:
        - name: Sync Roadie Techdocs
          uses: roadiehq/
          with: 
            path: './catalog-info.yaml'
            roadie-api-key: ${{ secrets.ROADIE_API_KEY }}
            github-token: ${{ secrets.GITHUB_TOKEN }}
```