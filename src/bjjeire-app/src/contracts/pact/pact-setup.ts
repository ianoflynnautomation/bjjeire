import { PactV4, SpecificationVersion } from '@pact-foundation/pact'
import path from 'node:path'

export const CONSUMER_NAME = 'BjjEireWeb'
export const PROVIDER_NAME = 'BjjEireApi'

export function createPact(): PactV4 {
  return new PactV4({
    consumer: CONSUMER_NAME,
    provider: PROVIDER_NAME,
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V4,
    logLevel: 'warn',
  })
}
