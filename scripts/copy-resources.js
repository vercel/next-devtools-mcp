#!/usr/bin/env node
/**
 * Copy resources script
 * Preserves directory structure from src/resources/ to dist/resources/
 * Copies .md files from src/prompts/ to dist/resources/prompts/
 *
 * Usage: node scripts/copy-resources.js
 */

import fs from 'fs'
import path from 'path'

const SRC_RESOURCES_DIR = 'src/resources'
const SRC_PROMPTS_DIR = 'src/prompts'
const DEST_DIR = 'dist/resources'

/**
 * Recursively copy .md files while preserving directory structure
 */
function copyMarkdownFiles(srcDir, destDir, relativePath = '') {
  if (!fs.existsSync(srcDir)) {
    return []
  }

  const files = fs.readdirSync(srcDir)
  const copiedFiles = []

  files.forEach(file => {
    const srcPath = path.join(srcDir, file)
    const stat = fs.statSync(srcPath)

    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      const newRelativePath = path.join(relativePath, file)
      const copied = copyMarkdownFiles(srcPath, destDir, newRelativePath)
      copiedFiles.push(...copied)
    } else if (file.endsWith('.md')) {
      // Copy .md file preserving structure
      const destPath = path.join(destDir, relativePath, file)
      const destDirPath = path.dirname(destPath)
      
      if (!fs.existsSync(destDirPath)) {
        fs.mkdirSync(destDirPath, { recursive: true })
      }
      
      fs.copyFileSync(srcPath, destPath)
      const relativeDestPath = path.relative(destDir, destPath)
      copiedFiles.push(relativeDestPath)
    }
  })

  return copiedFiles
}

/**
 * Main function
 */
function main() {
  console.log('📦 Copying markdown files with preserved structure...\n')

  // Ensure destination directory exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true })
  }

  // Copy resources with preserved structure
  console.log('Copying from src/resources/...')
  const resourceFiles = copyMarkdownFiles(SRC_RESOURCES_DIR, DEST_DIR)
  
  // Copy prompt .md files to prompts/ subdirectory
  console.log('Copying from src/prompts/...')
  const promptFiles = copyMarkdownFiles(SRC_PROMPTS_DIR, DEST_DIR, 'prompts')

  const allFiles = [...resourceFiles, ...promptFiles]
  
  console.log(`\nCopied ${allFiles.length} files:\n`)
  allFiles.forEach(file => {
    console.log(`  ✓ ${file}`)
  })

  console.log('\n✅ Resources copied successfully!')
}

main()
