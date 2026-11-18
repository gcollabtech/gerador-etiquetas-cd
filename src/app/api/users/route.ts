import { NextRequest, NextResponse } from "next/server";
import {
  getServerUsers,
  saveOrUpdateServerUser,
  deleteServerUser,
  mergeServerUsers,
} from "@/lib/serverUsers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const users = getServerUsers();
  return NextResponse.json(
    {
      success: true,
      users,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "sync" && Array.isArray(body.users)) {
      const merged = mergeServerUsers(body.users);
      return NextResponse.json({
        success: true,
        users: merged,
      });
    }

    if (body.user) {
      const updated = saveOrUpdateServerUser(body.user);
      return NextResponse.json({
        success: true,
        users: updated,
      });
    }

    if (Array.isArray(body.users)) {
      const merged = mergeServerUsers(body.users);
      return NextResponse.json({
        success: true,
        users: merged,
      });
    }

    return NextResponse.json(
      { success: false, error: "Nenhum usuário informado para gravação." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Erro na API /api/users POST:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let id: string | null = null;

    if (req.nextUrl && req.nextUrl.searchParams) {
      id = req.nextUrl.searchParams.get("id");
    }

    if (!id && req.url) {
      try {
        const parsed = new URL(req.url, "http://localhost:3002");
        id = parsed.searchParams.get("id");
      } catch {
        // ignore
      }
    }

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || null;
      } catch {
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do usuário não fornecido para exclusão." },
        { status: 400 }
      );
    }

    const res = deleteServerUser(id);
    return NextResponse.json(res, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Erro na API /api/users DELETE:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
