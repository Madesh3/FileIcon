import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import pngToIcoModule from "png-to-ico";
const pngToIco = (pngToIcoModule as any).default || pngToIcoModule;
import path from "path";
import fs from "fs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG and JPG files are allowed"));
    }
  },
});

const outputDir = path.join(process.cwd(), "server", "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

const ICNS_SIZES: { size: number; osType: string }[] = [
  { size: 16, osType: "icp4" },
  { size: 32, osType: "icp5" },
  { size: 64, osType: "icp6" },
  { size: 128, osType: "ic07" },
  { size: 256, osType: "ic08" },
  { size: 512, osType: "ic09" },
  { size: 1024, osType: "ic10" },
];

function buildIcns(pngBuffers: { osType: string; data: Buffer }[]): Buffer {
  let totalSize = 8;
  for (const entry of pngBuffers) {
    totalSize += 8 + entry.data.length;
  }

  const buf = Buffer.alloc(totalSize);
  buf.write("icns", 0, 4, "ascii");
  buf.writeUInt32BE(totalSize, 4);

  let offset = 8;
  for (const entry of pngBuffers) {
    buf.write(entry.osType, offset, 4, "ascii");
    buf.writeUInt32BE(entry.data.length + 8, offset + 4);
    entry.data.copy(buf, offset + 8);
    offset += 8 + entry.data.length;
  }

  return buf;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/convert", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No image file provided");
      }

      const imageBuffer = req.file.buffer;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

      const pngBuffersForIco = await Promise.all(
        ICO_SIZES.map((size) =>
          sharp(imageBuffer)
            .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer()
        )
      );

      const icoBuffer = await pngToIco(pngBuffersForIco);
      const icoFilename = `${id}.ico`;
      const icoPath = path.join(outputDir, icoFilename);
      fs.writeFileSync(icoPath, icoBuffer);

      const icnsEntries = await Promise.all(
        ICNS_SIZES.map(async ({ size, osType }) => {
          const data = await sharp(imageBuffer)
            .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
          return { osType, data };
        })
      );

      const icnsBuffer = buildIcns(icnsEntries);
      const icnsFilename = `${id}.icns`;
      const icnsPath = path.join(outputDir, icnsFilename);
      fs.writeFileSync(icnsPath, icnsBuffer);

      setTimeout(() => {
        try {
          if (fs.existsSync(icoPath)) fs.unlinkSync(icoPath);
          if (fs.existsSync(icnsPath)) fs.unlinkSync(icnsPath);
        } catch {}
      }, 5 * 60 * 1000);

      res.json({
        icoUrl: `/api/download/${icoFilename}`,
        icnsUrl: `/api/download/${icnsFilename}`,
      });
    } catch (err: any) {
      console.error("Conversion error:", err);
      res.status(500).send(err.message || "Conversion failed");
    }
  });

  app.get("/api/download/:filename", (req, res) => {
    const filename = req.params.filename;
    if (!/^[a-z0-9]+\.(ico|icns)$/.test(filename)) {
      return res.status(400).send("Invalid filename");
    }
    const filePath = path.join(outputDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found or expired");
    }
    const ext = path.extname(filename).slice(1);
    const mimeType = ext === "ico" ? "image/x-icon" : "image/icns";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  });

  return httpServer;
}
