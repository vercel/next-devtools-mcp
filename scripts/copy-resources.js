#!/usr/bin/env node
/**
 * Copy resources script
 * Copies all MCP resource files and directories from src to dist
 *
 * Usage: node scripts/copy-resources.js
 */

const fs = require('fs')
const path = require('path')

// Define resources to copy
const resources = [
  {
    type: 'files',
    src: 'src/mcp-prompts/*.md',
    dest: 'dist/mcp-prompts/'
  },
  {
    type: 'files',
    src: 'src/mcp-resources/nextjs-16-beta-to-stable.md',
    dest: 'dist/mcp-resources/'
  },
  {
    type: 'dir',
    src: 'src/mcp-resources/nextjs-16-knowledge',
    dest: 'dist/mcp-resources/nextjs-16-knowledge'
  },
  {
    type: 'dir',
    src: 'src/mcp-resources/nextjs-fundamentals-knowledge',
    dest: 'dist/mcp-resources/nextjs-fundamentals-knowledge'
  }
]

/**
 * Copy a file
 */
function copyFile(src, dest) {
  const destDir = path.dirname(dest)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  fs.copyFileSync(src, dest)
  console.log(`  ✓ ${path.relative(process.cwd(), dest)}`)
}

/**
 * Copy files matching a glob pattern
 */
function copyFiles(pattern, destDir) {
  const srcDir = path.dirname(pattern)
  const filename = path.basename(pattern)

  if (!fs.existsSync(srcDir)) {
    console.warn(`  ⚠ Source directory not found: ${srcDir}`)
    return
  }

  const files = fs.readdirSync(srcDir).filter(file => {
    if (filename === '*.md') return file.endsWith('.md')
    return file === filename
  })

  if (files.length === 0) {
    console.warn(`  ⚠ No files matching ${pattern}`)
    return
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  files.forEach(file => {
    const src = path.join(srcDir, file)
    const dest = path.join(destDir, file)
    copyFile(src, dest)
  })
}

/**
 * Copy a directory recursively
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Source directory not found: ${src}`)
    return
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const items = fs.readdirSync(src)

  items.forEach(item => {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)
    const stat = fs.statSync(srcPath)

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFile(srcPath, destPath)
    }
  })
}

/**
 * Main function
 */
function main() {
  console.log('📦 Copying MCP resources...\n')

  resources.forEach(resource => {
    if (resource.type === 'files') {
      console.log(`Copying markdown files: ${resource.src}`)
      copyFiles(resource.src, resource.dest)
    } else if (resource.type === 'dir') {
      console.log(`Copying directory: ${resource.src}`)
      copyDir(resource.src, resource.dest)
    }
  })

  console.log('\n✅ Resources copied successfully!')
}

main()
