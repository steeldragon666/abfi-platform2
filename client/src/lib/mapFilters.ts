// Map filter utility functions

export function buildLayerFilter(
  layerId: string,
  selectedStates: string[],
  sugarMillCapacity: [number, number],
  biogasCapacity: [number, number],
  biofuelCapacity: [number, number],
  portThroughput: [number, number]
): any[] {
  const filters: any[] = ["all"];

  // State filter (applies to all layers)
  if (selectedStates.length > 0 && selectedStates.length < 6) {
    filters.push(["in", ["get", "state"], ["literal", selectedStates]]);
  }

  // Layer-specific capacity filters
  switch (layerId) {
    case "sugar-mills":
      filters.push([
        "all",
        [">=", ["get", "crushing_capacity_tonnes"], sugarMillCapacity[0]],
        ["<=", ["get", "crushing_capacity_tonnes"], sugarMillCapacity[1]],
      ]);
      break;

    case "biogas-facilities":
      filters.push([
        "all",
        [">=", ["get", "capacity_mw"], biogasCapacity[0]],
        ["<=", ["get", "capacity_mw"], biogasCapacity[1]],
      ]);
      break;

    case "biofuel-plants":
      filters.push([
        "all",
        [">=", ["get", "capacity_ml_per_year"], biofuelCapacity[0]],
        ["<=", ["get", "capacity_ml_per_year"], biofuelCapacity[1]],
      ]);
      break;

    case "transport-ports":
      // Only filter ports (type === "port"), not grain hubs or rail lines
      filters.push([
        "any",
        ["!=", ["get", "type"], "port"],
        [
          "all",
          [">=", ["get", "annual_throughput_mt"], portThroughput[0]],
          ["<=", ["get", "annual_throughput_mt"], portThroughput[1]],
        ],
      ]);
      break;

    // Grain regions and forestry regions don't have capacity filters
    case "grain-regions":
    case "forestry-regions":
      // Only state filter applies
      break;
  }

  return filters.length > 1 ? filters : ["all"];
}
