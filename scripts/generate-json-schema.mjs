import { zodToJsonSchema } from 'zod-to-json-schema'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

async function main() {
  // Dynamic import to ensure TS compilation is handled by the bundler/runtime if needed,
  // though for .mjs scripts running via node/bun, we rely on the compiled JS or direct TS support.
  // Since this is a build script, we assume src/core/schema.ts is accessible.
  // Note: In a pure Node ESM environment without ts-node/tsx, importing .ts directly fails.
  // We will use a workaround: assume the user runs this with bun which supports TS natively in scripts,
  // OR we compile first. Given the project uses Bun, let's try direct import.

  let schemaModule
  try {
    schemaModule = await import('../src/core/schema.ts')
  } catch (e) {
    console.error(
      'Failed to import schema.ts. Ensure you are running this with Bun or a TS-compatible loader.',
    )
    throw e
  }

  const { resumeDocumentSchema } = schemaModule

  const jsonSchema = zodToJsonSchema(resumeDocumentSchema, {
    target: 'jsonSchema2019-09',
    io: 'output', // Generate schema based on output types (after transforms/defaults)
    definitions: {},
    $refStrategy: 'root',
  })

  // Add metadata required by our spec
  const finalSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://cv4every1.example/schemas/resume-1.0.0.json',
    title: 'cv4every1 Resume',
    description: 'Generated from src/core/schema.ts. Do not edit manually.',
    ...jsonSchema,
  }

  const outputPath = resolve(projectRoot, 'schemas', 'resume.schema.json')

  // Ensure directory exists
  mkdirSync(dirname(outputPath), { recursive: true })

  writeFileSync(outputPath, JSON.stringify(finalSchema, null, 2) + '\n', 'utf-8')
  console.log(`✅ Generated ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
