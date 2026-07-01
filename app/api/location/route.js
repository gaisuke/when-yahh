import { NextResponse } from "next/server";
import { getLocations, setLocation, storageBackend } from "@/lib/store";

export async function GET() {
  const data = await getLocations();
  return NextResponse.json({ ...data, _backend: storageBackend });
}

export async function POST(request) {
  const body = await request.json();
  const { person, lat, lng } = body;

  if (!person || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "Expected { person: 'me' | 'wife', lat: number, lng: number }" },
      { status: 400 }
    );
  }
  if (person !== "me" && person !== "wife") {
    return NextResponse.json(
      { error: "person must be 'me' or 'wife'" },
      { status: 400 }
    );
  }

  const data = await setLocation(person, lat, lng);
  return NextResponse.json(data);
}
