/**
 * Environment Diagnostics Tool
 * Helps identify why the same code works on some PCs but not others
 */

export interface DiagnosticResult {
  category: string;
  status: "pass" | "warning" | "fail";
  message: string;
  recommendation?: string;
}

export class EnvironmentDiagnostics {
  static async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Browser checks
    results.push(...this.checkBrowser());

    // Storage checks
    results.push(...this.checkStorage());

    // Network checks
    results.push(...(await this.checkNetwork()));

    // Performance checks
    results.push(...this.checkPerformance());

    // Console the results
    this.logResults(results);

    return results;
  }

  private static checkBrowser(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];
    const userAgent = navigator.userAgent;

    // Check Chrome version
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      const version = parseInt(chromeMatch[1]);
      if (version >= 115) {
        results.push({
          category: "Browser",
          status: "pass",
          message: `Chrome ${version} - Compatible`,
        });
      } else {
        results.push({
          category: "Browser",
          status: "fail",
          message: `Chrome ${version} - Too old`,
          recommendation: "Update Chrome to version 115 or higher",
        });
      }
    } else {
      // Check Firefox
      const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
      if (firefoxMatch) {
        const version = parseInt(firefoxMatch[1]);
        if (version >= 110) {
          results.push({
            category: "Browser",
            status: "pass",
            message: `Firefox ${version} - Compatible`,
          });
        } else {
          results.push({
            category: "Browser",
            status: "fail",
            message: `Firefox ${version} - Too old`,
            recommendation: "Update Firefox to version 110 or higher",
          });
        }
      } else {
        results.push({
          category: "Browser",
          status: "warning",
          message: "Unknown browser detected",
          recommendation:
            "Use Chrome 115+ or Firefox 110+ for best compatibility",
        });
      }
    }

    // Check if in private/incognito mode
    if (userAgent.includes("Incognito") || userAgent.includes("Private")) {
      results.push({
        category: "Browser",
        status: "warning",
        message: "Private browsing mode detected",
        recommendation: "Some features may not work in private mode",
      });
    }

    return results;
  }

  private static checkStorage(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Test localStorage
    try {
      const testKey = "diagnostic-test-" + Date.now();
      localStorage.setItem(testKey, "test");
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === "test") {
        results.push({
          category: "Storage",
          status: "pass",
          message: "localStorage - Working",
        });
      } else {
        results.push({
          category: "Storage",
          status: "fail",
          message: "localStorage - Data corruption",
          recommendation: "Clear browser cache and cookies",
        });
      }
    } catch (error) {
      results.push({
        category: "Storage",
        status: "fail",
        message: "localStorage - Blocked",
        recommendation:
          "Disable private mode or browser extensions blocking storage",
      });
    }

    // Test sessionStorage
    try {
      const testKey = "diagnostic-test-session-" + Date.now();
      sessionStorage.setItem(testKey, "test");
      const retrieved = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);

      if (retrieved === "test") {
        results.push({
          category: "Storage",
          status: "pass",
          message: "sessionStorage - Working",
        });
      } else {
        results.push({
          category: "Storage",
          status: "fail",
          message: "sessionStorage - Data corruption",
          recommendation: "Clear browser cache and cookies",
        });
      }
    } catch (error) {
      results.push({
        category: "Storage",
        status: "fail",
        message: "sessionStorage - Blocked",
        recommendation:
          "Disable private mode or browser extensions blocking storage",
      });
    }

    return results;
  }

  private static async checkNetwork(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check if backend is reachable
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        results.push({
          category: "Network",
          status: "pass",
          message: "Backend API - Reachable",
        });
      } else {
        results.push({
          category: "Network",
          status: "fail",
          message: `Backend API - Error ${response.status}`,
          recommendation:
            "Check if backend is running on http://localhost:8080",
        });
      }
    } catch (error) {
      results.push({
        category: "Network",
        status: "fail",
        message: "Backend API - Unreachable",
        recommendation: "Start the backend server: cd Backend && dotnet run",
      });
    }

    // Check CORS
    try {
      const response = await fetch("http://localhost:8080/api/health", {
        method: "GET",
        mode: "cors",
      });

      if (response.ok) {
        results.push({
          category: "Network",
          status: "pass",
          message: "CORS - Configured correctly",
        });
      }
    } catch (error) {
      results.push({
        category: "Network",
        status: "warning",
        message: "CORS - May have issues",
        recommendation: "Check backend CORS configuration",
      });
    }

    return results;
  }

  private static checkPerformance(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Check memory usage (rough estimate)
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);

      if (usedMB < 50) {
        results.push({
          category: "Performance",
          status: "pass",
          message: `Memory usage: ${usedMB}MB / ${totalMB}MB - Good`,
        });
      } else if (usedMB < 100) {
        results.push({
          category: "Performance",
          status: "warning",
          message: `Memory usage: ${usedMB}MB / ${totalMB}MB - High`,
          recommendation: "Close other tabs or restart browser",
        });
      } else {
        results.push({
          category: "Performance",
          status: "fail",
          message: `Memory usage: ${usedMB}MB / ${totalMB}MB - Very high`,
          recommendation: "Restart browser or check for memory leaks",
        });
      }
    }

    // Check if page is visible (not in background)
    if (document.hidden) {
      results.push({
        category: "Performance",
        status: "warning",
        message: "Page is in background",
        recommendation: "Focus the browser tab for best performance",
      });
    }

    return results;
  }

  private static logResults(results: DiagnosticResult[]): void {
    console.group("🔍 Environment Diagnostics");

    const categories = [...new Set(results.map((r) => r.category))];

    categories.forEach((category) => {
      const categoryResults = results.filter((r) => r.category === category);
      console.group(`${category} (${categoryResults.length} checks)`);

      categoryResults.forEach((result) => {
        const icon =
          result.status === "pass"
            ? "✅"
            : result.status === "warning"
            ? "⚠️"
            : "❌";

        console.log(`${icon} ${result.message}`);

        if (result.recommendation) {
          console.log(`   💡 ${result.recommendation}`);
        }
      });

      console.groupEnd();
    });

    // Summary
    const passCount = results.filter((r) => r.status === "pass").length;
    const warningCount = results.filter((r) => r.status === "warning").length;
    const failCount = results.filter((r) => r.status === "fail").length;

    console.log(
      `\n📊 Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failed`
    );

    if (failCount > 0) {
      console.warn(
        "🚨 Some critical issues found. Chat may not work properly."
      );
    } else if (warningCount > 0) {
      console.warn(
        "⚠️ Some warnings found. Chat should work but may have issues."
      );
    } else {
      console.log("✅ All checks passed. Environment looks good!");
    }

    console.groupEnd();
  }

  // Quick check for common issues
  static quickCheck(): boolean {
    try {
      // Test localStorage
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");

      // Test basic fetch
      if (typeof fetch === "undefined") {
        console.error("❌ Fetch API not available");
        return false;
      }

      console.log("✅ Quick environment check passed");
      return true;
    } catch (error) {
      console.error("❌ Quick environment check failed:", error);
      return false;
    }
  }
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  // Run after a short delay to ensure everything is loaded
  setTimeout(() => {
    void EnvironmentDiagnostics.runFullDiagnostics();
  }, 2000);
}

