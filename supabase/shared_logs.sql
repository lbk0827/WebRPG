-- 오더 앤 블레이드 — 전투 공유 링크 (docs/26 §5.2)
-- 실행: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여넣고 Run. (schema.sql 을 먼저 실행한 뒤)
-- 여러 번 실행해도 안전하게 썼다.
--
-- 설계
--   · 공유 로그는 함수 두 개로만 다룬다 — share_battle_log(공유하기, 로그인 필요) · get_shared_log(링크로 읽기, 누구나).
--   · 테이블 자체에는 아무 권한도 주지 않는다 → 남의 공유 로그 목록을 훑을 수 없고, 링크(id)를 아는 전투 하나만 볼 수 있다.
--   · 계정당 최대 20개(넘치면 오래된 것부터) + 30일 만료. 용병단 이름 · 시각 · 만료는 서버가 채운다 (남의 이름으로 공유 못 함).

create table if not exists public.shared_logs (
  id            text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  user_id       uuid not null references auth.users (id) on delete cascade,
  team_name     text,
  -- 시드 + 양 팀 편성. 엔진이 결정론이라 이것만으로 그 전투를 다시 계산해 보여 준다
  record        jsonb not null,
  -- 공유할 때의 전투 데이터 버전. 지금 버전과 다르면 "결과가 다를 수 있음" 표시
  data_version  text not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '30 days'
);

create index if not exists shared_logs_user_created on public.shared_logs (user_id, created_at desc);
create index if not exists shared_logs_expires on public.shared_logs (expires_at);

alter table public.shared_logs enable row level security;
revoke all on public.shared_logs from anon, authenticated;

-- ─── 공유하기 ────────────────────────────────────────────
create or replace function public.share_battle_log(p_record jsonb, p_data_version text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  found_id text;
begin
  if uid is null then
    raise exception 'sign in required' using errcode = '42501';
  end if;
  if p_record is null or jsonb_typeof(p_record) <> 'object' or octet_length(p_record::text) > 60000 then
    raise exception 'invalid record' using errcode = '22023';
  end if;

  -- 만료된 공유는 여기서 함께 치운다 (따로 예약 작업을 두지 않는다)
  delete from public.shared_logs where expires_at < now();

  -- 같은 전투를 또 공유하면 새로 만들지 않고 기존 링크를 돌려준다
  select id into found_id from public.shared_logs
   where user_id = uid and record->>'at' = p_record->>'at' and record->>'seed' = p_record->>'seed'
   limit 1;
  if found_id is not null then
    return found_id;
  end if;

  insert into public.shared_logs (user_id, team_name, record, data_version)
  values (uid, (select team_name from public.profiles where user_id = uid), p_record, left(coalesce(p_data_version, ''), 40))
  returning id into found_id;

  -- 계정당 최근 20개만
  delete from public.shared_logs
   where user_id = uid
     and id not in (select id from public.shared_logs where user_id = uid order by created_at desc limit 20);

  return found_id;
end $$;

-- ─── 링크로 읽기 ──────────────────────────────────────────
create or replace function public.get_shared_log(p_id text)
returns table (team_name text, record jsonb, data_version text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.team_name, s.record, s.data_version, s.created_at, s.expires_at
    from public.shared_logs s
   where s.id = p_id and s.expires_at > now();
$$;

revoke execute on function public.share_battle_log(jsonb, text) from public, anon;
revoke execute on function public.get_shared_log(text) from public;
grant execute on function public.share_battle_log(jsonb, text) to authenticated;
grant execute on function public.get_shared_log(text) to anon, authenticated;
