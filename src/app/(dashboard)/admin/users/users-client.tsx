"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui";
import { InviteForm } from "./invite-form";

export function UsersClient() {
  const [showForm, setShowForm] = useState(false);
  const handleClose = useCallback(() => setShowForm(false), []);

  return (
    <div>
      {!showForm && (
        <Button onClick={() => setShowForm(true)}>ユーザー招待</Button>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md mx-4">
            <InviteForm onClose={handleClose} />
          </div>
        </div>
      )}
    </div>
  );
}
