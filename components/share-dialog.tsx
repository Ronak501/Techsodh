"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Share2, Copy, Trash2, X } from "lucide-react";
import type { ResearchShare } from "@/lib/research-types";

type PermissionLevel = "view" | "comment" | "edit";

interface ShareDialogProps {
  researchId: string;
  onClose: () => void;
}

export function ShareDialog({ researchId, onClose }: ShareDialogProps) {
  const [shares, setShares] = useState<ResearchShare[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<PermissionLevel>("view");
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [shareLink] = useState(
    `${typeof window !== "undefined" ? window.location.origin : ""}/research/${researchId}/shared`,
  );

  const handleShare = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/research/${researchId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shared_with_email: email,
          permission_level: permission,
          expires_in_days: expiresInDays,
        }),
      });

      if (response.ok) {
        const share = (await response.json()) as ResearchShare;
        setShares((prev) => [...prev, share]);
        setEmail("");
      }
    } catch (error) {
      console.error("Failed to share:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await fetch(`/api/research/${researchId}/share/${shareId}`, {
        method: "DELETE",
      });
      setShares((prev) => prev.filter((share) => share.id !== shareId));
    } catch (error) {
      console.error("Failed to remove share:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Research
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Link Section */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium mb-2">Public Link</p>
          <div className="flex gap-2">
            <Input value={shareLink} readOnly className="flex-1 text-sm" />
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Share with Email Section */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium">Share with Email</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as PermissionLevel)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="view">View Only</option>
            <option value="comment">Can Comment</option>
            <option value="edit">Can Edit</option>
          </select>
          <div>
            <label className="text-sm">Expires in (days):</label>
            <Input
              type="number"
              min="1"
              max="365"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleShare}
            disabled={!email || loading}
            className="w-full"
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        </div>

        {/* Shares List */}
        {shares.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Shared With</p>
            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {share.shared_with_email}
                    </p>
                    <p className="text-xs text-gray-600">
                      {share.permission_level}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveShare(share.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
