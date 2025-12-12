import { Metadata } from "next";
import { CarbonCalculator } from "./calculator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Leaf } from "lucide-react";

export const metadata: Metadata = {
  title: "Carbon Intensity Calculator",
  description:
    "Calculate and understand carbon intensity ratings for bioenergy feedstocks using the ABFI scoring methodology.",
};

export default function CarbonCalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-bold text-green-900">ABFI</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Carbon Intensity Calculator
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Understand how carbon intensity affects feedstock ratings under the
              ABFI scoring system. Enter your lifecycle emissions data to see the
              resulting score and rating.
            </p>
          </div>

          <CarbonCalculator />

          {/* Educational Content */}
          <div className="mt-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Understanding Carbon Intensity
              </h2>
              <p className="mt-4 text-gray-600">
                Carbon intensity (CI) measures the greenhouse gas emissions
                associated with producing and delivering a unit of energy from a
                feedstock. It is expressed in grams of CO2 equivalent per
                megajoule of energy (gCO2e/MJ).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                RED II Benchmark
              </h2>
              <p className="mt-4 text-gray-600">
                The European Union Renewable Energy Directive II (RED II) uses
                94 gCO2e/MJ as the fossil fuel comparator for transport fuels.
                Biofuels must achieve at least 50-65% emissions savings compared
                to this benchmark to qualify as renewable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900">Rating Scale</h2>
              <div className="mt-4 overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Rating
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        CI Range (gCO2e/MJ)
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Score Range
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3">
                        <span className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800">
                          A+
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        &lt; 10
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">95-100</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Exceptional - Near carbon neutral
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-700">
                          A
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">10-20</td>
                      <td className="px-4 py-3 text-sm text-gray-600">85-95</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Excellent - Very low emissions
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        <span className="rounded bg-emerald-100 px-2 py-1 text-sm font-medium text-emerald-700">
                          B+
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">20-30</td>
                      <td className="px-4 py-3 text-sm text-gray-600">75-85</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Very Good - Low emissions
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="rounded bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-700">
                          B
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">30-40</td>
                      <td className="px-4 py-3 text-sm text-gray-600">65-75</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Good - Moderate emissions
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        <span className="rounded bg-orange-100 px-2 py-1 text-sm font-medium text-orange-600">
                          C+
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">40-50</td>
                      <td className="px-4 py-3 text-sm text-gray-600">55-65</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Average - Higher emissions
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="rounded bg-orange-100 px-2 py-1 text-sm font-medium text-orange-700">
                          C
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">50-60</td>
                      <td className="px-4 py-3 text-sm text-gray-600">45-55</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Below Average
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        <span className="rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-600">
                          D
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">60-70</td>
                      <td className="px-4 py-3 text-sm text-gray-600">35-45</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Poor - High emissions
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800">
                          F
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        &gt; 70
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">0-35</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Failing - Very high emissions
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Typical CI Values by Feedstock
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900">
                    Used Cooking Oil (UCO)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Typical CI: 10-20 gCO2e/MJ
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Low emissions due to waste-derived status and minimal
                    agricultural inputs.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900">Tallow</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Typical CI: 15-30 gCO2e/MJ
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Varies by category and processing method.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900">Canola Oil</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Typical CI: 30-45 gCO2e/MJ
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Depends on farming practices, fertilizer use, and processing.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900">
                    Agricultural Residues
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Typical CI: 5-15 gCO2e/MJ
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Very low due to using waste materials with no additional land
                    use.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            This calculator uses the ABFI scoring methodology. For official
            certification, please{" "}
            <Link href="/contact" className="text-green-700 hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
