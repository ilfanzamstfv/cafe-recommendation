import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiError>(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}
