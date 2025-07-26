"use client";

import { Suspense } from "react";
import { ActivateForm } from "./activate-form";
import { Card, CardContent } from "@time-tracker/ui";

function ActivatePageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Loading activation page...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<ActivatePageFallback />}>
      <ActivateForm />
    </Suspense>
  );
}

