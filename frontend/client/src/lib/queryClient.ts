import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Throws an error if the HTTP response is not 'ok'.
 *
 * @param {Response} res - The response object from a fetch call.
 * @throws {Error} If the response status is not in the 200-299 range.
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * A generic function for making API requests.
 *
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {string} url - The URL to send the request to.
 * @param {unknown} [data] - The data to be sent in the request body.
 * @returns {Promise<Response>} A promise that resolves with the response.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const res = await fetch(url, {
    method,
    headers: data instanceof FormData ? {} : (data ? { "Content-Type": "application/json" } : {}),
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
/**
 * A factory for creating a default query function for React Query.
 *
 * This function returns a query function that can be configured to either
 * throw an error or return null when an unauthorized (401) response is
 * received.
 *
 * @param {{ on401: UnauthorizedBehavior }} options - Configuration for handling 401 responses.
 * @returns {QueryFunction<T>} The configured query function.
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

/**
 * The application's central QueryClient instance.
 *
 * This instance is configured with default options for queries and mutations,
 * such as disabling retries and window-focus refetching, and setting a default
 * query function that throws on error.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
