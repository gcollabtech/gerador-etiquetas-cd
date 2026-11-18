import { NextRequest, NextResponse } from "next/server";
import { getServerUsers, saveServerUsers } from "@/lib/serverUsers";
import { AuthSession, PortalUser } from "@/lib/authTypes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body.email || "";
    const rawPassword = body.password || "";
    const remember = body.remember !== false;

    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanPassword = rawPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail e senha são obrigatórios para acessar o portal.",
        },
        { status: 400 }
      );
    }

    const users = getServerUsers();
    const userIdx = users.findIndex(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );

    if (userIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail ou senha incorretos. Verifique suas credenciais.",
        },
        { status: 401 }
      );
    }

    const user = users[userIdx];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail ou senha incorretos. Verifique suas credenciais.",
        },
        { status: 401 }
      );
    }

    if (user.status !== "ativo") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este usuário está temporariamente desativado. Contate o administrador do sistema.",
        },
        { status: 403 }
      );
    }

    const defaultPass =
      cleanEmail === "admin@collab.com.br" ? "Gcoll@b123" : "collab123";
    const userPassword = (user.password || defaultPass).trim();

    // Verificação de senha flexível (permite senha com trim e case-sensitive)
    const isPasswordCorrect =
      cleanPassword === userPassword || rawPassword === user.password;

    if (!isPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail ou senha incorretos. Verifique suas credenciais.",
        },
        { status: 401 }
      );
    }

    // Se o usuário precisa obrigatoriamente trocar a senha no primeiro acesso
    if (user.mustChangePassword) {
      return NextResponse.json({
        success: true,
        mustChangePassword: true,
        user,
      });
    }

    // Atualiza lastLogin no servidor
    const updatedUsers: PortalUser[] = [...users];
    const updatedUser: PortalUser = {
      ...user,
      lastLogin: new Date().toISOString(),
    };
    updatedUsers[userIdx] = updatedUser;
    saveServerUsers(updatedUsers);

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
    console.error("Erro na API /api/auth/login:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
