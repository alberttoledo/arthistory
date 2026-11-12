import { listJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(listJobs());
}
