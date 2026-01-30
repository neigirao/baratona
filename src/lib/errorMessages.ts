type Language = 'pt' | 'en';

export interface FriendlyError {
  title: string;
  description: string;
  canRetry: boolean;
}

export function getFriendlyError(error: unknown, language: Language): FriendlyError {
  const errorStr = error instanceof Error ? error.message : String(error);
  const isNetworkError = errorStr.includes('fetch') || 
                         errorStr.includes('network') || 
                         errorStr.includes('Failed to fetch') ||
                         errorStr.includes('NetworkError');

  if (isNetworkError) {
    return {
      title: language === 'pt' ? 'Problema de conexão' : 'Connection issue',
      description: language === 'pt' 
        ? 'Verifique sua internet e tente novamente.' 
        : 'Check your internet and try again.',
      canRetry: true,
    };
  }

  // Supabase specific errors
  if (errorStr.includes('JWT') || errorStr.includes('auth')) {
    return {
      title: language === 'pt' ? 'Sessão expirada' : 'Session expired',
      description: language === 'pt' 
        ? 'Por favor, atualize a página.' 
        : 'Please refresh the page.',
      canRetry: false,
    };
  }

  if (errorStr.includes('duplicate') || errorStr.includes('unique')) {
    return {
      title: language === 'pt' ? 'Ação já realizada' : 'Already done',
      description: language === 'pt' 
        ? 'Esta ação já foi registrada anteriormente.' 
        : 'This action was already recorded.',
      canRetry: false,
    };
  }

  if (errorStr.includes('timeout') || errorStr.includes('Timeout')) {
    return {
      title: language === 'pt' ? 'Servidor lento' : 'Server slow',
      description: language === 'pt' 
        ? 'O servidor está demorando. Tente novamente.' 
        : 'The server is taking long. Try again.',
      canRetry: true,
    };
  }

  // Generic error
  return {
    title: language === 'pt' ? 'Ops! Algo deu errado' : 'Oops! Something went wrong',
    description: language === 'pt' 
      ? 'Tente novamente em alguns segundos.' 
      : 'Try again in a few seconds.',
    canRetry: true,
  };
}
