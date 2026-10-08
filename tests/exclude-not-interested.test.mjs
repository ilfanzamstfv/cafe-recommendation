import assert from "node:assert/strict";
import test from "node:test";
import { excludeNotInterestedCafes } from "../src/features/recommendation/exclude-not-interested.ts";

test("removes dismissed cafes while preserving recommendation order", () => {
  const cafes = [{ placeId: "first" }, { placeId: "dismissed" }, { placeId: "last" }];

  assert.deepEqual(excludeNotInterestedCafes(cafes, ["dismissed"]), [cafes[0], cafes[2]]);
});

test("keeps all cafes when no dismissals exist", () => {
  const cafes = [{ placeId: "first" }, { placeId: "second" }];

  assert.deepEqual(excludeNotInterestedCafes(cafes, []), cafes);
});
