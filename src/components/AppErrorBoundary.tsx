import React from "react";

import { Button } from "@/components/ui/button";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <h1 className="font-display text-xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            The app hit a runtime error and couldnt finish rendering.
          </p>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-left overflow-auto max-h-40">
            <pre className="whitespace-pre-wrap break-words">
              {this.state.error?.message}
            </pre>
          </div>

          <Button onClick={this.handleReload} className="w-full">
            Reload
          </Button>
        </div>
      </div>
    );
  }
}
