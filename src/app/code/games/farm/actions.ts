// src/app/code/games/farm/actions.ts
//
// Server Actions — 클라이언트 컴포넌트(FarmEntryPage)에서 호출 가능한 서버 함수.
// 'use server' 디렉티브 덕에 직접 호출만으로 서버에서 실행됨.

"use server";

import { revalidatePath } from "next/cache";
import { deactivateSave } from "@/lib/farm/saves";

export async function deactivateSaveAction(saveId: string): Promise<void> {
  await deactivateSave(saveId);
  // 진입 화면 데이터 새로고침 — 삭제된 세이브가 목록에서 사라짐
  revalidatePath("/code/games/farm");
}