import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiGet, apiPost, ApiError } from "./api";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.stubEnv("VITE_API_URL", "");
  mockFetch.mockReset();
});

describe("ApiError", () => {
  it("should create an error with status and message", () => {
    const error = new ApiError(404, "Not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.name).toBe("ApiError");
  });
});

describe("apiGet", () => {
  it("should send a GET request to the correct URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }),
    });

    const result = await apiGet("/test");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result).toEqual([{ id: 1 }]);
  });

  it("should append query parameters", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await apiGet("/test", { page: 1, limit: "10" });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("page=1");
    expect(calledUrl).toContain("limit=10");
  });

  it("should throw ApiError on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Server error" }),
    });

    await expect(apiGet("/test")).rejects.toThrow(ApiError);
    await expect(apiGet("/test")).rejects.toThrow("Server error");
  });

  it("should throw ApiError when success is false", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ success: false, message: "Business error" }),
    });

    await expect(apiGet("/test")).rejects.toThrow(ApiError);
    await expect(apiGet("/test")).rejects.toThrow("Business error");
  });
});

describe("apiPost", () => {
  it("should send a POST request with JSON body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    });

    const body = { name: "test", amount: 100 };
    const result = await apiPost("/test", body);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    expect(result).toEqual({ id: 1 });
  });

  it("should send a POST request without body when undefined", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    });

    await apiPost("/test");
    const options = mockFetch.mock.calls[0][1];
    expect(options.body).toBeUndefined();
  });
});
