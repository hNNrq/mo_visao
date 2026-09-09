-- Mo Visão — funções de negócio
--
-- Toda mexida em estoque mora aqui, dentro do Postgres, e não no código Node.
-- Motivo: dois clientes podem clicar "comprar" no mesmo segundo, no mesmo óculos
-- de 1 unidade. Ler-e-depois-escrever do lado da aplicação perde essa corrida.
-- O UPDATE condicional abaixo trava a linha e resolve atomicamente.

-- ============================================================
-- quem é admin
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ============================================================
-- reservar estoque ao criar o pedido
--
-- p_itens: [{"produto_id": "...", "quantidade": 1}, ...]
-- Estoura SEM_ESTOQUE:<id> se algum item não couber — a transação inteira
-- volta atrás, então não fica reserva pela metade.
-- ============================================================

create or replace function public.reservar_estoque(p_itens jsonb)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  item        jsonb;
  v_produto_id uuid;
  v_qtd       integer;
begin
  for item in select * from jsonb_array_elements(p_itens)
  loop
    v_produto_id := (item->>'produto_id')::uuid;
    v_qtd        := (item->>'quantidade')::integer;

    if v_qtd is null or v_qtd < 1 then
      raise exception 'QUANTIDADE_INVALIDA:%', v_produto_id;
    end if;

    -- o WHERE é o que garante a atomicidade: ou tem saldo e reserva,
    -- ou não afeta linha nenhuma e a gente aborta
    update public.produtos
       set reservado = reservado + v_qtd
     where id = v_produto_id
       and ativo
       and estoque - reservado >= v_qtd;

    if not found then
      raise exception 'SEM_ESTOQUE:%', v_produto_id;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- confirmar pagamento (chamada pelo webhook do Mercado Pago)
--
-- Retorna:
--   'confirmado'    — baixou estoque e marcou pago
--   'ja_processado' — notificação repetida, nada a fazer (idempotência)
--   'sem_estoque'   — pagou depois da reserva expirar e o produto já foi.
--                     O dono precisa estornar. O webhook alerta.
-- ============================================================

create or replace function public.confirmar_pedido(
  p_pedido_id  uuid,
  p_payment_id text,
  p_metodo     text
)
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_status    public.pedido_status;
  v_expirado  boolean;
  item        record;
begin
  select status into v_status
    from public.pedidos
   where id = p_pedido_id
     for update;   -- trava o pedido: duas notificações simultâneas viram fila

  if not found then
    raise exception 'PEDIDO_NAO_ENCONTRADO:%', p_pedido_id;
  end if;

  if v_status not in ('pendente', 'expirado') then
    return 'ja_processado';
  end if;

  v_expirado := (v_status = 'expirado');

  for item in
    select produto_id, quantidade
      from public.pedido_itens
     where pedido_id = p_pedido_id
       and produto_id is not null
  loop
    if v_expirado then
      -- a reserva já foi devolvida; só dá pra confirmar se ainda sobrou peça
      update public.produtos
         set estoque = estoque - item.quantidade
       where id = item.produto_id
         and estoque - reservado >= item.quantidade;

      if not found then
        return 'sem_estoque';
      end if;
    else
      update public.produtos
         set estoque   = estoque - item.quantidade,
             reservado = greatest(reservado - item.quantidade, 0)
       where id = item.produto_id;
    end if;
  end loop;

  update public.pedidos
     set status           = 'pago',
         mp_payment_id    = coalesce(p_payment_id, mp_payment_id),
         metodo_pagamento = coalesce(p_metodo, metodo_pagamento),
         pago_em          = now()
   where id = p_pedido_id;

  return 'confirmado';
end;
$$;

-- ============================================================
-- liberar reservas de quem não pagou
-- Roda de tempos em tempos. Devolve quantos pedidos expirou.
-- ============================================================

create or replace function public.liberar_reservas_expiradas()
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_pedido record;
  item     record;
  v_total  integer := 0;
begin
  for v_pedido in
    select id
      from public.pedidos
     where status = 'pendente'
       and expira_em < now()
     for update skip locked
  loop
    for item in
      select produto_id, quantidade
        from public.pedido_itens
       where pedido_id = v_pedido.id
         and produto_id is not null
    loop
      update public.produtos
         set reservado = greatest(reservado - item.quantidade, 0)
       where id = item.produto_id;
    end loop;

    update public.pedidos set status = 'expirado' where id = v_pedido.id;
    v_total := v_total + 1;
  end loop;

  return v_total;
end;
$$;

-- ============================================================
-- cancelar pedido pago (estorno manual pelo dono) — devolve ao estoque
-- ============================================================

create or replace function public.cancelar_pedido(p_pedido_id uuid)
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_status public.pedido_status;
  item     record;
begin
  if not public.is_admin() then
    raise exception 'SEM_PERMISSAO';
  end if;

  select status into v_status from public.pedidos where id = p_pedido_id for update;
  if not found or v_status = 'cancelado' then
    return false;
  end if;

  if v_status in ('pago', 'separado', 'entregue') then
    for item in
      select produto_id, quantidade from public.pedido_itens
       where pedido_id = p_pedido_id and produto_id is not null
    loop
      update public.produtos set estoque = estoque + item.quantidade
       where id = item.produto_id;
    end loop;
  elsif v_status = 'pendente' then
    for item in
      select produto_id, quantidade from public.pedido_itens
       where pedido_id = p_pedido_id and produto_id is not null
    loop
      update public.produtos set reservado = greatest(reservado - item.quantidade, 0)
       where id = item.produto_id;
    end loop;
  end if;

  update public.pedidos set status = 'cancelado' where id = p_pedido_id;
  return true;
end;
$$;
