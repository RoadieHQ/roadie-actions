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


    console.log(context)
    console.log(context.payload.pull_request?.base)
    console.log(context.payload.pull_request?.head)
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
        basehead: `${context.payload.pull_request?.base}...${context.payload.pull_request?.head}`,
        per_page: 50,
    } );
    console.log(res?.data)
    console.log(res?.body)
    console.log(`${res.data?.files?.length} changed files`)


    if(apiKey === '') {
        core.setFailed(`No roadie-api-key input value found.`)
        console.warn(`No roadie-api-key input value found. Cannot continue.`)
        return
    }

    try {
        const content = fs.readFileSync(catalogInfoPath, 'utf8')
        const docs = yaml.parseAllDocuments(content)
        if (docs == null || docs == undefined || docs.length < 1) {
            core.setFailed(`No file matching the path ${catalogInfoPath} found`)
            console.warn(`No file matching the path ${catalogInfoPath} found`)
            return
        }

        const syncRequestsData = docs.map(yamlDoc => yamlDoc.toJS())
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