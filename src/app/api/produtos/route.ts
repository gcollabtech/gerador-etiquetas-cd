import { NextRequest, NextResponse } from "next/server";
import {
  getProducts,
  saveProduct,
  bulkSaveProducts,
  deleteProduct,
  bulkDeleteProducts,
} from "@/lib/serverProducts";
import { Produto } from "@/lib/productTypes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;

    const products = await getProducts({ search });
    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err: any) {
    console.error("GET /api/produtos erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao consultar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Importação em massa via array
    if (Array.isArray(body.products) && body.products.length > 0) {
      const validItems: Partial<Produto>[] = [];

      for (const item of body.products) {
        if (!item.descricao || !item.ean) continue;
        validItems.push({
          id: item.id,
          cod_produto: String(item.cod_produto || "").trim(),
          descricao: String(item.descricao || "").trim().toUpperCase(),
          ean: String(item.ean || "").replace(/\D/g, ""),
        });
      }

      if (validItems.length === 0) {
        return NextResponse.json(
          { success: false, error: "Nenhum produto válido encontrado para salvar." },
          { status: 400 }
        );
      }

      const result = await bulkSaveProducts(validItems);
      return NextResponse.json({
        success: true,
        count: result.count,
        products: result.saved,
        message: `${result.count} produto(s) gravado(s) com sucesso no banco de dados!`,
      });
    }

    // Gravação de item individual
    const item = body.product || body;
    if (!item.descricao) {
      return NextResponse.json(
        { success: false, error: "A descrição do produto é obrigatória." },
        { status: 400 }
      );
    }
    if (!item.ean) {
      return NextResponse.json(
        { success: false, error: "O código EAN de barras é obrigatório." },
        { status: 400 }
      );
    }

    const saved = await saveProduct({
      id: item.id,
      cod_produto: item.cod_produto,
      descricao: item.descricao,
      ean: item.ean,
    });

    return NextResponse.json({
      success: true,
      product: saved,
      message: "Produto gravado com sucesso no banco de dados!",
    });
  } catch (err: any) {
    console.error("POST /api/produtos erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao salvar produto(s)" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await deleteProduct(id);
      return NextResponse.json({
        success: true,
        deleted: 1,
        message: "Produto excluído com sucesso.",
      });
    }

    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const count = await bulkDeleteProducts(body.ids);
      return NextResponse.json({
        success: true,
        deleted: count,
        message: `${count} produto(s) excluído(s) com sucesso.`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Informe o 'id' ou lista de 'ids' a excluir." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("DELETE /api/produtos erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao excluir produto(s)" },
      { status: 500 }
    );
  }
}
