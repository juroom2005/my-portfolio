import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-8">
      <h1 className="text-2xl">Supabase 연결 테스트</h1>
      <pre className="mt-4 p-4 bg-gray-100 rounded">
        {user ? `로그인됨: ${user.email}` : '로그인 안 됨 (정상)'}
      </pre>
    </div>
  )
}