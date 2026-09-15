-- 오더 앤 블레이드 — 계정 · 저장 테이블 (docs/25 B 단계)
-- 실행: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여넣고 Run.
-- 여러 번 실행해도 안전하게 썼다 (if not exists · drop if exists).
--
-- 자물쇠 두 겹:
--   1) 권한(GRANT)  — 로그인한 사용자(authenticated)만 테이블에 닿는다. 비로그인(anon)은 아무것도 못 한다.
--   2) 행 보안(RLS) — 닿더라도 자기 계정 줄만 읽고 쓴다.
-- 프로젝트를 "Automatically expose new tables" 끔으로 만들었으므로 권한은 여기서 직접 준다.

-- ─── 테이블 ───────────────────────────────────────────────

-- 계정 정보 한 줄. 랭킹 · PvP(C 단계)는 이 표에 붙인다.
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  login_id       text not null unique,
  team_name      text check (team_name is null or char_length(team_name) between 1 and 12),
  -- 용병단 이름 중복 판정용 — 공백을 빼고 소문자로. "Red Wolf" 와 "redwolf" 는 같은 이름 (단장 결정: 중복 불가)
  team_name_key  text generated always as (lower(regexp_replace(team_name, '\s', '', 'g'))) stored unique,
  created_at     timestamptz not null default now(),
  -- 미접속 정리(docs/25 §8.1)의 기준
  last_login_at  timestamptz not null default now()
);

-- 게임 저장 한 줄 (JSON 통째). 모양 검사는 게임 코드(migrate)가 한다.
create table if not exists public.saves (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ─── 자물쇠 1: 권한 ──────────────────────────────────────

revoke all on public.profiles from anon, authenticated;
revoke all on public.saves from anon, authenticated;

grant select on public.profiles to authenticated;
-- 바꿀 수 있는 칸은 이름과 접속 시각뿐. login_id 는 가입 때 서버가 정한다
grant update (team_name, last_login_at) on public.profiles to authenticated;
grant select, insert, update on public.saves to authenticated;

-- ─── 자물쇠 2: 행 보안 ───────────────────────────────────

alter table public.profiles enable row level security;
alter table public.saves enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "saves_select_own" on public.saves;
create policy "saves_select_own" on public.saves
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own" on public.saves
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own" on public.saves
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ─── 자동 처리 ────────────────────────────────────────────

-- 저장 시각은 서버가 찍는다 (두 기기 충돌 판정의 기준)
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists saves_touch_updated_at on public.saves;
create trigger saves_touch_updated_at before update on public.saves
  for each row execute function public.touch_updated_at();

-- 가입하면 계정 정보 줄을 만든다. ID 는 로그인용 이메일의 @ 앞부분
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, login_id)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이 SQL 을 실행하기 전에 가입된 계정이 있으면 계정 정보 줄을 채운다
insert into public.profiles (user_id, login_id)
select id, split_part(email, '@', 1) from auth.users
on conflict do nothing;
