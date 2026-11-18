import { NextRequest, NextResponse } from "next/server";
import { getServerUsers, saveServerUsers } from "@/lib/serverUsers";
import { AuthSession, PortalUser } from "@/lib/authTypes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId;
    const rawNewPassword = body.newPassword || "";
    const remember = body.remember !== false;

    const cleanNewPassword = rawNewPassword.trim();

    if (!cleanNewPassword || cleanNewPassword.length < 4) {
      return NextResponse.json(
        {
          success: false,
          error: "A nova senha deve possuir pelo menos 4 caracteres.",
        },
        { status: 400 }
      );
    }

    const users = await getServerUsers();
    const userIdx = users.findIndex((u) => u.id === userId);

    if (userIdx === -1) {
      return NextResponse.json(
        { success: false, error: "Usuário não localizado no sistema." },
        { status: 404 }
      );
    }

    const targetUser = users[userIdx];
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Usuário não localizado no sistema." },
        { status: 404 }
      );
    }

    const updatedUsers: PortalUser[] = [...users];
    const updatedUser: PortalUser = {
      ...targetUser,
      password: cleanNewPassword,
      mustChangePassword: false,
      lastLogin: new Date().toISOString(),
    };
    updatedUsers[userIdx] = updatedUser;
    await saveServerUsers(updatedUsers);

    const session: AuthSession = {
      user: updatedUser,
      token: `token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      loginTime: new Date().toISOString(),
      remember,
    };

    return NextResponse.json({
      success: true,
      session,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error("Erro na API /api/auth/first-access:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
