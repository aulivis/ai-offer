-- Migration: Create trigger function for handling offer responses
-- This trigger automatically updates offer status and creates notifications when customers respond

-- Function to update offer status on response and create notification
create or replace function public.handle_offer_response()
returns trigger as $$
declare
  v_offer_user_id uuid;
  v_offer_title text;
  v_customer_name text;
begin
  -- Get offer details
  select user_id, title into v_offer_user_id, v_offer_title
  from public.offers
  where id = new.offer_id;
  
  -- Exit if offer not found
  if v_offer_user_id is null then
    return new;
  end if;
  
  -- Get customer name from response, share, or default
  v_customer_name := coalesce(
    new.customer_name,
    (select customer_name from public.offer_shares where id = new.share_id),
    'Customer'
  );
  
  -- Update offer status and decision
  update public.offers
  set 
    status = case 
      when new.decision = 'accepted' then 'accepted'
      when new.decision = 'rejected' then 'lost'
      else status
    end,
    decision = new.decision,
    decided_at = new.created_at,
    sent_at = coalesce(sent_at, new.created_at) -- Set sent_at if not already set
  where id = new.offer_id;
  
  -- Create notification for offer creator
  insert into public.offer_notifications (
    offer_id,
    user_id,
    type,
    title,
    message,
    metadata
  ) values (
    new.offer_id,
    v_offer_user_id,
    'response',
    case 
      when new.decision = 'accepted' then 'Offer Accepted'
      else 'Offer Rejected'
    end,
    case 
      when new.decision = 'accepted' 
        then v_customer_name || ' accepted your offer "' || coalesce(v_offer_title, 'Untitled') || '"'
      else 
        v_customer_name || ' rejected your offer "' || coalesce(v_offer_title, 'Untitled') || '"'
    end,
    jsonb_build_object(
      'decision', new.decision,
      'customer_name', v_customer_name,
      'customer_email', new.customer_email,
      'comment', new.comment,
      'response_id', new.id,
      'share_id', new.share_id
    )
  );
  
  return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_offer_response() is 'Trigger function that updates offer status and creates notifications when customers respond to shared offers.';

-- Create trigger
drop trigger if exists on_offer_response on public.offer_responses;
create trigger on_offer_response
after insert on public.offer_responses
for each row
execute function public.handle_offer_response();






