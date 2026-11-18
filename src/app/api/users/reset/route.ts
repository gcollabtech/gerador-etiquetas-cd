import { NextRequest, NextResponse } from "next/server";
import {
  getServerUsers,
  saveServerUsers,
  saveServerReset,
  getActiveServerReset,
  removeServerReset,
} from "@/lib/serverUsers";
import { PasswordResetRequest, PortalUser } from "@/lib/authTypes";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { success: false, error: "E-mail não informado." },
      { status: 400 }
    );
  }

  const active = await getActiveServerReset(email);
  return NextResponse.json({
    success: true,
    active,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "request";

    if (action === "request") {
      const cleanEmail = (body.email || "").trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: "E-mail corporativo não informado." },
          { status: 400 }
        );
      }

      const users = await getServerUsers();
      const user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "E-mail não localizado no cadastro de usuários do portal.",
          },
          { status: 404 }
        );
      }

      if (user.status !== "ativo") {
        return NextResponse.json(
          {
            success: false,
            error: "Este usuário está temporariamente desativado. Contate o administrador.",
          },
          { status: 403 }
        );
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const token = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();
      const expires = new Date(now.getTime() + 15 * 60 * 1000);

      const resetData: PasswordResetRequest = {
        email: user.email,
        userName: user.name,
        token,
        code,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };

      await saveServerReset(resetData);

      return NextResponse.json({
        success: true,
        resetData,
      });
    }

    if (action === "reset") {
      const cleanEmail = (body.email || "").trim().toLowerCase();
      const cleanCode = (body.code || "").trim();
      const newPassword = (body.newPassword || "").trim();

      if (!cleanCode) {
        return NextResponse.json(
          { success: false, error: "Informe o código de verificação de 6 dígitos." },
          { status: 400 }
        );
      }

      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: "A nova senha deve possuir pelo menos 4 caracteres." },
          { status: 400 }
        );
      }

      const pending = await getActiveServerReset(cleanEmail);
      if (!pending) {
        return NextResponse.json(
          {
            success: false,
            error: "Nenhuma solicitação de redefinição ativa ou o código expirou.",
          },
          { status: 400 }
        );
      }

      if (pending.code !== cleanCode) {
        return NextResponse.json(
          { success: false, error: "Código de verificação incorreto." },
          { status: 400 }
        );
      }

      const users = await getServerUsers();
      const userIdx = users.findIndex(
        (u) => u.email.trim().toLowerCase() === cleanEmail
      );
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
        password: newPassword,
        mustChangePassword: false,
        lastLogin: new Date().toISOString(),
      };
      updatedUsers[userIdx] = updatedUser;

      await saveServerUsers(updatedUsers);
      await removeServerReset(cleanEmail);

      return NextResponse.json({
        success: true,
        user: updatedUser,
      });
    }

    return NextResponse.json(
      { success: false, error: "Ação inválida." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Erro na API /api/users/reset POST:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
