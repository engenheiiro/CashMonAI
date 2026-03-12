import React from "react";
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Ops, algo deu errado</h2>
      <p className="mb-6 max-w-md text-zinc-600 dark:text-zinc-400">
        Ocorreu um erro inesperado ao carregar esta parte do aplicativo. 
        Nossos engenheiros (ou a IA) já foram notificados.
      </p>
      <div className="mb-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4 text-left font-mono text-xs text-zinc-500 dark:text-zinc-400 overflow-auto max-w-full">
        <p className="font-bold mb-1">Erro:</p>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
      <Button onClick={resetErrorBoundary} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
