import * as core from '@actions/core'
import * as yaml from 'yaml'
import * as fs from "fs";
import fetch from 'node-fetch';
import path from 'path';
import {context} from "@actions/github";
import simpleGit, { Response } from 'simple-git'

const run = async () => {
    const baseUrl = `https://api.roadie.so`;
    const catalogInfoPath = core.getInput('path')
    const apiKey = core.getInput('roadie-api-key')
    const baseDir = path.join(process.cwd(), './')
    const git = simpleGit({ baseDir })
    const changedFiles = (await git.diffSummary(['--cached'])).files
    console.log(`Changed files: ${changedFiles}`)

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