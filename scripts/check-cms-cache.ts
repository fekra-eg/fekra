import assert from 'node:assert/strict'

Object.assign(process.env, { NODE_ENV: 'development' })
const { cmsMemo, clearCmsMemo } = await import('../src/lib/cms-cache')

let reads = 0
const read = async () => ++reads
assert.deepEqual(await Promise.all([cmsMemo('same', read), cmsMemo('same', read)]), [1, 1])
assert.equal(await cmsMemo('same', read), 1)
assert.equal(await cmsMemo('other-locale', read), 2)
assert.equal(await cmsMemo(null, read), 3)
assert.equal(await cmsMemo(null, read), 4)
clearCmsMemo()
assert.equal(await cmsMemo('same', read), 5)

let finish!: (value: string) => void
const pending = cmsMemo('publish-race', () => new Promise<string>((resolve) => { finish = resolve }))
clearCmsMemo()
assert.equal(await cmsMemo('publish-race', async () => 'new'), 'new')
finish('old')
await pending
assert.equal(await cmsMemo('publish-race', async () => 'unexpected'), 'new')

await assert.rejects(cmsMemo('retry', async () => { throw new Error('temporary failure') }))
assert.equal(await cmsMemo('retry', async () => 'recovered'), 'recovered')
console.log('CMS cache: deduplication, locale isolation, draft bypass, publish invalidation, in-flight invalidation, and retry passed.')
