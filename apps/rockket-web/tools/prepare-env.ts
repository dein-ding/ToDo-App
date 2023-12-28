import 'dotenv/config'
import { writeFile } from 'fs/promises'
import path from 'path'
import { RawEnvironmentVariables, Roughly, rawEnvSchema } from '../src/environments/env.types'

const main = async () => {
    const packageVersion = process.env.npm_package_version || (await import('../../../package.json')).version

    const rawEnv: Roughly<RawEnvironmentVariables> = {
        NG_APP_PACKAGE_VERSION: packageVersion,
        NG_APP_TESTING_ENV: process.env.NG_APP_TESTING_ENV,
        NG_APP_SERVER_BASE_URL: process.env.NG_APP_SERVER_BASE_URL,
        NG_APP_NETLIFY_CONTEXT: process.env.CONTEXT,
        NG_APP_REVIEW_ID: process.env.REVIEW_ID,
    }
    const parsedRawEnv = rawEnvSchema.parse(rawEnv)

    const envFilePath = path.join(__dirname, '../src/environments/env.generated.ts')
    const stringifiedEnv = JSON.stringify(parsedRawEnv, null, 4)
    const envFileContent = `// This file is generated by apps/rockket-web/tools/prepare-env.ts
import type { RawEnvironmentVariables } from './env.types'
    
export const rawEnv: RawEnvironmentVariables = ${stringifiedEnv}
`

    console.info('Writing env file to', envFilePath)
    console.info(stringifiedEnv)
    await writeFile(envFilePath, envFileContent)
    console.info('✅ Done')
}
main()
