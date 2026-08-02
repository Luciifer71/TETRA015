/**
 * Frontend API Service
 * Handles all communication with the backend for invoice processing
 * 
 * Upload API defaults to FastAPI on http://localhost:8000.
 * Dashboard/auth data defaults to Node API on http://localhost:8001/api/v1.
 * Features:
 * - File upload with progress tracking
 * - Upload status polling
 * - Error handling with retry logic
 * - Request/response logging (dev mode)
 */

export interface UploadResponse {
  invoice_id: string;
  file_name: string;
  file_size: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  uploaded_at: string;
}

export interface ExtractionData {
  invoice_number: string;
  vendor_name: string;
  vendor_gstin: string;
  invoice_date: string;
  due_date: string;
  po_number: string;
  total_amount: number;
  tax_amount: number;
  currency: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RiskAssessment {
  risk_score: number; // 0-100
  risk_level: "MINIMAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_factors: string[];
  recommendation: string;
}

export interface UploadDetailResponse {
  id: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  upload_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  invoice_id: string | null;
  error_message: string | null;
  extracted_data: ExtractionData | null;
  confidence_scores?: Record<string, number> | null;
  risk_score?: number | null;
  risk_level?: RiskAssessment["risk_level"] | null;
  validation_errors?: Array<Record<string, any>> | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * API Client Service
 */
class ApiClient {
  private baseUrl: string;
  private isDev: boolean = import.meta.env.DEV;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";
    this.log("API Client initialized", { baseUrl: this.baseUrl });
  }

  /**
   * Internal logging for development
   */
  private log(message: string, data?: any): void {
    if (this.isDev) {
      console.log(`[API] ${message}`, data);
    }
  }

  /**
   * Internal error logging
   */
  private logError(message: string, error?: any): void {
    console.error(`[API ERROR] ${message}`, error);
  }

