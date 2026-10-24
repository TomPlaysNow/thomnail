import AppKit

let args = CommandLine.arguments
guard args.count == 3 else {
    fputs("Usage: swift-helper <video-file> <image-file>\n", stderr)
    exit(1)
}

let videoPath = args[1]
let imagePath = args[2]

guard FileManager.default.fileExists(atPath: videoPath) else {
    fputs("ERROR: File not found: \(videoPath)\n", stderr)
    exit(1)
}

guard let img = NSImage(contentsOfFile: imagePath) else {
    fputs("ERROR: Cannot load image: \(imagePath)\n", stderr)
    exit(1)
}

let ok = NSWorkspace.shared.setIcon(img, forFile: videoPath, options: [])
if ok {
    print("OK")
} else {
    fputs("ERROR: setIcon failed for \(videoPath)\n", stderr)
    exit(1)
}
