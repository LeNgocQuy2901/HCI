import http from "k6/http";
import { check } from "k6";
import { config } from "./config.js";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const ping = http.get(`${config.appBaseUrl}/api/ping`);
  check(ping, {
    "app API responds": (response) => response.status === 200,
  });

  const content = http.get(`${config.appBaseUrl}/api/learning/published-content`);
  check(content, {
    "published learning content responds": (response) => response.status === 200,
  });
}
