# Sync Roadie Techdocs Action

Update a repository's Backstage Techdocs build in Roadie.



[comment]: <> (A detailed description of what the action does)

[comment]: <> (Required input and output arguments)

```yaml
    steps:
        - name: Sync Roadie Techdocs
          uses: roadiehq/
          with: 
            path: './catalog-info.yaml'
            roadie-api-key: ${{ secrets.ROADIE_API_KEY }}
```


[comment]: <> (Optional input and output arguments)

[comment]: <> (Secrets the action uses)

[comment]: <> (Environment variables the action uses)

[comment]: <> (An example of how to use your action in a workflow)