  /**
   * Upload invoice file with progress tracking
   * 
   * @param file - File to upload
   * @param onProgress - Callback for progress updates
   * @returns Promise<ApiResponse<UploadResponse>>
   */
  async uploadInvoice(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: (event.loaded / event.total) * 100,
            };
            onProgress(progress);
          }
        });
      }

      // Completion
      xhr.addEventListener("load", () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            this.log("Upload successful", response);
            resolve(response);
          } else {
            const error = JSON.parse(xhr.responseText);
            this.logError("Upload failed", error);
            reject(new Error(error.detail || "Upload failed"));
          }
        } catch (e) {
          this.logError("Failed to parse upload response", e);
          reject(e);
        }
      });

      // Error handling
      xhr.addEventListener("error", () => {
        const error = new Error("Network error during upload");
        this.logError("Network error", error);
        reject(error);
      });

      // Timeout
      xhr.timeout = 120000; // 2 minutes
      xhr.addEventListener("timeout", () => {
        const error = new Error("Upload timeout (2 minutes)");
        this.logError("Upload timeout", error);
        reject(error);
      });

      // Send
      xhr.open("POST", `${this.baseUrl}/api/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Get upload status and processing results
   * 
   * @param uploadId - The upload ID to check
   * @returns Promise<ApiResponse<UploadDetailResponse>>
   */
  async getUploadStatus(uploadId: string): Promise<ApiResponse<UploadDetailResponse>> {
    const url = `${this.baseUrl}/api/upload/${uploadId}`;
    
    try {
      this.log("Fetching upload status", { uploadId });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.log("Upload status retrieved", data);
      return data;
    } catch (error) {
      this.logError("Failed to fetch upload status", error);
      throw error;
    }
  }

  /**
   * Poll upload status with retries and exponential backoff
   * 
   * @param uploadId - The upload ID to poll
   * @param maxWaitTime - Maximum time to wait in milliseconds (default 10 minutes)
   * @returns Promise<UploadDetailResponse>
   */
  async pollUploadStatus(
    uploadId: string,
    maxWaitTime: number = 600000 // 10 minutes
  ): Promise<UploadDetailResponse> {
    const startTime = Date.now();
    let attempt = 0;
    const maxAttempts = 50; // Maximum number of polls

    while (Date.now() - startTime < maxWaitTime && attempt < maxAttempts) {
      try {
        const response = await this.getUploadStatus(uploadId);
        
        if (!response.success) {
          throw new Error(response.message);
        }

        const status = response.data.upload_status;

        if (status === "COMPLETED") {
          this.log("Upload processing completed", response.data);
          return response.data;
        }

        if (status === "FAILED") {
          const err = new Error(response.data.error_message || "Upload processing failed");
          (err as any).isFatal = true;
          throw err;
        }

        // Still processing, wait and retry with exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(1.5, attempt), 5000); // Max 5 seconds
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        attempt++;
      } catch (error) {
        if (error instanceof Error && (error as any).isFatal) {
          throw error;
        }

        this.logError(`Poll attempt ${attempt} failed`, error);
        
        // Don't retry on client errors (400-499) except 408 (timeout)
        if (error instanceof Error && error.message.includes("HTTP 4")) {
          throw error;
        }

        // Retry on server errors or network issues
        const backoffTime = Math.min(1000 * Math.pow(1.5, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        attempt++;
      }
    }

    throw new Error(
      `Upload processing timeout after ${maxWaitTime / 1000}s (${attempt} attempts)`
    );
  }

  /**
   * Get list of all uploads (paginated)
   * 
   * @param page - Page number (default 1)
   * @param limit - Items per page (default 20)
   * @returns Promise<ApiResponse<{items: UploadDetailResponse[], total: number, page: number}>>
   */
  async getUploads(page: number = 1, limit: number = 20) {
    const url = `${this.baseUrl}/api/uploads?page=${page}&limit=${limit}`;
    
    try {
      this.log("Fetching uploads list", { page, limit });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.log("Uploads list retrieved", data);
      return data;
    } catch (error) {
      this.logError("Failed to fetch uploads", error);
      throw error;
    }
  }

  /**
   * Delete an upload record
   * 
   * @param uploadId - The upload ID to delete
   * @returns Promise<ApiResponse<{deleted: boolean}>>
   */
  async deleteUpload(uploadId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const url = `${this.baseUrl}/api/upload/${uploadId}`;
    
    try {
      this.log("Deleting upload", { uploadId });
      
      const response = await fetch(url, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.log("Upload deleted", data);
      return data;
    } catch (error) {
      this.logError("Failed to delete upload", error);
      throw error;
    }
  }

  /**
   * Get processing statistics/dashboard data
   * 
   * @returns Promise<{total: number, successful: number, failed: number, avgConfidence: number}>
   */
  async getDashboardStats() {
    const url = `${this.baseUrl}/api/stats`;
    
    try {
      this.log("Fetching dashboard stats");
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.log("Dashboard stats retrieved", data);
      return data;
    } catch (error) {
      this.logError("Failed to fetch dashboard stats", error);
      // Return default stats on error
      return {
        total: 0,
        successful: 0,
        failed: 0,
        avgConfidence: 0,
      };
    }
  }

  /**
   * Retry failed upload processing
   * 
   * @param uploadId - The upload ID to retry
   * @returns Promise<ApiResponse<UploadResponse>>
   */
  async retryUpload(uploadId: string): Promise<ApiResponse<UploadResponse>> {
    const url = `${this.baseUrl}/api/upload/${uploadId}/retry`;
    
    try {
      this.log("Retrying upload", { uploadId });
      
      const response = await fetch(url, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.log("Upload retry initiated", data);
      return data;
    } catch (error) {
      this.logError("Failed to retry upload", error);
      throw error;
    }
  }
}

// Create axios-like instance for compatibility with service files
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export singleton instance
export const apiClient = new ApiClient();

// Export axios instance as default for services
export default api;
