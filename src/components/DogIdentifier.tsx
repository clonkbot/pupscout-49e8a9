import { useState, useRef, useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface IdentificationResult {
  breed: string;
  confidence: string;
  description: string;
  characteristics: string[];
  funFact: string;
}

export function DogIdentifier() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chat = useAction(api.ai.chat);
  const saveIdentification = useMutation(api.dogs.create);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await chat({
        systemPrompt: `You are an expert dog breed identifier. When given a description or mention of a dog image, identify the breed and provide detailed information. Always respond in valid JSON format with this exact structure:
{
  "breed": "The primary breed name (or mix if applicable)",
  "confidence": "High/Medium/Low based on how certain you are",
  "description": "A 2-3 sentence description of this breed's appearance and temperament",
  "characteristics": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "funFact": "An interesting or surprising fact about this breed"
}

If no dog is detected in the image, respond with:
{
  "breed": "No dog detected",
  "confidence": "N/A",
  "description": "No dog was found in this image. Please upload a clear photo of a dog.",
  "characteristics": [],
  "funFact": ""
}

Always respond with valid JSON only, no additional text.`,
        messages: [
          {
            role: "user",
            content: `I've uploaded an image of a dog. The image data is: ${imageBase64.substring(0, 500)}... Please identify the dog breed based on typical characteristics visible in dog photos. Consider fur color, body shape, ear type, muzzle shape, and size. Provide your analysis in the specified JSON format.`,
          },
        ],
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const parsed: IdentificationResult = JSON.parse(jsonMatch[0]);
      setResult(parsed);

      // Save to database
      const base64Data = imageBase64.split(",")[1] || imageBase64;
      await saveIdentification({
        imageBase64: base64Data.substring(0, 50000), // Limit storage size
        breed: parsed.breed,
        confidence: parsed.confidence,
        description: parsed.description,
        characteristics: parsed.characteristics,
        funFact: parsed.funFact,
      });
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze image. Please try again with a clearer photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const resetIdentifier = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Upload Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
            Identify Your Dog
          </h2>
          <p className="text-amber-100/60">
            Upload a photo and our AI will identify the breed instantly
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !selectedImage && fileInputRef.current?.click()}
          className={`relative aspect-square sm:aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
            isDragging
              ? "border-amber-400 bg-amber-500/10"
              : selectedImage
              ? "border-amber-900/30 bg-[#12121a]"
              : "border-amber-900/30 bg-[#12121a] hover:border-amber-500/50 hover:bg-[#16161f]"
          }`}
        >
          {selectedImage ? (
            <>
              <img
                src={selectedImage}
                alt="Uploaded dog"
                className="absolute inset-0 w-full h-full object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      </svg>
                    </div>
                  </div>
                  <p className="mt-4 text-amber-100 font-medium animate-pulse">
                    Analyzing breed...
                  </p>
                </div>
              )}
              {!isAnalyzing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetIdentifier();
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-white mb-1">
                Drop your dog photo here
              </p>
              <p className="text-sm text-amber-100/50">
                or click to browse files
              </p>
              <p className="text-xs text-amber-100/30 mt-3">
                Supports JPG, PNG, WebP up to 10MB
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {result ? (
          <div className="animate-fadeIn">
            <div className="bg-[#12121a] rounded-2xl border border-amber-900/30 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-b border-amber-900/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-amber-400 text-sm font-medium mb-1">Identified Breed</p>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                      {result.breed}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.confidence === "High"
                        ? "bg-green-500/20 text-green-400"
                        : result.confidence === "Medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {result.confidence} Confidence
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-amber-400 mb-2">About this breed</h4>
                  <p className="text-amber-100/80 leading-relaxed">{result.description}</p>
                </div>

                {result.characteristics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-amber-400 mb-3">Key Characteristics</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.characteristics.map((trait, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-[#1a1a24] rounded-lg text-sm text-amber-100/70 border border-amber-900/20"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.funFact && (
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                    <div className="flex gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <h4 className="text-sm font-medium text-amber-400 mb-1">Fun Fact</h4>
                        <p className="text-amber-100/70 text-sm">{result.funFact}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={resetIdentifier}
              className="mt-4 w-full py-3 bg-[#1a1a24] border border-amber-900/30 rounded-xl text-amber-100/80 font-medium hover:bg-[#22222e] transition-colors"
            >
              Identify Another Dog
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-600/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-2">
                Ready to Identify
              </h3>
              <p className="text-amber-100/50 max-w-sm">
                Upload a photo of any dog and we'll tell you the breed, characteristics, and fun facts!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
