#!/usr/bin/env node
/**
 * Copy resources script
 * Scans all .md files in src/ and copies them to a flat dist/resources/ directory
 * Ensures all .md filenames are unique
 *
 * Usage: node scripts/copy-resources.js
 */

const fs = require('fs')
const path = require('path')

const SRC_DIR = 'src'
const DEST_DIR = 'dist/resources'

/**
 * Recursively find all .md files in a directory
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      findMarkdownFiles(filePath, fileList)
    } else if (file.endsWith('.md')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

/**
 * Check for duplicate filenames
 */
function checkDuplicates(files) {
  const filenames = new Map()
  const duplicates = []

  files.forEach(filePath => {
    const filename = path.basename(filePath)
    if (filenames.has(filename)) {
      duplicates.push({
        filename,
        paths: [filenames.get(filename), filePath]
      })
    } else {
      filenames.set(filename, filePath)
    }
  })

  return duplicates
}

/**
 * Main function
 */
function main() {
  console.log('📦 Scanning for markdown files in src/...\n')

  const markdownFiles = findMarkdownFiles(SRC_DIR)
  console.log(`Found ${markdownFiles.length} markdown files\n`)

  const duplicates = checkDuplicates(markdownFiles)
  if (duplicates.length > 0) {
    console.error('❌ Error: Duplicate markdown filenames found:\n')
    duplicates.forEach(({ filename, paths }) => {
      console.error(`  ${filename}:`)
      paths.forEach(p => console.error(`    - ${p}`))
    })
    console.error('\nAll .md files must have unique names.')
    process.exit(1)
  }

  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true })
  }

  console.log(`Copying to ${DEST_DIR}...\n`)
  markdownFiles.forEach(srcPath => {
    const filename = path.basename(srcPath)
    const destPath = path.join(DEST_DIR, filename)
    fs.copyFileSync(srcPath, destPath)
    console.log(`  ✓ ${filename}`)
  })

  console.log('\n✅ Resources copied successfully!')
}

main()
