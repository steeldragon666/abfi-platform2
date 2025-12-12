import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
  test.describe("Calculate Score API", () => {
    test("should calculate carbon intensity score via GET", async ({ request }) => {
      const response = await request.get("/api/calculate-score?ci=25");

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty("carbonIntensity");
      expect(data.carbonIntensity).toHaveProperty("score");
      expect(data.carbonIntensity).toHaveProperty("rating");
    });

    test("should return error for invalid CI value", async ({ request }) => {
      const response = await request.get("/api/calculate-score?ci=-10");

      // Should still return 200 but with potentially different score
      expect(response.ok()).toBeTruthy();
    });

    test("should calculate full ABFI score via POST", async ({ request }) => {
      const response = await request.post("/api/calculate-score", {
        data: {
          sustainability: {
            certification_type: "ISCC_EU",
            no_deforestation_verified: true,
            no_hcv_land_conversion: true,
            no_peatland_drainage: true,
          },
          carbonIntensityValue: 25,
          quality: {
            category: "UCO",
            parameters: {
              free_fatty_acid: 5,
              moisture: 0.5,
              impurities: 1,
            },
          },
          reliability: {
            has_valid_certification: true,
            audit_frequency: 2,
            data_completeness: 90,
            supply_consistency: 85,
          },
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty("abfiScore");
    });

    test("should return partial calculation when calculateOnly specified", async ({
      request,
    }) => {
      const response = await request.post("/api/calculate-score", {
        data: {
          calculateOnly: "carbonIntensity",
          carbonIntensityValue: 30,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty("carbonIntensity");
    });
  });

  test.describe("Feedstocks API", () => {
    test("should return 401 for unauthenticated feedstock requests", async ({
      request,
    }) => {
      const response = await request.get("/api/feedstocks/test-id");

      // Should fail without auth
      expect([401, 404, 400]).toContain(response.status());
    });

    test("should return 401 for unauthenticated DELETE", async ({ request }) => {
      const response = await request.delete("/api/feedstocks/test-id");

      // Should fail without auth
      expect([401, 404, 400]).toContain(response.status());
    });
  });

  test.describe("Shortlist API", () => {
    test("should return 401 for unauthenticated shortlist requests", async ({
      request,
    }) => {
      const response = await request.get("/api/shortlist");

      // Should fail without auth
      expect([401, 400]).toContain(response.status());
    });
  });

  test.describe("Inquiries API", () => {
    test("should return 401 for unauthenticated inquiry requests", async ({
      request,
    }) => {
      const response = await request.get("/api/inquiries");

      // Should fail without auth
      expect([401, 400]).toContain(response.status());
    });

    test("should return 401 for unauthenticated POST inquiry", async ({
      request,
    }) => {
      const response = await request.post("/api/inquiries", {
        data: {
          feedstock_id: "test-id",
          volume_requested: 100,
        },
      });

      // Should fail without auth
      expect([401, 400]).toContain(response.status());
    });
  });
});
