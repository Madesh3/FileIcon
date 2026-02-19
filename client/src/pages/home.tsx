import { useState, useCallback, useRef } from "react";
import { Upload, Download, Image, Monitor, Apple, X, Loader2, FileImage, ArrowRight, Sparkles, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type ConvertState = "idle" | "uploading" | "converting" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertState, setConvertState] = useState<ConvertState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [icoUrl, setIcoUrl] = useState<string | null>(null);
  const [icnsUrl, setIcnsUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((f: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(f.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG or JPG image.",
        variant: "destructive",
      });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 10MB.",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setConvertState("idle");
    setIcoUrl(null);
    setIcnsUrl(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleConvert = async () => {
    if (!file) return;
    setConvertState("converting");
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Conversion failed");
      }

      const data = await res.json();
      setIcoUrl(data.icoUrl);
      setIcnsUrl(data.icnsUrl);
      setConvertState("done");
      toast({
        title: "Conversion complete",
        description: "Your icon files are ready to download.",
      });
    } catch (err: any) {
      setConvertState("error");
      toast({
        title: "Conversion failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setConvertState("idle");
    setIcoUrl(null);
    setIcnsUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-4 flex-wrap px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight" data-testid="text-logo">
              FileIcon
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wide">
              by Madesh
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          v1.0
        </Badge>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-xl mx-auto flex flex-col items-center"
        >
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3" data-testid="text-heading">
              Image to Icon
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Upload a PNG or JPG and convert it into icon files for
              <span className="text-foreground font-medium"> Windows</span> and
              <span className="text-foreground font-medium"> macOS</span>.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Card
                  className={`relative w-full cursor-pointer transition-colors duration-200 ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-dashed border-border"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  data-testid="dropzone"
                >
                  <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Drop your image here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse — PNG, JPG up to 10MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        .png
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        .jpg
                      </Badge>
                    </div>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                    data-testid="input-file"
                  />
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col gap-4"
              >
                <Card className="relative overflow-visible p-6">
                  <div className="flex items-start gap-5">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 flex items-center justify-center">
                      <Folder className="absolute inset-0 w-full h-full text-primary/80" strokeWidth={0.8} fill="hsl(var(--primary) / 0.15)" />
                      {preview && (
                        <img
                          src={preview}
                          alt="Preview"
                          className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-sm mt-2"
                          data-testid="img-preview"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" data-testid="text-filename">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleReset}
                          data-testid="button-remove"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileImage className="w-3.5 h-3.5" />
                          <span>{file.type.split("/")[1].toUpperCase()}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="font-mono text-xs gap-1">
                            <Monitor className="w-3 h-3" />
                            .ico
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-xs gap-1">
                            <Apple className="w-3 h-3" />
                            .icns
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <AnimatePresence mode="wait">
                  {convertState === "idle" || convertState === "error" ? (
                    <motion.div
                      key="convert-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Button
                        className="w-full gap-2"
                        onClick={handleConvert}
                        data-testid="button-convert"
                      >
                        <Sparkles className="w-4 h-4" />
                        Convert to Icons
                      </Button>
                    </motion.div>
                  ) : convertState === "converting" ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Button className="w-full gap-2" disabled data-testid="button-converting">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Converting...
                      </Button>
                    </motion.div>
                  ) : convertState === "done" ? (
                    <motion.div
                      key="download"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => icoUrl && handleDownload(icoUrl, file.name.replace(/\.\w+$/, ".ico"))}
                          data-testid="button-download-ico"
                        >
                          <Monitor className="w-4 h-4" />
                          <span className="flex flex-col items-start leading-tight">
                            <span className="text-sm">Windows</span>
                            <span className="text-xs text-muted-foreground font-mono">.ico</span>
                          </span>
                          <Download className="w-4 h-4 ml-auto" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => icnsUrl && handleDownload(icnsUrl, file.name.replace(/\.\w+$/, ".icns"))}
                          data-testid="button-download-icns"
                        >
                          <Apple className="w-4 h-4" />
                          <span className="flex flex-col items-start leading-tight">
                            <span className="text-sm">macOS</span>
                            <span className="text-xs text-muted-foreground font-mono">.icns</span>
                          </span>
                          <Download className="w-4 h-4 ml-auto" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={handleReset}
                        data-testid="button-convert-another"
                      >
                        Convert another image
                      </Button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-md bg-card flex items-center justify-center mb-2 border border-border/50">
                <Image className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multiple sizes included
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-md bg-card flex items-center justify-center mb-2 border border-border/50">
                <Monitor className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Windows .ico format
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-md bg-card flex items-center justify-center mb-2 border border-border/50">
                <Apple className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                macOS .icns format
              </p>
            </div>
          </div>

          <div className="mt-14 w-full max-w-xl" data-testid="section-instructions">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-center mb-6">
              How to Use Your Icons
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-4 h-4 text-foreground" />
                  <h3 className="text-sm font-semibold">Windows</h3>
                </div>
                <ol className="space-y-2 text-xs text-muted-foreground leading-relaxed list-decimal list-inside">
                  <li>Right-click the folder and select <span className="text-foreground font-medium">Properties</span></li>
                  <li>Go to the <span className="text-foreground font-medium">Customize</span> tab</li>
                  <li>Click <span className="text-foreground font-medium">Change Icon</span></li>
                  <li>Browse and select your <span className="font-mono text-foreground">.ico</span> file</li>
                  <li>Click <span className="text-foreground font-medium">OK</span> and <span className="text-foreground font-medium">Apply</span></li>
                </ol>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Apple className="w-4 h-4 text-foreground" />
                  <h3 className="text-sm font-semibold">macOS</h3>
                </div>
                <ol className="space-y-2 text-xs text-muted-foreground leading-relaxed list-decimal list-inside">
                  <li>Open the <span className="font-mono text-foreground">.icns</span> file in <span className="text-foreground font-medium">Preview</span></li>
                  <li>Press <span className="font-mono text-foreground">Cmd + A</span> then <span className="font-mono text-foreground">Cmd + C</span></li>
                  <li>Right-click your folder and select <span className="text-foreground font-medium">Get Info</span></li>
                  <li>Click the folder icon at the top-left of the info window</li>
                  <li>Press <span className="font-mono text-foreground">Cmd + V</span> to paste</li>
                </ol>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border/50 px-6 py-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            by{" "}
            <a
              href="https://www.madeshthevar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground font-medium underline underline-offset-4 decoration-border hover:decoration-primary transition-colors"
              data-testid="link-author"
            >
              Madesh Thevar
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
