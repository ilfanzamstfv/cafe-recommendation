import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentLikedPlaceIds } from "../src/features/user/current-liked-place-ids.ts";

test("latest Like or Unlike event determines current liked cafes", () => {
  const interactions = [
    { placeId: "cafe-a", interactionType: "UNLIKE" },
    { placeId: "cafe-b", interactionType: "LIKE" },
    { placeId: "cafe-a", interactionType: "LIKE" },
    { placeId: "cafe-d", interactionType: "LIKE" },
    { placeId: "cafe-d", interactionType: "UNLIKE" },
    { placeId: "cafe-c", interactionType: "VISITED" },
  ];

  assert.deepEqual(getCurrentLikedPlaceIds(interactions), ["cafe-b", "cafe-d"]);
});
