import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  feature?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.feature ?? 'Feature'}] crashed:`, error, info);
  }

  private reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-card border border-destructive/30 rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <div>
            <p className="font-semibold text-sm">Erro ao carregar {this.props.feature ?? 'esta seção'}</p>
            <p className="text-xs text-muted-foreground mt-1">{this.state.error?.message}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.history.back()}>
              Voltar
            </Button>
            <Button size="sm" className="flex-1" onClick={this.reset}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
