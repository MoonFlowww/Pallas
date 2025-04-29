"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/20">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="mb-2 text-2xl font-semibold text-red-500">Something went wrong</h2>
          <p className="mb-4 text-sm text-red-400 max-w-md">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          {this.state.errorInfo && (
            <pre className="mb-4 max-h-32 overflow-auto rounded bg-red-100 p-2 text-left text-xs text-red-600 dark:bg-red-900/40 dark:text-red-200">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} variant="destructive">
              Refresh Page
            </Button>
            <Button onClick={() => this.setState({ hasError: false })} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

