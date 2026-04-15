import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";

interface DogIdentification {
  _id: Id<"dogIdentifications">;
  _creationTime: number;
  userId: Id<"users">;
  imageBase64: string;
  breed: string;
  confidence: string;
  description: string;
  characteristics: string[];
  funFact: string;
  createdAt: number;
}

export function History() {
  const identifications = useQuery(api.dogs.list);
  const removeIdentification = useMutation(api.dogs.remove);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: Id<"dogIdentifications">) => {
    setDeletingId(id);
    try {
      await removeIdentification({ id });
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (identifications === undefined) {
    return (
      <div className="space-y-4">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
            Your History
          </h2>
          <p className="text-amber-100/60">
            All your identified dogs in one place
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#12121a] rounded-2xl border border-amber-900/30 p-4 animate-pulse"
            >
              <div className="aspect-square bg-amber-900/20 rounded-xl mb-4" />
              <div className="h-6 bg-amber-900/20 rounded w-3/4 mb-2" />
              <div className="h-4 bg-amber-900/20 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (identifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-600/10 flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-amber-500/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-xl font-display font-semibold text-white mb-2">
          No identifications yet
        </h3>
        <p className="text-amber-100/50 text-center max-w-sm">
          Start by uploading a photo of a dog in the Identify tab. Your history
          will appear here!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
          Your History
        </h2>
        <p className="text-amber-100/60">
          {identifications.length} dog{identifications.length !== 1 ? "s" : ""} identified
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {identifications.map((item: DogIdentification) => (
          <div
            key={item._id}
            className="group bg-[#12121a] rounded-2xl border border-amber-900/30 overflow-hidden hover:border-amber-500/30 transition-all"
          >
            <div className="relative aspect-video bg-[#0a0a0f] overflow-hidden">
              {item.imageBase64 ? (
                <img
                  src={`data:image/jpeg;base64,${item.imageBase64}`}
                  alt={item.breed}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-amber-900/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <button
                onClick={() => handleDelete(item._id)}
                disabled={deletingId === item._id}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
              >
                {deletingId === item._id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
              <span
                className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-xs font-medium ${
                  item.confidence === "High"
                    ? "bg-green-500/80 text-white"
                    : item.confidence === "Medium"
                    ? "bg-amber-500/80 text-white"
                    : "bg-gray-500/80 text-white"
                }`}
              >
                {item.confidence}
              </span>
            </div>

            <div className="p-4">
              <h3 className="font-display font-bold text-white text-lg mb-1 truncate">
                {item.breed}
              </h3>
              <p className="text-amber-100/50 text-sm line-clamp-2 mb-3">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {item.characteristics.slice(0, 3).map((trait: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-[#1a1a24] rounded text-xs text-amber-100/60"
                  >
                    {trait}
                  </span>
                ))}
                {item.characteristics.length > 3 && (
                  <span className="px-2 py-0.5 text-xs text-amber-100/40">
                    +{item.characteristics.length - 3} more
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-amber-900/20">
                <p className="text-xs text-amber-100/30">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
