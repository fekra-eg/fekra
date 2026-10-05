import assert from 'node:assert/strict'
import { blogHtmlDocument, cleanBlogHtml, htmlReadingMinutes } from '../src/lib/blog-html'

const source = '<!doctype html><html lang="ar" dir="rtl"><head><style>body{color:navy}.card{display:grid}@media(max-width:500px){.card{display:block}}</style></head><body style="background:#fafafa"><h2 id="intro">Hello</h2><img src="https://example.com/photo.jpg" alt="Photo"><p style="color:red">Article</p></body></html>'
const document = blogHtmlDocument(source)
assert.ok(document.includes('lang="ar" dir="rtl"'))
assert.ok(document.includes('body style="background:#fafafa"'))
assert.ok(document.includes('@media(max-width:500px)'))
assert.ok(document.indexOf('Content-Security-Policy') < document.indexOf('<style>body'))
assert.ok(document.includes('style="color:red"'))
assert.ok(document.includes('https://example.com/photo.jpg'))

const hostile = cleanBlogHtml('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Link</a><iframe src="/admin"></iframe><form action="/cms-api/posts"><input></form><meta http-equiv="refresh" content="0;url=/admin"><base href="https://example.com">')
assert.doesNotMatch(hostile, /<script|onerror|javascript:|<iframe|<form|<input|<meta|<base/)
assert.match(blogHtmlDocument('<h2>Fragment</h2>'), /<body><h2>Fragment<\/h2><\/body>/)
assert.equal(htmlReadingMinutes(`<style>${'hidden '.repeat(500)}</style><script>${'hidden '.repeat(500)}</script><p>${'word '.repeat(440)}</p>`), 2)
console.log('HTML preservation, document policy, script removal, fragments, and reading time passed.')
