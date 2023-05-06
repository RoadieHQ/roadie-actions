import * as core from '@actions/core'
import * as yaml from 'yaml'
import * as fs from "fs";
import fetch from 'node-fetch';
import path from 'path';
import {context} from "@actions/github";
import simpleGit, { Response } from 'simple-git'
import {info} from "@actions/core";
const github = require('@actions/github');

const run = async () => {
    const baseUrl = `https://api.roadie.so`;
    const catalogInfoPath = core.getInput('path')
    const apiKey = core.getInput('roadie-api-key')
    // const baseDir = path.join(process.cwd(), '')
    // const git = simpleGit({ baseDir })
    // const diff = await git.diffSummary(['--cached'])
    // const changedFiles = diff.files.map(f => f.file)
    // console.log(`Changed files: ${changedFiles}`)
    // console.log(changedFiles)

    // const diffRes = await fetch(context.pull_request.diff_url)
    // if (!diffRes.ok) {
    //     console.error(`Failed to fetch diff`)
    // }
    // if (diffRes.ok) {
    //     console.log(`Fetched diff ${diffRes}`)
    // }

    const githubToken = core.getInput('github-token');
    const octokit = github.getOctokit(githubToken)

    const res = await octokit.request( 'GET /repos/{owner}/{repo}/compare/{basehead}', {
        owner: context.payload.organization?.login,
        repo: context.payload.repository?.name,
        basehead: `${context.payload.pull_request?.base.ref}...${context.payload.pull_request?.head.ref}`,
        per_page: 100,
    } );
    const filesChanged = res.data.files.map((f: any) => f?.filename)
    console.log(`${filesChanged.length} changed files`)

    if(apiKey === '') {
        core.setFailed(`No roadie-api-key input value found.`)
        console.warn(`No roadie-api-key input value found. Cannot continue.`)
        return
    }

    const getDocsPath = (path: string, fileName: string) => {
        const filePath = `${path}/${fileName}`;
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            const doc = yaml.parseDocument(content)
            if (doc == null || doc == undefined) {
                core.setFailed(`No mkdocs file matching the path ${filePath} found`)
                console.warn(`No mkdocs file matching the path ${filePath} found`)
                return
            }
            const docContent = doc.toJS()
            return `${path}/${docContent?.docs_dir || 'docs'}`
        } catch(e) {
            core.setFailed(`No mkdocs file matching the path ${filePath} found due to error ${e}`)
            console.warn(`No mkdocs file matching the path ${filePath} found due to error ${e}`)
            return
        }
    }

    try {
        const content = fs.readFileSync(catalogInfoPath, 'utf8')
        const docs = yaml.parseAllDocuments(content)
        if (docs == null || docs == undefined || docs.length < 1) {
            core.setFailed(`No catalog-info file matching the path ${catalogInfoPath} found`)
            console.warn(`No catalog-info file matching the path ${catalogInfoPath} found`)
            return
        }
        const parsedDocs = docs.map(yamlDoc => yamlDoc.toJS());
        const backstageDocsPaths = parsedDocs
            .map(doc => doc.metadata.annotations?.['backstage.io/techdocs-ref'])
            .map(value => {
                if(value.startsWith('dir:')){
                    const filePath = value.slice(4)
                    return getDocsPath(filePath, 'mkdocs.yml')
                }
                console.warn(`Techdocs annotation ${value} not a dir.`)
                return
            })
        console.log(`Backstage docs paths found: ${backstageDocsPaths}`)

        const docsUpdated = filesChanged
            .find((filePath: string | undefined) => backstageDocsPaths
                .find((docPath: string | undefined) => docPath && filePath?.startsWith(docPath)))

        if(!docsUpdated) {
            console.log(`No changes to doc files found - skipping sync`)
            return
        }
        const syncRequestsData = parsedDocs
            .filter(doc => doc.metadata.annotations?.['backstage.io/techdocs-ref'])
            .map(doc => {
                const namespace = doc.metadata.namespace || 'default'
                const name = doc.metadata.name
                const kind = doc.kind.toLowerCase()

                console.log(`Found entity ${doc.kind}:${doc.metadata.namespace || 'default'}/${doc.metadata.name} with techdocs ref`)
                return {
                    url: `${baseUrl}/api/techdocs/sync/${namespace}/${kind}/${name}`,
                    name: name,
                    namespace: namespace,
                    kind: kind
                }
            })

        await Promise.allSettled(syncRequestsData.map(async requestData => {
            const res = await fetch(requestData.url, { headers: {'Authorization': `Bearer ${apiKey}`}})
            if (!res.ok) {
                console.error(`Sync failed for ${requestData.url} with ${res.status}: ${res.body}`)
            }
            if (res.ok) {
                console.log(`Synced Roadie techdocs for entity ${requestData.kind}:${requestData.namespace}/${requestData.name}`)
            }
            return res;
        }))
    } catch (error) {
        core.setFailed((error as Error).message)
    }
}

run()