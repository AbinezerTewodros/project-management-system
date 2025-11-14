// API Configuration and Base Client
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
  errors?: string[];
  status?: number;
  // raw unmodified response body from server (useful for debugging validation issues)
  raw?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshingToken: boolean = false;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.loadToken();
    this.setupInterceptors();
  }

  private loadToken() {
    const token = localStorage.getItem("authToken");
    if (token) {
      this.axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    }
  }

  public setToken(token: string) {
    this.axiosInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
    localStorage.setItem("authToken", token);
  }

  public clearToken() {
    delete this.axiosInstance.defaults.headers.common["Authorization"];
    localStorage.removeItem("authToken");
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(
          "🔐 Auth Header:",
          this.axiosInstance.defaults.headers.common["Authorization"]
        );
        console.log("🚀 Request Headers:", config.headers);
        return config;
      },
      (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
      }
    );
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        // ✅ FIX: Pass through network errors (no response) to let method handlers deal with them
        if (!error.response) {
          // Network error - let the original error propagate so get/post methods can handle it
          return Promise.reject(error);
        }

        console.error("❌ Response Error Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          headers: error.response?.headers,
          data: error.response?.data,
        });
        const originalConfig = error.config;
        if (
          error.response?.status === 401 &&
          originalConfig &&
          !(originalConfig as any)._retry &&
          !this.isRefreshingToken
        ) {
          (originalConfig as any)._retry = true;
          this.isRefreshingToken = true;
          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const refreshResponse = await this.axiosInstance.post<{
                accessToken: string;
                refreshToken: string;
              }>("/Auth/refresh-token", { token: refreshToken });
              const { accessToken, refreshToken: newRefreshToken } =
                refreshResponse.data;
              if (accessToken) {
                this.setToken(accessToken);
                if (newRefreshToken) {
                  localStorage.setItem("refreshToken", newRefreshToken);
                }
                return this.axiosInstance(originalConfig);
              } else {
                throw new Error("Token refresh failed: no access token");
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            this.clearToken();
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
          } finally {
            this.isRefreshingToken = false;
          }
        }

        let message = "Request failed";
        let errors: string[] = [];
        const status = error.response?.status;
        const raw = error.response?.data;
        if (raw && typeof raw === "object") {
          const errorData = raw as {
            message?: string;
            errors?: string[];
            title?: string;
            detail?: string;
          };
          message =
            errorData.message || errorData.title || errorData.detail || message;
          // Some backends return errors as object map {field: [msg]}
          if (!errorData.errors && raw && typeof raw === "object") {
            const collected: string[] = [];
            for (const [k, v] of Object.entries(
              raw as Record<string, unknown>
            )) {
              if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
                collected.push(...(v as string[]).map((m) => `${k}: ${m}`));
              }
            }
            if (collected.length) errors = collected;
          }
          errors = errorData.errors || errors;
        }
        return Promise.reject({
          data: null,
          success: false,
          message,
          errors,
          status,
          raw,
        } as ApiResponse<never>);
      }
    );
  }

  public async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${this.axiosInstance.defaults.baseURL}${endpoint}`;
      console.log("🌐 API Call - Full URL:", fullUrl);
      console.log("🔧 Endpoint parameter:", endpoint);
      console.log("🏠 Base URL:", this.axiosInstance.defaults.baseURL);

      const res = await this.axiosInstance.get<T>(endpoint, config);
      console.log("✅ API Success - Status:", res.status);
      console.log("📦 Response data:", res.data);
      return { data: res.data, success: true };
    } catch (err: any) {
      console.error(
        "❌ API Error - Full URL:",
        `${this.axiosInstance.defaults.baseURL}${endpoint}`
      );
      console.error("❌ Error details:", err.response?.data || err.message);
      console.error("❌ Status code:", err.response?.status);

      // Check if it's a network error vs API error
      const baseUrl = this.axiosInstance.defaults.baseURL || 'the backend server';
      if (!err.response) {
        if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED" || err.message?.includes('ERR_CONNECTION_REFUSED') || err.message?.includes('Failed to fetch')) {
          return {
            data: null,
            success: false,
            message: `Cannot connect to backend server at ${baseUrl}. Please ensure the backend is running on port 8080.`,
            status: 0,
          };
        } else if (err.message) {
          return {
            data: null,
            success: false,
            message: `Network error: ${err.message}. Backend may not be running at ${baseUrl}.`,
            status: 0,
          };
        }
      }

      if (err && err.success === false) return err;
      return {
        data: null,
        success: false,
        message: err.response?.data?.message || err.message || "Request failed",
        errors: err.response?.data?.errors || [],
        status: err.response?.status,
      } as ApiResponse<T>;
    }
  }

    public async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            console.log('🌐 POST API Call:', `${this.axiosInstance.defaults.baseURL}${endpoint}`);
            console.log('📦 POST Data:', JSON.stringify(data, null, 2));
            console.log('🔑 Auth Header:', this.axiosInstance.defaults.headers.common['Authorization']);
            const res = await this.axiosInstance.post<T>(endpoint, data, config);
            console.log('✅ POST Success:', res.data);
            console.log('✅ POST Status:', res.status);
            console.log('✅ POST Headers:', res.headers);
            return { data: res.data, success: true, status: res.status };
        } catch (err: any) {

            console.error('❌ POST API Error:', err);
            console.error('🔍 Error URL:', `${this.axiosInstance.defaults.baseURL}${endpoint}`);
            console.error('🔍 Error Data:', JSON.stringify(data, null, 2));
            console.error('🔍 Error Message:', err.message);
            console.error('🔍 Error Response:', err.response);
            console.error('🔍 Error Response Data:', err.response?.data);
            console.error('🔍 Error Status:', err.response?.status);
            console.error('🔍 Error Status Text:', err.response?.statusText);
            console.error('🔍 Error Headers:', err.response?.headers);
            console.error('🔍 Error Details:', err.response?.data?.errors);
            console.error('🔍 Error Message:', err.response?.data?.message);
            console.error('🔍 Error Config:', err.config);
            console.error('🔍 Error Code:', err.code);
            console.error('🔍 Is Axios Error:', err.isAxiosError);

            // ✅ DETAILED ERROR LOGGING for 400 Bad Request
            if (err.response?.status === 400) {
              console.error('🚨 ========================================');
              console.error('🚨 VALIDATION ERRORS (400 Bad Request)');
              console.error('🚨 ========================================');
              console.error('📋 Full Response Data:', err.response.data);

              if (err.response?.data?.errors) {
                if (Array.isArray(err.response.data.errors)) {
                  console.error('📋 Validation Errors (Array):');
                  err.response.data.errors.forEach((error: any, index: number) => {
                    console.error(`   ${index + 1}. ${error}`);
                  });
                } else if (typeof err.response.data.errors === 'object') {
                  console.error('📋 Validation Errors (Object):');
                  Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    console.error(`   ❌ Field: ${field}`);
                    if (Array.isArray(messages)) {
                      messages.forEach((msg: any) => console.error(`      - ${msg}`));
                    } else {
                      console.error(`      - ${messages}`);
                    }
                  });
                }
              }
              console.error('🚨 ========================================');
            }

            // If this is already a processed error from the interceptor
            if (err && err.success === false) return err;

            // Extract error details from axios error
            let message = 'Request failed';
            let errors: string[] = [];
            let status = err.response?.status;
            let raw = err.response?.data;

            // Handle network errors (no response from server)
            if (!err.response) {
                const baseUrl = this.axiosInstance.defaults.baseURL || 'the backend server';
                if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || err.message?.includes('ERR_CONNECTION_REFUSED') || err.message?.includes('Failed to fetch')) {
                    message = `Cannot connect to backend server at ${baseUrl}. Please ensure the backend is running on port 8080. Try: 1) Check if backend is running, 2) Verify backend is on http://localhost:8080, 3) Check browser console for CORS errors.`;
                } else if (err.code === 'ECONNABORTED') {
                    message = 'Request timeout: Server took too long to respond.';
                } else if (err.message) {
                    message = `Network error: ${err.message}. Backend may not be running at ${baseUrl}.`;
                } else {
                    message = `Cannot connect to backend server at ${baseUrl}. Please ensure the backend is running.`;
                }
                console.error('🚨 NETWORK ERROR:', message);
                console.error('🚨 Error code:', err.code);
                console.error('🚨 Error message:', err.message);
                console.error('🚨 Backend URL should be:', baseUrl);
                return {
                    data: null,
                    success: false,
                    message,
                    errors: [message],
                    status: 0,
                    raw: null,
                } as ApiResponse<T>;
            }

            // Parse backend validation errors
            if (raw && typeof raw === 'object') {
                const errorData = raw as any;

                // Try different error message fields
                message = errorData.message || errorData.title || errorData.detail || message;

                // Extract validation errors
                if (errorData.errors) {
                    if (typeof errorData.errors === 'object') {
                        // ASP.NET Core ModelState errors: { "field": ["error1", "error2"] }
                        errors = Object.entries(errorData.errors).flatMap(([field, messages]) => {
                            if (Array.isArray(messages)) {
                                return messages.map(msg => `${field}: ${msg}`);
                            }
                            return [`${field}: ${messages}`];
                        });
                    } else if (Array.isArray(errorData.errors)) {
                        errors = errorData.errors;
                    }
                }

                console.error('🔍 Parsed Errors:', errors);
            }

            return {
                data: null,
                success: false,
                message,
                errors: errors.length > 0 ? errors : [message],
                status,
                raw,
            } as ApiResponse<T>;
        }
    }

    public async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            console.log('🌐 PUT API Call:', `${this.axiosInstance.defaults.baseURL}${endpoint}`);
            console.log('📦 PUT Data:', JSON.stringify(data, null, 2));
            console.log('📦 PUT Data Type:', typeof data);
            const res = await this.axiosInstance.put<T>(endpoint, data, config);
            console.log('✅ PUT Success Response:', {
                status: res.status,
                statusText: res.statusText,
                data: res.data,
                headers: res.headers
            });
            console.log('🎯 Returning API Response:', { data: res.data, success: true, status: res.status });
            return { data: res.data, success: true, status: res.status };  // ✅ Include status
        } catch (err: any) {
            console.error('❌ PUT Error:', err);
            console.error('🔍 PUT Error URL:', `${this.axiosInstance.defaults.baseURL}${endpoint}`);
            console.error('🔍 PUT Error Status:', err.response?.status);
            console.error('🔍 PUT Error Response:', err.response?.data);
            console.error('🔍 PUT Error Response Data:', JSON.stringify(err.response?.data, null, 2));
            console.error('🔍 PUT Validation Errors:', err.response?.data?.errors);

            // Extract validation errors from ASP.NET Core format
            const backendErrors = err.response?.data?.errors || {};
            const errorMessages: string[] = [];

            if (typeof backendErrors === 'object' && Object.keys(backendErrors).length > 0) {
                Object.entries(backendErrors).forEach(([field, messages]: [string, any]) => {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => errorMessages.push(`${field}: ${msg}`));
                    } else {
                        errorMessages.push(`${field}: ${messages}`);
                    }
                });
            }

            console.error('📋 Formatted Validation Errors:', errorMessages);

            if (err && err.success === false) return err;
            
            // ✅ Extract error message - handle different backend response formats
            let errorMessage = 'Request failed';
            if (typeof err.response?.data === 'string') {
                errorMessage = err.response.data;  // ✅ Backend sends plain string
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.title) {
                errorMessage = err.response.data.title;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            console.error('🎯 Final error message:', errorMessage);
            
            return {
                data: null,
                success: false,
                message: errorMessage,
                errors: errorMessages.length > 0 ? errorMessages : (err.errors || []),
                status: err.response?.status || err.status,
                raw: err.response?.data || err.raw,
            } as ApiResponse<T>;
        }
    }

  public async patch<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const res = await this.axiosInstance.patch<T>(endpoint, data, config);
      return { data: res.data, success: true };
    } catch (err: any) {
      if (err && err.success === false) return err;
      return {
        data: null,
        success: false,
        message: err.message || "Request failed",
        errors: err.errors || [],
        status: err.status,
        raw: err.raw,
      } as ApiResponse<T>;
    }
  }

  public async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const res = await this.axiosInstance.delete<T>(endpoint, config);
      return { data: res.data, success: true };
    } catch (err: any) {
      if (err && err.success === false) return err;
      return {
        data: null,
        success: false,
        message: err.message || "Request failed",
        errors: err.errors || [],
        status: err.status,
        raw: err.raw,
      } as ApiResponse<T>;
    }
  }

  // For file uploads
  public async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const res = await this.axiosInstance.post<T>(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { data: res.data, success: true };
    } catch (err: any) {
      return {
        data: null,
        success: false,
        message: err.message || "Request failed",
        errors: err.errors || [],
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export const testAPIEndpoints = async () => {
  const endpoints = [
    "ProjectTask/Get-all-tasks",
    "ProjectTask/create-task",
    "independent-tasks",
    "PersonalTodo/Get-user-todos",
  ];

  console.log("🧪 Testing API endpoints...");

  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint);
      console.log(`✅ ${endpoint}: ${response.success ? "WORKS" : "FAILED"}`);
    } catch (error: any) {
      console.log(`❌ ${endpoint}: FAILED - ${error.message}`);
    }
  }
};
