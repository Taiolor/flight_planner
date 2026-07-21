import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(),
    auth: {
      me: {
        useQuery: vi.fn(),
      },
      logout: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// Mock getLoginUrl
vi.mock("@/const", () => ({
  getLoginUrl: () => "/login",
}));

describe("useAuth", () => {
  let mockSetData: any;
  let mockInvalidate: any;
  let mockUseUtils: any;
  let mockUseQuery: any;
  let mockUseMutation: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetData = vi.fn();
    mockInvalidate = vi.fn();

    mockUseUtils = {
      auth: {
        me: {
          setData: mockSetData,
          invalidate: mockInvalidate,
        },
      },
    };

    (trpc.useUtils as any).mockReturnValue(mockUseUtils);

    mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    (trpc.auth.me.useQuery as any).mockImplementation(mockUseQuery);

    mockUseMutation = vi.fn().mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    });
    (trpc.auth.logout.useMutation as any).mockImplementation(mockUseMutation);

    // Mock window.location
    delete (window as any).location;
    window.location = { pathname: "/current-path", href: "" } as any;

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return loading state initially if query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should return user data if query is successful", () => {
    const mockUser = { id: 1, name: "Test User" };
    mockUseQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should save user info to localStorage", () => {
    const mockUser = { id: 1, name: "Test User" };
    mockUseQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    });

    renderHook(() => useAuth());

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "manus-runtime-user-info",
      JSON.stringify(mockUser)
    );
  });

  it("should redirect to login if unauthenticated and redirectOnUnauthenticated is true", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderHook(() => useAuth({ redirectOnUnauthenticated: true }));

    expect(window.location.href).toBe("/login");
  });

  it("should not redirect if already on redirect path", () => {
    window.location.pathname = "/login";
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderHook(() => useAuth({ redirectOnUnauthenticated: true }));

    expect(window.location.href).toBe(""); // unchanged
  });

  it("should not redirect if loading", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderHook(() => useAuth({ redirectOnUnauthenticated: true }));

    expect(window.location.href).toBe(""); // unchanged
  });

  it("should not redirect if user is authenticated", () => {
    mockUseQuery.mockReturnValue({
      data: { id: 1 },
      isLoading: false,
      error: null,
    });

    renderHook(() => useAuth({ redirectOnUnauthenticated: true }));

    expect(window.location.href).toBe(""); // unchanged
  });

  it("should handle logout successfully", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockMutateAsync).toHaveBeenCalled();
    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("should handle logout UNAUTHORIZED error silently", async () => {
    const trpcError = new TRPCClientError("Unauthorized");
    (trpcError as any).data = { code: "UNAUTHORIZED" };

    const mockMutateAsync = vi.fn().mockRejectedValue(trpcError);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockMutateAsync).toHaveBeenCalled();
    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("should throw other errors during logout", async () => {
    const error = new Error("Something went wrong");

    const mockMutateAsync = vi.fn().mockRejectedValue(error);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    let caughtError;
    try {
      await act(async () => {
        await result.current.logout();
      });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBe(error);
    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("should pass error state from query", () => {
    const error = new Error("Query error");
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.error).toBe(error);
  });

  it("should pass error state from mutation", () => {
    const error = new Error("Mutation error");
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    mockUseMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.error).toBe(error);
  });

  it("should call refetch when refresh is called", () => {
    const refetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch,
    });

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.refresh();
    });

    expect(refetch).toHaveBeenCalled();
  });
});
