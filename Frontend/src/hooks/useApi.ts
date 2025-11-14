import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '@/lib/api';

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiOptions {
    immediate?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}

export function useApi<T>(
    apiCall: () => Promise<ApiResponse<T>>,
    options: UseApiOptions = {}
) {
    const { immediate = true, onSuccess, onError } = options;

    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await apiCall();

            if (response.success) {
                setState({
                    data: response.data,
                    loading: false,
                    error: null,
                });
                onSuccess?.(response.data);
            } else {
                const errorMessage = response.message || 'An error occurred';
                setState({
                    data: null,
                    loading: false,
                    error: errorMessage,
                });
                onError?.(errorMessage);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setState({
                data: null,
                loading: false,
                error: errorMessage,
            });
            onError?.(errorMessage);
        }
    }, [apiCall, onSuccess, onError]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    const reset = useCallback(() => {
        setState({
            data: null,
            loading: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        execute,
        reset,
    };
}

export function useApiMutation<T, P = any>(
    apiCall: (params: P) => Promise<ApiResponse<T>>,
    options: UseApiOptions = {}
) {
    const { onSuccess, onError } = options;

    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const mutate = useCallback(async (params: P) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await apiCall(params);

            if (response.success) {
                setState({
                    data: response.data,
                    loading: false,
                    error: null,
                });
                onSuccess?.(response.data);
                return response.data;
            } else {
                const errorMessage = response.message || 'An error occurred';
                setState({
                    data: null,
                    loading: false,
                    error: errorMessage,
                });
                onError?.(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setState({
                data: null,
                loading: false,
                error: errorMessage,
            });
            onError?.(errorMessage);
            throw error;
        }
    }, [apiCall, onSuccess, onError]);

    const reset = useCallback(() => {
        setState({
            data: null,
            loading: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        mutate,
        reset,
    };
}
