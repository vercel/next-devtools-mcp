import { describe, it, expect } from "vitest"
import { filterImageDataFromResult } from "../../src/tools/browser-eval.js"

describe("browser-eval screenshot filter", () => {
  it("should filter out base64 image data from screenshot result", () => {
    const mockResponse = {
      content: [
        {
          type: "text",
          text: "### Result\nTook the viewport screenshot and saved it as /tmp/screenshot.png",
        },
        {
          type: "image",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ],
    }

    const formattedResult = filterImageDataFromResult(mockResponse) as {
      content: { type: string; text?: string }[]
    }

    // Should remove the image block
    expect(formattedResult.content.length).toBe(2) // Original text + new guidance text
    expect(formattedResult.content.every((block) => block.type !== "image")).toBe(true)

    // Should contain guidance about reading the file
    const guidanceBlock = formattedResult.content.find((block) =>
      block.text?.includes('To view this screenshot, use the "read" tool with the file path')
    )
    expect(guidanceBlock).toBeDefined()
    expect(guidanceBlock?.text).toContain("/tmp/screenshot.png")
  })

  it("should extract file path from various text formats", () => {
    const formats = [
      "saved it as /path/to/screenshot.png",
      "saved as /path/to/screenshot.png",
      "Took the viewport screenshot and saved it as /var/folders/temp/screenshot.png",
    ]

    formats.forEach((text) => {
      const mockResult = { content: [{ type: "text", text }] }

      const formattedResult = filterImageDataFromResult(mockResult) as {
        content: { type: string; text?: string }[]
      }

      const guidanceBlock = formattedResult.content.find((block) =>
        block.text?.includes("To view this screenshot")
      )
      expect(guidanceBlock).toBeDefined()
    })
  })

  it("should handle results without image data", () => {
    const mockResult = { content: [{ type: "text", text: "Some other result" }] }

    const formattedResult = filterImageDataFromResult(mockResult) as {
      content: { type: string; text?: string }[]
    }

    // Should not add guidance if no screenshot path found
    expect(formattedResult.content.length).toBe(1)
  })

  it("should handle non-object results", () => {
    expect(filterImageDataFromResult(null)).toBe(null)
    expect(filterImageDataFromResult("string")).toBe("string")
    expect(filterImageDataFromResult(123)).toBe(123)
  })

  it("should handle responses without content array", () => {
    const mockResult = { other: "data" }
    expect(filterImageDataFromResult(mockResult)).toEqual(mockResult)
  })
})
