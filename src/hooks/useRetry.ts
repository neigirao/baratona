import { useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 8000,
};

/**
 * Executes an async operation with exponential backoff retry
 * Delays: 1s, 2s, 4s (capped at maxDelay)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay } = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        // Calculate delay with exponential backoff: baseDelay * 2^(attempt-1)
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
        options.onRetry?.(attempt, lastError);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Hook that provides retry functionality with state management
 */
export function useRetry() {
  const retryCountRef = useRef<Map<string, number>>(new Map());
  
  const executeWithRetry = useCallback(async <T>(
    operationId: string,
    operation: () => Promise<{ success: boolean; error?: Error }>,
    options: RetryOptions & { 
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
    } = {}
  ): Promise<boolean> => {
    const { 
      maxAttempts = 3, 
      baseDelay = 1000, 
      maxDelay = 8000,
      successMessage,
      errorMessage = 'Operação falhou. Tente novamente.',
      showToast = true,
    } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (result.success) {
          // Reset retry count on success
          retryCountRef.current.delete(operationId);
          
          if (showToast && successMessage) {
            toast({
              title: successMessage,
              duration: 2000,
            });
          }
          
          return true;
        }
        
        // Operation returned false but no exception
        lastError = result.error || new Error('Operation failed');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
      
      if (attempt < maxAttempts) {
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
        // Store retry count
        retryCountRef.current.set(operationId, attempt);
        
        console.log(`[Retry] ${operationId}: attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All attempts failed
    retryCountRef.current.delete(operationId);
    
    console.error(`[Retry] ${operationId}: all ${maxAttempts} attempts failed`, lastError);
    
    if (showToast) {
      toast({
        title: errorMessage,
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
        duration: 4000,
      });
    }
    
    return false;
  }, []);
  
  const getRetryCount = useCallback((operationId: string) => {
    return retryCountRef.current.get(operationId) || 0;
  }, []);
  
  return {
    executeWithRetry,
    getRetryCount,
  };
}
